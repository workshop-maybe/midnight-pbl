/**
 * Transaction Stream — Resource Route (GET loader) for SSE
 *
 * Proxies the Andamio Gateway SSE stream for a given txHash.
 * Returns the raw upstream response body as a pass-through stream.
 *
 * IMPORTANT: This must NOT use React Router's data() helper —
 * that would break the event stream format. We return a raw Response.
 *
 * @see ~/stores/tx-store.ts — Client-side consumer
 */

import type { LoaderFunctionArgs } from "react-router";
import { serverEnv } from "~/env.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const txHash = params.txHash;

  if (!txHash) {
    return Response.json({ error: "txHash parameter is required" }, { status: 400 });
  }

  // Basic validation: Cardano TX hashes are 64 hex characters
  if (!/^[a-fA-F0-9]{64}$/.test(txHash)) {
    return Response.json({ error: "Invalid txHash format" }, { status: 400 });
  }

  const gatewayUrl = `${serverEnv.ANDAMIO_GATEWAY_URL}/api/v2/tx/stream/${txHash}`;

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    console.log(`[TX Stream] Opening SSE for ${txHash.slice(0, 16)}...`);
  }

  try {
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      "X-API-Key": serverEnv.ANDAMIO_API_KEY,
    };

    // Forward user JWT when present
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
        // Prevent caching of SSE stream
        cache: "no-store",
        signal: controller.signal,
      });
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

    // Pass the upstream SSE stream directly to the client.
    // This avoids buffering and preserves the event-stream format.
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
}
