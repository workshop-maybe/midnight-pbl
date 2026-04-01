/**
 * React Query key factories
 *
 * Centralized query key definitions for cache management.
 * Each key factory produces strongly-typed arrays for use
 * with useQuery and queryClient invalidation.
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  detail: (courseId: string) => [...courseKeys.all, "detail", courseId] as const,
  modules: (courseId: string) =>
    [...courseKeys.all, "modules", courseId] as const,
};

export const moduleKeys = {
  all: ["modules"] as const,
  detail: (courseId: string, moduleCode: string) =>
    [...moduleKeys.all, "detail", courseId, moduleCode] as const,
};

export const sltKeys = {
  all: ["slts"] as const,
  list: (courseId: string, moduleCode: string) =>
    [...sltKeys.all, "list", courseId, moduleCode] as const,
  detail: (courseId: string, moduleCode: string, moduleIndex: number) =>
    [...sltKeys.all, "detail", courseId, moduleCode, moduleIndex] as const,
};

export const lessonKeys = {
  all: ["lessons"] as const,
  list: (courseId: string, moduleCode: string) =>
    [...lessonKeys.all, "list", courseId, moduleCode] as const,
  detail: (courseId: string, moduleCode: string, sltIndex: number) =>
    [...lessonKeys.all, "detail", courseId, moduleCode, sltIndex] as const,
};

export const assignmentKeys = {
  all: ["assignments"] as const,
  detail: (courseId: string, moduleCode: string) =>
    [...assignmentKeys.all, "detail", courseId, moduleCode] as const,
};

export const introductionKeys = {
  all: ["introductions"] as const,
  detail: (courseId: string, moduleCode: string) =>
    [...introductionKeys.all, "detail", courseId, moduleCode] as const,
};

export const commitmentKeys = {
  all: ["commitments"] as const,
  list: (courseId: string) =>
    [...commitmentKeys.all, "list", courseId] as const,
  detail: (courseId: string, moduleCode: string) =>
    [...commitmentKeys.all, "detail", courseId, moduleCode] as const,
};
