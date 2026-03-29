/**
 * Transaction Register — Resource Route (POST action)
 *
 * Receives { txHash, txType } from the client and registers the
 * submitted transaction with the Andamio Gateway for monitoring.
 *
 * The gateway will track the TX on-chain and update DB state when confirmed.
 *
 * @see ~/routes/api/tx-build.ts — Build route
 */

import type { ActionFunctionArgs } from "react-router";
import { serverEnv } from "~/env.server";

interface TxRegisterRequest {
  txHash: string;
  txType: string;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

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

  const gatewayUrl = `${serverEnv.ANDAMIO_GATEWAY_URL}/api/v2/tx/register`;

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    console.log(`[TX Register] ${txType} hash=${txHash.slice(0, 16)}...`);
  }

  try {
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
      console.error(`[TX Register] Error from API:`, {
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

    if (isDev) {
      console.log(`[TX Register] Success for ${txHash.slice(0, 16)}...`);
    }

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
}
