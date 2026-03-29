# 2026-03-29 — Phase 1 Complete: Midnight PBL Site

## What was built

A complete single-course learning app for "Midnight: From Aiken to Compact" using React Router v7 (framework mode) — the first non-Next.js Andamio app.

### Architecture

- **React Router v7** (framework mode) with Vite, TypeScript strict, SSR enabled
- **Tailwind CSS v4** with Midnight brand theme (dark-mode only)
- **Mesh SDK v2** for CIP-30 wallet connection (isolated in `.client.tsx` files for SSR safety)
- **@tanstack/react-query** for authenticated client-side queries
- **Zustand** for post-submission TX state watching
- **Andamio Preprod API** via server-side proxy (X-API-Key hidden from client)

### Features (6 implementation units)

1. **Scaffolding & Design System** — Midnight-branded UI with glassmorphic cards, blue-violet palette, Outfit/Urbanist/Geist Mono typography
2. **API Gateway & Course Pages** — Catch-all proxy, server-side data fetching in loaders, 5 course routes (overview, module, lesson, assignment, landing)
3. **Wallet Connection & Auth** — CIP-30 wallet connect, nonce→sign→JWT auth flow, access token detection with 500ms CIP-30 delay, registration/mint flow for first-time users
4. **Transaction Infrastructure** — useTransaction hook (local state for sync flow, Zustand for SSE watching), 3 resource routes (build, register, stream), 4 TX types, assignment status normalizer
5. **Assignment Submission** — Evidence form (text + URLs), 7 assignment page states, enrollment commit TX, evidence update TX
6. **Dashboard** — Module progress grid, credential claim (course-level, requires all 6 modules accepted), auth-gated

## Key decisions

- **React Router v7 over Next.js** — Genuinely different framework to expand Andamio's template library. Server loaders for public data, React Query for authenticated queries. No dehydrate/hydrate complexity.
- **`.client.tsx` convention** — RR7's build-time SSR exclusion for Mesh SDK WASM. Auth context is also `.client.tsx` because it imports `useWallet`. Type exports in separate `types/auth.ts` for server-importable type checking.
- **Provider placement in layout route** — MeshProvider/AuthProvider in app-layout, NOT root. Root has only QueryClientProvider (SSR-safe).
- **TX state split** — React local state for synchronous build→sign→submit, Zustand store only for post-submission SSE watching that survives navigation.
- **Simplified TX watcher** — No subscriber-aware toasting (4 TX types don't justify the complexity). 30s confirmed-state timeout with polling fallback.

## What was learned

- Mesh SDK v2's `getBalance()` returns raw CBOR, not structured arrays. `getBalanceMesh()` is the correct method.
- `vite-plugin-node-polyfills` needed for `@utxos/sdk` (transitive Mesh dep) which imports Node's `crypto.pbkdf2Sync`.
- RR7 resource routes can return raw `Response` objects for SSE streaming — this works for proxying Andamio's TX status stream.
- `shouldRevalidate` returning `false` on content routes prevents unnecessary re-fetches of static course data.
- `wallet.signTxReturnFullTx(cbor, true)` with partialSign=true is required for Andamio V2 co-signed transactions.

## What's next (Phase 2)

- Provide course_id (James) and test end-to-end against Andamio Preprod
- Use andamio-cli to compile and import the Midnight course content
- Finalize the Midnight course draft (lessons are complete in andamio-lesson-coach-content)
- Consider: API proxy path allowlist, markdown sanitization (rehype-sanitize), RR7 version pinning
