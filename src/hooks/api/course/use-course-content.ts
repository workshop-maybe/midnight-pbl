/**
 * React Query hooks for public course content API endpoints
 *
 * Read-only access to SLTs, lessons, assignments, and introductions.
 * No authentication required — these are public /course/user/* endpoints.
 *
 * Types and transforms are defined in @/types/course.ts.
 * This file provides the query hooks for reading content.
 */

import { useQuery } from "@tanstack/react-query";
import type { SLT, Lesson, Assignment, Introduction } from "@/types/course";
import {
  transformSLT,
  transformLesson,
  transformAssignment,
  transformIntroduction,
} from "@/types/course";
import { GATEWAY_API_BASE } from "@/lib/gateway";
import {
  sltKeys,
  lessonKeys,
  assignmentKeys,
  introductionKeys,
} from "@/hooks/api/query-keys";

// =============================================================================
// SLT Queries
// =============================================================================

/**
 * Fetch all SLTs for a module.
 *
 * Handles both V1 and V2 API response formats.
 * staleTime: Infinity — SLTs are static course content that never changes
 * during a user session. This prevents refetches on component remounts.
 */
export function useSLTs(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery<SLT[], Error>({
    queryKey: sltKeys.list(courseId ?? "", moduleCode ?? ""),
    staleTime: Infinity,
    queryFn: async () => {
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/slts/${courseId}/${moduleCode}`
      );

      if (response.status === 404) return [];
      if (!response.ok) {
        throw new Error(`Failed to fetch SLTs: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      let rawSlts: unknown[];
      if (Array.isArray(result)) {
        rawSlts = result;
      } else if (result && typeof result === "object" && "data" in result) {
        const dataValue = (result as { data?: unknown }).data;
        if (Array.isArray(dataValue)) {
          rawSlts = dataValue;
        } else if (
          dataValue &&
          typeof dataValue === "object" &&
          "slts" in dataValue
        ) {
          const sltsValue = (dataValue as { slts?: unknown }).slts;
          rawSlts = Array.isArray(sltsValue) ? sltsValue : [];
        } else {
          rawSlts = [];
        }
      } else {
        rawSlts = [];
      }

      return rawSlts.map((raw) =>
        transformSLT(raw as Record<string, unknown>)
      );
    },
    enabled: !!courseId && !!moduleCode,
  });
}

// =============================================================================
// Lesson Queries
// =============================================================================

/**
 * Fetch a single lesson.
 *
 * Handles both V1 and V2 API response formats.
 * staleTime: Infinity — lesson content is static and won't change
 * during a user session.
 */
export function useLesson(
  courseId: string | undefined,
  moduleCode: string | undefined,
  sltIndex: number | undefined
) {
  return useQuery({
    staleTime: Infinity,
    queryKey: lessonKeys.detail(
      courseId ?? "",
      moduleCode ?? "",
      sltIndex ?? 0
    ),
    queryFn: async (): Promise<Lesson | null> => {
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/lesson/${courseId}/${moduleCode}/${sltIndex}`
      );

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Failed to fetch lesson: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      let raw: Record<string, unknown> | null = null;
      if (result && typeof result === "object") {
        if ("data" in result && (result as { data?: unknown }).data) {
          raw = (result as { data: Record<string, unknown> }).data;
        } else if (
          "title" in result ||
          "content_json" in result ||
          "slt_index" in result ||
          "content" in result
        ) {
          raw = result as Record<string, unknown>;
        }
      }

      return raw ? transformLesson(raw) : null;
    },
    enabled: !!courseId && !!moduleCode && sltIndex !== undefined,
  });
}

// =============================================================================
// Assignment Queries
// =============================================================================

/**
 * Fetch an assignment for a specific module.
 * staleTime: Infinity — assignment content is static course data.
 */
export function useAssignment(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    staleTime: Infinity,
    queryKey: assignmentKeys.detail(courseId ?? "", moduleCode ?? ""),
    queryFn: async (): Promise<Assignment | null> => {
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/assignment/${courseId}/${moduleCode}`
      );

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(
          `Failed to fetch assignment: ${response.statusText}`
        );
      }

      const result = (await response.json()) as unknown;

      const asRecord = (value: unknown): Record<string, unknown> | null =>
        value && typeof value === "object"
          ? (value as Record<string, unknown>)
          : null;

      let raw: Record<string, unknown> | null = null;
      const resultRecord = asRecord(result);
      if (resultRecord) {
        if ("data" in resultRecord && resultRecord.data) {
          const dataRecord = asRecord(resultRecord.data);
          if (dataRecord) {
            if (
              "content" in dataRecord &&
              dataRecord.content &&
              typeof dataRecord.content === "object"
            ) {
              raw = dataRecord;
            } else if (
              "assignment" in dataRecord &&
              dataRecord.assignment
            ) {
              raw = asRecord(dataRecord.assignment);
            } else {
              raw = dataRecord;
            }
          }
        } else if (
          "title" in resultRecord ||
          "content_json" in resultRecord ||
          "assignment_content" in resultRecord ||
          "content" in resultRecord
        ) {
          raw = resultRecord;
        }
      }

      return raw ? transformAssignment(raw) : null;
    },
    enabled: !!courseId && !!moduleCode,
  });
}

// =============================================================================
// Introduction Queries
// =============================================================================

/**
 * Fetch an introduction for a specific module.
 * staleTime: Infinity — introduction content is static course data.
 */
export function useIntroduction(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    staleTime: Infinity,
    queryKey: introductionKeys.detail(courseId ?? "", moduleCode ?? ""),
    queryFn: async (): Promise<Introduction | null> => {
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/introduction/${courseId}/${moduleCode}`
      );

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(
          `Failed to fetch introduction: ${response.statusText}`
        );
      }

      const result = (await response.json()) as unknown;

      let raw: Record<string, unknown> | null = null;
      if (result && typeof result === "object") {
        if ("data" in result && (result as { data?: unknown }).data) {
          raw = (result as { data: Record<string, unknown> }).data;
        } else if (
          "title" in result ||
          "content_json" in result ||
          "introduction_content" in result ||
          "content" in result
        ) {
          raw = result as Record<string, unknown>;
        }
      }

      return raw ? transformIntroduction(raw) : null;
    },
    enabled: !!courseId && !!moduleCode,
  });
}
