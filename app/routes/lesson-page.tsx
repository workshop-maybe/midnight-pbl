/**
 * Lesson Page
 *
 * Renders lesson content with markdown formatting.
 * Provides previous/next navigation between lessons.
 *
 * The parent learn-layout.tsx provides module context (sidebar with
 * SLT list and assignment link), so this page focuses on content.
 *
 * Route: /learn/:moduleCode/:lessonIndex
 */

import { data } from "react-router";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { fetchLesson, fetchSLTs } from "~/lib/gateway.server";
import { serverEnv } from "~/env.server";
import { LessonContent } from "~/components/course/lesson-content";
import { Button } from "~/components/ui/button";
import { getPageTitle } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { Lesson, SLT } from "~/hooks/api/course/use-course";

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

  // Fetch lesson and SLTs in parallel (SLTs needed for prev/next nav)
  const [lesson, slts] = await Promise.all([
    fetchLesson(courseId, moduleCode, lessonIndex),
    fetchSLTs(courseId, moduleCode),
  ]);

  if (!lesson) {
    throw new Response("Lesson not found", { status: 404 });
  }

  return data({
    lesson,
    slts,
    moduleCode,
    lessonIndex,
    totalLessons: slts.length,
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
    totalLessons,
    slts,
  } = useLoaderData<typeof loader>();

  const typedLesson = lesson as Lesson;
  const typedSlts = slts as SLT[];
  const typedModuleCode = moduleCode as string;
  const typedLessonIndex = lessonIndex as number;

  // Determine prev/next indices from actual SLT list
  const sortedIndices = typedSlts
    .map((s) => s.moduleIndex ?? 0)
    .sort((a, b) => a - b);
  const currentPos = sortedIndices.indexOf(typedLessonIndex);
  const prevIndex = currentPos > 0 ? sortedIndices[currentPos - 1] : null;
  const nextIndex =
    currentPos < sortedIndices.length - 1
      ? sortedIndices[currentPos + 1]
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Lesson header */}
      <div className="mb-8">
        <p className="mb-2 text-sm text-mn-text-muted">
          Lesson {typedLessonIndex} of {totalLessons as number}
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
      <nav className="flex items-center justify-between border-t border-midnight-border pt-6">
        {prevIndex !== null ? (
          <Link prefetch="intent" to={MIDNIGHT_PBL.routes.lesson(typedModuleCode, prevIndex)}>
            <Button variant="secondary">Previous Lesson</Button>
          </Link>
        ) : (
          <div />
        )}

        {nextIndex !== null ? (
          <Link prefetch="render" to={MIDNIGHT_PBL.routes.lesson(typedModuleCode, nextIndex)}>
            <Button variant="primary">Next Lesson</Button>
          </Link>
        ) : (
          <Link
            prefetch="render"
            to={MIDNIGHT_PBL.routes.assignment(typedModuleCode)}
          >
            <Button variant="primary">View Assignment</Button>
          </Link>
        )}
      </nav>
    </div>
  );
}
