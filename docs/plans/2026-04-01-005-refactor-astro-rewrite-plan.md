---
title: "refactor: Rewrite Midnight PBL from React Router to Astro"
type: refactor
status: completed
date: 2026-04-01
origin: docs/brainstorms/2026-03-29-midnight-pbl-site-requirements.md
---

# Rewrite Midnight PBL from React Router to Astro

## Overview

Replace the React Router v7 + Vite SSR stack with Astro 6 + React islands. The current stack requires a custom Vite plugin to prevent `vite-plugin-node-polyfills` from breaking server-side `process.env` access. Astro's island architecture eliminates this entirely by keeping Mesh SDK exclusively in client-only islands. Content pages ship zero JavaScript.

## Problem Frame

The React Router + Vite stack works but has two structural problems:

1. **Polyfill conflict**: `vite-plugin-node-polyfills` (needed for Mesh SDK's crypto/buffer deps) injects a browser `process` shim into the SSR bundle, shadowing Node's real `process.env`. This broke Cloud Run deployments and required a custom `ssrStripProcessPolyfill` plugin. The workaround is fragile.

2. **Performance**: The client bundle is 14.8MB (gzipped: 7.9MB) because Mesh SDK and its transitive dependencies are bundled even though most pages don't need wallet functionality. The `.client.tsx` convention prevents server-side *execution* but not server-side *resolution* of the import graph.

Astro's `client:only="react"` directive completely excludes island dependency trees from the server build, solving both problems at the architecture level.

(see origin: `docs/brainstorms/2026-03-29-midnight-pbl-site-requirements.md`)

## Requirements Trace

All original requirements (R1-R19) are preserved. The rewrite changes *how* they're implemented, not *what* is implemented.

- R1-R4 (Content delivery): Astro pages with server-side data fetching, zero client JS
- R5-R8 (Wallet/Auth): React islands with `client:only="react"`, auth state via vanilla Zustand store
- R9-R12 (Learner workflow): React islands for enrollment/submission flows, API proxy via Astro server endpoints
- R13 (Dashboard): React island for authenticated dashboard
- R14-R16 (API integration): Astro server endpoints replace React Router resource routes
- R17-R19 (Branding): CSS/Tailwind transfers unchanged

## Scope Boundaries

- Full rewrite, not incremental migration (the app is small enough: ~25 source files)
- Same feature set as current app -- no new features, no removed features
- Same deployment target (GCP Cloud Run, Docker)
- Content rendering stays API-sourced (no Astro Content Collections for API data)
- MPA navigation (no View Transitions for now -- accept SSE degradation on page change)
- Not converting to SSG -- keep SSR for all pages since content changes when re-imported via andamio-cli

## Context & Research

### Relevant Code and Patterns

The current codebase has a clean separation that maps well to Astro:

- **Framework-agnostic code** (ports directly): `lib/gateway.server.ts`, `lib/gateway.ts`, `lib/andamio-auth.ts`, `lib/api-utils.ts`, `lib/access-token-utils.ts`, `lib/wallet-address.ts`, `lib/assignment-status.ts`, `stores/tx-store.ts`, `config/*`, `types/*`, `hooks/tx/use-transaction.ts`
- **Server routes** (become Astro server endpoints): `routes/api/gateway-proxy.ts`, `routes/api/tx-build.ts`, `routes/api/tx-register.ts`, `routes/api/tx-stream.ts`
- **React components** (become islands): `components/auth/*`, `components/assignment/*`, `components/dashboard/*`, `components/tx/*`
- **Server-rendered content** (become Astro pages/components): `routes/course-overview.tsx`, `routes/lesson-page.tsx`, `routes/assignment-page.tsx`, `routes/dashboard.tsx`, `routes/learn-layout.tsx`, layout components, UI components
- **Eliminated entirely**: `vite.config.ts` (custom polyfill plugin), `react-router.config.ts`, `routes.ts`, `env.server.ts` (replaced by `astro:env`), `providers/mesh-provider.client.tsx`, `providers/query-provider.tsx`

### Institutional Learnings

From `docs/solutions/` across Andamio repos:

1. **Mesh SDK WASM SSR crash** (andamio-app-v2): Never import `@meshsdk/core` at module scope in SSR-reachable code. Astro's `client:only` is stricter than React's `"use client"` -- it truly prevents server-side loading.
2. **CIP-30 race condition** (andamio-app-v2): Wallet extensions report `connected = true` before API methods are callable. The 500ms delay and `withTimeout` patterns in the current auth flow must be preserved.
3. **Route path mismatch after migration** (cardano-xp): Search both quoted strings AND template literals when migrating routes. Centralizing routes in a config file prevents this class of bug.
4. **TX crash recovery with localStorage** (cardano-xp): All localStorage access must be in `useEffect`. When crossing island boundaries, state that must survive needs localStorage persistence.
5. **Provider waterfall** (cardano-xp): Astro's island architecture eliminates provider waterfalls for non-wallet pages entirely.

### External References

- Astro 6 docs: SSR with Node adapter (`output: 'server'`, standalone mode)
- Astro `astro:env` module: type-safe env vars with server/client context separation
- Astro `client:only="react"`: excludes component tree from server build entirely
- Astro server endpoints: export named HTTP method functions (`GET`, `POST`)
- Node 22 required for Astro 6 (current Dockerfile uses Node 20)

## Key Technical Decisions

- **Vanilla Zustand store for auth state** (not React Context): Astro islands are independently hydrated React roots with no shared context tree. A vanilla Zustand store (same pattern as existing `tx-store.ts`) allows all islands to share auth state. The store persists to localStorage for page-reload recovery. Rejected alternatives: `nanostores` (adds a dependency for something Zustand already does), single mega-island (defeats the purpose of islands).

- **Single WalletController island owns MeshProvider**: One island in the nav wraps `MeshProvider` + `CardanoWallet` + auth logic. It writes wallet/auth state to the vanilla Zustand store. Other islands (assignment, dashboard) read from the store. This avoids duplicating `MeshProvider` across islands and keeps wallet connection state centralized.

- **SSR for all pages (not SSG)**: Course content is API-sourced and changes when re-imported via andamio-cli. SSG would require rebuild on content change. SSR with the existing in-memory cache (5-min TTL) is simpler and matches the current behavior.

- **Server-side markdown rendering**: Replace `react-markdown` + `remark-gfm` + `rehype-highlight` (client-side) with `marked` + `highlight.js` (server-side) for lesson content. Content is static -- no reason to ship a markdown parser to the client.

- **Accept SSE degradation on MPA navigation**: Astro's MPA navigation destroys the `txStore` on page change. The existing "stalled" state handles this gracefully. View Transitions can be added later if this proves to be a UX issue.

- **Node 22 in Dockerfile**: Astro 6 requires Node 22+. Update from `node:20-alpine` to `node:22-alpine`.

## Open Questions

### Resolved During Planning

- **How to share auth state across islands?** Vanilla Zustand store with localStorage persistence. Each island imports the store. WalletController island writes, others read. (Grounded in existing `tx-store.ts` pattern)
- **Does the Node adapter support SSE streaming?** Yes -- Astro's Node standalone adapter supports streaming `Response` objects, same as the current React Router setup.
- **Does `client:only="react"` truly prevent server-side polyfill issues?** Yes -- the component and its entire dependency tree are excluded from the server build. No `vite-plugin-node-polyfills` needed.

### Deferred to Implementation

- **Does `@meshsdk/react` need client-side `buffer` polyfill in Astro?** The Astro Vite config may need `nodePolyfills({ include: ["buffer"] })` for the client build only. Test during Unit 3 implementation.
- **Exact `marked` + `highlight.js` server-side rendering config**: Test during Unit 4 to ensure output matches current `react-markdown` rendering.

## Implementation Units

- [ ] **Unit 1: Astro project scaffold and configuration**

  **Goal:** Initialize Astro 6 project with Node adapter, React integration, Tailwind v4, and env var schema. Delete React Router config files.

  **Requirements:** Foundation for R1-R19

  **Dependencies:** None

  **Files:**
  - Create: `astro.config.mjs`
  - Create: `src/env.d.ts`
  - Modify: `package.json` (swap dependencies)
  - Modify: `tsconfig.json` (Astro preset)
  - Modify: `Dockerfile` (Node 22, new entry point)
  - Move: `app/styles/globals.css` -> `src/styles/globals.css`
  - Delete: `vite.config.ts`, `react-router.config.ts`, `app/routes.ts`, `app/env.server.ts`, `app/env.d.ts`

  **Approach:**
  - `npm create astro@latest` in a temp dir to get the scaffold, then adapt. Or manually create `astro.config.mjs` with `output: 'server'`, `@astrojs/node` adapter (standalone), `@astrojs/react` integration, `@tailwindcss/vite` plugin.
  - Define env schema in `astro.config.mjs` using `envField` -- replaces the Zod validation in `env.server.ts`. `ANDAMIO_API_KEY` is `context: 'server', access: 'secret'`. `PUBLIC_ACCESS_TOKEN_POLICY_ID` is `context: 'client', access: 'public'`.
  - Move `globals.css` unchanged (the `@theme` block and `@import "tailwindcss"` work identically).
  - Update Dockerfile: `node:22-alpine`, entry point `node ./dist/server/entry.mjs`, `ENV HOST=0.0.0.0`, remove `VITE_ACCESS_TOKEN_POLICY_ID` build ARG (Astro reads public vars at runtime).
  - Delete polyfill-related code: `vite-plugin-node-polyfills` dependency, `ssrStripProcessPolyfill` plugin, `ssr.external` config.

  **Patterns to follow:**
  - Astro Docker recipe from docs
  - Existing `globals.css` theme structure

  **Test scenarios:**
  - Happy path: `npm run build` completes without errors, `dist/server/entry.mjs` exists
  - Happy path: `node dist/server/entry.mjs` starts and responds on port 4321
  - Edge case: missing `ANDAMIO_API_KEY` env var causes build-time or startup validation error
  - Happy path: Tailwind utility classes render correctly in built output

  **Verification:**
  - Dev server starts, shows the Astro welcome or a blank page with correct Tailwind styling
  - Build produces `dist/server/entry.mjs` and `dist/client/` assets

- [ ] **Unit 2: Server-side infrastructure (API client, endpoints, middleware)**

  **Goal:** Port the server-side API layer: gateway client, API proxy, transaction endpoints, and SSE streaming.

  **Requirements:** R14, R15, R16

  **Dependencies:** Unit 1

  **Files:**
  - Move: `app/lib/gateway.server.ts` -> `src/lib/gateway.ts` (update env imports to `astro:env/server`)
  - Move: `app/lib/api-utils.ts` -> `src/lib/api-utils.ts`
  - Create: `src/pages/api/gateway/[...path].ts` (catch-all proxy)
  - Create: `src/pages/api/tx/build.ts` (POST endpoint)
  - Create: `src/pages/api/tx/register.ts` (POST endpoint)
  - Create: `src/pages/api/tx/stream/[txHash].ts` (GET SSE endpoint)
  - Move: `app/config/midnight.ts` -> `src/config/midnight.ts`
  - Move: `app/config/branding.ts` -> `src/config/branding.ts`
  - Move: `app/config/transaction-ui.ts` -> `src/config/transaction-ui.ts`

  **Approach:**
  - `gateway.server.ts` drops the `.server` suffix (Astro doesn't use this convention). Update `process.env` references to `import { ANDAMIO_API_KEY, ANDAMIO_GATEWAY_URL } from 'astro:env/server'`. Keep the in-memory module cache.
  - API proxy: export `GET` and `POST` as `APIRoute` functions. Same logic as current `gateway-proxy.ts` but with Astro's request/params API.
  - TX endpoints: same logic, different function signature (`APIRoute` instead of `ActionFunctionArgs`).
  - SSE stream: export `GET` as `APIRoute`, return streaming `Response` with `text/event-stream`. Verify Node adapter supports this.
  - `midnight.ts` config: update to use `import.meta.env.PUBLIC_ACCESS_TOKEN_POLICY_ID` for client-accessible policy ID and `astro:env/server` for server vars.

  **Patterns to follow:**
  - Current `gateway-proxy.ts` logic (cache headers, auth forwarding)
  - Current `tx-stream.ts` SSE pass-through pattern

  **Test scenarios:**
  - Happy path: `GET /api/gateway/v2/course/:courseId/modules` returns module list with correct headers
  - Happy path: `POST /api/tx/build` with valid body returns unsigned transaction
  - Happy path: `GET /api/tx/stream/:txHash` returns SSE stream with `text/event-stream` content type
  - Error path: request to gateway with invalid path returns 404 from upstream
  - Error path: gateway timeout returns 504 with error message
  - Integration: authenticated request forwards `Authorization` header to upstream

  **Verification:**
  - `curl` to each endpoint returns expected responses
  - SSE endpoint streams events when given a valid txHash

- [ ] **Unit 3: Auth store and WalletController island**

  **Goal:** Replace React Context auth with a vanilla Zustand store and create the WalletController island that owns MeshProvider and drives auth state.

  **Requirements:** R5, R6, R7, R8

  **Dependencies:** Unit 2

  **Files:**
  - Create: `src/stores/auth-store.ts` (vanilla Zustand store with localStorage persistence)
  - Move: `app/lib/andamio-auth.ts` -> `src/lib/andamio-auth.ts`
  - Move: `app/lib/access-token-utils.ts` -> `src/lib/access-token-utils.ts`
  - Move: `app/lib/wallet-address.ts` -> `src/lib/wallet-address.ts`
  - Create: `src/components/auth/WalletController.tsx` (React island: MeshProvider + auth flow + store writes)
  - Move: `app/components/auth/connect-wallet.client.tsx` -> `src/components/auth/ConnectWallet.tsx` (adapt to use auth store)
  - Move: `app/components/auth/registration-flow.client.tsx` -> `src/components/auth/RegistrationFlow.tsx`
  - Move: `app/components/auth/auth-gate.tsx` -> `src/components/auth/AuthGate.tsx`
  - Move: `app/stores/tx-store.ts` -> `src/stores/tx-store.ts`
  - Move: `app/hooks/tx/use-transaction.ts` -> `src/hooks/tx/use-transaction.ts`
  - Move: `app/types/auth.ts` -> `src/types/auth.ts`

  **Approach:**
  - **Auth store** (`auth-store.ts`): Vanilla Zustand store (same pattern as `tx-store.ts`) with state: `{ status, user, jwt, walletAddress, error }` and actions: `{ setAuthenticated, setDisconnected, setError, getJwt, authenticatedFetch }`. Persist JWT + walletAddress to localStorage. Subscribe to changes via `store.subscribe()`.
  - **WalletController** island: Wraps `MeshProvider` + `CardanoWallet`. Uses `useWallet()` hook internally. On wallet connect, runs the existing auth flow (scan token -> nonce/sign/validate -> JWT). Writes result to `authStore`. On disconnect, clears store. This is the *only* island that imports `@meshsdk/react`.
  - **Other auth components**: `ConnectWallet.tsx` becomes thin -- just renders `CardanoWallet` within the WalletController. `RegistrationFlow.tsx` and `AuthGate.tsx` read from `authStore` instead of `useAuth()` context.
  - **Preserved patterns**: 500ms CIP-30 delay, `withTimeout` tiers (10s/15s/60s), 30s early JWT expiry check, wallet address change polling (10s). These are in `andamio-auth.ts` and port directly.
  - The `tx-store.ts` is already vanilla Zustand -- it ports with zero changes.

  **Patterns to follow:**
  - `app/stores/tx-store.ts` (vanilla Zustand pattern)
  - `app/contexts/auth-context.client.tsx` (auth flow logic to extract)
  - `app/lib/andamio-auth.ts` (auth utilities)

  **Test scenarios:**
  - Happy path: WalletController renders CardanoWallet, user connects wallet, auth store updates to AUTHENTICATED
  - Happy path: page reload reads JWT from localStorage, auth store restores AUTHENTICATED state
  - Edge case: wallet disconnection clears auth store and localStorage
  - Edge case: JWT expiration triggers re-auth flow
  - Error path: CIP-30 timeout (10s) shows error state with retry option
  - Error path: no access token triggers NEEDS_REGISTRATION state
  - Integration: WalletController writes to auth store, a separate island reads the updated state

  **Verification:**
  - Connect wallet in nav -> auth store shows AUTHENTICATED -> another island on the same page reads the JWT
  - Refresh page -> auth state restored from localStorage

- [ ] **Unit 4: Astro layouts and content pages**

  **Goal:** Create Astro layouts and content pages: course overview, lesson pages, learn layout with sidebar. All server-rendered with zero client JS.

  **Requirements:** R1, R2, R3, R17, R18, R19

  **Dependencies:** Unit 2 (gateway client)

  **Files:**
  - Create: `src/layouts/BaseLayout.astro` (HTML shell, meta, fonts, globals.css)
  - Create: `src/layouts/AppLayout.astro` (nav + main + footer wrapper)
  - Create: `src/layouts/LearnLayout.astro` (sidebar + content area for lesson/assignment pages)
  - Create: `src/pages/index.astro` (course overview)
  - Create: `src/pages/learn/[moduleCode]/[lessonIndex].astro` (lesson page)
  - Create: `src/pages/learn/[moduleCode]/assignment.astro` (assignment page -- server content only, island added in Unit 5)
  - Create: `src/pages/learn/[moduleCode]/index.astro` (redirect to lesson 1)
  - Create: `src/pages/learn/index.astro` (redirect to /)
  - Create: `src/components/layout/Nav.astro`
  - Create: `src/components/layout/Footer.astro`
  - Create: `src/components/course/ModuleCard.astro`
  - Create: `src/components/course/ModuleHeader.astro`
  - Create: `src/components/course/SltList.astro`
  - Create: `src/components/course/LessonContent.astro` (server-side markdown rendering)
  - Create: `src/components/ui/Card.astro`
  - Create: `src/components/ui/Badge.astro`
  - Create: `src/components/ui/Skeleton.astro`
  - Move: `app/lib/assignment-status.ts` -> `src/lib/assignment-status.ts`

  **Approach:**
  - **BaseLayout**: `<html>`, `<head>` with fonts (Outfit, Urbanist, Lora), viewport meta, `<body>` with base dark classes. Import `globals.css`.
  - **AppLayout**: extends BaseLayout, adds Nav + Footer + `<slot />`.
  - **LearnLayout**: extends AppLayout, adds sidebar with SLT navigation. Fetches module + SLTs in frontmatter using `gateway.ts`. The existing `modulesCache` prevents duplicate fetches when both layout and page need module data.
  - **Content pages**: fetch data in Astro frontmatter (`---` block), render as HTML. No React needed.
  - **LessonContent**: server-side markdown rendering with `marked` + `highlight.js`. Replace `react-markdown` + `remark-gfm` + `rehype-highlight`. The `extractMarkdown()` function from `lesson-content.tsx` ports directly. Render HTML with Astro's `set:html` directive.
  - **Nav**: Astro component with static links. The WalletController island (from Unit 3) slots into the nav via `<WalletController client:only="react" />`.
  - **Redirects**: `/learn` -> `/` and `/learn/:moduleCode` -> `/learn/:moduleCode/1` as simple Astro pages that return `Astro.redirect()`.
  - **UI components**: Port `Card`, `Badge`, `Skeleton` as Astro components (they're purely presentational).

  **Patterns to follow:**
  - Current `learn-layout.tsx` sidebar structure and responsive behavior
  - Current `course-overview.tsx` module grid
  - Current `lesson-page.tsx` content layout with prev/next navigation
  - `globals.css` prose-midnight class for markdown styling

  **Test scenarios:**
  - Happy path: course overview page lists all modules with correct branding
  - Happy path: lesson page renders markdown content with syntax highlighting
  - Happy path: sidebar shows SLTs with active lesson highlighted
  - Happy path: prev/next navigation works between lessons
  - Edge case: invalid moduleCode returns 404
  - Edge case: lessonIndex out of range returns 404
  - Happy path: redirect `/learn/MN101` to `/learn/MN101/1`
  - Happy path: mobile responsive sidebar toggles correctly (CSS-based)
  - Happy path: fonts (Outfit, Urbanist, Lora) load and render correctly

  **Verification:**
  - All content pages render with zero client-side JavaScript (check network tab)
  - Visual appearance matches current site's charcoal design
  - Sidebar navigation works for all 6 modules

- [ ] **Unit 5: Interactive islands (assignment, dashboard, enrollment)**

  **Goal:** Port the interactive React components as Astro islands: assignment submission, dashboard progress, enrollment flow, credential claim.

  **Requirements:** R4, R9, R10, R11, R12, R13

  **Dependencies:** Unit 3 (auth store), Unit 4 (pages to host islands)

  **Files:**
  - Move + adapt: `app/components/assignment/assignment-interactive.client.tsx` -> `src/components/assignment/AssignmentInteractive.tsx`
  - Move + adapt: `app/components/assignment/enrollment-flow.client.tsx` -> `src/components/assignment/EnrollmentFlow.tsx`
  - Move + adapt: `app/components/assignment/evidence-form.tsx` -> `src/components/assignment/EvidenceForm.tsx`
  - Move + adapt: `app/components/assignment/commitment-status.tsx` -> `src/components/assignment/CommitmentStatus.tsx`
  - Move + adapt: `app/components/dashboard/dashboard-interactive.client.tsx` -> `src/components/dashboard/DashboardInteractive.tsx`
  - Move + adapt: `app/components/dashboard/module-progress.tsx` -> `src/components/dashboard/ModuleProgress.tsx`
  - Move + adapt: `app/components/dashboard/claim-credential.tsx` -> `src/components/dashboard/ClaimCredential.tsx`
  - Move + adapt: `app/components/dashboard/credentials-list.tsx` -> `src/components/dashboard/CredentialsList.tsx`
  - Move + adapt: `app/components/tx/transaction-button.tsx` -> `src/components/tx/TransactionButton.tsx`
  - Move + adapt: `app/components/tx/tx-status.tsx` -> `src/components/tx/TxStatus.tsx`
  - Move: `app/hooks/api/*` -> `src/hooks/api/*`
  - Modify: `src/pages/learn/[moduleCode]/assignment.astro` (add island)
  - Create: `src/pages/dashboard.astro` (page with island)
  - Move: `app/components/ui/button.tsx` -> `src/components/ui/Button.tsx` (React, used by islands)

  **Approach:**
  - **Replace `useAuth()` with auth store**: Every component that calls `useAuth()` switches to `import { useAuthStore } from '@/stores/auth-store'`. The `authenticatedFetch` function comes from the store instead of context.
  - **Drop `.client.tsx` suffix**: Astro doesn't use this convention. Components are just `.tsx` files. The `client:only="react"` directive on the Astro page controls hydration.
  - **AssignmentInteractive**: same 7-state status-driven UI. Reads auth from store. Uses React Query for commitment status. The `QueryClientProvider` wraps this island internally (not at app level).
  - **DashboardInteractive**: same progress grid + credential claim. Reads auth from store. `QueryClientProvider` wraps internally.
  - **Transaction components**: `TransactionButton` and `TxStatus` port with minimal changes. They already use `useTransaction` hook which uses `tx-store.ts` (vanilla Zustand).
  - **Island mounting in Astro pages**: `<AssignmentInteractive client:only="react" courseId={courseId} moduleCode={moduleCode} ... />`

  **Patterns to follow:**
  - Current `assignment-interactive.client.tsx` state machine
  - Current `dashboard-interactive.client.tsx` layout
  - Current `use-transaction.ts` hook

  **Test scenarios:**
  - Happy path: assignment page shows enrollment form for unenrolled authenticated user
  - Happy path: user submits evidence -> TX flow completes -> status updates to PENDING_APPROVAL
  - Happy path: dashboard shows module progress grid with correct statuses
  - Happy path: credential claim button triggers TX flow
  - Edge case: unauthenticated user sees "connect wallet" prompt in assignment island
  - Edge case: user with PENDING_APPROVAL sees read-only evidence
  - Error path: TX build failure shows error with retry option
  - Error path: wallet sign rejection returns to previous state
  - Integration: auth store update in WalletController propagates to AssignmentInteractive on same page

  **Verification:**
  - Full enrollment flow works: connect wallet -> authenticate -> view assignment -> submit evidence -> on-chain TX -> confirmation
  - Dashboard shows accurate progress after enrollment
  - Transaction status updates in real-time via SSE

- [ ] **Unit 6: Error handling, cleanup, and deploy**

  **Goal:** Add error pages, clean up old files, verify Docker build, deploy to Cloud Run.

  **Requirements:** All (verification)

  **Dependencies:** Units 1-5

  **Files:**
  - Create: `src/pages/404.astro`
  - Create: `src/pages/500.astro`
  - Delete: entire `app/` directory (old React Router code)
  - Delete: `react-router.config.ts`, `app/routes.ts`
  - Modify: `Dockerfile` (final verification)
  - Modify: `docs/DEPLOY.md` (update for Astro)

  **Approach:**
  - Error pages: simple Astro pages with the current charcoal error styling from `error-boundary.tsx`.
  - Delete old code only after full verification -- the `app/` directory is the entire previous implementation.
  - Docker build: verify `npm run build` produces `dist/`, `node dist/server/entry.mjs` starts, responds on port 3000 (or 4321).
  - Update `DEPLOY.md` to remove build ARG instructions (no `VITE_ACCESS_TOKEN_POLICY_ID` build arg needed), update entry point command.
  - Test Cloud Run deploy with same env vars as current deployment.

  **Patterns to follow:**
  - Current `error-boundary.tsx` error page styling
  - Current `DEPLOY.md` structure

  **Test scenarios:**
  - Happy path: Docker image builds on `linux/amd64` without polyfill issues
  - Happy path: container starts with env vars and responds on configured port
  - Happy path: 404 page renders for unknown routes
  - Edge case: missing ANDAMIO_API_KEY causes clear startup error
  - Integration: full deploy to Cloud Run succeeds, all pages load, wallet connection works

  **Verification:**
  - `docker build --platform linux/amd64` succeeds
  - `docker run` with env vars starts cleanly (no `process is not defined`, no env var validation errors)
  - Cloud Run deploy succeeds on first attempt
  - All original functionality works in production

## System-Wide Impact

- **Interaction graph:** WalletController island -> auth store -> all other islands. Auth store is the central coordination point, replacing React Context. `tx-store` remains unchanged.
- **Error propagation:** API errors from gateway continue to propagate as `ApiError`/`AuthExpiredError`. Islands handle errors locally (no global error boundary across islands).
- **State lifecycle risks:** MPA navigation destroys island state. Auth state is persisted to localStorage. TX watcher state may be lost on navigation (accepted degradation with "stalled" fallback).
- **API surface parity:** All 4 API endpoints (`gateway/*`, `tx/build`, `tx/register`, `tx/stream/:txHash`) maintain the same request/response contracts.
- **Unchanged invariants:** Andamio API contract is unchanged. Wallet auth flow is unchanged. Transaction lifecycle is unchanged. All React hooks (`useTransaction`, `useCourseModules`, etc.) preserve their interfaces.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `@meshsdk/react` needs buffer polyfill in client build | Test in Unit 3; configure `vite.plugins` in `astro.config.mjs` for client-only polyfill if needed |
| Vanilla Zustand auth store doesn't propagate between islands fast enough | Use `useSyncExternalStore` in React islands for synchronous subscription; test with two islands on same page |
| `marked` server-side rendering doesn't match `react-markdown` output | Compare output during Unit 4; fall back to `react-markdown` in an island if significant differences |
| Node 22 alpine image has different behavior than Node 20 | Test Docker build early in Unit 1; no known issues with Node 22 alpine |
| SSE streaming doesn't work with Astro Node adapter | Verified in research -- standalone Node adapter supports streaming Response |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-03-29-midnight-pbl-site-requirements.md](docs/brainstorms/2026-03-29-midnight-pbl-site-requirements.md)
- **Polyfill lesson:** memory `project_polyfill_ssr_lesson.md`
- **Mesh SDK WASM issue:** `andamio-app-v2/docs/solutions/runtime-errors/meshsdk-libsodium-wasm-ssr-init.md`
- **CIP-30 race condition:** `andamio-app-v2/docs/solutions/integration-issues/cip30-wallet-api-race-condition-first-login-hang.md`
- **Route mismatch on migration:** `cardano-xp/docs/solutions/integration-issues/route-path-mismatch-forked-template-migration.md`
- **TX crash recovery:** `cardano-xp/docs/solutions/runtime-errors/tx-crash-recovery-localstorage-persistence.md`
- Astro 6 docs: SSR, Node adapter, React integration, env vars, server endpoints
- Astro Docker recipe
