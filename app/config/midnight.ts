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

  /**
   * Pedagogical order — maps module code to display position.
   * The API returns modules in on-chain hash order and module codes
   * don't match the curriculum sequence. This map defines the intended
   * teaching order derived from lesson title prefixes (1.x through 6.x).
   */
  moduleOrder: {
    "104": 1, // Midnight Architecture
    "105": 2, // Compact Fundamentals
    "106": 3, // Privacy Model
    "102": 4, // Developer Workflow
    "103": 5, // Credential Systems
    "101": 6, // Dual-Chain Architecture
  } as Record<string, number>,

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
 * Sort modules by pedagogical order.
 * Falls back to code order for modules not in the map.
 */
export function sortModulesByPedagogicalOrder<
  T extends { moduleCode?: string },
>(modules: T[]): T[] {
  const order = MIDNIGHT_PBL.moduleOrder;
  const max = Object.keys(order).length + 1;
  return [...modules].sort(
    (a, b) =>
      (order[a.moduleCode ?? ""] ?? max) -
      (order[b.moduleCode ?? ""] ?? max),
  );
}

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
