/**
 * Assignment Page (shell)
 *
 * Displays the assignment prompt for a module. The submission form
 * will be added in Unit 5.
 *
 * Route: /learn/:moduleCode/assignment
 */

import { data } from "react-router";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { fetchAssignment, fetchModuleDetail } from "~/lib/gateway.server";
import { serverEnv } from "~/env.server";
import { LessonContent } from "~/components/course/lesson-content";
import { Badge } from "~/components/ui/badge";
import { Card, CardBody } from "~/components/ui/card";
import { getPageTitle } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { Assignment, CourseModule } from "~/hooks/api/course/use-course";

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
  const { assignment, module, moduleCode } =
    useLoaderData<typeof loader>();

  const typedAssignment = assignment as Assignment | null;
  const typedModule = module as CourseModule | null;
  const typedModuleCode = moduleCode as string;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-mn-text-muted">
        <Link
          to={MIDNIGHT_PBL.routes.learn}
          className="transition-colors hover:text-mn-text"
        >
          Modules
        </Link>
        <span>/</span>
        <Link
          to={MIDNIGHT_PBL.routes.module(typedModuleCode)}
          className="transition-colors hover:text-mn-text"
        >
          {typedModule?.title ?? typedModuleCode}
        </Link>
        <span>/</span>
        <span className="text-mn-text">Assignment</span>
      </nav>

      {/* Assignment header */}
      <div className="mb-8">
        <Badge variant="violet" className="mb-3">
          Assignment
        </Badge>
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

      {/* Submission placeholder — Unit 5 */}
      <Card noHover>
        <CardBody className="text-center py-8">
          <p className="text-mn-text-muted mb-2">
            Connect your wallet to submit your assignment.
          </p>
          <p className="text-xs text-mn-text-muted/60">
            Submission form coming in a future update.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
