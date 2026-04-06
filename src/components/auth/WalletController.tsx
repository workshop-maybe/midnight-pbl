/**
 * WalletController — React island for wallet connection and auth
 *
 * Used as `<WalletController client:only="react" />` in Astro layouts.
 * Wraps MeshProvider, renders CardanoWallet, and drives the auth flow.
 *
 * Combines the responsibilities of the old AuthProvider and ConnectWallet
 * components into a single self-contained island. Writes auth state to
 * the vanilla Zustand auth store so other islands can read it.
 *
 * MUST be client:only="react" — imports @meshsdk/react.
 */

import { useEffect, useRef, useCallback } from "react";
import { MeshProvider, CardanoWallet, useWallet } from "@meshsdk/react";
import "@meshsdk/react/styles.css";
import { authStore, useAuthStore } from "@/stores/auth-store";
import {
  buildSession,
  validateSignature,
  storeJWT,
  getStoredJWT,
  isJWTExpired,
  decodeJWTPayload,
  clearJWT,
} from "@/lib/andamio-auth";
import { getWalletAddressBech32 } from "@/lib/wallet-address";
import { findAccessToken } from "@/lib/access-token-utils";

// =============================================================================
// Constants
// =============================================================================

/** CIP-30 race condition delay — wallet extensions need time after connect */
const CIP30_DELAY_MS = 500;

/** Polling interval for wallet address change detection */
const WALLET_POLL_MS = 10_000;

/**
 * Access token policy ID from env.
 * Astro uses PUBLIC_ prefix for client-accessible env vars.
 * Fall back to VITE_ prefix for backward compatibility.
 */
const ACCESS_TOKEN_POLICY_ID =
  import.meta.env.PUBLIC_ACCESS_TOKEN_POLICY_ID ??
  import.meta.env.VITE_ACCESS_TOKEN_POLICY_ID ??
  "";

// =============================================================================
// Helpers
// =============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateAddress(address: string): string {
  if (address.length <= 15) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

// =============================================================================
// Inner Component (inside MeshProvider)
// =============================================================================

