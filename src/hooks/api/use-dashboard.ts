/**
 * Dashboard data aggregation hook
 *
 * Fetches the student's assignment commitments and credentials across
 * all modules, then computes aggregate progress (e.g., allModulesAccepted).
 *
 * Architecture: Client-side only. Commitments and credentials require
 * JWT authentication, which is stored in localStorage (not accessible
 * to server loaders).
 *
 * @see @/hooks/api/course/use-assignment-commitment.ts — Single commitment hook
 * @see @/hooks/api/query-keys.ts — Query key factories
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { GATEWAY_API_BASE } from "@/lib/gateway";
import { commitmentKeys } from "@/hooks/api/query-keys";
import { normalizeAssignmentStatus } from "@/lib/assignment-status";
import type { AssignmentStatus } from "@/lib/assignment-status";
import { MIDNIGHT_PBL } from "@/config/midnight";

// =============================================================================
// Types
// =============================================================================

/**
 * A single commitment item from the list endpoint.
 * Simplified from the full AssignmentCommitment — we only need
 * status + module code for the dashboard.
 */
export interface DashboardCommitment {
  courseId: string;
  moduleCode: string;
  status: AssignmentStatus | string;
  onChainStatus: string | null;
}

/**
 * A single credential from the credentials list endpoint.
 */
export interface DashboardCredential {
  courseId: string;
  alias: string;
  claimDate: string | null;
  txHash: string | null;
}

/** Raw API response shape from the commitments list endpoint */
interface CommitmentsListApiResponse {
  data?: Array<{
    course_id?: string;
    course_module_code?: string;
    on_chain_status?: string;
    commitment_status?: string;
    content?: {
      commitment_status?: string;
    };
  }>;
}

/** Raw API response shape from the credentials list endpoint */
interface CredentialsListApiResponse {
  data?: Array<{
    course_id?: string;
    alias?: string;
    claimed_at?: string;
    created_at?: string;
    tx_hash?: string;
  }>;
}

// =============================================================================
// Query Keys
// =============================================================================

export const dashboardKeys = {
  all: ["dashboard"] as const,
  commitmentsList: (courseId: string) =>
    [...dashboardKeys.all, "commitments", courseId] as const,
  credentialsList: (courseId: string) =>
    [...dashboardKeys.all, "credentials", courseId] as const,
};

// =============================================================================
// Transforms
// =============================================================================

function transformCommitmentItem(
  item: NonNullable<CommitmentsListApiResponse["data"]>[number]
): DashboardCommitment {
  const rawStatus =
    item.commitment_status ??
    item.content?.commitment_status ??
    item.on_chain_status ??
    "NOT_STARTED";

  // Map DB-specific status values to canonical statuses
  const DB_STATUS_MAP: Record<string, string> = {
    SUBMITTED: "PENDING_APPROVAL",
    ACCEPTED: "ASSIGNMENT_ACCEPTED",
    REFUSED: "ASSIGNMENT_DENIED",
    APPROVED: "ASSIGNMENT_ACCEPTED",
    REJECTED: "ASSIGNMENT_DENIED",
  };
  const mappedRaw = DB_STATUS_MAP[rawStatus] ?? rawStatus;
  const status = normalizeAssignmentStatus(mappedRaw);

  return {
    courseId: item.course_id ?? "",
    moduleCode: item.course_module_code ?? "",
    status,
    onChainStatus: item.on_chain_status ?? null,
  };
}

function transformCredentialItem(
  item: NonNullable<CredentialsListApiResponse["data"]>[number]
): DashboardCredential {
  return {
    courseId: item.course_id ?? "",
    alias: item.alias ?? "",
    claimDate: item.claimed_at ?? item.created_at ?? null,
    txHash: item.tx_hash ?? null,
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetch dashboard data: all assignment commitments and credentials
 * for the current student and course.
 *
 * @param courseId - The course NFT policy ID
 */
export function useDashboard(courseId: string | undefined) {
  const isAuthenticated = useAuthStore((s) => s.status === "AUTHENTICATED");
  const authenticatedFetch = useAuthStore((s) => s.authenticatedFetch);

  const commitmentsQuery = useQuery({
    queryKey: dashboardKeys.commitmentsList(courseId ?? ""),
    queryFn: async (): Promise<DashboardCommitment[]> => {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/student/assignment-commitments/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseId }),
        }
      );

      if (response.status === 404) return [];

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          "[useDashboard] Failed to fetch commitments:",
          response.status,
          errorBody
        );
        throw new Error(`Failed to fetch commitments: ${response.status}`);
      }

      const apiResponse = (await response.json()) as CommitmentsListApiResponse;
      const items = apiResponse.data;
      if (!items || !Array.isArray(items)) return [];

      return items.map(transformCommitmentItem);
    },
    enabled: isAuthenticated && !!courseId,
    staleTime: 60_000,
  });

  const credentialsQuery = useQuery({
    queryKey: dashboardKeys.credentialsList(courseId ?? ""),
    queryFn: async (): Promise<DashboardCredential[]> => {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/student/credentials/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseId }),
        }
      );

      if (response.status === 404) return [];

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          "[useDashboard] Failed to fetch credentials:",
          response.status,
          errorBody
        );
        throw new Error(`Failed to fetch credentials: ${response.status}`);
      }

      const apiResponse =
        (await response.json()) as CredentialsListApiResponse;
      const items = apiResponse.data;
      if (!items || !Array.isArray(items)) return [];

      return items.map(transformCredentialItem);
    },
    enabled: isAuthenticated && !!courseId,
    staleTime: 60_000,
  });

  // Compute whether ALL modules have been accepted
  const commitments = commitmentsQuery.data ?? [];
  const credentials = credentialsQuery.data ?? [];

  const acceptedCount = commitments.filter(
    (c) =>
      c.status === "ASSIGNMENT_ACCEPTED" || c.status === "CREDENTIAL_CLAIMED"
  ).length;

  const allModulesAccepted = acceptedCount >= MIDNIGHT_PBL.moduleCount;

  const refetch = async () => {
    await Promise.all([
      commitmentsQuery.refetch(),
      credentialsQuery.refetch(),
    ]);
  };

  return {
    commitments,
    credentials,
    acceptedCount,
    allModulesAccepted,
    isLoading: commitmentsQuery.isLoading || credentialsQuery.isLoading,
    error: commitmentsQuery.error ?? credentialsQuery.error,
    refetch,
  };
}

// =============================================================================
// Invalidation
// =============================================================================

/**
 * Returns a function to invalidate all dashboard queries.
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return useCallback(
    async (courseId?: string) => {
      if (courseId) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: dashboardKeys.commitmentsList(courseId),
          }),
          queryClient.invalidateQueries({
            queryKey: dashboardKeys.credentialsList(courseId),
          }),
        ]);
      } else {
        await queryClient.invalidateQueries({
          queryKey: dashboardKeys.all,
        });
      }
      // Also invalidate individual commitment queries
      await queryClient.invalidateQueries({
        queryKey: commitmentKeys.all,
      });
    },
    [queryClient]
  );
}
