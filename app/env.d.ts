/**
 * Vite environment variable type declarations.
 *
 * Variables prefixed with VITE_ are exposed to the client bundle.
 * @see https://vite.dev/guide/env-and-mode.html#intellisense-for-typescript
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Access token policy ID for wallet authentication */
  readonly VITE_ACCESS_TOKEN_POLICY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
