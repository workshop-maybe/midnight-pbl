/**
 * Transaction Build endpoint (POST)
 *
 * Receives { txType, params } and calls the Andamio API to build
 * an unsigned transaction CBOR.
 */

import type { APIRoute } from "astro";
import { ANDAMIO_API_KEY } from "astro:env/server";
import { CURRENT_NETWORK } from "@/config/network";
import {
  isValidTransactionType,
  getTransactionUI,
} from "@/config/transaction-ui";

interface TxBuildRequest {
  txType: string;
  params: Record<string, unknown>;
}

export const POST: APIRoute = async ({ request }) => {
  let body: TxBuildRequest;
  try {
    body = (await request.json()) as TxBuildRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { txType, params } = body;

  if (!txType || !isValidTransactionType(txType)) {
    return Response.json(
      {
        error: `Invalid transaction type: ${txType ?? "(missing)"}`,
        allowedTypes: [
          "GLOBAL_GENERAL_ACCESS_TOKEN_MINT",
          "COURSE_STUDENT_ASSIGNMENT_COMMIT",
          "COURSE_STUDENT_ASSIGNMENT_UPDATE",
          "COURSE_STUDENT_CREDENTIAL_CLAIM",
        ],
      },
      { status: 400 }
    );
  }

  const ui = getTransactionUI(txType);
  const gatewayUrl = `${CURRENT_NETWORK.gatewayUrl}${ui.endpoint}`;

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
        body: JSON.stringify(params),
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
      console.error(`[TX Build] Error:`, {
        status: response.status,
        body: errorBody,
      });
      return Response.json(
        {
          error: `Transaction build failed: ${response.status} ${response.statusText}`,
          details: errorBody,
        },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("[TX Build] Error:", error);
    return Response.json(
      {
        error: "Failed to build transaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
