/**
 * Module Detail Page
 *
 * Displays module header, introduction, SLT list, and assignment link.
 * Data is loaded server-side.
 *
 * Route: /learn/:moduleCode
 */

import { data } from "react-router";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import {
  fetchModuleDetail,
  fetchSLTs,
  fetchIntroduction,
} from "~/lib/gateway.server";
import { serverEnv } from "~/env.server";
import { ModuleHeader } from "~/components/course/module-header";
import { SLTList } from "~/components/course/slt-list";
import { LessonContent } from "~/components/course/lesson-content";
import { Button } from "~/components/ui/button";
import { getPageTitle } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { CourseModule, SLT, Introduction } from "~/hooks/api/course/use-course";

export async function loader({ params }: LoaderFunctionArgs) {
  const courseId = serverEnv.COURSE_ID;
  if (!courseId) {
    throw new Response("Course ID not configured", { status: 500 });
  }

  const moduleCode = params.moduleCode;
  if (!moduleCode) {
    throw new Response("Module code is required", { status: 400 });
  }

  const [module, slts, introduction] = await Promise.all([
    fetchModuleDetail(courseId, moduleCode),
    fetchSLTs(courseId, moduleCode),
    fetchIntroduction(courseId, moduleCode),
  ]);

  if (!module) {
    throw new Response("Module not found", { status: 404 });
  }

  return data({ module, slts, introduction, courseId, moduleCode });
}

export const meta: MetaFunction<typeof loader> = ({ data: loaderData }) => {
  const title = (loaderData as { module: CourseModule } | undefined)?.module?.title ?? "Module";
  return [
    { title: getPageTitle(title) },
    {
      name: "description",
      content: (loaderData as { module: CourseModule } | undefined)?.module?.description ??
        `Module details for ${title}`,
    },
  ];
};

export function shouldRevalidate() {
  return false;
}

export default function ModulePage() {
  const { module, slts, introduction, moduleCode } =
    useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Module header */}
      <ModuleHeader module={module as CourseModule} />

      {/* Introduction content */}
      {(introduction as Introduction | null) && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold font-heading text-mn-text">
            Introduction
          </h2>
          <LessonContent
            contentJson={(introduction as Introduction).contentJson}
          />
        </section>
      )}

      {/* SLT list / lessons */}
      <section className="mb-10">
        <SLTList
          slts={slts as SLT[]}
          moduleCode={moduleCode as string}
        />
      </section>

      {/* Assignment link */}
      <section className="rounded-xl border border-midnight-border bg-midnight-surface/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold font-heading text-mn-text">
              Module Assignment
            </h2>
            <p className="text-sm text-mn-text-muted">
              Complete the assignment to earn your credential for this module.
            </p>
          </div>
          <Link to={MIDNIGHT_PBL.routes.assignment(moduleCode as string)}>
            <Button variant="primary">View Assignment</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
