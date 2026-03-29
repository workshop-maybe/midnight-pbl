/**
 * Course Overview Page
 *
 * Displays a grid of all modules in the course.
 * Data is loaded server-side via the gateway.server.ts client.
 *
 * Route: /learn (index of the learn prefix)
 */

import { data } from "react-router";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { fetchCourseModules } from "~/lib/gateway.server";
import { serverEnv } from "~/env.server";
import { ModuleCard } from "~/components/course/module-card";
import { getPageTitle } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { CourseModule } from "~/hooks/api/course/use-course";

export async function loader() {
  const courseId = serverEnv.COURSE_ID;
  if (!courseId) {
    throw new Response("Course ID not configured", { status: 500 });
  }

  const modules = await fetchCourseModules(courseId);

  return data({ modules, courseId });
}

export const meta: MetaFunction = () => [
  { title: getPageTitle("Modules") },
  {
    name: "description",
    content: `Browse all ${MIDNIGHT_PBL.moduleCount} modules in ${MIDNIGHT_PBL.title}`,
  },
];

/**
 * Prevent re-fetching on back-navigation — course content is static.
 */
export function shouldRevalidate() {
  return false;
}

export default function CourseOverview() {
  const { modules } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="mb-3 text-3xl font-bold font-heading text-mn-text sm:text-4xl">
          {MIDNIGHT_PBL.title}
        </h1>
        <p className="max-w-2xl text-lg text-mn-text-muted">
          {MIDNIGHT_PBL.description}
        </p>
      </div>

      {/* Module grid */}
      {modules.length === 0 ? (
        <div className="rounded-xl border border-midnight-border bg-midnight-surface/50 p-12 text-center">
          <p className="text-lg text-mn-text-muted">
            No modules available yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(modules as CourseModule[]).map((module, index) => (
            <ModuleCard
              key={module.sltHash || module.moduleCode || index}
              module={module}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
