/**
 * useTransaction Hook
 *
 * Main transaction hook for the Midnight PBL app. Orchestrates the full
 * TX lifecycle using React local state for the synchronous flow:
 *
 *   IDLE -> BUILDING -> SIGNING -> SUBMITTING -> REGISTERING -> SUCCESS / ERROR
 *
 * After submission, hands off to the Zustand txStore for SSE confirmation watching.
 *
 * IMPORTANT: This hook imports useWallet from @meshsdk/react, so it must
 * only be imported from .client.tsx components.
 *
 * @see ~/config/transaction-ui.ts — TX type config
 * @see ~/stores/tx-store.ts — SSE watcher store
 * @see ~/projects/01-projects/andamio-platform/andamio-app-v2/src/hooks/tx/use-transaction.ts
 */

import { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "~/contexts/auth-context.client";
import { withTimeout } from "~/lib/api-utils";
import {
  type TransactionType,
  getTransactionUI,
  requiresJWT,
} from "~/config/transaction-ui";
import { txStore } from "~/stores/tx-store";

// =============================================================================
// Types
// =============================================================================

/**
 * Transaction lifecycle states.
 */
export type TransactionState =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "registering"
  | "success"
  | "error";

export interface TransactionResult {
  txHash: string;
}

interface UnsignedTxResponse {
  unsigned_tx?: string;
  unsignedTxCBOR?: string;
  [key: string]: unknown;
}

// =============================================================================
// Error Helpers
// =============================================================================

/** Map known wallet/SDK error messages to user-friendly text */
function humanizeError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("user declined") ||
    lower.includes("user rejected") ||
    lower.includes("user denied")
  ) {
    return "You declined to sign the transaction.";
  }
  if (lower.includes("insufficient") && lower.includes("fund")) {
    return "Insufficient funds in your wallet to complete this transaction.";
  }
  return message;
}

// =============================================================================
// Hook
// =============================================================================

export function useTransaction() {
  const { wallet, connected } = useWallet();
  const { jwt } = useAuth();
  const queryClient = useQueryClient();

  const [state, setState] = useState<TransactionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransactionResult | null>(null);

  /**
   * Execute a transaction through the full lifecycle.
   *
   * @param txType - One of the 4 supported transaction types
   * @param params - Parameters passed to the Andamio API build endpoint
   * @param options.invalidateKeys - React Query keys to invalidate on success
   * @param options.onSuccess - Callback fired after successful submission
   */
  const execute = useCallback(
    async (
      txType: TransactionType,
      params: Record<string, unknown>,
      options?: {
        invalidateKeys?: readonly unknown[][];
        onSuccess?: (txHash: string) => void | Promise<void>;
      }
    ) => {
      const ui = getTransactionUI(txType);

      // Reset state
      setError(null);
      setResult(null);

      try {
        // -----------------------------------------------------------------
        // Step 0: Prerequisites
        // -----------------------------------------------------------------
        if (!connected || !wallet) {
          throw new Error("Please connect your wallet first.");
        }

        // JWT check — access token mint does NOT require JWT
        if (requiresJWT(txType) && !jwt) {
          throw new Error("Please authenticate before performing this action.");
        }

        // -----------------------------------------------------------------
        // Step 1: Build transaction (fetch unsigned CBOR from server)
        // -----------------------------------------------------------------
        setState("building");

        const buildHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (jwt) {
          buildHeaders.Authorization = `Bearer ${jwt}`;
        }

        const buildResponse = await withTimeout(
          fetch("/api/tx/build", {
            method: "POST",
            headers: buildHeaders,
            body: JSON.stringify({ txType, params }),
          }),
          15_000
        );

        if (!buildResponse.ok) {
          const errorData = await buildResponse.json().catch(() => ({})) as {
            error?: string;
            details?: string;
          };
          const errorMsg =
            errorData.details ?? errorData.error ?? buildResponse.statusText;
          throw new Error(`${ui.errorMessage}: ${errorMsg}`);
        }

        const buildResult = (await buildResponse.json()) as UnsignedTxResponse;
        const unsignedCbor =
          buildResult.unsigned_tx ?? buildResult.unsignedTxCBOR;

        if (!unsignedCbor) {
          throw new Error("No unsigned transaction returned from API.");
        }

        // -----------------------------------------------------------------
        // Step 2: Sign transaction with wallet
        // -----------------------------------------------------------------
        setState("signing");

        // partialSign=true is REQUIRED for Andamio V2
        const signedTx = await withTimeout(
          wallet.signTxReturnFullTx(unsignedCbor, true),
          60_000 // 60s timeout for signing
        );

        // -----------------------------------------------------------------
        // Step 3: Submit to blockchain
        // -----------------------------------------------------------------
        setState("submitting");

        const txHash = await withTimeout(
          wallet.submitTx(signedTx),
          15_000
        );

        // -----------------------------------------------------------------
        // Step 4: Register with gateway for monitoring
        // -----------------------------------------------------------------
        setState("registering");

        const registerHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (jwt) {
          registerHeaders.Authorization = `Bearer ${jwt}`;
        }

        try {
          await withTimeout(
            fetch("/api/tx/register", {
              method: "POST",
              headers: registerHeaders,
              body: JSON.stringify({ txHash, txType }),
            }),
            10_000
          );
        } catch (regError) {
          // Registration failure is non-critical — gateway may still pick it up
          console.warn(`[TX] Failed to register ${txType}:`, regError);
        }

        // -----------------------------------------------------------------
        // Step 5: Hand off to SSE watcher store
        // -----------------------------------------------------------------
        if (ui.requiresDBUpdate) {
          txStore.getState().startWatching(txHash);
        }

        // -----------------------------------------------------------------
        // Step 6: Success!
        // -----------------------------------------------------------------
        setState("success");
        setResult({ txHash });

        // Invalidate relevant React Query caches
        if (options?.invalidateKeys) {
          for (const key of options.invalidateKeys) {
            void queryClient.invalidateQueries({ queryKey: key });
          }
        }

        // Fire success callback
        await options?.onSuccess?.(txHash);
      } catch (err) {
        const rawMessage =
          err instanceof Error ? err.message : String(err);
        const friendlyMessage = humanizeError(rawMessage);

        console.error(`[TX] ${txType} failed:`, err);
        setError(friendlyMessage);
        setState("error");
      }
    },
    [connected, wallet, jwt, queryClient]
  );

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setResult(null);
  }, []);

  return {
    execute,
    state,
    result,
    error,
    reset,

    // Derived state helpers
    isIdle: state === "idle",
    isLoading: ["building", "signing", "submitting", "registering"].includes(
      state
    ),
    isSuccess: state === "success",
    isError: state === "error",
  };
}
