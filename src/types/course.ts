// Extracted types and transforms from use-course.ts

// =============================================================================
// JSON Content Type (lightweight — no TipTap dependency)
// =============================================================================

/**
 * Minimal TipTap/ProseMirror JSON content shape.
 * We only need to check for a `type` field to validate.
 */
export interface JSONContent {
  type: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
  [key: string]: unknown;
}

/** Type guard for JSON content */
export function isJSONContent(value: unknown): value is JSONContent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as Record<string, unknown>).type === "string"
  );
}

// =============================================================================
// App-Level Types
// =============================================================================

/**
 * Module lifecycle status derived from API source field.
 */
export type CourseModuleStatus = "draft" | "active" | "unregistered";

function getStatusFromSource(source: string | undefined): CourseModuleStatus {
  switch (source) {
    case "merged":
      return "active";
    case "chain_only":
      return "unregistered";
    case "db_only":
    default:
      return "draft";
  }
}

/**
 * App-level Course Module with camelCase fields.
 */
export interface CourseModule {
  sltHash: string;
  courseId: string;
  createdBy?: string;
  prerequisites?: string[];
  onChainSlts?: string[];
  status: CourseModuleStatus;

  // Content fields (flattened from content.*)
  moduleCode?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  isLive?: boolean;
  slts?: SLT[];
  assignment?: Assignment | null;
  introduction?: Introduction | null;
}

/**
 * App-level SLT (Student Learning Target).
 */
export interface SLT {
  id?: number;
  sltId?: string;
  sltText?: string;
  moduleIndex?: number;
  moduleCode?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  hasLesson?: boolean;
  lesson?: Lesson | null;
}

/**
 * App-level Lesson.
 */
export interface Lesson {
  id?: number;
  contentJson?: JSONContent | null;
  sltId?: string;
  sltIndex?: number;
  moduleCode?: string;
  createdAt?: string;
  updatedAt?: string;
  title?: string;
  description?: string;
  isLive?: boolean;
  imageUrl?: string;
  videoUrl?: string;
}

/**
 * App-level Assignment.
 */
