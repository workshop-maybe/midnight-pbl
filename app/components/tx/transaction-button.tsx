/**
 * Transaction Button — Shows different states through the TX lifecycle.
 *
 * Uses Midnight brand colors for states:
 * - idle: gradient primary button
 * - building/signing/submitting: animated with muted tones
 * - success: success green
 * - error: error red with retry option
 *
 * @see ~/hooks/tx/use-transaction.ts — TransactionState type
 */

import type { TransactionState } from "~/hooks/tx/use-transaction";
import { Button } from "~/components/ui/button";

// =============================================================================
// Types
// =============================================================================

interface TransactionButtonProps {
  /** Current transaction state from useTransaction hook */
  state: TransactionState;
  /** Label shown in idle state */
  label: string;
  /** Click handler — typically calls execute() from useTransaction */
  onClick: () => void;
  /** Click handler for retry after error */
  onRetry?: () => void;
  /** Whether the button should be disabled (beyond state-driven disabling) */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// State Labels
// =============================================================================

const STATE_LABELS: Record<TransactionState, string> = {
  idle: "",
  building: "Building transaction...",
  signing: "Please sign in wallet...",
  submitting: "Submitting...",
  registering: "Registering...",
  success: "Complete!",
  error: "Transaction failed",
};

// =============================================================================
// Component
// =============================================================================

export function TransactionButton({
  state,
  label,
  onClick,
  onRetry,
  disabled = false,
  className = "",
}: TransactionButtonProps) {
  const isLoading = ["building", "signing", "submitting", "registering"].includes(state);
  const isTerminal = state === "success" || state === "error";

  // Success state
  if (state === "success") {
    return (
      <div
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 px-6 py-3 text-sm font-medium text-success sm:text-base ${className}`}
      >
        <SuccessIcon />
        <span className="truncate">{STATE_LABELS.success}</span>
      </div>
    );
  }

  // Error state with retry
  if (state === "error") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="inline-flex items-center gap-2 text-sm text-error">
          <ErrorIcon />
          {STATE_LABELS.error}
        </div>
        <Button
          variant="danger"
          size="md"
          onClick={onRetry ?? onClick}
          className="w-full"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Idle or loading state
  return (
    <Button
      variant="primary"
      size="lg"
      loading={isLoading}
      disabled={disabled || isLoading || isTerminal}
      onClick={onClick}
      className={`w-full ${className}`}
    >
      {isLoading ? STATE_LABELS[state] : label}
    </Button>
  );
}

// =============================================================================
// Icons
// =============================================================================

function SuccessIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
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

function ErrorIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}
