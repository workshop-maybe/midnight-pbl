/**
 * Shared API utilities
 *
 * Error types, timeout wrappers, and retry logic used by both
 * server-side gateway and client-side hooks.
 */

// =============================================================================
// Error Types
// =============================================================================

/**
 * Structured API error with status code and optional details.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Thrown when the user's session (JWT) has expired and they need to
 * reconnect their wallet. Allows consuming components to show a
 * "session expired" message instead of a generic error.
 */
export class AuthExpiredError extends Error {
  constructor() {
    super("Your session has expired. Please reconnect your wallet.");
    this.name = "AuthExpiredError";
  }
}

/**
 * Parse an unknown error into a user-friendly message.
 */
export function parseApiError(error: unknown): {
  message: string;
  status: number;
} {
  if (error instanceof ApiError) {
    return { message: error.message, status: error.status };
  }
  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }
  return { message: "An unexpected error occurred", status: 500 };
}

// =============================================================================
// Timeout
// =============================================================================

/**
 * Wrap a promise with a timeout.
 *
 * @param promise  The promise to wrap
 * @param ms       Timeout in milliseconds (default 10_000)
 * @returns        The resolved value or throws on timeout
 */
export function withTimeout<T>(promise: Promise<T>, ms = 10_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new ApiError("Request timed out", 408)),
      ms
    );

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// =============================================================================
// Retry
// =============================================================================

/**
 * Retry fetch on 5xx errors with linear backoff.
 *
 * @param url      Request URL
 * @param options  Fetch options
 * @param retries  Number of retries (default 2)
 * @param backoff  Base backoff in ms (default 1000) — doubles each retry
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2,
  backoff = 1000
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Only retry on 5xx server errors
      if (response.status >= 500 && attempt < retries) {
        await sleep(backoff * (attempt + 1));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(backoff * (attempt + 1));
      }
    }
  }

  throw lastError ?? new ApiError("Request failed after retries", 503);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
