/**
 * Current network config, resolved at build time.
 *
 * Reads `PUBLIC_ANDAMIO_NETWORK` (inlined by Vite in both server and
 * client bundles) and looks up the matching profile in `networks.ts`.
 *
 * Import from anywhere — page frontmatter, API routes, React islands.
 * A single resolved object guarantees server and client agree about
 * which network they're talking to.
 */

import { resolveNetwork, type NetworkConfig } from "@/config/networks";

export const CURRENT_NETWORK: NetworkConfig = resolveNetwork(
  import.meta.env.PUBLIC_ANDAMIO_NETWORK
);
