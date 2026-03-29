/**
 * Server-side Andamio Gateway client
 *
 * Calls the Andamio API directly (not through the proxy route) for use
 * in route loaders and actions. The `.server.ts` suffix guarantees
 * tree-shaking removes this from the client bundle.
 *
 * Uses the same transform functions as client-side hooks to ensure
 * hydration compatibility.
 *
 * @see app/routes/api/gateway-proxy.ts — Client-facing proxy
 * @see ~/projects/01-projects/cardano-xp/src/lib/gateway-server.ts — Reference
 */

import { serverEnv } from "~/env.server";
import { fetchWithRetry, withTimeout, ApiError } from "~/lib/api-utils";
import {
  type CourseModule,
  type SLT,
  type Lesson,
  type Assignment,
  type Introduction,
  transformCourseModule,
  transformSLT,
  transformLesson,
  transformAssignment,
  transformIntroduction,
  sortModulesByCode,
} from "~/hooks/api/course/use-course";

const GATEWAY_URL = serverEnv.ANDAMIO_GATEWAY_URL;
const API_KEY = serverEnv.ANDAMIO_API_KEY;

// =============================================================================
// Core fetch
// =============================================================================

/**
 * Validate a URL path segment to prevent path traversal.
 */
function safePath(segment: string): string {
  if (!/^[a-zA-Z0-9_\-.]+$/.test(segment)) {
    throw new ApiError(`Invalid path segment: ${segment}`, 400);
  }
  return segment;
}

/**
 * Low-level fetch to the Andamio Gateway with API key and retry logic.
 */
async function gatewayFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${GATEWAY_URL}/api/v2${path}`;

  return withTimeout(
    fetchWithRetry(url, {
      ...init,
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        Accept: "application/json;charset=utf-8",
        "X-API-Key": API_KEY,
        ...init?.headers,
      },
    })
  );
}

// =============================================================================
// Course endpoints
// =============================================================================

/**
 * Fetch all modules for a course.
 * Endpoint: GET /api/v2/course/user/modules/{course_id}
 */
export async function fetchCourseModules(
  courseId: string
): Promise<CourseModule[]> {
  const response = await gatewayFetch(
    `/course/user/modules/${safePath(courseId)}`
  );

  if (response.status === 404) return [];
  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch modules: ${response.statusText}`,
      response.status
    );
  }

  const result = (await response.json()) as unknown;

  // Handle both { data: [...] } and raw array formats
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
}

/**
 * Fetch a single module's detail.
 * Endpoint: GET /api/v2/course/user/modules/{course_id}
 * Filters client-side by module code (no dedicated single-module endpoint).
 */
export async function fetchModuleDetail(
  courseId: string,
  moduleCode: string
): Promise<CourseModule | null> {
  const modules = await fetchCourseModules(courseId);
  return modules.find((m) => m.moduleCode === moduleCode) ?? null;
}

/**
 * Fetch SLTs for a module.
 * Endpoint: GET /api/v2/course/user/slts/{course_id}/{module_code}
 */
export async function fetchSLTs(
  courseId: string,
  moduleCode: string
): Promise<SLT[]> {
  const response = await gatewayFetch(
    `/course/user/slts/${safePath(courseId)}/${safePath(moduleCode)}`
  );

  if (response.status === 404) return [];
  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch SLTs: ${response.statusText}`,
      response.status
    );
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

  return rawSlts.map((raw) => transformSLT(raw as Record<string, unknown>));
}

/**
 * Fetch a single lesson.
 * Endpoint: GET /api/v2/course/user/lesson/{course_id}/{module_code}/{slt_index}
 */
export async function fetchLesson(
  courseId: string,
  moduleCode: string,
  sltIndex: number
): Promise<Lesson | null> {
  if (!Number.isFinite(sltIndex) || sltIndex < 0) return null;

  const response = await gatewayFetch(
    `/course/user/lesson/${safePath(courseId)}/${safePath(moduleCode)}/${sltIndex}`
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch lesson: ${response.statusText}`,
      response.status
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
      "slt_index" in result ||
      "content" in result
    ) {
      raw = result as Record<string, unknown>;
    }
  }

  return raw ? transformLesson(raw) : null;
}

/**
 * Fetch an assignment for a module.
 * Endpoint: GET /api/v2/course/user/assignment/{course_id}/{module_code}
 */
export async function fetchAssignment(
  courseId: string,
  moduleCode: string
): Promise<Assignment | null> {
  const response = await gatewayFetch(
    `/course/user/assignment/${safePath(courseId)}/${safePath(moduleCode)}`
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch assignment: ${response.statusText}`,
      response.status
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
        } else if ("assignment" in dataRecord && dataRecord.assignment) {
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
}

/**
 * Fetch an introduction for a module.
 * Endpoint: GET /api/v2/course/user/introduction/{course_id}/{module_code}
 */
export async function fetchIntroduction(
  courseId: string,
  moduleCode: string
): Promise<Introduction | null> {
  const response = await gatewayFetch(
    `/course/user/introduction/${safePath(courseId)}/${safePath(moduleCode)}`
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch introduction: ${response.statusText}`,
      response.status
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
}
