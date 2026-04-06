/**
 * Client-side Andamio Gateway API client
 *
 * All requests route through the server-side proxy at /api/gateway,
 * which injects the API key. This keeps secrets out of the client bundle.
 *
 * Framework-agnostic: pure fetch, no React imports.
 *
 * @see app/routes/api/gateway-proxy.ts — Server-side proxy
 * @see ~/projects/01-projects/cardano-xp/src/lib/gateway.ts — Reference
 */

import { withTimeout } from "@/lib/api-utils";

export const PROXY_BASE = "/api/gateway";

/**
 * Client-side base path for Andamio API v2 endpoints.
 * Requests go: browser -> /api/gateway/api/v2/... -> Andamio Gateway
 */
export const GATEWAY_API_BASE = `${PROXY_BASE}/api/v2`;

// =============================================================================
// Error Types
// =============================================================================

/**
 * Gateway API Error with status code and optional details.
 */
export class GatewayError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

/**
 * Request options for gateway calls (excluding method and body).
 */
export type GatewayRequestOptions = Omit<RequestInit, "method" | "body">;

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Make a GET request through the gateway proxy.
 *
 * @param path - API path (e.g., "/api/v2/course/user/courses/list")
 * @returns Parsed JSON response
 */
export async function gateway<T>(path: string): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  let response: Response;
  try {
    response = await withTimeout(fetch(url), 15_000);
  } catch (err) {
    if (err instanceof Error && err.message.includes("timed out")) {
      throw new GatewayError(
        "Request timed out. The server may be temporarily unavailable.",
        408
      );
    }
    throw err;
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      details?: string;
    };
    throw new GatewayError(
      `Gateway API error: ${response.status} ${response.statusText}`,
      response.status,
      errorData.details
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Make a POST request through the gateway proxy.
 *
 * @param path - API path
 * @param body - Request body (JSON-serialized)
 * @param options - Additional fetch options
 */
export async function gatewayPost<T>(
  path: string,
  body?: unknown,
  options?: GatewayRequestOptions
): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  let response: Response;
  try {
    response = await withTimeout(
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      }),
      15_000
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("timed out")) {
      throw new GatewayError(
        "Request timed out. The server may be temporarily unavailable.",
        408
      );
    }
    throw err;
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      details?: string;
    };
    throw new GatewayError(
      `Gateway API error: ${response.status} ${response.statusText}`,
      response.status,
      errorData.details
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Make an authenticated GET request through the gateway proxy.
 *
 * @param path - API path
 * @param jwt - User JWT token
 */
export async function gatewayAuth<T>(
  path: string,
  jwt: string
): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  let response: Response;
  try {
    response = await withTimeout(
      fetch(url, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }),
      15_000
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("timed out")) {
      throw new GatewayError(
        "Request timed out. The server may be temporarily unavailable.",
        408
      );
    }
    throw err;
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      details?: string;
    };
    throw new GatewayError(
      `Gateway API error: ${response.status} ${response.statusText}`,
      response.status,
      errorData.details
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Make an authenticated POST request through the gateway proxy.
 *
 * @param path - API path
 * @param jwt - User JWT token
 * @param body - Request body (JSON-serialized)
 * @param options - Additional fetch options
 */
export async function gatewayAuthPost<T>(
  path: string,
  jwt: string,
  body?: unknown,
  options?: GatewayRequestOptions
): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  let response: Response;
  try {
    response = await withTimeout(
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      }),
      15_000
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("timed out")) {
      throw new GatewayError(
        "Request timed out. The server may be temporarily unavailable.",
        408
      );
    }
    throw err;
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      details?: string;
    };
    throw new GatewayError(
      `Gateway API error: ${response.status} ${response.statusText}`,
      response.status,
      errorData.details
    );
  }

  return response.json() as Promise<T>;
}

// =============================================================================
// Type Guards
// =============================================================================

/** Check if an error is a GatewayError */
export function isGatewayError(error: unknown): error is GatewayError {
  return error instanceof GatewayError;
}

/** Check if an error is a 404 Not Found */
export function isNotFound(error: unknown): boolean {
  return isGatewayError(error) && error.status === 404;
}

/** Check if an error is a 401 Unauthorized */
export function isUnauthorized(error: unknown): boolean {
  return isGatewayError(error) && error.status === 401;
}

/** Check if an error is a 403 Forbidden */
export function isForbidden(error: unknown): boolean {
  return isGatewayError(error) && error.status === 403;
}