export interface Assignment {
  id?: number;
  title?: string;
  description?: string;
  contentJson?: JSONContent | null;
  moduleCode?: string;
  imageUrl?: string;
  videoUrl?: string;
  isLive?: boolean;
  createdByAlias?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * App-level Introduction.
 */
export interface Introduction {
  id?: number;
  title?: string;
  description?: string;
  contentJson?: JSONContent | null;
  moduleCode?: string;
  imageUrl?: string;
  videoUrl?: string;
  isLive?: boolean;
  createdByAlias?: string;
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// Transform Functions (exported for server-side reuse)
// =============================================================================

/** Helper: extract string from NullableString API fields */
function getStringField(field: unknown): string | undefined {
  if (typeof field === "string") return field;
  if (field && typeof field === "object" && "String" in field) {
    return (field as { String?: string }).String;
  }
  return undefined;
}

/**
 * Transform raw API SLT to app-level SLT type.
 * Handles both V1 (module_index) and V2 (slt_index, has_lesson) formats.
 */
export function transformSLT(raw: Record<string, unknown>): SLT {
  const moduleIndex = (raw.slt_index ?? raw.module_index) as
    | number
    | undefined;
  const hasLesson = raw.has_lesson as boolean | undefined;
  const lessonData = raw.lesson as Record<string, unknown> | null | undefined;

  return {
    id: raw.id as number | undefined,
    sltId: raw.slt_id as string | undefined,
    sltText: raw.slt_text as string | undefined,
    moduleIndex,
    moduleCode: raw.course_module_code as string | undefined,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
    createdBy: raw.created_by as string | undefined,
    hasLesson,
    lesson: lessonData ? transformLesson(lessonData) : null,
  };
}

/**
 * Transform raw API Lesson to app-level Lesson type.
 * Handles V1 (flat) and V2 (nested under `content`) formats.
 */
export function transformLesson(raw: Record<string, unknown>): Lesson {
  const content = raw.content as Record<string, unknown> | undefined;

  const title = (content?.title ?? raw.title) as string | undefined;
  const description = (content?.description ?? raw.description) as
    | string
    | undefined;
  const imageUrl = (content?.image_url ?? raw.image_url) as
    | string
    | undefined;
  const videoUrl = (content?.video_url ?? raw.video_url) as
    | string
    | undefined;
  const rawContentJson =
    content?.content_json ?? raw.lesson_content ?? raw.content_json;
  const contentJson = isJSONContent(rawContentJson) ? rawContentJson : null;

  return {
    id: raw.id as number | undefined,
    contentJson,
    sltId: raw.slt_id as string | undefined,
    sltIndex: raw.slt_index as number | undefined,
    moduleCode: raw.course_module_code as string | undefined,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
    title,
    description,
    isLive: raw.is_live as boolean | undefined,
    imageUrl,
    videoUrl,
  };
}

/**
 * Transform raw API Assignment to app-level Assignment type.
 * Handles V1 (flat) and V2 (nested under `content`) formats.
 */
export function transformAssignment(
  raw: Record<string, unknown>
): Assignment {
  const content = raw.content as Record<string, unknown> | undefined;

  const title = getStringField(content?.title ?? raw.title);
  const description = getStringField(content?.description ?? raw.description);
  const imageUrl = getStringField(content?.image_url ?? raw.image_url);
  const videoUrl = getStringField(content?.video_url ?? raw.video_url);
  const rawContentJson =
    content?.content_json ?? raw.assignment_content ?? raw.content_json;
  const contentJson = isJSONContent(rawContentJson) ? rawContentJson : null;
  const createdByAlias = (raw.created_by ?? raw.created_by_alias) as
    | string
    | undefined;

  return {
    id: raw.id as number | undefined,
    title,
    description,
    contentJson,
    moduleCode: raw.course_module_code as string | undefined,
    imageUrl,
    videoUrl,
    isLive: raw.is_live as boolean | undefined,
    createdByAlias,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
  };
}

/**
 * Transform raw API Introduction to app-level Introduction type.
 * Handles V1 (flat) and V2 (nested under `content`) formats.
 */
export function transformIntroduction(
  raw: Record<string, unknown>
): Introduction {
  const content = raw.content as Record<string, unknown> | undefined;

  const title = (content?.title ?? raw.title) as string | undefined;
  const description = (content?.description ?? raw.description) as
    | string
    | undefined;
  const imageUrl = (content?.image_url ?? raw.image_url) as
    | string
    | undefined;
  const videoUrl = (content?.video_url ?? raw.video_url) as
    | string
    | undefined;
  const rawContentJson =
    content?.content_json ?? raw.introduction_content ?? raw.content_json;
  const contentJson = isJSONContent(rawContentJson) ? rawContentJson : null;
  const createdByAlias = (raw.created_by ?? raw.created_by_alias) as
    | string
    | undefined;

  return {
    id: raw.id as number | undefined,
    title,
    description,
    contentJson,
    moduleCode: raw.course_module_code as string | undefined,
    imageUrl,
    videoUrl,
    isLive: raw.is_live as boolean | undefined,
    createdByAlias,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
  };
}

/**
 * Transform API module response to app-level CourseModule.
 * Works with MergedCourseModuleItem shape from the API.
 */
export function transformCourseModule(
  item: Record<string, unknown>
): CourseModule {
  const source = item.source as string | undefined;
  const contentObj = item.content as Record<string, unknown> | undefined;
  const isChainOnly = source === "chain_only" || !contentObj;

  // Transform nested SLTs if present
  const rawSlts = contentObj?.slts as Record<string, unknown>[] | undefined;
  const dbSlts = rawSlts?.map(transformSLT);

  // For chain_only modules, convert on_chain_slts strings to SLT objects
  const chainSltStrings = item.on_chain_slts as string[] | undefined;
  const chainSlts: SLT[] | undefined = chainSltStrings?.map(
    (text, index) => ({
      sltText: text,
      moduleIndex: index,
    })
  );

  return {
    sltHash: (item.slt_hash as string) ?? "",
    courseId: (item.course_id as string) ?? "",
    createdBy: item.created_by as string | undefined,
    prerequisites: item.prerequisites as string[] | undefined,
    onChainSlts: chainSltStrings,
    status: getStatusFromSource(source),

    // Content fields
    moduleCode: (contentObj?.course_module_code ??
      item.course_module_code) as string | undefined,
    title: isChainOnly
      ? (chainSltStrings?.[0] ?? "Untitled Module")
      : ((contentObj?.title as string) ?? undefined),
    description: contentObj?.description as string | undefined,
    imageUrl: contentObj?.image_url as string | undefined,
    videoUrl: contentObj?.video_url as string | undefined,
    isLive: contentObj?.is_live as boolean | undefined,
    slts: dbSlts ?? chainSlts,
    assignment: contentObj?.assignment
      ? transformAssignment(
          contentObj.assignment as Record<string, unknown>
        )
      : null,
    introduction: contentObj?.introduction
      ? transformIntroduction(
          contentObj.introduction as Record<string, unknown>
        )
      : null,
  };
}

/**
 * Sort modules by module code (natural string order).
 */
export function sortModulesByCode(modules: CourseModule[]): CourseModule[] {
  return [...modules].sort((a, b) =>
    (a.moduleCode ?? "").localeCompare(b.moduleCode ?? "")
  );
}
