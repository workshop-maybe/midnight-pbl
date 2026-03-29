/**
 * Transaction Build — Resource Route (POST action)
 *
 * Receives { txType, params } from the client, validates the txType
 * is one of the 4 allowed types, then calls the corresponding Andamio API
 * endpoint to build an unsigned transaction CBOR.
 *
 * Server-side: injects X-API-Key, forwards Authorization header.
 *
 * @see ~/config/transaction-ui.ts — TX type config
 * @see ~/routes/api/gateway-proxy.ts — General proxy (reference pattern)
 */

import type { ActionFunctionArgs } from "react-router";
import { serverEnv } from "~/env.server";
import {
  isValidTransactionType,
  getTransactionUI,
} from "~/config/transaction-ui";

interface TxBuildRequest {
  txType: string;
  params: Record<string, unknown>;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

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
  const gatewayUrl = `${serverEnv.ANDAMIO_GATEWAY_URL}${ui.endpoint}`;

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    console.log(
      `[TX Build] ${txType} → POST ${gatewayUrl}`,
      JSON.stringify(params).slice(0, 200)
    );
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json;charset=utf-8",
      "X-API-Key": serverEnv.ANDAMIO_API_KEY,
    };

    // Forward user JWT when present (required for assignment/credential TXs)
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[TX Build] Error from API:`, {
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

    if (isDev) {
      console.log(`[TX Build] Success for ${txType}`);
    }

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
}
