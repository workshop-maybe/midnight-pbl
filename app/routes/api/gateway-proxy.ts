/**
 * Andamio Gateway API Proxy
 *
 * Catch-all resource route at /api/gateway/* that forwards requests
 * to the Andamio Gateway API with the app's API key injected server-side.
 *
 * No default component export — this is a resource route only.
 *
 * Two-layer authentication model:
 * 1. App Authentication (X-API-Key) — always required, injected here
 * 2. User Authentication (Authorization: Bearer) — forwarded when present
 *
 * @see ~/projects/01-projects/cardano-xp/src/app/api/gateway/[...path]/route.ts
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { serverEnv } from "~/env.server";

async function proxyRequest(
  request: Request,
  params: Record<string, string | undefined>,
  method: "GET" | "POST"
) {
  const isDev = process.env.NODE_ENV === "development";

  try {
    const splatPath = params["*"] ?? "";
    const url = new URL(request.url);
    const queryString = url.searchParams.toString();
    const fullPath = `${splatPath}${queryString ? `?${queryString}` : ""}`;
    const gatewayUrl = `${serverEnv.ANDAMIO_GATEWAY_URL}/${fullPath}`;

    if (isDev) {
      console.log(
        `[Gateway Proxy] Forwarding ${method} request to: ${gatewayUrl}`
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json;charset=utf-8",
      "X-API-Key": serverEnv.ANDAMIO_API_KEY,
    };

    // Forward user JWT when present
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (method === "POST") {
      const bodyText = await request.text();
      fetchOptions.body = bodyText;
    }

    let response: Response;
    try {
      response = await fetch(gatewayUrl, fetchOptions);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        return Response.json(
          { error: "Gateway timeout" },
          { status: 504 }
        );
      }
      throw err;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Gateway Proxy] Error response:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return Response.json(
        {
          error: `Gateway API error: ${response.status} ${response.statusText}`,
          details: errorBody,
        },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();

    if (isDev) {
      console.log(`[Gateway Proxy] Success response from ${splatPath}`);
    }

    return Response.json(data);
  } catch (error) {
    console.error("[Gateway Proxy] Error:", error);
    return Response.json(
      {
        error: "Failed to fetch from Gateway",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Loader handles GET requests.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  return proxyRequest(request, params, "GET");
}

/**
 * Action handles POST requests.
 */
export async function action({ request, params }: ActionFunctionArgs) {
  return proxyRequest(request, params, "POST");
}
