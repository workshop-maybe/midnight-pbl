/**
 * Midnight PBL — single-course configuration.
 *
 * Centralizes course identity, route paths, and network config.
 */

export const MIDNIGHT_PBL = {
  title: "Midnight: From Aiken to Compact",

  description:
    "Learn to build on Midnight Network. Six modules from Aiken fundamentals to Compact smart contracts, with on-chain credentials.",

  moduleCount: 6,

  routes: {
    learn: "/learn",
    home: "/",
    module: (moduleCode: string) => `/learn/${moduleCode}`,
    lesson: (moduleCode: string, lessonIndex: number) =>
      `/learn/${moduleCode}/${lessonIndex}`,
    assignment: (moduleCode: string) => `/learn/${moduleCode}/assignment`,
    dashboard: "/dashboard",
  },
} as const;
