/**
 * Andamio Authentication Service
 *
 * Handles wallet-based authentication with Andamio APIs.
 * NO Mesh SDK imports — wallet methods are received as parameters.
 *
 * Auth Flow:
 * 1. POST /api/v2/auth/login/session → get nonce
 * 2. Sign nonce with wallet (CIP-30 signData)
 * 3. POST /api/v2/auth/login/validate → get JWT
 *
 * @see ~/projects/01-projects/cardano-xp/src/lib/andamio-auth.ts — Reference
 */

import { PROXY_BASE } from "@/lib/gateway";
import { withTimeout } from "@/lib/api-utils";
import type {
  LoginSession,
  WalletSignature,
  ValidateResponse,
} from "@/types/auth";

// =============================================================================
// Session & Validation
// =============================================================================

/**
 * Step 1: Create a login session.
 * Returns a nonce that must be signed with the user's wallet.
 */
export async function buildSession(
  _address: string
): Promise<LoginSession> {
  let response: Response;
  try {
    response = await withTimeout(
      fetch(`${PROXY_BASE}/api/v2/auth/login/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      12_000
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("timed out")) {
      throw new Error(
        "Authentication server is not responding. Please try again."
      );
    }
    throw err;
  }

  if (!response.ok) {
    let errorMessage = `Login session failed (${response.status})`;
    try {
      const error = (await response.json()) as {
        message?: string;
        error?: string;
        details?: string;
      };
      errorMessage =
        error.message ?? error.error ?? error.details ?? errorMessage;
    } catch {
      // Response wasn't JSON
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<LoginSession>;
}

/**
 * Step 2: Validate signature and get JWT.
 *
 * @param sessionId   - Session ID from buildSession
 * @param signature   - CIP-30 wallet signature
 * @param address     - Wallet address in bech32 format
 * @param accessTokenUnit - Full access token unit (policy ID + hex name), optional
 */
export async function validateSignature(
  sessionId: string,
  signature: WalletSignature,
  address: string,
  accessTokenUnit?: string | null
): Promise<ValidateResponse> {
  let response: Response;
  try {
    response = await withTimeout(
      fetch(`${PROXY_BASE}/api/v2/auth/login/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sessionId,
          signature,
          address,
          convert_utf8: false,
          andamio_access_token_unit: accessTokenUnit ?? undefined,
        }),
      }),
      12_000
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("timed out")) {
      throw new Error(
        "Authentication server is not responding. Please try again."
      );
    }
    throw err;
  }

  if (!response.ok) {
    let errorMessage = `Signature validation failed (${response.status})`;
    try {
      const error = (await response.json()) as {
        message?: string;
        error?: string;
        details?: string;
      };
      errorMessage =
        error.message ?? error.error ?? error.details ?? errorMessage;
    } catch {
      // Response wasn't JSON
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<ValidateResponse>;
}

// =============================================================================
// JWT Storage
// =============================================================================

const JWT_STORAGE_KEY = "midnight_pbl_jwt";

/**
 * Store JWT in localStorage. Only call from useEffect (never during render).
 */
export function storeJWT(jwt: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(JWT_STORAGE_KEY, jwt);
    } catch {
      console.warn("[Auth] Failed to store JWT in localStorage");
    }
  }
}

/**
 * Retrieve stored JWT. Only call from useEffect (never during render).
 */
export function getStoredJWT(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(JWT_STORAGE_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear stored JWT.
 */
export function clearJWT(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(JWT_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }
}

/**
 * Check if JWT is expired (basic decode, no signature verification).
 */
export function isJWTExpired(jwt: string): boolean {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3 || !parts[1]) return true;
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (!payload.exp) return true;
    // Expire 30 seconds early to avoid edge cases
    return Date.now() >= payload.exp * 1000 - 30_000;
  } catch {
    return true;
  }
}

/**
 * Decode JWT payload without verification.
 * Returns null if the JWT is malformed.
 */
export function decodeJWTPayload(
  jwt: string
): {
  userId: string;
  cardanoBech32Addr?: string;
  accessTokenAlias?: string;
  exp?: number;
} | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3 || !parts[1]) return null;
    return JSON.parse(atob(parts[1])) as {
      userId: string;
      cardanoBech32Addr?: string;
      accessTokenAlias?: string;
      exp?: number;
    };
  } catch {
    return null;
  }
}
