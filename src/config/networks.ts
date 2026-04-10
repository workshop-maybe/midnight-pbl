/**
 * Network profiles.
 *
 * Single source of truth for every value that differs between preprod
 * and mainnet: gateway URL, Cardano network name, the Andamio global
 * access-token policy ID, and the course ID for this deployment.
 *
 * Flipping networks = changing PUBLIC_ANDAMIO_NETWORK in .env (or a
 * GitHub Actions variable). Everything else is resolved at build time
 * from the matching entry below.
 *
 * These values are *not* secrets — they're public on-chain identifiers
 * and public API endpoints. They live in code so the gateway URL, policy
 * ID, and course ID can never drift out of sync with each other.
 *
 * When you fork this repo to publish your own course, edit the
 * `courseId` fields below with the IDs you get from `andamio course
 * import-all`. Leave `accessTokenPolicyId` alone — it's the global
 * Andamio access token policy, one per network, shared across all
 * Andamio courses.
 */

export type AndamioNetwork = "preprod" | "mainnet";

export interface NetworkConfig {
  /** Andamio API base URL. */
  gatewayUrl: string;
  /** Cardano network name (used by wallet libraries). */
  cardanoNetwork: "preprod" | "mainnet";
  /** Global Andamio access-token policy ID — one per network. */
  accessTokenPolicyId: string;
  /** Course ID for this single-course deployment. */
  courseId: string;
}

export const NETWORKS: Record<AndamioNetwork, NetworkConfig> = {
  preprod: {
    gatewayUrl: "https://preprod.api.andamio.io",
    cardanoNetwork: "preprod",
    accessTokenPolicyId:
      "aa1cbea2524d369768283d7c8300755880fd071194a347cf0a4e274f",
    courseId: "f681a4ba15d0ff635dbe574fa15a7dd2f1a233140b04b051865c88e6",
  },
  mainnet: {
    gatewayUrl: "https://api.andamio.io",
    cardanoNetwork: "mainnet",
    // TODO: fill when publishing to mainnet.
    accessTokenPolicyId: "",
    // TODO: fill when publishing to mainnet.
    courseId: "",
  },
};

/**
 * Resolve a network name to its config, with a runtime guard that throws
 * if the value isn't one of the known networks. Call this once at module
 * load time so a bad `PUBLIC_ANDAMIO_NETWORK` fails fast instead of
 * silently returning undefined later.
 */
export function resolveNetwork(value: string | undefined): NetworkConfig {
  const network = (value ?? "preprod") as AndamioNetwork;
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(
      `Unknown ANDAMIO_NETWORK: "${value}". Expected "preprod" or "mainnet".`
    );
  }
  return config;
}
