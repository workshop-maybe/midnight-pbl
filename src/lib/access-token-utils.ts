/**
 * Access Token Utilities
 *
 * Scan wallet UTXOs for Andamio access tokens and extract alias info.
 * NO Mesh SDK module-level imports — wallet is received as a parameter.
 *
 * @see ~/projects/01-projects/cardano-xp/src/lib/access-token-utils.ts — Reference
 */

import { withTimeout } from "@/lib/api-utils";

// =============================================================================
// Hex Conversion
// =============================================================================

function stringToHex(str: string): string {
  return str
    .split("")
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

function hexToString(hex: string): string {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return str;
}

// =============================================================================
// Access Token Operations
// =============================================================================

/**
 * Result of scanning a wallet for an access token.
 */
export interface AccessTokenResult {
  /** Full asset unit (policy ID + hex-encoded name) */
  unit: string;
  /** Decoded alias (e.g., "CMI663VI") */
  alias: string;
}

/**
 * Minimal wallet interface for UTXO scanning.
 * Mesh SDK v2 provides getBalanceMesh() for the structured asset list.
 */
interface WalletWithBalance {
  getBalanceMesh?: () => Promise<Array<{ unit: string; quantity: string }>>;
}

/**
 * Scan wallet UTXOs for an Andamio access token.
 *
 * @param wallet   - Mesh SDK wallet instance
 * @param policyId - Access token policy ID
 * @returns Token info if found, null otherwise
 */
export async function findAccessToken(
  wallet: WalletWithBalance,
  policyId: string
): Promise<AccessTokenResult | null> {
  if (!policyId) {
    console.warn("[AccessToken] No policy ID provided");
    return null;
  }

  try {
    if (typeof wallet.getBalanceMesh !== "function") {
      console.warn("[AccessToken] Wallet does not support getBalanceMesh");
      return null;
    }

    // Wrap in timeout — UTXO scans can hang on slow wallet extensions
    const assets = await withTimeout(wallet.getBalanceMesh(), 10_000);

    const accessToken = assets.find((asset) =>
      asset.unit.startsWith(policyId)
    );

    if (!accessToken) {
      return null;
    }

    const alias = extractAliasFromUnit(accessToken.unit, policyId);
    return { unit: accessToken.unit, alias };
  } catch (error) {
    console.warn("[AccessToken] Failed to scan wallet:", error);
    return null;
  }
}

/**
 * Extract the alias from a full access token unit.
 *
 * Token format: policyId + hex("u" + alias)
 * The "u" prefix indicates a user token (vs "g" for group).
 *
 * @param unit      - Full asset unit (policy ID + hex name)
 * @param policyId  - Access token policy ID
 * @param prefixLength - Length of the token name prefix (default: 1 for "u")
 */
export function extractAliasFromUnit(
  unit: string,
  policyId: string,
  prefixLength = 1
): string {
  const hexName = unit.replace(policyId, "");
  const tokenName = hexToString(hexName);
  return tokenName.slice(prefixLength);
}

/**
 * Build the full access token unit from an alias.
 *
 * @param alias    - User alias (plain text)
 * @param policyId - Access token policy ID
 * @param prefix   - Token name prefix (default: "u")
 */
export function buildAccessTokenUnit(
  alias: string,
  policyId: string,
  prefix = "u"
): string {
  const tokenName = prefix + alias;
  const hexName = stringToHex(tokenName);
  return policyId + hexName;
}
