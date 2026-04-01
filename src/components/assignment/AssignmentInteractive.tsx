/**
 * Assignment Interactive Island
 *
 * Client-only React island that renders the appropriate UI based on
 * authentication state and assignment commitment status.
 *
 * Used as `<AssignmentInteractive client:only="react" />` in Astro pages.
 *
 * Wraps itself with QueryClientProvider since each Astro island is an
 * independent React root with no shared context.
 *
 * States:
 *   - Unauthenticated: "Connect wallet to submit" CTA
 *   - Loading commitment: skeleton
 *   - NOT_STARTED: evidence form + "Enroll & Submit"
 *   - IN_PROGRESS: pre-filled form + "Update Submission"
 *   - PENDING_APPROVAL: read-only evidence + "Awaiting Review"
 *   - ASSIGNMENT_ACCEPTED: success + link to dashboard
 *   - ASSIGNMENT_DENIED: feedback + form for resubmission
 *   - CREDENTIAL_CLAIMED: credential earned badge
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { useAssignmentCommitment } from "@/hooks/api/course/use-assignment-commitment";
import { isPendingStatus } from "@/lib/assignment-status";
import { AuthExpiredError } from "@/lib/api-utils";
import { CommitmentStatus } from "@/components/assignment/CommitmentStatus";
import { EvidenceForm } from "@/components/assignment/EvidenceForm";
import { EnrollmentFlow } from "@/components/assignment/EnrollmentFlow";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MIDNIGHT_PBL } from "@/config/midnight";

// =============================================================================
// QueryClient — one per island instance
// =============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

// =============================================================================
// Types
// =============================================================================

interface AssignmentInteractiveProps {
  courseId: string;
  moduleCode: string;
  sltHash: string | null;
}

// =============================================================================
// Outer Component (wraps with QueryClientProvider)
// =============================================================================

export default function AssignmentInteractive(
  props: AssignmentInteractiveProps
) {
  return (
    <QueryClientProvider client={queryClient}>
      <AssignmentInteractiveInner {...props} />
    </QueryClientProvider>
  );
}

// =============================================================================
// Inner Component
// =============================================================================

function AssignmentInteractiveInner({
  courseId,
  moduleCode,
  sltHash,
}: AssignmentInteractiveProps) {
  const status = useAuthStore((s) => s.status);
  const walletAddress = useAuthStore((s) => s.walletAddress);
  const user = useAuthStore((s) => s.user);
  const setDisconnected = useAuthStore((s) => s.setDisconnected);

  const isAuthenticated = status === "AUTHENTICATED";
  const isWalletConnected = !!walletAddress;

  // Only fetch commitment if authenticated
  const {
    data: commitment,
    isLoading: isLoadingCommitment,
    error: commitmentError,
    refetch: refetchCommitment,
  } = useAssignmentCommitment(courseId, moduleCode, sltHash);

  // -------------------------------------------------------------------
  // Unauthenticated: show connect wallet CTA
  // -------------------------------------------------------------------
  if (!isAuthenticated) {
    return <UnauthenticatedCTA isWalletConnected={isWalletConnected} />;
  }

  // -------------------------------------------------------------------
  // Loading commitment data
  // -------------------------------------------------------------------
  if (isLoadingCommitment) {
    return <CommitmentLoadingSkeleton />;
  }

  // -------------------------------------------------------------------
  // Error loading commitment
  // -------------------------------------------------------------------
  if (commitmentError) {
    const isExpired = commitmentError instanceof AuthExpiredError;
    return (
      <Card noHover>
        <CardBody className="py-6">
          <div className="rounded-sm border border-error/30 bg-error/10 p-4">
            <p className="text-sm text-error">
              {isExpired
                ? "Your session has expired. Please reconnect your wallet."
                : "Failed to load your submission status. Please try again."}
            </p>
            <div className="mt-3">
              {isExpired ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDisconnected()}
                >
                  Reconnect Wallet
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void refetchCommitment()}
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Determine status
  const commitmentStatus = commitment?.status ?? "NOT_STARTED";

  // -------------------------------------------------------------------
  // CREDENTIAL_CLAIMED: earned badge
  // -------------------------------------------------------------------
  if (commitmentStatus === "CREDENTIAL_CLAIMED") {
    return (
      <Card noHover>
        <CardBody className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mn-primary/10">
              <CredentialIcon />
            </div>
            <CommitmentStatus status={commitmentStatus} />
            <a href={MIDNIGHT_PBL.routes.dashboard}>
              <Button variant="secondary">View Dashboard</Button>
            </a>
          </div>
        </CardBody>
      </Card>
    );
  }

  // -------------------------------------------------------------------
  // ASSIGNMENT_ACCEPTED: show success + dashboard link
  // -------------------------------------------------------------------
  if (commitmentStatus === "ASSIGNMENT_ACCEPTED") {
    return (
      <Card noHover>
        <CardBody className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <AcceptedIcon />
            </div>
            <CommitmentStatus status={commitmentStatus} />
            <a href={MIDNIGHT_PBL.routes.dashboard}>
              <Button variant="primary">Go to Dashboard</Button>
            </a>
          </div>
        </CardBody>
      </Card>
    );
  }

  // -------------------------------------------------------------------
  // PENDING_APPROVAL: read-only evidence + awaiting review
  // -------------------------------------------------------------------
  if (isPendingStatus(commitmentStatus)) {
    return (
      <Card noHover>
        <CardHeader>
          <CommitmentStatus status={commitmentStatus} />
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-mn-text">
              Your Submitted Evidence
            </h3>
            <EvidenceForm
              initialEvidence={commitment?.networkEvidence}
              onSubmit={() => {
                /* read-only */
              }}
              readOnly
            />
          </div>
        </CardBody>
      </Card>
    );
  }

  // -------------------------------------------------------------------
  // ASSIGNMENT_DENIED: feedback + resubmission form
  // -------------------------------------------------------------------
  if (commitmentStatus === "ASSIGNMENT_DENIED") {
    return (
      <Card noHover>
        <CardHeader>
          <CommitmentStatus
            status={commitmentStatus}
            feedback={commitment?.feedback}
          />
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-mn-text">
              Resubmit Your Evidence
            </h3>
            {sltHash && user?.alias ? (
              <EnrollmentFlow
                courseId={courseId}
                moduleCode={moduleCode}
                sltHash={sltHash}
                alias={user.alias}
                isUpdate
                existingEvidence={commitment?.networkEvidence}
              />
            ) : (
              <MissingSltHashWarning />
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  // -------------------------------------------------------------------
  // IN_PROGRESS: pre-filled form for update
  // -------------------------------------------------------------------
  if (commitmentStatus === "IN_PROGRESS") {
    return (
      <Card noHover>
        <CardHeader>
          <CommitmentStatus status={commitmentStatus} />
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-mn-text">
              Update Your Submission
            </h3>
            {sltHash && user?.alias ? (
              <EnrollmentFlow
                courseId={courseId}
                moduleCode={moduleCode}
                sltHash={sltHash}
                alias={user.alias}
                isUpdate
                existingEvidence={commitment?.networkEvidence}
              />
            ) : (
              <MissingSltHashWarning />
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  // -------------------------------------------------------------------
  // NOT_STARTED (default): fresh enrollment form
  // -------------------------------------------------------------------
  return (
    <Card noHover>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold font-heading text-mn-text sm:text-lg">
            Submit Your Assignment
          </h3>
          <Badge variant="default">Not Started</Badge>
        </div>
        <p className="mt-1 text-sm text-mn-text-muted">
          Provide evidence of your work to enroll and submit this assignment.
          Your submission will be recorded on-chain.
        </p>
      </CardHeader>
      <CardBody>
        {sltHash && user?.alias ? (
          <EnrollmentFlow
            courseId={courseId}
            moduleCode={moduleCode}
            sltHash={sltHash}
            alias={user.alias}
          />
        ) : (
          <MissingSltHashWarning />
        )}
      </CardBody>
    </Card>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function UnauthenticatedCTA({
  isWalletConnected,
}: {
  isWalletConnected: boolean;
}) {
  return (
    <Card noHover>
      <CardBody className="py-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-midnight-border bg-midnight-card">
            <WalletIcon />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-lg font-semibold text-mn-text">
              {isWalletConnected
                ? "Complete Authentication"
                : "Connect Your Wallet"}
            </h3>
            <p className="max-w-sm text-sm text-mn-text-muted">
              {isWalletConnected
                ? "Please complete the authentication flow to submit your assignment."
                : "Connect your Cardano wallet to submit your assignment and earn credentials."}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function CommitmentLoadingSkeleton() {
  return (
    <Card noHover>
      <CardBody className="space-y-4 py-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardBody>
    </Card>
  );
}

function MissingSltHashWarning() {
  return (
    <div className="rounded-sm border border-warning/30 bg-warning/10 p-4">
      <p className="text-sm text-warning">
        This module is not yet configured for on-chain submissions. The
        module SLT hash is missing. Please check back later.
      </p>
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function WalletIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 text-mn-primary-light"
      aria-hidden="true"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function AcceptedIcon() {
  return (
    <svg
      className="h-8 w-8 text-success"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
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

function CredentialIcon() {
  return (
    <svg
      className="h-8 w-8 text-mn-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.27.308 6.023 6.023 0 01-2.27-.308"
      />
    </svg>
  );
}
