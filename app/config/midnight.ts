/**
 * Midnight PBL — single-course configuration.
 *
 * Centralizes course identity, route paths, and network config.
 * Pattern: cardano-xp:/src/config/cardano-xp.ts
 */

export const MIDNIGHT_PBL = {
  /** Course title */
  title: "Midnight: From Aiken to Compact",

  /** Short description for metadata and hero sections */
  description:
    "Learn to build on Midnight Network. Six modules from Aiken fundamentals to Compact smart contracts, with on-chain credentials.",

  /** Number of modules in the course */
  moduleCount: 6,

  /** Route paths used throughout the app */
  routes: {
    landing: "/about",
    learn: "/learn",
    home: "/",
    module: (moduleCode: string) => `/learn/${moduleCode}`,
    lesson: (moduleCode: string, lessonIndex: number) =>
      `/learn/${moduleCode}/${lessonIndex}`,
    assignment: (moduleCode: string) => `/learn/${moduleCode}/assignment`,
    dashboard: "/dashboard",
  },
} as const;

/**
 * Public environment values exposed to the client via root loader.
 * These are safe to send to the browser — no secrets.
 */
export interface PublicEnv {
  ANDAMIO_GATEWAY_URL: string;
  CARDANO_NETWORK: string;
  COURSE_ID: string | undefined;
  ACCESS_TOKEN_POLICY_ID: string | undefined;
}
