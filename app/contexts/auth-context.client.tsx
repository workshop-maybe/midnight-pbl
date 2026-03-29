/**
 * Andamio Auth Context — .client.tsx
 *
 * MUST be .client.tsx because it imports useWallet from @meshsdk/react.
 * React Router v7 excludes .client.tsx files from the server bundle.
 *
 * Provides auth state to the entire app. Handles:
 * - Auto-detecting access token in wallet on connect
 * - Full auth flow: nonce → sign → validate → JWT
 * - JWT persistence in localStorage
 * - Wallet address change detection (10s polling)
 * - Auto re-auth when JWT expires and wallet is connected
 * - NEEDS_REGISTRATION state for first-time users
 *
 * @see ~/projects/01-projects/cardano-xp/src/contexts/andamio-auth-context.tsx — Reference
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useWallet } from "@meshsdk/react";
import {
  buildSession,
  validateSignature,
  storeJWT,
  getStoredJWT,
  clearJWT,
  isJWTExpired,
  decodeJWTPayload,
} from "~/lib/andamio-auth";
import { getWalletAddressBech32 } from "~/lib/wallet-address";
import { findAccessToken } from "~/lib/access-token-utils";
import type { AuthState, AuthUser, AuthContextValue } from "~/types/auth";

// =============================================================================
// Constants
// =============================================================================

/** CIP-30 race condition delay — wallet extensions need time after connect */
const CIP30_DELAY_MS = 500;

/** Polling interval for wallet address change detection */
const WALLET_POLL_MS = 10_000;

/**
 * Access token policy ID from Vite env.
 * VITE_ prefix makes it available to the client bundle.
 */
