/**
 * Dashboard Page
 *
 * Shows the learner's progress across all 6 modules, earned credentials,
 * and the credential claim CTA.
 *
 * Server-side: fetches the public modules list (no auth required).
 * Client-side: fetches authenticated data (commitments + credentials)
 * via the DashboardInteractive client component.
 *
 * Route: /dashboard (inside app-layout.tsx)
 *
 * @see ~/components/dashboard/dashboard-interactive.client.tsx
 * @see ~/hooks/api/use-dashboard.ts
 */

import { data } from "react-router";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { lazy, Suspense } from "react";
import { fetchCourseModules } from "~/lib/gateway.server";
import { serverEnv } from "~/env.server";
import { SkeletonCard } from "~/components/ui/skeleton";
import { getPageTitle } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { CourseModule } from "~/hooks/api/course/use-course";

// Lazy-load the client-only dashboard interactive section.
// Uses Mesh SDK (useWallet) and auth context (localStorage JWT).
const DashboardInteractive = lazy(
  () => import("~/components/dashboard/dashboard-interactive.client")
);

// =============================================================================
// Loader
// =============================================================================

export async function loader() {
  const courseId = serverEnv.COURSE_ID;
  if (!courseId) {
    throw new Response("Course ID not configured", { status: 500 });
  }

  const modules = await fetchCourseModules(courseId);

  return data({ modules, courseId });
}

// =============================================================================
// Meta
// =============================================================================

export const meta: MetaFunction = () => [
  { title: getPageTitle("Dashboard") },
  {
    name: "description",
    content: `Track your progress across all ${MIDNIGHT_PBL.moduleCount} modules in ${MIDNIGHT_PBL.title}`,
  },
];

// =============================================================================
// Revalidation
// =============================================================================

/**
 * Prevent re-fetching modules on navigation — module data is static.
 * Commitments and credentials are fetched client-side.
 */
export function shouldRevalidate() {
  return false;
}

// =============================================================================
// Component
// =============================================================================

export default function Dashboard() {
  const { modules, courseId } = useLoaderData<typeof loader>();

  const typedModules = modules as CourseModule[];
  const typedCourseId = courseId as string;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="mb-3 text-3xl font-bold font-heading text-mn-text sm:text-4xl">
          Your Progress
        </h1>
        <p className="max-w-2xl text-lg text-mn-text-muted">
          Track your enrollment status across all {MIDNIGHT_PBL.moduleCount}{" "}
          modules and claim your credential when complete.
        </p>
      </div>

      {/* Interactive section — client-only */}
      {typeof window === "undefined" ? (
        <DashboardLoadingFallback />
      ) : (
        <Suspense fallback={<DashboardLoadingFallback />}>
          <DashboardInteractive
            modules={typedModules}
            courseId={typedCourseId}
          />
        </Suspense>
      )}
    </div>
  );
}

// =============================================================================
// Loading Fallback
// =============================================================================

function DashboardLoadingFallback() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: MIDNIGHT_PBL.moduleCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
