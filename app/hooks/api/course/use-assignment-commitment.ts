/**
 * React Query hook for Assignment Commitment API endpoints
 *
 * Fetches the student's assignment commitment (merged on-chain + DB data)
 * for a specific course module. Used by the assignment page to determine
 * what state to render (not started, in progress, pending, accepted, etc.).
 *
 * Architecture: Colocated Types Pattern
 * - App-level types defined here with camelCase fields
 * - Transform function converts API snake_case to app camelCase
 * - Components import types from this hook
 *
 * @see ~/projects/01-projects/andamio-platform/andamio-app-v2/src/hooks/api/course/use-assignment-commitment.ts
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "~/contexts/auth-context.client";
import { GATEWAY_API_BASE } from "~/lib/gateway";
import { commitmentKeys } from "~/hooks/api/query-keys";
import { normalizeAssignmentStatus } from "~/lib/assignment-status";
import type { AssignmentStatus } from "~/lib/assignment-status";

// =============================================================================
// Types
// =============================================================================

/**
 * App-level AssignmentCommitment with camelCase fields.
 *
 * Normalized from the V2 merged API response which may return
 * flat or nested `content` structures.
 */
export interface AssignmentCommitment {
  courseId: string;
  moduleCode: string;
  sltHash: string | null;
  /** Canonical status derived from API response via normalizeAssignmentStatus */
  status: AssignmentStatus | string;
  /** Raw on-chain status before normalization */
  onChainStatus: string | null;
  /** Evidence hash from chain */
  onChainContent: string | null;
  /** Evidence object from DB (notes + urls) */
  networkEvidence: EvidencePayload | null;
  /** Evidence hash from DB */
  networkEvidenceHash: string | null;
  /** Data source: merged on-chain + DB, chain only, or DB only */
  source: "merged" | "chain_only" | "db_only";
  /** Reviewer feedback (present when ASSIGNMENT_DENIED) */
  feedback: string | null;
}

/**
 * Evidence payload stored in the DB.
 * Matches the shape submitted by the evidence form.
 */
export interface EvidencePayload {
  notes?: string;
  urls?: string[];
  [key: string]: unknown;
}

/** Raw API response shape from /course/student/assignment-commitment/get */
interface CommitmentApiResponse {
  data?: {
    course_id?: string;
    course_module_code?: string;
    slt_hash?: string;
    on_chain_status?: string;
    on_chain_content?: string;
    commitment_status?: string;
    evidence?: Record<string, unknown>;
    assignment_evidence_hash?: string;
    feedback?: string;
    // Legacy: some endpoints may nest these in content
    content?: {
      commitment_status?: string;
      evidence?: Record<string, unknown>;
      assignment_evidence_hash?: string;
      feedback?: string;
    };
    source?: "merged" | "chain_only" | "db_only";
  };
  warning?: string;
}

// =============================================================================
// Transform
// =============================================================================

/**
 * Transform raw V2 merged API response to app-level AssignmentCommitment.
 *
 * Handles both flat structure and nested `content` structures from the API.
 */
export function transformAssignmentCommitment(
  data: NonNullable<CommitmentApiResponse["data"]>,
  fallbackCourseId: string,
  fallbackModuleCode: string
): AssignmentCommitment {
  // API may return flat structure OR nested content -- check both
  const evidence = data.evidence ?? data.content?.evidence;
  const commitmentStatus =
    data.commitment_status ?? data.content?.commitment_status;
  const evidenceHash =
    data.assignment_evidence_hash ?? data.content?.assignment_evidence_hash;
  const feedback = data.feedback ?? data.content?.feedback ?? null;

  // Determine source
  let source: "merged" | "chain_only" | "db_only";
  if (
    data.source === "chain_only" ||
    data.source === "db_only" ||
    data.source === "merged"
  ) {
    source = data.source;
  } else {
    const hasOnChainData = !!(data.on_chain_status ?? data.on_chain_content);
    const hasDbData = !!(commitmentStatus ?? evidence);
    if (hasOnChainData && !hasDbData) {
      source = "chain_only";
    } else if (!hasOnChainData && hasDbData) {
      source = "db_only";
    } else {
      source = "merged";
    }
  }

  // Normalize raw DB status through the status normalizer.
  // The DB sends values like SUBMITTED, ACCEPTED, REFUSED etc.
  // First apply a local DB-to-raw mapping, then run through normalizeAssignmentStatus.
  const rawStatus =
    commitmentStatus ?? data.on_chain_status ?? "PENDING_APPROVAL";
  const DB_STATUS_MAP: Record<string, string> = {
    SUBMITTED: "PENDING_APPROVAL",
    ACCEPTED: "ASSIGNMENT_ACCEPTED",
    REFUSED: "ASSIGNMENT_DENIED",
    APPROVED: "ASSIGNMENT_ACCEPTED",
    REJECTED: "ASSIGNMENT_DENIED",
  };
  const mappedRaw = DB_STATUS_MAP[rawStatus] ?? rawStatus;
  const status = normalizeAssignmentStatus(mappedRaw);

  // Parse evidence into typed shape
  let networkEvidence: EvidencePayload | null = null;
  if (evidence && typeof evidence === "object") {
    networkEvidence = evidence as EvidencePayload;
  }

  return {
    courseId: data.course_id ?? fallbackCourseId,
    moduleCode: data.course_module_code ?? fallbackModuleCode,
    sltHash: data.slt_hash ?? null,
    status,
    onChainStatus: data.on_chain_status ?? null,
    onChainContent: data.on_chain_content ?? null,
    networkEvidence,
    networkEvidenceHash: evidenceHash ?? data.on_chain_content ?? null,
    source,
    feedback,
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetch the student's assignment commitment for a specific course module.
 *
 * Returns merged on-chain + DB data. Returns `null` when no commitment exists (404).
 *
 * @param courseId - Course NFT policy ID
 * @param moduleCode - Module code (e.g., "MN001")
 * @param sltHash - Module SLT hash (64-char hex) -- required for on-chain lookup
 */
export function useAssignmentCommitment(
  courseId: string,
  moduleCode: string,
  sltHash: string | null
) {
  const { isAuthenticated, authenticatedFetch } = useAuth();

  return useQuery({
    queryKey: commitmentKeys.detail(courseId, moduleCode),
    queryFn: async (): Promise<AssignmentCommitment | null> => {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/student/assignment-commitment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            slt_hash: sltHash,
            course_module_code: moduleCode,
          }),
        }
      );

      // 404 means no commitment (neither on-chain nor DB)
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          "[useAssignmentCommitment] Failed to fetch commitment:",
          response.status,
          errorBody
        );
        throw new Error(`Failed to fetch commitment: ${response.status}`);
      }

      const apiResponse = (await response.json()) as CommitmentApiResponse;

      const data = apiResponse.data;
      if (!data) {
        return null;
      }

      return transformAssignmentCommitment(data, courseId, moduleCode);
    },
    enabled: isAuthenticated && !!courseId && !!sltHash,
    staleTime: 60_000,
  });
}

// =============================================================================
// Invalidation
// =============================================================================

/**
 * Returns a function to invalidate assignment commitment queries.
 *
 * Call with courseId + moduleCode for a specific one, or no args for all.
 */
export function useInvalidateCommitment() {
  const queryClient = useQueryClient();

  return useCallback(
    async (courseId?: string, moduleCode?: string) => {
      if (courseId && moduleCode) {
        await queryClient.invalidateQueries({
          queryKey: commitmentKeys.detail(courseId, moduleCode),
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: commitmentKeys.all,
        });
      }
    },
    [queryClient]
  );
}
