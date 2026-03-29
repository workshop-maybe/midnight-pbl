/**
 * Claim Credential Section — .client.tsx-style component
 *
 * Shows the credential claim UI on the dashboard. When all modules
 * are accepted, displays a "Claim Course Credential" button that
 * triggers the COURSE_STUDENT_CREDENTIAL_CLAIM transaction.
 *
 * When not all modules are accepted, shows a progress message with
 * the count of accepted modules out of the total.
 *
 * NOTE: This component uses useTransaction (which imports useWallet),
 * so it must only be rendered from client-side code (.client.tsx or
 * lazy-loaded in Suspense).
 *
 * @see ~/hooks/tx/use-transaction.ts — Transaction hook
 * @see ~/components/tx/transaction-button.tsx — TX button states
 * @see ~/hooks/api/use-dashboard.ts — Dashboard data hook
 */

import { useCallback } from "react";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useAuth } from "~/contexts/auth-context.client";
import { useInvalidateDashboard } from "~/hooks/api/use-dashboard";
import { commitmentKeys, courseKeys } from "~/hooks/api/query-keys";
import { dashboardKeys } from "~/hooks/api/use-dashboard";
import { TransactionButton } from "~/components/tx/transaction-button";
import { TxStatus } from "~/components/tx/tx-status";
import { Card, CardBody } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { MIDNIGHT_PBL } from "~/config/midnight";

// =============================================================================
// Types
// =============================================================================

interface ClaimCredentialProps {
  /** Whether all modules have ASSIGNMENT_ACCEPTED status */
  allModulesAccepted: boolean;
  /** Number of accepted modules */
  acceptedCount: number;
  /** The course NFT policy ID */
  courseId: string;
  /** Whether the student already has a credential for this course */
  hasCredential: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ClaimCredential({
  allModulesAccepted,
  acceptedCount,
  courseId,
  hasCredential,
}: ClaimCredentialProps) {
  const { user } = useAuth();
  const invalidateDashboard = useInvalidateDashboard();

  const {
    execute,
    state: txState,
    result,
    error: txError,
    reset,
  } = useTransaction();

  const handleClaim = useCallback(async () => {
    if (!user?.alias || !courseId) return;

    await execute(
      "COURSE_STUDENT_CREDENTIAL_CLAIM",
      {
        course_id: courseId,
        alias: user.alias,
      },
      {
        invalidateKeys: [
          [...dashboardKeys.credentialsList(courseId)],
          [...dashboardKeys.commitmentsList(courseId)],
          [...commitmentKeys.all],
          [...courseKeys.all],
        ],
        onSuccess: async () => {
          await invalidateDashboard(courseId);
        },
      }
    );
  }, [user?.alias, courseId, execute, invalidateDashboard]);

  // Already has credential
  if (hasCredential) {
    return (
      <Card className="border-mn-violet/30">
        <CardBody className="py-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mn-violet/30 bg-mn-violet/10">
              <TrophyIcon className="h-6 w-6 text-mn-violet" />
            </div>
          </div>
          <Badge variant="violet" className="mb-2">
            Credential Earned
          </Badge>
          <p className="text-sm text-mn-text-muted">
            You have earned the course credential for {MIDNIGHT_PBL.title}.
          </p>
        </CardBody>
      </Card>
    );
  }

  // TX success
  if (txState === "success" && result?.txHash) {
    return (
      <Card className="border-success/30">
        <CardBody className="space-y-4">
          <TxStatus txState={txState} txHash={result.txHash} />
          <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center">
            <p className="text-sm font-medium text-success">
              Credential claimed successfully!
            </p>
            <p className="mt-1 text-xs text-mn-text-muted">
              Your on-chain credential is being confirmed.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // TX in progress
  if (txState !== "idle" && txState !== "error") {
    return (
      <Card>
        <CardBody className="space-y-4">
          <TxStatus txState={txState} error={txError} />
          <TransactionButton
            state={txState}
            label="Claim Course Credential"
            onClick={() => {
              /* TX in progress */
            }}
            onRetry={reset}
          />
        </CardBody>
      </Card>
    );
  }

  // TX error
  if (txState === "error") {
    return (
      <Card>
        <CardBody className="space-y-4">
          <TxStatus txState={txState} error={txError} />
          <TransactionButton
            state={txState}
            label="Claim Course Credential"
            onClick={reset}
            onRetry={reset}
          />
        </CardBody>
      </Card>
    );
  }

  // All modules accepted — show claim button
  if (allModulesAccepted) {
    return (
      <Card className="border-mn-primary/30">
        <CardBody className="space-y-4 py-6 text-center">
          <div className="mb-2 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mn-primary/30 bg-mn-primary/10">
              <TrophyIcon className="h-6 w-6 text-mn-primary-light" />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-lg font-semibold font-heading text-mn-text">
              All Modules Complete!
            </h3>
            <p className="mb-4 text-sm text-mn-text-muted">
              You have completed all {MIDNIGHT_PBL.moduleCount} modules. Claim
              your on-chain credential.
            </p>
          </div>
          <TransactionButton
            state={txState}
            label="Claim Course Credential"
            onClick={() => void handleClaim()}
          />
        </CardBody>
      </Card>
    );
  }

  // Not all modules accepted — show progress
  return (
    <Card noHover>
      <CardBody className="py-6 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-midnight-border bg-midnight-surface">
            <TrophyIcon className="h-6 w-6 text-mn-text-muted/40" />
          </div>
        </div>
        <p className="mb-2 text-sm font-medium text-mn-text">
          Complete all {MIDNIGHT_PBL.moduleCount} modules to claim your
          credential
        </p>
        <p className="text-xs text-mn-text-muted">
          {acceptedCount} of {MIDNIGHT_PBL.moduleCount} modules accepted
        </p>

        {/* Progress bar */}
        <div className="mx-auto mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-midnight-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-mn-primary to-mn-violet transition-all duration-500"
            style={{
              width: `${(acceptedCount / MIDNIGHT_PBL.moduleCount) * 100}%`,
            }}
          />
        </div>
      </CardBody>
    </Card>
  );
}

// =============================================================================
// Icons
// =============================================================================

function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.016 6.016 0 01-5.54 0M7.73 9.728a6.016 6.016 0 005.54 0"
      />
    </svg>
  );
}
