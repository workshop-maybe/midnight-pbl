/**
 * Registration Flow — .client.tsx
 *
 * Shown when a wallet is connected but no access token is detected.
 * The user chooses an alias and mints an Andamio Access Token.
 *
 * MUST be .client.tsx because it uses the auth context (which imports useWallet).
 *
 * The actual mint transaction call is a placeholder — Unit 4 builds
 * the transaction infrastructure (useTransaction hook).
 */

import { useState, useCallback } from "react";
import { useAuth } from "~/contexts/auth-context.client";
import { Button } from "~/components/ui/button";

/**
 * Registration flow for first-time users.
 *
 * Shows alias input + mint button. After minting, triggers
 * re-authentication with the new access token.
 */
export function RegistrationFlow() {
  const { authState, isWalletConnected, authenticate } = useAuth();

  const [alias, setAlias] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState(false);

  const handleMint = useCallback(async () => {
    if (!alias.trim()) return;

    setIsMinting(true);
    setMintError(null);

    try {
      // TODO (Unit 4): Replace with actual mint transaction via useTransaction hook
      // The flow will be:
      // 1. Build TX: POST /api/tx/build with { type: "ACCESS_TOKEN_MINT", params: { alias } }
      // 2. Sign TX: wallet.signTxReturnFullTx(cbor, true)
      // 3. Submit TX: wallet.submitTx(signed)
      // 4. Register TX: POST /api/tx/register
      // 5. Wait for confirmation via SSE stream
      // 6. Re-authenticate with new access token

      console.warn(
        "[Registration] Mint TX not implemented yet (Unit 4). Alias:",
        alias
      );
      throw new Error(
        "Access token minting is not yet implemented. This feature will be available in a future update."
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Mint failed";
      setMintError(message);
    } finally {
      setIsMinting(false);
    }
  }, [alias]);

  const handleRetryAuth = useCallback(() => {
    void authenticate();
  }, [authenticate]);

  // Only show when wallet is connected and needs registration
  if (authState !== "NEEDS_REGISTRATION" || !isWalletConnected) {
    return null;
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-midnight-border bg-midnight-card/80 p-6 backdrop-blur-sm">
      <div className="space-y-2 text-center">
        <h2 className="font-heading text-xl font-semibold text-mn-text">
          Welcome to Midnight PBL
        </h2>
        <p className="text-sm text-mn-text-muted">
          To get started, you need an Andamio Access Token.
          Choose an alias and mint your token to begin learning.
        </p>
      </div>

      {mintSuccess ? (
        <div className="space-y-4 text-center">
          <div className="rounded-lg border border-success/30 bg-success/10 p-4">
            <p className="text-sm text-success">
              Access token minted successfully! Authenticating...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Alias input */}
          <div className="space-y-2">
            <label
              htmlFor="alias-input"
              className="block text-sm font-medium text-mn-text"
            >
              Choose your alias
            </label>
            <input
              id="alias-input"
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g., MyAlias123"
              maxLength={32}
              disabled={isMinting}
              className="w-full rounded-lg border border-midnight-border bg-midnight-surface px-4 py-2.5 text-sm text-mn-text placeholder:text-mn-text-muted/50 focus:border-mn-primary-light focus:outline-none focus:ring-1 focus:ring-mn-primary-light disabled:opacity-50"
            />
            <p className="text-xs text-mn-text-muted">
              This will be your on-chain identity. 1-32 characters, alphanumeric.
            </p>
          </div>

          {/* Mint button */}
          <Button
            variant="primary"
            size="lg"
            loading={isMinting}
            disabled={!alias.trim() || isMinting}
            onClick={() => void handleMint()}
            className="w-full"
          >
            Mint Access Token
          </Button>

          {/* Retry auth button — in case scan missed an existing token */}
          <button
            onClick={handleRetryAuth}
            className="w-full text-center text-xs text-mn-text-muted transition-colors hover:text-mn-primary-light"
          >
            Already have an access token? Click to retry authentication
          </button>

          {/* Error message */}
          {mintError && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-3">
              <p className="text-sm text-error">{mintError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
