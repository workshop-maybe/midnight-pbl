/**
 * Auth Gate — guards content behind authentication.
 *
 * Reads auth state from the vanilla Zustand auth store.
 * Renders children when authenticated, shows a connect prompt otherwise.
 *
 * No Mesh SDK imports — safe to import from any React island.
 */

import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface AuthGateProps {
  /** Content to render when authenticated */
  children: ReactNode;
  /** Optional custom message for the connect prompt */
  message?: string;
}

/**
 * Renders children only when the user is authenticated.
 * Shows a connect-wallet prompt otherwise.
 *
 * Usage:
 * ```tsx
 * <AuthGate>
 *   <ProtectedContent />
 * </AuthGate>
 * ```
 */
export function AuthGate({
  children,
  message = "Connect your wallet to access this content.",
}: AuthGateProps) {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);

  if (status === "AUTHENTICATED") {
    return <>{children}</>;
  }

  return (
    <ConnectWalletPrompt
      message={message}
      status={status}
      error={error}
    />
  );
}

/**
 * Prompt shown when the user is not authenticated.
 */
function ConnectWalletPrompt({
  message,
  status,
  error,
}: {
  message: string;
  status: string;
  error: string | null;
}) {
  const isAuthenticating =
    status === "AUTHENTICATING" || status === "SCANNING_TOKEN";

  return (
    <div className="flex flex-col items-center justify-center gap-5 px-4 py-10 sm:py-16">
      {/* Wallet icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-midnight-border bg-midnight-card">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7 text-mn-primary-light"
          aria-hidden="true"
        >
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
      </div>

      <div className="space-y-1.5 text-center">
        <h3 className="font-heading text-lg font-semibold text-mn-text">
          Wallet Required
        </h3>
        <p className="max-w-sm text-sm text-mn-text-muted">{message}</p>
      </div>

      {/* Show auth error if present */}
      {error && (
        <div className="w-full max-w-sm rounded-sm border border-error/30 bg-error/10 px-4 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Show authenticating state */}
      {isAuthenticating && (
        <p className="text-sm text-mn-text-muted">Authenticating...</p>
      )}
    </div>
  );
}
