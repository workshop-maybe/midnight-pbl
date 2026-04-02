# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build (prerendered pages fetch from Andamio API)
npm run preview      # Preview production build locally
npm run start        # Run built server: node --env-file=.env ./dist/server/entry.mjs
npm run typecheck    # astro check && tsc --noEmit
```

No test runner is configured. Validate changes with `npm run typecheck` and `npm run build`.

Content update after editing `compiled/` markdown files:
```bash
andamio course import-all compiled/midnight-from-aiken-to-compact --course-id 5f74e419a291825c637626c196b40a7aa63313cad6e69916cfdec9e5
npm run build   # prerendered pages pull fresh content at build time
```

## Architecture

Astro 6 hybrid app — most pages prerendered at build time, interactive features delivered as React 19 islands.

### Rendering strategy

- **Prerendered (static):** Homepage (`/`), lesson pages (`/learn/[moduleCode]/[lessonIndex]`). Built at deploy time against the Andamio API. ~2ms response times.
- **SSR:** Assignment pages (`/learn/[moduleCode]/assignment`), dashboard (`/dashboard`). These need authenticated data.
- **API routes:** `/api/gateway/[...path]` (proxy to Andamio API with key injection + path allowlist), `/api/tx/*` (build, register, SSE stream for TX confirmation).

### Two-tier API access

- **Server-side** (`src/lib/gateway.server.ts`): Direct calls to Andamio API with `X-API-Key` header. Used in Astro page frontmatter. Has a 5-min in-memory module cache.
- **Client-side** (`src/lib/gateway.ts`): Calls `/api/gateway/*` proxy which injects the API key server-side. Authenticated requests forward the `Authorization` header.

### React islands and shared state

Astro islands are separate React roots — they cannot share React context. State sharing uses **vanilla Zustand stores** (`src/stores/`) at module level:

- `auth-store.ts` — Auth state, JWT, wallet address. Persists to localStorage. Provides `authenticatedFetch` for client-side API calls.
- `tx-store.ts` — TX confirmation watcher via SSE. Manages AbortControllers, 30s timeout for stale confirmations.

Islands use `client:only="react"` (never SSR'd) because they depend on browser APIs (wallet, localStorage).

### Auth flow

WalletController → `buildSession` (nonce from API) → wallet signs nonce (CIP-30) → `validateSignature` → JWT stored in localStorage → `authStore` recovers on page load.

### Transaction flow

Build (POST `/api/tx/build` → unsigned CBOR) → Sign (wallet `signTxReturnFullTx`) → Submit (`wallet.submitTx`) → Register (POST `/api/tx/register`) → Watch (SSE `/api/tx/stream/[txHash]`).

Four TX types defined in `src/config/transaction-ui.ts`: access token mint, assignment commit, assignment update, credential claim.

### Content rendering

Lessons stored as TipTap JSON in the Andamio API. Rendered server-side: `src/lib/markdown.ts` extracts markdown from TipTap JSON, then `marked` + `highlight.js` produce HTML. Zero client JS for lesson pages.

### Path alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Key constraints

- **Polyfills:** `vite-plugin-node-polyfills` provides crypto/buffer for Mesh SDK. `process` must be excluded (`globals: { process: false }`) or it shadows `process.env` in the server build.
- **Env vars:** Defined via Astro's `env.schema` in `astro.config.mjs`. Server secrets use `access: "secret"`, client vars use `PUBLIC_` prefix. `ANDAMIO_API_KEY` is never exposed to the client.
- **Docker build args:** `ANDAMIO_API_KEY`, `ANDAMIO_GATEWAY_URL`, and `COURSE_ID` are passed as build args because prerendered pages need them at build time.

## Deploy

Auto-deploys on push to `main` via `.github/workflows/deploy.yml` → Docker build → GCP Artifact Registry → Cloud Run (`built-on-andamio` / `us-central1`). Manual content rebuilds via `update-content.yml` workflow dispatch.
