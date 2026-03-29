import { z } from "zod";

/**
 * Server-only environment validation.
 *
 * Validated once at startup. Import from loaders and actions — never
 * from client code. The `.server.ts` suffix guarantees tree-shaking
 * removes this from the client bundle in React Router v7.
 */

const envSchema = z.object({
  /** Andamio API key — required, never exposed to client */
  ANDAMIO_API_KEY: z.string().min(1, "ANDAMIO_API_KEY is required"),

  /** Andamio gateway base URL (e.g. https://preprod.api.andamio.io) */
  ANDAMIO_GATEWAY_URL: z
    .string()
    .url("ANDAMIO_GATEWAY_URL must be a valid URL"),

  /** Cardano network — defaults to preprod */
  CARDANO_NETWORK: z.enum(["preprod", "mainnet", "preview"]).default("preprod"),

  /** Course ID for this single-course app */
  COURSE_ID: z.string().optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

function validateEnv(): ServerEnv {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Environment validation failed:\n${formatted}\n\nCheck your .env file or environment variables.`
    );
  }

  return result.data;
}

/** Validated server environment — safe to use in loaders and actions */
export const serverEnv = validateEnv();
