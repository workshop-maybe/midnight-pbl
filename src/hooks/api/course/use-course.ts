/**
 * Course module React Query hooks
 *
 * React Query hooks for fetching course modules. Types and transforms
 * are defined in @/types/course.ts — this file only provides the query hooks.
 *
 * @see @/types/course.ts — Types and transforms
 */

import { useQuery } from "@tanstack/react-query";
import { GATEWAY_API_BASE } from "@/lib/gateway";
import { courseKeys } from "@/hooks/api/query-keys";
import {
  type CourseModule,
  transformCourseModule,
  sortModulesByCode,
} from "@/types/course";

// Re-export types for convenience — consumers can import from either location
export type {
  CourseModule,
  CourseModuleStatus,
  SLT,
  Lesson,
  Assignment,
  Introduction,
  JSONContent,
} from "@/types/course";
export {
  transformCourseModule,
  transformSLT,
  transformLesson,
  transformAssignment,
  transformIntroduction,
  sortModulesByCode,
  isJSONContent,
} from "@/types/course";

// =============================================================================
// React Query Hooks
// =============================================================================

/**
 * Fetch all modules for a course.
 * staleTime: Infinity — the modules list is static course structure
 * that won't change during a user session.
 *
 * @example
 * ```tsx
 * const { data: modules, isLoading } = useCourseModules(courseId);
 * ```
 */
export function useCourseModules(courseId: string | undefined) {
  return useQuery({
    staleTime: Infinity,
    queryKey: courseKeys.modules(courseId ?? ""),
    queryFn: async (): Promise<CourseModule[]> => {
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/modules/${courseId}`
      );

      if (response.status === 404) return [];
      if (!response.ok) {
        throw new Error(
          `Failed to fetch modules: ${response.statusText}`
        );
      }

      const result = (await response.json()) as unknown;

      let items: Record<string, unknown>[];
      if (Array.isArray(result)) {
        items = result as Record<string, unknown>[];
      } else if (
        result &&
        typeof result === "object" &&
        "data" in result
      ) {
        const dataValue = (result as { data?: unknown }).data;
        items = Array.isArray(dataValue)
          ? (dataValue as Record<string, unknown>[])
          : [];
      } else {
        items = [];
      }

      const modules = items.map(transformCourseModule);
      return sortModulesByCode(modules);
    },
    enabled: !!courseId,
  });
}
