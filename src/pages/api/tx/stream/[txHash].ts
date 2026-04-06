/**
 * Transaction Stream endpoint (GET) — SSE pass-through
 *
 * Proxies the Andamio Gateway SSE stream for a given txHash.
 */

import type { APIRoute } from "astro";
import { ANDAMIO_API_KEY, ANDAMIO_GATEWAY_URL } from "astro:env/server";

export const GET: APIRoute = async ({ params, request }) => {
  const txHash = params.txHash;

  if (!txHash) {
    return Response.json(
      { error: "txHash parameter is required" },
      { status: 400 }
    );
  }

  if (!/^[a-fA-F0-9]{64}$/.test(txHash)) {
    return Response.json(
      { error: "Invalid txHash format" },
      { status: 400 }
    );
  }

  const gatewayUrl = `${ANDAMIO_GATEWAY_URL}/api/v2/tx/stream/${txHash}`;

  try {
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      "X-API-Key": ANDAMIO_API_KEY,
    };

    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let upstream: Response;
    try {
      upstream = await fetch(gatewayUrl, {
        headers,
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        return Response.json({ error: "Gateway timeout" }, { status: 504 });
      }
      throw err;
    }
    clearTimeout(timeoutId);

    if (!upstream.ok) {
      const errorBody = await upstream.text();
      console.error(`[TX Stream] Upstream error:`, {
        status: upstream.status,
        body: errorBody,
      });
      return Response.json(
        {
          error: `Stream failed: ${upstream.status} ${upstream.statusText}`,
          details: errorBody,
        },
        { status: upstream.status }
      );
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[TX Stream] Error:", error);
    return Response.json(
      {
        error: "Failed to connect to transaction stream",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
