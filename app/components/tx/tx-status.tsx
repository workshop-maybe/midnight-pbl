/**
 * Transaction Status — Progress indicator during TX lifecycle.
 *
 * Shows current step with animated dots/spinner during async steps.
 * Uses Midnight brand colors.
 *
 * @see ~/hooks/tx/use-transaction.ts — TransactionState type
 * @see ~/stores/tx-store.ts — Post-submission SSE watching
 */

import type { TransactionState } from "~/hooks/tx/use-transaction";
import type { TxWatchStatus } from "~/stores/tx-store";

// =============================================================================
// Types
// =============================================================================

interface TxStatusProps {
  /** Transaction lifecycle state from useTransaction */
  txState: TransactionState;
  /** Post-submission watch status from txStore (optional) */
  watchStatus?: TxWatchStatus;
  /** Error message to display */
  error?: string | null;
  /** TX hash for display after submission */
  txHash?: string | null;
}

// =============================================================================
// Step Definitions
// =============================================================================

interface Step {
  label: string;
  key: TransactionState | TxWatchStatus;
}

const TX_STEPS: Step[] = [
  { label: "Build transaction", key: "building" },
  { label: "Sign with wallet", key: "signing" },
  { label: "Submit to blockchain", key: "submitting" },
  { label: "Register for tracking", key: "registering" },
  { label: "Confirm on chain", key: "confirmed" },
  { label: "Database updated", key: "updated" },
];

/** Map states to step index for progress tracking */
function getActiveStepIndex(
  txState: TransactionState,
  watchStatus?: TxWatchStatus
): number {
  // Post-submission states
  if (txState === "success" && watchStatus) {
    switch (watchStatus) {
      case "pending":
        return 4;
      case "confirmed":
        return 4;
      case "updated":
        return 5;
      case "stalled":
        return 4;
      default:
        return 5;
    }
  }

  switch (txState) {
    case "building":
      return 0;
    case "signing":
      return 1;
    case "submitting":
      return 2;
    case "registering":
      return 3;
    case "success":
      return 5;
    case "error":
      return -1;
    default:
      return -1;
  }
}

// =============================================================================
// Component
// =============================================================================

export function TxStatus({
  txState,
  watchStatus,
  error,
  txHash,
}: TxStatusProps) {
  const activeIndex = getActiveStepIndex(txState, watchStatus);

  // Don't show anything in idle state
  if (txState === "idle") return null;

  return (
    <div className="space-y-4 rounded-xl border border-midnight-border bg-midnight-card/60 p-4 backdrop-blur-sm">
      {/* Step list */}
      <div className="space-y-2">
        {TX_STEPS.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          const isFailed = txState === "error" && index === activeIndex;

          return (
            <div
              key={step.key}
              className="flex items-center gap-3 text-sm"
            >
              {/* Step indicator */}
              <div className="flex-shrink-0">
                {isComplete ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-success">
                    <CheckIcon />
                  </div>
                ) : isActive ? (
                  <div className="flex h-5 w-5 items-center justify-center">
                    {isFailed ? (
                      <div className="h-2 w-2 rounded-full bg-error" />
                    ) : (
                      <div className="h-2 w-2 animate-pulse rounded-full bg-mn-primary-light" />
                    )}
                  </div>
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-midnight-border" />
                  </div>
                )}
              </div>

              {/* Step label */}
              <span
                className={`${
                  isComplete
                    ? "text-success"
                    : isActive
                      ? isFailed
                        ? "text-error"
                        : "text-mn-text"
                      : "text-mn-text-muted/50"
                }`}
              >
                {step.label}
                {isActive && !isFailed && <AnimatedDots />}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 p-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* TX hash after submission */}
      {txHash && txState === "success" && (
        <div className="border-t border-midnight-border pt-3">
          <p className="text-xs text-mn-text-muted">
            TX Hash:{" "}
            <code className="font-mono text-mn-text">
              {txHash.slice(0, 16)}...{txHash.slice(-8)}
            </code>
          </p>
        </div>
      )}

      {/* Watch status after submission */}
      {watchStatus && txState === "success" && (
        <WatchStatusBadge status={watchStatus} />
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function AnimatedDots() {
  return (
    <span className="inline-flex w-6 overflow-hidden">
      <span className="animate-pulse">...</span>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3 w-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function WatchStatusBadge({ status }: { status: TxWatchStatus }) {
  const config: Record<TxWatchStatus, { label: string; className: string }> = {
    pending: {
      label: "Waiting for confirmation...",
      className: "text-mn-primary-light bg-mn-primary/10 border-mn-primary/30",
    },
    confirmed: {
      label: "Confirmed on chain, updating database...",
      className: "text-mn-sky bg-mn-sky/10 border-mn-sky/30",
    },
    updated: {
      label: "Complete!",
      className: "text-success bg-success/10 border-success/30",
    },
    failed: {
      label: "Transaction failed on chain",
      className: "text-error bg-error/10 border-error/30",
    },
    expired: {
      label: "Transaction expired",
      className: "text-mn-text-muted bg-midnight-surface border-midnight-border",
    },
    stalled: {
      label: "Confirmed but database update delayed. Please refresh shortly.",
      className: "text-warning bg-warning/10 border-warning/30",
    },
  };

  const { label, className } = config[status];

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs font-medium ${className}`}
    >
      {status === "pending" || status === "confirmed" ? (
        <span className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          {label}
        </span>
      ) : (
        label
      )}
    </div>
  );
}
