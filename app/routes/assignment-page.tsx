/**
 * Assignment Page
 *
 * Displays the assignment prompt for a module and the interactive
 * submission/enrollment UI. The prompt renders server-side; the
 * interactive parts (evidence form, status, enrollment flow) render
 * client-side only because they depend on the auth context and wallet.
 *
 * Data optimization: module detail is NOT fetched here — the parent
 * learn-layout.tsx already loads it for the sidebar. This page accesses
 * the parent's module data via useRouteLoaderData, eliminating a
 * redundant fetchModuleDetail call (which itself fetches the full
 * modules list behind the scenes).
 *
 * Route: /learn/:moduleCode/assignment
 *
 * States based on auth + commitment status:
 *   - Unauthenticated: prompt + "Connect wallet to submit" CTA
 *   - NOT_STARTED: prompt + evidence form + "Enroll & Submit" button
 *   - IN_PROGRESS: pre-filled form + "Update Submission" button
 *   - PENDING_APPROVAL: submitted evidence (read-only) + "Awaiting Review"
 *   - ASSIGNMENT_ACCEPTED: "Assignment accepted" + link to dashboard
 *   - ASSIGNMENT_DENIED: feedback + evidence form for resubmission
 *   - CREDENTIAL_CLAIMED: "Credential earned" badge
 */

import { data } from "react-router";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRouteLoaderData } from "react-router";
import { Suspense, lazy } from "react";
import { fetchAssignment } from "~/lib/gateway.server";
import { serverEnv } from "~/env.server";
import { LessonContent } from "~/components/course/lesson-content";
import { Card, CardBody } from "~/components/ui/card";
import { getPageTitle } from "~/config/branding";
import type { Assignment, CourseModule } from "~/hooks/api/course/use-course";
import type { loader as learnLayoutLoader } from "~/routes/learn-layout";

// Lazy-load the client-only interactive section to avoid SSR issues
// with Mesh SDK imports (useWallet, etc.)
const AssignmentInteractive = lazy(
  () => import("~/components/assignment/assignment-interactive.client")
);

export async function loader({ params }: LoaderFunctionArgs) {
  const courseId = serverEnv.COURSE_ID;
  if (!courseId) {
    throw new Response("Course ID not configured", { status: 500 });
  }

  const moduleCode = params.moduleCode;
  if (!moduleCode) {
    throw new Response("Module code is required", { status: 400 });
  }

  // Only fetch the assignment content — module detail comes from
  // the parent learn-layout loader (accessed via useRouteLoaderData).
  // This eliminates a redundant fetchModuleDetail call that would
  // fetch the full modules list just to find one module.
  const assignment = await fetchAssignment(courseId, moduleCode);

  return data({ assignment, courseId, moduleCode });
}

export const meta: MetaFunction<typeof loader> = ({ data: loaderData }) => {
  // Meta function can't use hooks, so we fall back to "Module" for title
  // when parent data isn't available in the meta context.
  const moduleCode =
    (loaderData as { moduleCode: string } | undefined)?.moduleCode ?? "";
  return [
    { title: getPageTitle(`Assignment: ${moduleCode || "Module"}`) },
    {
      name: "description",
      content: `Assignment for module ${moduleCode}`,
    },
  ];
};

export function shouldRevalidate() {
  return false;
}

export default function AssignmentPage() {
  const { assignment, courseId, moduleCode } =
    useLoaderData<typeof loader>();

  // Access module detail from the parent learn-layout loader instead
  // of re-fetching it. The parent already loaded the module for the
  // sidebar — reuse that data to get sltHash and title.
  const parentData = useRouteLoaderData<typeof learnLayoutLoader>(
    "routes/learn-layout"
  );
  const parentModule = (parentData?.module ?? null) as CourseModule | null;

  const typedAssignment = assignment as Assignment | null;
  const typedModuleCode = moduleCode as string;
  const typedCourseId = courseId as string;
  const sltHash = parentModule?.sltHash ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Assignment header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-3 text-2xl font-bold font-heading text-mn-text sm:text-3xl">
          {typedAssignment?.title ??
            `${parentModule?.title ?? "Module"} Assignment`}
        </h1>
        {typedAssignment?.description && (
          <p className="max-w-2xl text-base text-mn-text-muted sm:text-lg">
            {typedAssignment.description}
          </p>
        )}
      </div>

      {/* Assignment content */}
      {typedAssignment ? (
        <section className="mb-10">
          <LessonContent contentJson={typedAssignment.contentJson} />
        </section>
      ) : (
        <div className="mb-10 rounded-xl border border-midnight-border bg-midnight-surface/50 p-4 text-center sm:p-8">
          <p className="text-mn-text-muted">
            No assignment available for this module yet.
          </p>
        </div>
      )}

      {/* Interactive section (client-only) */}
      <Suspense fallback={<InteractiveLoadingFallback />}>
        <AssignmentInteractive
          courseId={typedCourseId}
          moduleCode={typedModuleCode}
          sltHash={sltHash}
        />
      </Suspense>
    </div>
  );
}

/**
 * Loading fallback shown while the client-only bundle loads.
 */
function InteractiveLoadingFallback() {
  return (
    <Card noHover>
      <CardBody className="py-8 text-center">
        <p className="text-mn-text-muted mb-2">
          Loading submission interface...
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-mn-primary-light" />
          <div className="h-2 w-2 animate-pulse rounded-full bg-mn-primary-light delay-100" />
          <div className="h-2 w-2 animate-pulse rounded-full bg-mn-primary-light delay-200" />
        </div>
      </CardBody>
    </Card>
  );
}
