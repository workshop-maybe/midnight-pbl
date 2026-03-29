/**
 * Dashboard Interactive — .client.tsx
 *
 * Client-only dashboard section that fetches authenticated data
 * (commitments + credentials) and renders the interactive progress UI.
 *
 * MUST be .client.tsx because it uses:
 * - useAuth (imports useWallet from @meshsdk/react)
 * - useDashboard (uses authenticatedFetch)
 * - ClaimCredential (uses useTransaction → useWallet)
 *
 * @see ~/hooks/api/use-dashboard.ts — Dashboard data hook
 * @see ~/components/dashboard/module-progress.tsx — Per-module status card
 * @see ~/components/dashboard/claim-credential.tsx — Credential claim CTA
 * @see ~/components/dashboard/credentials-list.tsx — Earned credentials display
 */

import { useAuth } from "~/contexts/auth-context.client";
import { useDashboard } from "~/hooks/api/use-dashboard";
import { AuthGate } from "~/components/auth/auth-gate";
import { ModuleProgress } from "~/components/dashboard/module-progress";
import { CredentialsList } from "~/components/dashboard/credentials-list";
import { ClaimCredential } from "~/components/dashboard/claim-credential";
import { Button } from "~/components/ui/button";
import { SkeletonCard } from "~/components/ui/skeleton";
import { MIDNIGHT_PBL } from "~/config/midnight";
import { AuthExpiredError } from "~/lib/api-utils";
import type { CourseModule } from "~/hooks/api/course/use-course";

// =============================================================================
// Types
// =============================================================================

interface DashboardInteractiveProps {
  /** Modules list from the server loader */
  modules: CourseModule[];
  /** Course ID from the server loader */
  courseId: string;
}

// =============================================================================
// Component
// =============================================================================

export default function DashboardInteractive({
  modules,
  courseId,
}: DashboardInteractiveProps) {
  const auth = useAuth();

  return (
    <AuthGate
      auth={auth}
      message="Connect your wallet to view your progress across all modules."
    >
      <DashboardContent modules={modules} courseId={courseId} />
    </AuthGate>
  );
}

// =============================================================================
// Authenticated Dashboard Content
// =============================================================================

function DashboardContent({
  modules,
  courseId,
}: DashboardInteractiveProps) {
  const auth = useAuth();
  const {
    commitments,
    credentials,
    acceptedCount,
    allModulesAccepted,
    isLoading,
    error,
    refetch,
  } = useDashboard(courseId);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Loading skeleton for module grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: MIDNIGHT_PBL.moduleCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const isExpired = error instanceof AuthExpiredError;

    // Even on error, we can render modules from the server loader.
    // Show an inline error for the commitments section only.
    return (
      <div className="space-y-10">
        {/* Module grid — always rendered from server data */}
        <section>
          <h2 className="mb-4 text-lg font-semibold font-heading text-mn-text">
            Module Progress
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => (
              <ModuleProgress
                key={module.sltHash || module.moduleCode || index}
                module={module}
                commitment={null}
                index={index + 1}
              />
            ))}
          </div>
        </section>

        {/* Inline error for commitments */}
        <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-center">
          <p className="text-sm text-error">
            {isExpired
              ? "Your session has expired. Please reconnect your wallet."
              : "Failed to load your progress data. Please try again."}
          </p>
          <div className="mt-3">
            {isExpired ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => auth.logout()}
              >
                Reconnect Wallet
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void refetch()}
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Build a lookup of commitments by module code
  const commitmentByModule = new Map(
    commitments.map((c) => [c.moduleCode, c])
  );

  const hasCredential = credentials.length > 0;

  return (
    <div className="space-y-10">
      {/* Module progress grid */}
      <section>
        <h2 className="mb-4 text-lg font-semibold font-heading text-mn-text">
          Module Progress
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <ModuleProgress
              key={module.sltHash || module.moduleCode || index}
              module={module}
              commitment={
                commitmentByModule.get(module.moduleCode ?? "") ?? null
              }
              index={index + 1}
            />
          ))}
        </div>
      </section>

      {/* Credential claim section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold font-heading text-mn-text">
          Course Credential
        </h2>
        <ClaimCredential
          allModulesAccepted={allModulesAccepted}
          acceptedCount={acceptedCount}
          courseId={courseId}
          hasCredential={hasCredential}
        />
      </section>

      {/* Earned credentials */}
      {hasCredential && (
        <section>
          <h2 className="mb-4 text-lg font-semibold font-heading text-mn-text">
            Earned Credentials
          </h2>
          <CredentialsList
            credentials={credentials}
            courseTitle={MIDNIGHT_PBL.title}
          />
        </section>
      )}
    </div>
  );
}
