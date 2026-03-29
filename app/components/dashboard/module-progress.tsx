/**
 * Module Progress Card — per-module status display for the dashboard.
 *
 * Shows the module title, current assignment status badge, and a link
 * to the assignment page. Different visual treatment for completed,
 * in-progress, and not-started modules.
 *
 * Does NOT import Mesh SDK — safe for any rendering context.
 *
 * @see ~/components/assignment/commitment-status.tsx — Status badge component
 * @see ~/components/ui/card.tsx — Card component
 */

import { Link } from "react-router";
import { Card, CardBody } from "~/components/ui/card";
import { CommitmentStatusBadge } from "~/components/assignment/commitment-status";
import { MIDNIGHT_PBL } from "~/config/midnight";
import { isCompletedStatus } from "~/lib/assignment-status";
import type { CourseModule } from "~/hooks/api/course/use-course";
import type { DashboardCommitment } from "~/hooks/api/use-dashboard";

// =============================================================================
// Types
// =============================================================================

interface ModuleProgressProps {
  /** Module data from the server loader */
  module: CourseModule;
  /** The commitment for this module (null if no commitment exists) */
  commitment: DashboardCommitment | null;
  /** 1-based index for display numbering */
  index: number;
}

// =============================================================================
// Component
// =============================================================================

export function ModuleProgress({
  module,
  commitment,
  index,
}: ModuleProgressProps) {
  const status = commitment?.status ?? "NOT_STARTED";
  const completed = isCompletedStatus(status);
  const moduleCode = module.moduleCode ?? "";

  return (
    <Card
      className={`relative overflow-hidden ${
        completed
          ? "border-success/30"
          : status !== "NOT_STARTED"
            ? "border-mn-primary/30"
            : ""
      }`}
    >
      {/* Subtle top accent bar for completed modules */}
      {completed && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-success/60 to-success/20" />
      )}

      <CardBody className="space-y-3">
        {/* Module number + title */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-mn-text-muted">
              Module {index}
            </p>
            <h3 className="text-sm font-semibold leading-snug text-mn-text line-clamp-2">
              {module.title ?? `Module ${moduleCode}`}
            </h3>
          </div>

          {/* Completion indicator */}
          {completed && (
            <div className="flex-shrink-0">
              <CheckCircleIcon />
            </div>
          )}
        </div>

        {/* Status badge */}
        <CommitmentStatusBadge status={status} />

        {/* Action link */}
        <Link
          to={MIDNIGHT_PBL.routes.assignment(moduleCode)}
          className="inline-flex min-h-[44px] items-center gap-1 text-xs font-medium text-mn-primary-light transition-colors hover:text-mn-text"
        >
          {completed ? "View assignment" : "Go to assignment"}
          <ArrowRightIcon />
        </Link>
      </CardBody>
    </Card>
  );
}

// =============================================================================
// Icons
// =============================================================================

function CheckCircleIcon() {
  return (
    <svg
      className="h-5 w-5 text-success"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      className="h-3 w-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}
