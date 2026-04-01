/**
 * Assignment Status Normalizer
 *
 * Maps raw API status strings to canonical values. Handles both V1 and V2
 * format differences. Returns raw value for unknown strings (graceful degradation).
 *
 * @see ~/projects/01-projects/andamio-platform/andamio-app-v2/src/lib/assignment-status.ts
 */

// =============================================================================
// Types
// =============================================================================

export type AssignmentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "ASSIGNMENT_ACCEPTED"
  | "ASSIGNMENT_DENIED"
  | "CREDENTIAL_CLAIMED";

// =============================================================================
// Alias Map
// =============================================================================

/**
 * Maps all known raw status strings (uppercased) to canonical values.
 * Covers both V1 and V2 API responses plus on-chain status values.
 */
const STATUS_ALIASES: Record<string, AssignmentStatus> = {
  // Canonical values (V2)
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ASSIGNMENT_ACCEPTED: "ASSIGNMENT_ACCEPTED",
  ASSIGNMENT_DENIED: "ASSIGNMENT_DENIED",
  CREDENTIAL_CLAIMED: "CREDENTIAL_CLAIMED",

  // V1 aliases
  AWAITING_SUBMISSION: "IN_PROGRESS",
  DRAFT: "IN_PROGRESS",
  ASSIGNMENT_REFUSED: "ASSIGNMENT_DENIED",
  ASSIGNMENT_LEFT: "NOT_STARTED",
  LEFT: "NOT_STARTED",

  // On-chain status values (andamioscan / chain_only responses)
  COMPLETED: "CREDENTIAL_CLAIMED",
  CURRENT: "IN_PROGRESS",
  PENDING: "PENDING_APPROVAL",
  SAVE_FOR_LATER: "IN_PROGRESS",
  COMMITMENT: "IN_PROGRESS",
  NETWORK_READY: "IN_PROGRESS",
};

// =============================================================================
// Normalizer
// =============================================================================

/**
 * Normalize a raw assignment status string to a canonical value.
 *
 * - null/undefined/empty → "NOT_STARTED"
 * - Known aliases → mapped canonical value
 * - Contains "PENDING_TX" → "IN_PROGRESS" (transaction in flight)
 * - Unknown strings → returned as-is (graceful degradation)
 */
export function normalizeAssignmentStatus(
  rawStatus: string | null | undefined
): AssignmentStatus | string {
  if (!rawStatus) return "NOT_STARTED";

  const normalized = rawStatus.trim().toUpperCase();

  // In-flight transaction
  if (normalized.includes("PENDING_TX")) {
    return "IN_PROGRESS";
  }

  const aliased = STATUS_ALIASES[normalized];
  if (aliased) return aliased;

  // Graceful degradation: return raw value for unknown strings
  return rawStatus;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if the status represents a completed assignment (accepted or credential claimed).
 */
export function isCompletedStatus(status: AssignmentStatus | string): boolean {
  return status === "ASSIGNMENT_ACCEPTED" || status === "CREDENTIAL_CLAIMED";
}

/**
 * Check if the status allows claiming a credential.
 */
export function isClaimableStatus(status: AssignmentStatus | string): boolean {
  return status === "ASSIGNMENT_ACCEPTED";
}

/**
 * Check if the status indicates a submission is pending review.
 */
export function isPendingStatus(status: AssignmentStatus | string): boolean {
  return status === "PENDING_APPROVAL";
}

/**
 * Check if the status allows submitting or resubmitting an assignment.
 */
export function canSubmitAssignment(status: AssignmentStatus | string): boolean {
  return (
    status === "NOT_STARTED" ||
    status === "IN_PROGRESS" ||
    status === "ASSIGNMENT_DENIED"
  );
}
