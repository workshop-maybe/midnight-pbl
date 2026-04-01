/**
 * Registration Flow — React island
 *
 * Shown when a wallet is connected but no access token is detected.
 * The user chooses an alias and mints an Andamio Access Token using
 * the useTransaction hook.
 *
 * MUST be used inside a MeshProvider (e.g., as client:only="react"
 * island or wrapped by WalletController).
 *
 * After minting, re-authenticates the user with their new access token.
 *
 * Uses the auth store instead of useAuth() context.
 *
 * @see @/hooks/tx/use-transaction.ts — Transaction hook
 * @see @/config/transaction-ui.ts — TX type config
 */

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { authStore, useAuthStore } from "@/stores/auth-store";
import { useTransaction } from "@/hooks/tx/use-transaction";
import { TransactionButton } from "@/components/tx/transaction-button";
import { TxStatus } from "@/components/tx/tx-status";
import { getWalletAddressBech32 } from "@/lib/wallet-address";

/**
 * Registration flow for first-time users.
 *
 * Shows alias input + mint button. After minting, triggers
 * re-authentication with the new access token.
 */
export function RegistrationFlow() {
  const status = useAuthStore((s) => s.status);
  const { wallet } = useWallet();

  const {
    execute,
    state: txState,
    result,
    error: txError,
    reset,
  } = useTransaction();

  const [alias, setAlias] = useState("");

  // After successful mint, the WalletController will detect the new access
  // token on the next scan cycle. Force a re-scan by resetting auth state,
  // which triggers WalletController's auto-auth effect.
  useEffect(() => {
    if (txState === "success" && result?.txHash) {
      const timer = setTimeout(() => {
        // Reset to WALLET_CONNECTED to trigger WalletController's
        // auto-auth effect, which will scan for the new access token
        authStore.getState().setScanningToken();
        // Give the scan a moment, then reload if still not authenticated
        setTimeout(() => {
          if (authStore.getState().status !== "AUTHENTICATED") {
            window.location.reload();
          }
        }, 5000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [txState, result]);

  const handleMint = useCallback(async () => {
    if (!alias.trim() || !wallet) return;

    try {
      const walletAddress = await getWalletAddressBech32(wallet);

      await execute("GLOBAL_GENERAL_ACCESS_TOKEN_MINT", {
        initiator_data: walletAddress,
        alias: alias.trim(),
      });
    } catch {
      // Error is handled by the hook and displayed via txError
    }
  }, [alias, wallet, execute]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // Only show when wallet is connected and needs registration
  if (status !== "NEEDS_REGISTRATION") {
    return null;
  }

  const isInProgress = [
    "building",
    "signing",
    "submitting",
    "registering",
  ].includes(txState);

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-sm border border-midnight-border bg-midnight-card p-4 sm:p-6">
      <div className="space-y-2 text-center">
        <h2 className="font-heading text-xl font-semibold text-mn-text">
          Welcome to Midnight PBL
        </h2>
        <p className="text-sm text-mn-text-muted">
          To get started, you need an Andamio Access Token. Choose an alias
          and mint your token to begin learning.
        </p>
      </div>

      {txState === "success" ? (
        <div className="space-y-4 text-center">
          <div className="rounded-sm border border-success/30 bg-success/10 p-4">
            <p className="text-sm text-success">
              Access token minted successfully! Authenticating...
            </p>
          </div>
          {result?.txHash && (
            <p className="text-xs text-mn-text-muted">
              TX:{" "}
              <code className="font-mono">
                {result.txHash.slice(0, 16)}...{result.txHash.slice(-8)}
              </code>
            </p>
          )}
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
              disabled={isInProgress}
              className="w-full rounded-sm border border-midnight-border bg-midnight-surface px-4 py-2.5 text-sm text-mn-text placeholder:text-mn-text-muted/50 focus:border-mn-primary-light focus:outline-none focus:ring-1 focus:ring-mn-primary-light disabled:opacity-50"
            />
            <p className="text-xs text-mn-text-muted">
              This will be your on-chain identity. 1-32 characters,
              alphanumeric.
            </p>
          </div>

          {/* TX status indicator */}
          {txState !== "idle" && txState !== "error" && (
            <TxStatus txState={txState} error={txError} />
          )}

          {/* Mint button */}
          <TransactionButton
            state={txState}
            label="Mint Access Token"
            onClick={() => void handleMint()}
            onRetry={handleReset}
            disabled={!alias.trim()}
          />

          {/* Error message */}
          {txError && (
            <div className="rounded-sm border border-error/30 bg-error/10 p-3">
              <p className="text-sm text-error">{txError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
