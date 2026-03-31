/**
 * Course Overview / Homepage
 *
 * Displays the course with wordmark, description, vertical module list,
 * and community section. Content-first layout.
 *
 * Route: / (index)
 */

import { data } from "react-router";
import type { MetaFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import { fetchCourseModules } from "~/lib/gateway.server";
import { serverEnv } from "~/env.server";
import { Button } from "~/components/ui/button";
import { BRANDING } from "~/config/branding";
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
  { title: getPageTitle() },
  {
    name: "description",
    content: BRANDING.description,
  },
];

export function shouldRevalidate() {
  return false;
}

export default function CourseOverview() {
  const { modules } = useLoaderData<typeof loader>();

  const sorted = [...(modules as CourseModule[])].sort((a, b) => {
    const codeA = parseInt(a.moduleCode ?? "0", 10);
    const codeB = parseInt(b.moduleCode ?? "0", 10);
    return codeA - codeB;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
      {/* Midnight wordmark */}
      <div className="mb-12 sm:mb-16">
        <p className="font-heading text-4xl font-bold tracking-tight text-mn-text sm:text-5xl md:text-6xl">
          midnight pbl
        </p>
        <p className="mt-1 font-heading text-lg text-mn-text-muted sm:text-xl">
          From Aiken to Compact
        </p>
      </div>

      {/* Course description */}
      <div className="mb-12 sm:mb-16 max-w-2xl">
        <p className="text-base text-mn-text-muted leading-relaxed sm:text-lg">
          {BRANDING.longDescription}
        </p>
      </div>

      {/* Module list */}
      <div className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-mn-text-muted">
          Modules
        </h2>
        {sorted.length === 0 ? (
          <p className="text-mn-text-muted py-4">
            No modules available yet.
          </p>
        ) : (
          <div className="divide-y divide-midnight-border border-t border-b border-midnight-border">
            {sorted.map((module, index) => {
              const moduleCode = module.moduleCode ?? "";
              const sltCount = module.slts?.length ?? 0;

              return (
                <Link
                  key={module.sltHash || moduleCode || index}
                  to={MIDNIGHT_PBL.routes.module(moduleCode)}
                  prefetch="intent"
                  className="group flex items-baseline gap-4 py-4 transition-colors hover:bg-midnight-surface/50 sm:py-5 -mx-4 px-4 sm:-mx-6 sm:px-6"
                >
                  <span className="text-sm font-mono text-mn-text-muted w-6 shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-base font-medium text-mn-text group-hover:text-mn-primary-hover">
                      {module.title ?? "Untitled Module"}
                    </span>
                    {module.description && (
                      <p className="mt-1 text-sm text-mn-text-muted line-clamp-1">
                        {module.description}
                      </p>
                    )}
                  </div>
                  {sltCount > 0 && (
                    <span className="text-xs text-mn-text-muted shrink-0">
                      {sltCount} {sltCount === 1 ? "lesson" : "lessons"}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Credentials note */}
      <div className="mb-12 sm:mb-16">
        <p className="text-sm text-mn-text-muted">
          Self-paced. On-chain credentials via{" "}
          <a
            href={BRANDING.links.andamio}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mn-primary transition-colors hover:text-mn-text underline underline-offset-2"
          >
            Andamio
          </a>
          .
        </p>
      </div>

      {/* Community */}
      <div className="border-t border-midnight-border pt-10 sm:pt-12">
        <p className="mb-4 text-base text-mn-text-muted leading-relaxed">
          This course is a free community resource. It's made to be refined
          over time by the people who use it — if something is unclear, missing,
          or could be better, that's a contribution waiting to happen.
        </p>
        <a
          href="https://github.com/workshop-maybe/midnight-pbl/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="secondary" size="md">Give Feedback</Button>
        </a>
      </div>
    </div>
  );
}
