/**
 * Auth Gate — guards content behind authentication.
 *
 * NOT .client.tsx — this file has no Mesh SDK imports.
 * It reads auth state from the context (which may return defaults
 * before the .client.tsx provider loads).
 *
 * Renders children when authenticated, shows a connect prompt otherwise.
 */

import type { ReactNode } from "react";
import type { AuthContextValue } from "~/types/auth";

interface AuthGateProps {
  /** The auth context value — passed in to avoid importing .client.tsx */
  auth: AuthContextValue;
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
 * // In a .client.tsx file where useAuth is available:
 * const auth = useAuth();
 * <AuthGate auth={auth}>
 *   <ProtectedContent />
 * </AuthGate>
 * ```
 */
export function AuthGate({
  auth,
  children,
  message = "Connect your wallet to access this content.",
}: AuthGateProps) {
  if (auth.isAuthenticated) {
    return <>{children}</>;
  }

  return <ConnectWalletPrompt message={message} auth={auth} />;
}

/**
 * Prompt shown when the user is not authenticated.
 */
function ConnectWalletPrompt({
  message,
  auth,
}: {
  message: string;
  auth: AuthContextValue;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-12 sm:py-20">
      {/* Wallet icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-midnight-border bg-midnight-card">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8 text-mn-primary-light"
          aria-hidden="true"
        >
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
      </div>

      <div className="space-y-2 text-center">
        <h3 className="font-heading text-lg font-semibold text-mn-text">
          Wallet Required
        </h3>
        <p className="max-w-sm text-sm text-mn-text-muted">{message}</p>
      </div>

      {/* Show auth error if present */}
      {auth.authError && (
        <div className="w-full max-w-sm rounded-sm border border-error/30 bg-error/10 px-4 py-3">
          <p className="text-sm text-error">{auth.authError}</p>
          {auth.scanFailed && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={auth.retryScan}
                className="rounded bg-midnight-card px-3 py-2 text-xs font-medium text-mn-text hover:bg-midnight-border transition-colors min-h-[44px]"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={auth.goToRegistration}
                className="rounded px-3 py-2 text-xs font-medium text-mn-text-muted hover:text-mn-text transition-colors min-h-[44px]"
              >
                Register New Token
              </button>
            </div>
          )}
        </div>
      )}

      {/* Show authenticating state */}
      {auth.isAuthenticating && (
        <p className="text-sm text-mn-text-muted">Authenticating...</p>
      )}
    </div>
  );
}
