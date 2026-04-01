/**
 * Transaction Register endpoint (POST)
 *
 * Registers a submitted transaction with the Andamio Gateway for monitoring.
 */

import type { APIRoute } from "astro";
import { ANDAMIO_API_KEY, ANDAMIO_GATEWAY_URL } from "astro:env/server";

interface TxRegisterRequest {
  txHash: string;
  txType: string;
}

export const POST: APIRoute = async ({ request }) => {
  let body: TxRegisterRequest;
  try {
    body = (await request.json()) as TxRegisterRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { txHash, txType } = body;

  if (!txHash || typeof txHash !== "string") {
    return Response.json({ error: "txHash is required" }, { status: 400 });
  }

  if (!txType || typeof txType !== "string") {
    return Response.json({ error: "txType is required" }, { status: 400 });
  }

  const gatewayUrl = `${ANDAMIO_GATEWAY_URL}/api/v2/tx/register`;

  try {
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

    let response: Response;
    try {
      response = await fetch(gatewayUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          tx_hash: txHash,
          tx_type: txType,
        }),
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

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[TX Register] Error:`, {
        status: response.status,
        body: errorBody,
      });
      return Response.json(
        {
          error: `Transaction registration failed: ${response.status} ${response.statusText}`,
          details: errorBody,
        },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("[TX Register] Error:", error);
    return Response.json(
      {
        error: "Failed to register transaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
