/**
 * Dashboard Interactive Island
 *
 * Client-only React island that fetches authenticated data
 * (commitments + credentials) and renders the interactive progress UI.
 *
 * Used as `<DashboardInteractive client:only="react" />` in the
 * dashboard Astro page. Wraps itself with QueryClientProvider since
 * each Astro island is an independent React root.
 *
 * MUST be client:only="react" because it uses:
 * - useAuthStore (reads auth state)
 * - useDashboard (uses authenticatedFetch)
 * - ClaimCredential (uses useTransaction -> useWallet)
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { useDashboard } from "@/hooks/api/use-dashboard";
import { AuthGate } from "@/components/auth/AuthGate";
import { ModuleProgress } from "@/components/dashboard/ModuleProgress";
import { CredentialsList } from "@/components/dashboard/CredentialsList";
import { ClaimCredential } from "@/components/dashboard/ClaimCredential";
import { AccountDetails } from "@/components/dashboard/AccountDetails";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { MIDNIGHT_PBL } from "@/config/midnight";
import { AuthExpiredError } from "@/lib/api-utils";
import type { CourseModule } from "@/types/course";

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

interface DashboardInteractiveProps {
  /** Modules list from the server (serialized as JSON string) */
  modulesJson: string;
  /** Course ID from the server */
  courseId: string;
}

// =============================================================================
// Outer Component (wraps with QueryClientProvider)
// =============================================================================

export default function DashboardInteractive(
  props: DashboardInteractiveProps
) {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardInteractiveInner {...props} />
    </QueryClientProvider>
  );
}

// =============================================================================
// Inner Component (inside QueryClientProvider)
// =============================================================================

function DashboardInteractiveInner({
  modulesJson,
  courseId,
}: DashboardInteractiveProps) {
  // Parse modules from JSON string (Astro -> React serialization)
  const modules: CourseModule[] = (() => {
    try {
      return JSON.parse(modulesJson) as CourseModule[];
    } catch {
      return [];
    }
  })();

  return (
    <AuthGate message="Connect your wallet to view your progress across all modules.">
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
}: {
  modules: CourseModule[];
  courseId: string;
}) {
  const setDisconnected = useAuthStore((s) => s.setDisconnected);
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
            {[...modules]
              .sort(
                (a, b) =>
                  parseInt(a.moduleCode ?? "0", 10) -
                  parseInt(b.moduleCode ?? "0", 10)
              )
              .map((module, index) => (
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
        <div className="rounded-sm border border-error/30 bg-error/10 p-6 text-center">
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
                onClick={() => setDisconnected()}
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
      {/* Account details */}
      <section>
        <AccountDetails />
      </section>

      {/* Module progress grid */}
      <section>
        <h2 className="mb-4 text-lg font-semibold font-heading text-mn-text">
          Module Progress
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...modules]
            .sort(
              (a, b) =>
                parseInt(a.moduleCode ?? "0", 10) -
                parseInt(b.moduleCode ?? "0", 10)
            )
            .map((module, index) => (
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
