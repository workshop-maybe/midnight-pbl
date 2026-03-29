/**
 * Lesson Page
 *
 * Renders lesson content with markdown formatting.
 * Provides previous/next navigation between lessons.
 *
 * Data optimization: SLTs are NOT fetched here — the parent
 * learn-layout.tsx already loads them for the sidebar. This page
 * accesses parent SLT data via useRouteLoaderData to build
 * prev/next navigation without a redundant API call.
 *
 * Route: /learn/:moduleCode/:lessonIndex
 */

import { data } from "react-router";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRouteLoaderData, Link } from "react-router";
import { fetchLesson } from "~/lib/gateway.server";
import { serverEnv } from "~/env.server";
import { LessonContent } from "~/components/course/lesson-content";
import { Button } from "~/components/ui/button";
import { getPageTitle } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { Lesson, SLT } from "~/hooks/api/course/use-course";
import type { loader as learnLayoutLoader } from "~/routes/learn-layout";

export async function loader({ params }: LoaderFunctionArgs) {
  const courseId = serverEnv.COURSE_ID;
  if (!courseId) {
    throw new Response("Course ID not configured", { status: 500 });
  }

  const moduleCode = params.moduleCode;
  const lessonIndexStr = params.lessonIndex;
  if (!moduleCode || !lessonIndexStr) {
    throw new Response("Module code and lesson index are required", {
      status: 400,
    });
  }

  const lessonIndex = parseInt(lessonIndexStr, 10);
  if (isNaN(lessonIndex) || lessonIndex < 0) {
    throw new Response("Invalid lesson index", { status: 400 });
  }

  // Only fetch the lesson content — SLTs come from the parent
  // learn-layout loader (accessed via useRouteLoaderData in the component).
  // This eliminates a redundant fetchSLTs call on every lesson navigation.
  const lesson = await fetchLesson(courseId, moduleCode, lessonIndex);

  if (!lesson) {
    throw new Response("Lesson not found", { status: 404 });
  }

  return data({
    lesson,
    moduleCode,
    lessonIndex,
  });
}

export const meta: MetaFunction<typeof loader> = ({ data: loaderData }) => {
  const title =
    (loaderData as { lesson: Lesson } | undefined)?.lesson?.title ?? "Lesson";
  return [{ title: getPageTitle(title) }];
};

export function shouldRevalidate() {
  return false;
}

export default function LessonPage() {
  const {
    lesson,
    moduleCode,
    lessonIndex,
  } = useLoaderData<typeof loader>();

  // Access SLTs from the parent learn-layout loader instead of
  // fetching them again. This is the key data deduplication — the
  // sidebar already has the SLT list, so we reuse it for prev/next nav.
  const parentData = useRouteLoaderData<typeof learnLayoutLoader>(
    "routes/learn-layout"
  );
  const parentSlts = (parentData?.slts ?? []) as SLT[];

  const typedLesson = lesson as Lesson;
  const typedModuleCode = moduleCode as string;
  const typedLessonIndex = lessonIndex as number;

  // Determine prev/next indices from parent SLT list
  const sortedIndices = parentSlts
    .map((s) => s.moduleIndex ?? 0)
    .sort((a, b) => a - b);
  const currentPos = sortedIndices.indexOf(typedLessonIndex);
  const prevIndex = currentPos > 0 ? sortedIndices[currentPos - 1] : null;
  const nextIndex =
    currentPos < sortedIndices.length - 1
      ? sortedIndices[currentPos + 1]
      : null;
  const totalLessons = parentSlts.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Lesson header */}
      <div className="mb-8">
        <p className="mb-2 text-sm text-mn-text-muted">
          Lesson {typedLessonIndex} of {totalLessons}
        </p>
        {typedLesson.title && (
          <h1 className="text-3xl font-bold font-heading text-mn-text">
            {typedLesson.title}
          </h1>
        )}
      </div>

      {/* Lesson content */}
      <section className="mb-12">
        <LessonContent contentJson={typedLesson.contentJson} />
      </section>

      {/* Previous / Next navigation */}
      <nav className="flex flex-col gap-3 border-t border-midnight-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        {prevIndex !== null ? (
          <Link prefetch="intent" to={MIDNIGHT_PBL.routes.lesson(typedModuleCode, prevIndex)} className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto min-h-[44px]">
              <span className="truncate">Previous Lesson</span>
            </Button>
          </Link>
        ) : (
          <div />
        )}

        {nextIndex !== null ? (
          <Link prefetch="render" to={MIDNIGHT_PBL.routes.lesson(typedModuleCode, nextIndex)} className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto min-h-[44px]">
              <span className="truncate">Next Lesson</span>
            </Button>
          </Link>
        ) : (
          <Link
            prefetch="render"
            to={MIDNIGHT_PBL.routes.assignment(typedModuleCode)}
            className="w-full sm:w-auto"
          >
            <Button variant="primary" className="w-full sm:w-auto min-h-[44px]">
              <span className="truncate">View Assignment</span>
            </Button>
          </Link>
        )}
      </nav>
    </div>
  );
}
