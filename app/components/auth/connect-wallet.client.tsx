/**
 * Connect Wallet Button — .client.tsx
 *
 * MUST be .client.tsx because it imports from @meshsdk/react.
 * Uses Mesh SDK's CardanoWallet component for wallet selection,
 * and shows auth state when connected.
 *
 * @see ~/projects/01-projects/cardano-xp/src/contexts/andamio-auth-context.tsx — Reference
 */

import { CardanoWallet } from "@meshsdk/react";
import { useAuth } from "~/contexts/auth-context.client";

/**
 * Wallet connect button for the navigation bar.
 *
 * States:
 * - Disconnected: shows Mesh SDK CardanoWallet button
 * - Authenticating: shows loading indicator
 * - Authenticated: shows alias/address + logout
 * - Needs registration: shows "Register" indicator
 * - Error: shows retry option
 */
export function ConnectWallet() {
  const {
    authState,
    isAuthenticated,
    user,
    isAuthenticating,
    authError,
    isWalletConnected,
    authenticate,
    logout,
  } = useAuth();

  // Authenticated — show user info
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <span className="max-w-[120px] truncate text-sm text-mn-primary-light">
          {user.alias || truncateAddress(user.address)}
        </span>
        <button
          onClick={logout}
          className="rounded-md px-2 py-1 text-xs text-mn-text-muted transition-colors hover:bg-midnight-surface hover:text-mn-text"
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
      <div className="flex h-9 items-center gap-2 rounded-lg border border-midnight-border bg-midnight-surface px-3">
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
  if (authState === "NEEDS_REGISTRATION" && isWalletConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-mn-violet">Register</span>
        <button
          onClick={logout}
          className="rounded-md px-2 py-1 text-xs text-mn-text-muted transition-colors hover:bg-midnight-surface hover:text-mn-text"
          title="Disconnect wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Error state — show error + retry
  if (authError && isWalletConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="max-w-[100px] truncate text-xs text-error" title={authError}>
          Auth failed
        </span>
        <button
          onClick={() => void authenticate()}
          className="rounded-md border border-midnight-border bg-midnight-surface px-2 py-1 text-xs text-mn-text-muted transition-colors hover:text-mn-text"
        >
          Retry
        </button>
      </div>
    );
  }

  // Default: show CardanoWallet connect button
  return (
    <div className="[&_button]:!rounded-lg [&_button]:!border [&_button]:!border-midnight-border [&_button]:!bg-midnight-surface [&_button]:!px-4 [&_button]:!py-2 [&_button]:!text-sm [&_button]:!text-mn-text [&_button]:!font-medium [&_button]:!transition-colors [&_button]:hover:!bg-midnight-card">
      <CardanoWallet />
    </div>
  );
}

/**
 * Truncate a bech32 address for display: "addr1q...abc123"
 */
function truncateAddress(address: string): string {
  if (address.length <= 15) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}
