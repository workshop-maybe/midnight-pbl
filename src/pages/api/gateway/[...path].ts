/**
 * Andamio Gateway API Proxy
 *
 * Catch-all endpoint at /api/gateway/* that forwards requests
 * to the Andamio Gateway API with the app's API key injected.
 */

import type { APIRoute } from "astro";
import { ANDAMIO_API_KEY, ANDAMIO_GATEWAY_URL } from "astro:env/server";

async function proxyRequest(
  request: Request,
  path: string,
  method: "GET" | "POST"
) {
  try {
    const url = new URL(request.url);
    const queryString = url.searchParams.toString();
    const fullPath = `${path}${queryString ? `?${queryString}` : ""}`;
    const gatewayUrl = `${ANDAMIO_GATEWAY_URL}/${fullPath}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json;charset=utf-8",
      "X-API-Key": ANDAMIO_API_KEY,
    };

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
      fetchOptions.body = await request.text();
    }

    let response: Response;
    try {
      response = await fetch(gatewayUrl, fetchOptions);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        return Response.json({ error: "Gateway timeout" }, { status: 504 });
      }
      throw err;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Gateway Proxy] Error:`, {
        status: response.status,
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

    const responseData: unknown = await response.json();

    const isAuthenticated = !!authHeader;
    const cacheControl = isAuthenticated
      ? "no-store"
      : "public, max-age=300";

    return Response.json(responseData, {
      headers: { "Cache-Control": cacheControl },
    });
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

export const GET: APIRoute = async ({ params, request }) => {
  return proxyRequest(request, params.path ?? "", "GET");
};

export const POST: APIRoute = async ({ params, request }) => {
  return proxyRequest(request, params.path ?? "", "POST");
};