const ACCESS_TOKEN_POLICY_ID =
  import.meta.env.VITE_ACCESS_TOKEN_POLICY_ID ?? "";

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    connected,
    wallet,
    name: walletName,
    disconnect: disconnectWallet,
  } = useWallet();

  // --- State ---
  const [authState, setAuthState] = useState<AuthState>("DISCONNECTED");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Refs for preventing duplicate effects
  const isValidatingRef = useRef(false);
  const lastAddressRef = useRef<string | null>(null);

  // Derived
  const isAuthenticated = authState === "AUTHENTICATED";

  // =========================================================================
  // JWT Restoration on wallet connect
  // =========================================================================

  useEffect(() => {
    if (!connected || !wallet) {
      return;
    }

    const storedJWT = getStoredJWT();
    if (!storedJWT || isJWTExpired(storedJWT)) {
      // No valid stored JWT — will proceed to scanning in autoAuth effect
      return;
    }

    if (isValidatingRef.current) return;
    isValidatingRef.current = true;

    const validate = async () => {
      try {
        const payload = decodeJWTPayload(storedJWT);
        if (!payload) {
          clearJWT();
          return;
        }

        // Wait for CIP-30 readiness
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
        setJwt(storedJWT);
        setUser({
          alias: payload.accessTokenAlias ?? "",
          address: payload.cardanoBech32Addr ?? walletAddress,
        });
        setAuthState("AUTHENTICATED");
        lastAddressRef.current = walletAddress;
      } catch (error) {
        console.warn("[Auth] JWT validation failed:", error);
        clearJWT();
      } finally {
        isValidatingRef.current = false;
      }
    };

    void validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // =========================================================================
  // Auto-auth when wallet connects without valid JWT
  // =========================================================================

  useEffect(() => {
    if (!connected || !wallet) {
      return;
    }

    // Skip if already authenticated, authenticating, or has error
    if (isAuthenticated || isAuthenticating || authError) {
      return;
    }

    // Skip if validating stored JWT
    if (isValidatingRef.current) {
      return;
    }

    // Skip if stored JWT exists (let validation effect handle it)
    const storedJWT = getStoredJWT();
    if (storedJWT && !isJWTExpired(storedJWT)) {
      return;
    }

    // Wallet connected, no valid JWT — scan for access token
    setAuthState("SCANNING_TOKEN");

    const scanAndAuth = async () => {
      // CIP-30 race condition delay
      await delay(CIP30_DELAY_MS);

      try {
        const tokenResult = await findAccessToken(
          wallet,
          ACCESS_TOKEN_POLICY_ID
        );

        if (!tokenResult) {
          // No access token — user needs to register
          setAuthState("NEEDS_REGISTRATION");
          return;
        }

        // Access token found — auto-trigger auth flow
        await authenticateInternal(tokenResult.unit);
      } catch (error) {
        console.warn("[Auth] Auto-auth scan failed:", error);
        // Scan failed — allow retry before assuming registration needed
        setAuthState("NEEDS_REGISTRATION");
      }
    };

    void scanAndAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, isAuthenticated, isAuthenticating, authError]);

  // =========================================================================
  // Wallet disconnect → clear auth
  // =========================================================================

  useEffect(() => {
    if (!connected) {
      if (isAuthenticated || authState !== "DISCONNECTED") {
        setAuthState("DISCONNECTED");
        setUser(null);
        setJwt(null);
        setAuthError(null);
        setIsAuthenticating(false);
        lastAddressRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // =========================================================================
  // Wallet address change detection (10s polling)
  // =========================================================================

  useEffect(() => {
    if (!isAuthenticated || !connected || !wallet) {
      return;
    }

    const checkAddress = async () => {
      try {
        const currentAddress = await getWalletAddressBech32(wallet);
        if (
          lastAddressRef.current &&
          currentAddress !== lastAddressRef.current
        ) {
          console.warn(
            "[Auth] Wallet address changed, logging out",
            lastAddressRef.current,
            "→",
            currentAddress
          );
          logout();
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

  // =========================================================================
  // Core auth flow
  // =========================================================================

  const authenticateInternal = useCallback(
    async (accessTokenUnit?: string) => {
      if (!connected || !wallet) {
        setAuthError("Please connect your wallet first");
        return;
      }

      setIsAuthenticating(true);
      setAuthError(null);
      setAuthState("AUTHENTICATING");

      try {
        // 1. Get wallet address
        const address = await getWalletAddressBech32(wallet);
        if (!address || address.length < 10) {
          throw new Error(`Invalid wallet address: ${address || "(empty)"}`);
        }
        lastAddressRef.current = address;

        // 2. If no accessTokenUnit provided, try to find one
        let tokenUnit = accessTokenUnit;
        if (!tokenUnit && ACCESS_TOKEN_POLICY_ID) {
          const tokenResult = await findAccessToken(
            wallet,
            ACCESS_TOKEN_POLICY_ID
          );
          tokenUnit = tokenResult?.unit;
        }

        if (!tokenUnit) {
          setAuthState("NEEDS_REGISTRATION");
          setIsAuthenticating(false);
          return;
        }

        // 3. Build session (get nonce)
        const session = await buildSession(address);

        // 4. Sign nonce with wallet (CIP-30 signData)
        // Mesh SDK v2: signData(address, payload)
        const signature = await wallet.signData(address, session.nonce);

        // 5. Validate signature and get JWT
        const response = await validateSignature(
          session.id,
          signature,
          address,
          tokenUnit
        );

        // 6. Store and update state
        storeJWT(response.jwt);
        setJwt(response.jwt);
        setUser({
          alias: response.user.access_token_alias ?? "",
          address: response.user.cardano_bech32_addr,
        });
        setAuthState("AUTHENTICATED");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Authentication failed";
        console.error("[Auth] Authentication failed:", error);
        setAuthError(message);
        setAuthState("AUTH_ERROR");
      } finally {
        setIsAuthenticating(false);
      }
    },
    [connected, wallet]
  );

  // =========================================================================
  // Public actions
  // =========================================================================

  const authenticate = useCallback(async () => {
    await authenticateInternal();
  }, [authenticateInternal]);

  const logout = useCallback(() => {
    clearJWT();
    setJwt(null);
    setUser(null);
    setAuthState("DISCONNECTED");
    setAuthError(null);
    setIsAuthenticating(false);
    lastAddressRef.current = null;
    disconnectWallet();
  }, [disconnectWallet]);

  const refreshAuth = useCallback(() => {
    const storedJWT = getStoredJWT();
    if (!storedJWT) return;

    if (isJWTExpired(storedJWT)) {
      clearJWT();
      setJwt(null);
      setUser(null);
      setAuthState("DISCONNECTED");
      return;
    }

    const payload = decodeJWTPayload(storedJWT);
    if (!payload) return;

    setJwt(storedJWT);
    setUser({
      alias: payload.accessTokenAlias ?? "",
      address: payload.cardanoBech32Addr ?? "",
    });
    setAuthState("AUTHENTICATED");
  }, []);

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!jwt) {
        throw new Error("Not authenticated");
      }

      if (isJWTExpired(jwt)) {
        logout();
        throw new Error("JWT expired, please re-authenticate");
      }

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${jwt}`,
        },
      });
    },
    [jwt, logout]
  );

  // =========================================================================
  // Context value
  // =========================================================================

  const value: AuthContextValue = {
    authState,
    isAuthenticated,
    user,
    jwt,
    isAuthenticating,
    authError,
    isWalletConnected: connected,
    authenticate,
    logout,
    refreshAuth,
    authenticatedFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Default context value returned before the provider loads.
 * Allows components to render safely during dynamic import resolution.
 */
const defaultValue: AuthContextValue = {
  authState: "DISCONNECTED",
  isAuthenticated: false,
  user: null,
  jwt: null,
  isAuthenticating: false,
  authError: null,
  isWalletConnected: false,
  authenticate: async () => {
    console.warn("[Auth] Provider not loaded yet");
  },
  logout: () => {
    console.warn("[Auth] Provider not loaded yet");
  },
  refreshAuth: () => {
    console.warn("[Auth] Provider not loaded yet");
  },
  authenticatedFetch: async () => {
    console.warn("[Auth] Provider not loaded yet");
    return new Response(null, { status: 503 });
  },
};

/**
 * Access the auth context. Returns a safe default if the provider
 * hasn't loaded yet (during dynamic import of .client.tsx providers).
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return defaultValue;
  }
  return context;
}

// =============================================================================
// Helpers
// =============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
