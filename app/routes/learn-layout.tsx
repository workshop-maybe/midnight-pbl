/**
 * Learn Layout Route
 *
 * Wraps lesson and assignment pages with a sidebar showing module
 * navigation (SLT list, assignment link). Provides module context
 * to child routes via the layout loader data.
 *
 * Layout for: /learn/:moduleCode/:lessonIndex and /learn/:moduleCode/assignment
 */

import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useParams, useLocation, Link, Outlet } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { fetchModuleDetail, fetchSLTs } from "~/lib/gateway.server";
import { serverEnv } from "~/env.server";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { CourseModule, SLT } from "~/hooks/api/course/use-course";

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export async function loader({ params }: LoaderFunctionArgs) {
  const courseId = serverEnv.COURSE_ID;
  if (!courseId) {
    throw new Response("Course ID not configured", { status: 500 });
  }

  const moduleCode = params.moduleCode;
  if (!moduleCode) {
    throw new Response("Module code is required", { status: 400 });
  }

  const [moduleResult, sltsResult] = await Promise.allSettled([
    fetchModuleDetail(courseId, moduleCode),
    fetchSLTs(courseId, moduleCode),
  ]);

  // Module detail is required — throw if it failed
  if (moduleResult.status === "rejected") {
    throw new Response("Failed to load module", { status: 502 });
  }

  const module = moduleResult.value;
  if (!module) {
    throw new Response("Module not found", { status: 404 });
  }

  // SLTs are optional — degrade gracefully if they fail
  const slts = sltsResult.status === "fulfilled" ? sltsResult.value : [];
  const sltsFailed = sltsResult.status === "rejected";

  return data({ module, slts, moduleCode, sltsFailed });
}

export function shouldRevalidate() {
  return false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LearnLayout() {
  const { module, slts, moduleCode, sltsFailed } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const typedModule = module as CourseModule;
  const typedSlts = slts as SLT[];
  const typedModuleCode = moduleCode as string;
  const typedSltsFailed = sltsFailed as boolean;

  // Close sidebar on route change (navigating to a new lesson)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [sidebarOpen, handleKeyDown]);

  return (
    <div className="learn-layout">
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        className="learn-sidebar-toggle"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
      >
        {sidebarOpen ? (
          <CloseIcon />
        ) : (
          <MenuIcon />
        )}
        <span className="ml-2 text-sm font-medium">
          {sidebarOpen ? "Close" : "Navigation"}
        </span>
      </button>

      {/* Overlay for mobile sidebar — tap to dismiss */}
      {sidebarOpen && (
        <div
          className="learn-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close navigation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`learn-sidebar ${sidebarOpen ? "learn-sidebar--open" : ""}`}
      >
        {/* Mobile close button inside sidebar */}
        <div className="flex items-center justify-end px-2 pt-2 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-sm text-mn-text-muted transition-colors hover:bg-midnight-surface hover:text-mn-text"
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>
        <SidebarContent
          module={typedModule}
          slts={typedSlts}
          moduleCode={typedModuleCode}
          sltsFailed={typedSltsFailed}
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main content — uses <div> not <main> because AppShell already has <main> */}
      <div className="learn-content">
        <Outlet />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Content
// ---------------------------------------------------------------------------

function SidebarContent({
  module,
  slts,
  moduleCode,
  sltsFailed,
  onNavigate,
}: {
  module: CourseModule;
  slts: SLT[];
  moduleCode: string;
  sltsFailed: boolean;
  onNavigate: () => void;
}) {
  const params = useParams();
  const location = useLocation();

  const currentLessonIndex = params.lessonIndex
    ? parseInt(params.lessonIndex, 10)
    : null;
  const isAssignmentPage = location.pathname.endsWith("/assignment");

  // Sort SLTs by moduleIndex for consistent ordering
  const sortedSlts = [...slts].sort(
    (a, b) => (a.moduleIndex ?? 0) - (b.moduleIndex ?? 0)
  );

  return (
    <nav className="flex h-full flex-col" aria-label="Module navigation">
      {/* Back to modules */}
      <Link
        to={MIDNIGHT_PBL.routes.home}
        prefetch="intent"
        className="sidebar-back-link"
        onClick={onNavigate}
      >
        <ChevronLeftIcon />
        <span>All modules</span>
      </Link>

      {/* Module title + description */}
      <div className="px-4 pb-4">
        <h2 className="text-base font-semibold font-heading text-mn-text leading-tight">
          {module.title ?? "Untitled Module"}
        </h2>
        {module.description && (
          <p className="mt-1.5 text-xs text-mn-text-muted line-clamp-2">
            {module.description}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-midnight-border" />

      {/* SLT list */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-mn-text-muted/60">
          Lessons
        </p>
        {sltsFailed ? (
          <div className="px-2 py-4 text-center">
            <p className="text-sm text-mn-text-muted">
              Could not load lessons.
            </p>
            <a
              href={`/learn/${moduleCode}/1`}
              className="mt-2 inline-block text-sm text-mn-primary-light underline underline-offset-2 hover:text-mn-primary"
            >
              Retry
            </a>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {sortedSlts.map((slt, idx) => {
              const lessonIndex = slt.moduleIndex ?? idx + 1;
              const isActive =
                currentLessonIndex !== null && currentLessonIndex === lessonIndex;

              return (
                <li key={slt.sltId ?? idx}>
                  <Link
                    to={MIDNIGHT_PBL.routes.lesson(moduleCode, lessonIndex)}
                    prefetch="intent"
                    className={`sidebar-slt-item ${isActive ? "sidebar-slt-item--active" : ""}`}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="sidebar-slt-index">{lessonIndex}</span>
                    <span className="sidebar-slt-text">
                      {slt.sltText ?? `Lesson ${lessonIndex}`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Assignment link */}
      <div className="border-t border-midnight-border px-2 py-3">
        <Link
          to={MIDNIGHT_PBL.routes.assignment(moduleCode)}
          prefetch="intent"
          className={`sidebar-assignment-link ${isAssignmentPage ? "sidebar-assignment-link--active" : ""}`}
          onClick={onNavigate}
          aria-current={isAssignmentPage ? "page" : undefined}
        >
          <AssignmentIcon />
          <span>Module Assignment</span>
        </Link>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid extra dependencies)
// ---------------------------------------------------------------------------

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 5h14M3 10h14M3 15h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 12L6 8l4-4" />
    </svg>
  );
}

function AssignmentIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="2" width="10" height="12" rx="1.5" />
      <path d="M6 5h4M6 8h4M6 11h2" />
    </svg>
  );
}
