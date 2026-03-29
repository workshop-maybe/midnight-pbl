/**
 * Commitment Status — displays the current assignment commitment state.
 *
 * Maps canonical assignment statuses to colored badges and descriptive labels.
 * Shows reviewer feedback when the assignment has been denied.
 *
 * Does NOT import Mesh SDK — safe for any rendering context.
 *
 * @see ~/lib/assignment-status.ts — AssignmentStatus type and normalizer
 */

import { Badge } from "~/components/ui/badge";
import type { AssignmentStatus } from "~/lib/assignment-status";

// =============================================================================
// Types
// =============================================================================

interface CommitmentStatusProps {
  /** Canonical assignment status */
  status: AssignmentStatus | string;
  /** Reviewer feedback (shown for ASSIGNMENT_DENIED) */
  feedback?: string | null;
  /** Additional CSS classes for the container */
  className?: string;
}

// =============================================================================
// Status Configuration
// =============================================================================

interface StatusConfig {
  label: string;
  variant: "default" | "success" | "warning" | "error" | "info" | "violet";
  description: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  NOT_STARTED: {
    label: "Not Started",
    variant: "default",
    description: "You have not enrolled in this assignment yet.",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "info",
    description: "Your assignment is in progress.",
  },
  PENDING_APPROVAL: {
    label: "Awaiting Review",
    variant: "warning",
    description:
      "Your submission is being reviewed. You will be notified when a decision is made.",
  },
  ASSIGNMENT_ACCEPTED: {
    label: "Accepted",
    variant: "success",
    description:
      "Your assignment has been accepted! You can claim your credential.",
  },
  ASSIGNMENT_DENIED: {
    label: "Needs Revision",
    variant: "error",
    description:
      "Your assignment needs revision. Please review the feedback below and resubmit.",
  },
  CREDENTIAL_CLAIMED: {
    label: "Credential Earned",
    variant: "violet",
    description: "You have earned the credential for this module.",
  },
};

/**
 * Get configuration for a status value. Falls back to a generic display
 * for unknown statuses (graceful degradation).
 */
function getConfig(status: string): StatusConfig {
  return (
    STATUS_CONFIG[status] ?? {
      label: status.replace(/_/g, " "),
      variant: "default" as const,
      description: `Status: ${status}`,
    }
  );
}

// =============================================================================
// Component
// =============================================================================

export function CommitmentStatus({
  status,
  feedback,
  className = "",
}: CommitmentStatusProps) {
  const config = getConfig(status);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status badge and description */}
      <div className="flex items-center gap-3">
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
      <p className="text-sm text-mn-text-muted">{config.description}</p>

      {/* Reviewer feedback (ASSIGNMENT_DENIED) */}
      {status === "ASSIGNMENT_DENIED" && feedback && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4">
          <h4 className="mb-1 text-sm font-medium text-error">
            Reviewer Feedback
          </h4>
          <p className="text-sm text-mn-text-muted">{feedback}</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Compact variant for inline display
// =============================================================================

interface CommitmentStatusBadgeProps {
  status: AssignmentStatus | string;
}

/**
 * Compact badge-only variant for use in lists or headers.
 */
export function CommitmentStatusBadge({ status }: CommitmentStatusBadgeProps) {
  const config = getConfig(status);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