function WalletControllerInner() {
  const { connected, wallet, disconnect: disconnectWallet } = useWallet();

  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const error = useAuthStore((s) => s.error);

  const isValidatingRef = useRef(false);
  const lastAddressRef = useRef<string | null>(null);
  /** Track if wallet was ever connected — prevents clearing auth on initial render */
  const wasConnectedRef = useRef(false);

  const isAuthenticated = status === "AUTHENTICATED";
  const isAuthenticating = status === "AUTHENTICATING" || status === "SCANNING_TOKEN";

  // ===========================================================================
  // JWT Restoration on wallet connect
  // ===========================================================================

  useEffect(() => {
    if (!connected || !wallet) return;

    const storedJWT = getStoredJWT();
    if (!storedJWT || isJWTExpired(storedJWT)) return;
    if (isValidatingRef.current) return;
    isValidatingRef.current = true;

    const validate = async () => {
      try {
        const payload = decodeJWTPayload(storedJWT);
        if (!payload) {
          clearJWT();
          return;
        }

        await delay(CIP30_DELAY_MS);
        const walletAddress = await getWalletAddressBech32(wallet);

        // Address mismatch — different wallet connected
        if (
          payload.cardanoBech32Addr &&
          payload.cardanoBech32Addr !== walletAddress
        ) {
          clearJWT();
          return;
        }

        // JWT valid and matches wallet — restore session
        authStore.getState().setAuthenticated(
          {
            alias: payload.accessTokenAlias ?? "",
            address: payload.cardanoBech32Addr ?? walletAddress,
          },
          storedJWT,
          walletAddress
        );
        lastAddressRef.current = walletAddress;
      } catch (err) {
        console.warn("[WalletController] JWT validation failed:", err);
        clearJWT();
      } finally {
        isValidatingRef.current = false;
      }
    };

    void validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // ===========================================================================
  // Auto-auth when wallet connects without valid JWT
  // ===========================================================================

  useEffect(() => {
    if (!connected || !wallet) return;
    if (isAuthenticated || isAuthenticating || error) return;
    if (isValidatingRef.current) return;

    const storedJWT = getStoredJWT();
    if (storedJWT && !isJWTExpired(storedJWT)) return;

    authStore.getState().setScanningToken();

    const scanAndAuth = async () => {
      await delay(CIP30_DELAY_MS);

      try {
        const tokenResult = await findAccessToken(
          wallet,
          ACCESS_TOKEN_POLICY_ID
        );

        if (!tokenResult) {
          authStore.getState().setNeedsRegistration();
          return;
        }

        await authenticateInternal(tokenResult.unit);
      } catch (err) {
        console.warn("[WalletController] Auto-auth scan failed:", err);
        authStore.getState().setError(
          "Could not check your wallet. This may be temporary."
        );
      }
    };

    void scanAndAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, isAuthenticated, isAuthenticating, error]);

  // ===========================================================================
  // Wallet disconnect -> clear auth
  // ===========================================================================

  useEffect(() => {
    if (connected) {
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current) {
      // Only clear auth on actual disconnect (was connected, now isn't)
      // — not on initial render when Mesh hasn't auto-reconnected yet
      const currentStatus = authStore.getState().status;
      if (currentStatus !== "DISCONNECTED") {
        authStore.getState().setDisconnected();
        lastAddressRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // ===========================================================================
  // Wallet address change detection (10s polling)
  // ===========================================================================

  useEffect(() => {
    if (!isAuthenticated || !connected || !wallet) return;

    const checkAddress = async () => {
      try {
        const currentAddress = await getWalletAddressBech32(wallet);
        if (
          lastAddressRef.current &&
          currentAddress !== lastAddressRef.current
        ) {
          console.warn(
            "[WalletController] Wallet address changed, logging out"
          );
          handleLogout();
        }
      } catch {
        // Don't logout on transient errors
      }
    };

    void checkAddress();
    const intervalId = setInterval(() => {
      void checkAddress();
    }, WALLET_POLL_MS);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, connected]);

  // ===========================================================================
  // Core auth flow
  // ===========================================================================

  const authenticateInternal = useCallback(
    async (accessTokenUnit?: string) => {
      if (!connected || !wallet) {
        authStore.getState().setError("Please connect your wallet first");
        return;
      }

      authStore.getState().setAuthenticating();

      try {
        const address = await getWalletAddressBech32(wallet);
        if (!address || address.length < 10) {
          throw new Error(`Invalid wallet address: ${address || "(empty)"}`);
        }
        lastAddressRef.current = address;

        let tokenUnit = accessTokenUnit;
        if (!tokenUnit && ACCESS_TOKEN_POLICY_ID) {
          const tokenResult = await findAccessToken(
            wallet,
            ACCESS_TOKEN_POLICY_ID
          );
          tokenUnit = tokenResult?.unit;
        }

        if (!tokenUnit) {
          authStore.getState().setNeedsRegistration();
          return;
        }

        const session = await buildSession(address);
        const signature = await wallet.signData(address, session.nonce);
        const response = await validateSignature(
          session.id,
          signature,
          address,
          tokenUnit
        );

        storeJWT(response.jwt);
        authStore.getState().setAuthenticated(
          {
            alias: response.user.access_token_alias ?? "",
            address: response.user.cardano_bech32_addr,
          },
          response.jwt,
          address
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Authentication failed";
        console.error("[WalletController] Authentication failed:", err);
        authStore.getState().setError(message);
      }
    },
    [connected, wallet]
  );

  // ===========================================================================
  // Public actions
  // ===========================================================================

  const handleLogout = useCallback(() => {
    authStore.getState().setDisconnected();
    lastAddressRef.current = null;
    disconnectWallet();
  }, [disconnectWallet]);

  const handleRetry = useCallback(() => {
    void authenticateInternal();
  }, [authenticateInternal]);

  // ===========================================================================
  // Render
  // ===========================================================================

  // Authenticated — show user info + logout
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <span className="max-w-[120px] truncate text-sm text-mn-primary-light">
          {user.alias || truncateAddress(user.address)}
        </span>
        <button
          onClick={handleLogout}
          className="rounded-md px-2 py-1 text-xs text-mn-text-muted transition-colors hover:bg-midnight-surface hover:text-mn-text min-h-[44px] min-w-[44px]"
          title="Disconnect wallet"
        >
          Logout
        </button>
      </div>
    );
  }

  // Authenticating — show spinner
  if (isAuthenticating) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-sm border border-midnight-border bg-midnight-surface px-3">
        <svg
          className="h-4 w-4 animate-spin text-mn-primary-light"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm text-mn-text-muted">Signing...</span>
      </div>
    );
  }

  // Needs registration — wallet connected but no access token
  if (status === "NEEDS_REGISTRATION" && connected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-mn-primary">Register</span>
        <button
          onClick={handleLogout}
          className="rounded-md px-2 py-1 text-xs text-mn-text-muted transition-colors hover:bg-midnight-surface hover:text-mn-text min-h-[44px]"
          title="Disconnect wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Error state — show error + retry
  if (error && connected) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="max-w-[100px] truncate text-xs text-error"
          title={error}
        >
          Auth failed
        </span>
        <button
          onClick={handleRetry}
          className="rounded-md border border-midnight-border bg-midnight-surface px-3 py-2 text-xs text-mn-text-muted transition-colors hover:text-mn-text min-h-[44px]"
        >
          Retry
        </button>
      </div>
    );
  }

  // Default: show CardanoWallet connect button
  return (
    <div className="[&_button]:!rounded-sm [&_button]:!border [&_button]:!border-midnight-border [&_button]:!bg-midnight-surface [&_button]:!px-4 [&_button]:!py-2 [&_button]:!text-sm [&_button]:!text-mn-text [&_button]:!font-medium [&_button]:!transition-colors [&_button]:hover:!bg-midnight-card">
      <CardanoWallet />
    </div>
  );
}

// =============================================================================
// Exported Component (wraps with MeshProvider)
// =============================================================================

/**
 * WalletController island — self-contained auth flow.
 *
 * Usage in Astro:
 * ```astro
 * <WalletController client:only="react" />
 * ```
 */
export default function WalletController() {
  return (
    <MeshProvider>
      <WalletControllerInner />
    </MeshProvider>
  );
}
