/**
 * Assignment Page
 *
 * Displays the assignment prompt for a module and the interactive
 * submission/enrollment UI. The prompt renders server-side; the
 * interactive parts (evidence form, status, enrollment flow) render
 * client-side only because they depend on the auth context and wallet.
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
import { useLoaderData, Link } from "react-router";
import { Suspense, lazy } from "react";
import { fetchAssignment, fetchModuleDetail } from "~/lib/gateway.server";
import { serverEnv } from "~/env.server";
import { LessonContent } from "~/components/course/lesson-content";
import { Card, CardBody } from "~/components/ui/card";
import { getPageTitle } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { Assignment, CourseModule } from "~/hooks/api/course/use-course";

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

  const [assignment, module] = await Promise.all([
    fetchAssignment(courseId, moduleCode),
    fetchModuleDetail(courseId, moduleCode),
  ]);

  return data({ assignment, module, courseId, moduleCode });
}

export const meta: MetaFunction<typeof loader> = ({ data: loaderData }) => {
  const moduleTitle =
    (loaderData as { module: CourseModule | null } | undefined)?.module?.title ??
    "Module";
  return [
    { title: getPageTitle(`Assignment: ${moduleTitle}`) },
    {
      name: "description",
      content: `Assignment for ${moduleTitle}`,
    },
  ];
};

export function shouldRevalidate() {
  return false;
}

export default function AssignmentPage() {
  const { assignment, module, courseId, moduleCode } =
    useLoaderData<typeof loader>();

  const typedAssignment = assignment as Assignment | null;
  const typedModule = module as CourseModule | null;
  const typedModuleCode = moduleCode as string;
  const typedCourseId = courseId as string;
  const sltHash = typedModule?.sltHash ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-mn-text-muted">
        <Link
          to={MIDNIGHT_PBL.routes.learn}
          prefetch="intent"
          className="transition-colors hover:text-mn-text"
        >
          Modules
        </Link>
        <span>/</span>
        <Link
          to={MIDNIGHT_PBL.routes.module(typedModuleCode)}
          prefetch="intent"
          className="transition-colors hover:text-mn-text"
        >
          {typedModule?.title ?? typedModuleCode}
        </Link>
        <span>/</span>
        <span className="text-mn-text">Assignment</span>
      </nav>

      {/* Assignment header */}
      <div className="mb-8">
        <h1 className="mb-3 text-3xl font-bold font-heading text-mn-text">
          {typedAssignment?.title ??
            `${typedModule?.title ?? "Module"} Assignment`}
        </h1>
        {typedAssignment?.description && (
          <p className="max-w-2xl text-lg text-mn-text-muted">
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
        <div className="mb-10 rounded-xl border border-midnight-border bg-midnight-surface/50 p-8 text-center">
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
