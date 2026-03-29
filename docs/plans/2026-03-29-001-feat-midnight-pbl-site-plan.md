---
title: "feat: Build Midnight PBL single-course learning app"
type: feat
status: completed
date: 2026-03-29
origin: docs/brainstorms/2026-03-29-midnight-pbl-site-requirements.md
deepened: 2026-03-29
---

# feat: Build Midnight PBL single-course learning app

## Overview

Build a greenfield single-course learning app for "Midnight: From Aiken to Compact" using React Router v7 (framework mode), TypeScript, React, Tailwind CSS, and Mesh SDK. The app fetches course content from Andamio Preprod API, supports wallet-based authentication, and enables learners to enroll in modules, submit assignment evidence, and claim credentials.

## Problem Frame

Andamio's existing apps are all Next.js. This project delivers the Midnight PBL course and establishes a React Router v7 reference implementation for single-course deployments. The codebase should be clean enough to extract as a template. (see origin: docs/brainstorms/2026-03-29-midnight-pbl-site-requirements.md)

## Requirements Trace

**Course Content Delivery**
- R1. Display course overview with all 6 modules and descriptions
- R2. Module pages show introduction, SLTs, and lessons
- R3. Lesson pages render markdown content from Andamio API
- R4. Assignment page per module shows prompt and submission interface

**Wallet & Auth**
- R5. CIP-30 wallet connection via Mesh SDK
- R6. Wallet triggers auth flow (nonce → sign → JWT)
- R6a. First-time users mint an Andamio Access Token before authenticating (discovered gap — API requires `andamio_access_token_unit`)
- R7. Auth persists across navigation (JWT in localStorage)
- R8. Unauthenticated browsing; wallet required for enrollment/assignments

**Learner Workflow**
- R9. Enroll in a module (commit to assignment — on-chain TX)
- R10. Submit/update assignment evidence (text + URLs)
- R11. View enrollment status and submission history per module
- R12. Claim course credential after all assignments approved (on-chain TX)

**Progress**
- R13. Dashboard shows enrollment status across all modules and earned credentials

**API Integration**
- R14. Server-side API proxy (X-API-Key never exposed to client)
- R15. Single course_id from environment variable
- R16. Andamio Preprod environment

**Branding**
- R17. Midnight dark-mode palette (deep navy, blue-to-violet accents, glassmorphic cards)
- R18. Typography: Outfit (headings), Urbanist (body), Geist Mono (code)
- R19. Responsive (functional mobile, polished desktop)

## Scope Boundaries

- No teacher/admin views
- No project/task workflows
- No content editing or studio
- No file uploads for evidence (text/URL only)
- No social wallet (UTXOS/Web3 SDK)
- No light mode
- No module prerequisites (learners complete in any order)
- andamio-cli content management is Phase 2

## Context & Research

### Relevant Code and Patterns

**Gateway client** (`cardano-xp:/src/lib/gateway.ts`): Framework-agnostic fetch wrapper routing through `/api/gateway`. Four functions: `gateway<T>` (GET), `gatewayPost<T>` (POST), `gatewayAuth<T>` (auth GET), `gatewayAuthPost<T>` (auth POST). Custom `GatewayError` class with type guards.

**Server gateway** (`cardano-xp:/src/lib/gateway-server.ts`): Direct API calls with `X-API-Key` header. Reuses transform functions from hooks for hydration parity.

**API proxy** (`cardano-xp:/src/app/api/gateway/[...path]/route.ts`): Catch-all proxy forwarding GET/POST with API key injection. Passes Authorization header through.

**Auth flow** (`cardano-xp:/src/lib/andamio-auth.ts`): `POST /auth/login/session` → nonce, `wallet.signData()`, `POST /auth/login/validate` → JWT. Requires `andamio_access_token_unit` for browser wallets.

**Auth context** (`cardano-xp:/src/contexts/andamio-auth-context.tsx`): Provides `isAuthenticated`, `user`, `jwt`, `authenticate()`, `logout()`. Auto-authenticates on wallet connect. 10s polling for wallet switch detection.

**MeshProvider** (`cardano-xp:/src/components/providers/combined-provider.tsx`): Parallel dynamic import of `@meshsdk/react` + auth. `MeshProvider > AuthProvider > children`.

**Course hooks** (`cardano-xp:/src/hooks/api/course/`): Colocated types pattern — each hook defines app-level camelCase interfaces, transform functions, and React Query hooks. Query key factories for deduplication.

**TX hook** (`andamio-app-v2:/src/hooks/tx/use-transaction.ts`): Six-phase lifecycle: Prerequisites → Validation → Build → Sign → Submit → Register. Uses Zustand store for state, SSE for confirmation tracking.

**Single-course config** (`cardano-xp:/src/config/cardano-xp.ts`): Centralizes courseId, projectId, routes, token config as a const object from env vars.

**Assignment status** (`andamio-app-v2:/src/lib/assignment-status.ts`): Normalizer mapping API values to canonical statuses: NOT_STARTED → IN_PROGRESS → PENDING_APPROVAL → ACCEPTED/DENIED → CREDENTIAL_CLAIMED.

### Institutional Learnings

**Mesh SDK WASM SSR crash**: `@meshsdk/core` initializes a 1.9MB WASM binary at import time. Never import at module scope in SSR-reachable files. Use `.client.tsx` module convention in RR7 or dynamic `import()`.

**CIP-30 wallet race condition**: Wallet extensions fire `connected = true` before CIP-30 API is callable. Add 500ms delay before auto-auth. Wrap every wallet call in `withTimeout()` (10s reads, 15s API, 60s signing).

**TX timers in stores, not hooks**: React hooks cancel timers on unmount/navigation. TX watchdog timeouts and retry logic must live in Zustand store. State machine: BUILD → SIGN → SUBMIT → REGISTER → STREAM → terminal.

**SSR hydration mismatches**: Never read localStorage/sessionStorage during render. Use `useState(null)` + `useEffect`. `typeof window !== "undefined"` prevents runtime errors but NOT hydration mismatches.

**Zod API validation**: Validate at boundary with `safeParse`. Start soft mode (warn, don't break), switch to strict once shapes confirmed.

**Gateway 5xx retry**: Wrap server-side gateway calls with retry for 500/502/503/504. Linear backoff (1s, 2s), max 2 retries. Never retry 4xx or wallet signing.

### External References

**React Router v7 Framework Mode** (reactrouter.com):
- Routes configured in `app/routes.ts` using `route()`, `index()`, `layout()`, `prefix()` helpers
- Server `loader`/`action` functions stripped from client bundles, access `process.env` directly
- Resource routes: export `loader`/`action` without default component. Splat route `route("api/*", ...)` for catch-all proxy
- `.client.tsx` convention excludes files from server bundle entirely
- Root `Layout` export wraps component, ErrorBoundary, and HydrateFallback
- Type generation via `./+types/` directories from route config
- `@react-router/node` adapter for Express/Node deployment

## Key Technical Decisions

- **React Router v7 framework mode** over Next.js: Server loaders handle API proxy natively. Nested routing fits course hierarchy. Full React for Mesh SDK. Vite-based, fast DX. (see origin)

- **Catch-all resource route for API proxy** over individual loaders: Matches the proven gateway pattern from existing Andamio apps. A single `route("api/gateway/*", ...)` resource route injects `X-API-Key` and forwards all requests. Client-side `gateway.ts` remains framework-agnostic. Separate resource routes for TX-specific endpoints (build, register, stream).

- **Client-side transaction hook** over form actions: The TX flow (server build → client sign → client submit → server register → SSE confirm) spans server and client. RR7 form actions are not viable because wallet signing breaks the action model, and actions trigger full loader revalidation. A client-side `useTransaction` hook orchestrates the sequence by calling resource route endpoints for server steps and wallet methods for client steps. **State split: React local state for synchronous execution (idle → building → signing → submitting), Zustand store only for post-submission SSE watching** (must survive navigation). Simplified TX watcher — no subscriber-aware toasting pattern (overkill for 4 TX types). After TX success, React Query `invalidateQueries` refreshes displayed data.

- **`.client.tsx` convention for Mesh SDK** over dynamic import: RR7's `.client.tsx` files are excluded from the server bundle at build time — cleaner than runtime `React.lazy()` or `useEffect` + `import()`. MeshProvider, wallet connect, and registration flow all use this convention. **Critical: the auth context must also be `.client.tsx`** because it needs to import `useWallet` from `@meshsdk/react`. Unlike Next.js's `"use client"` directive (which is a boundary declaration), RR7 has no equivalent — any file importing Mesh SDK at module scope will crash during SSR. The entire provider chain (Mesh + Auth) lives in `.client.tsx` files. Type exports for auth state are placed in a separate `types/auth.ts` file for server-importable type checking.

- **Provider placement in layout route, not root.tsx**: MeshProvider and AuthProvider depend on browser APIs and must not render during SSR. They live in the app-layout route (the layout wrapping `/learn/*` and `/dashboard`), not in `root.tsx`. Root renders only `QueryClientProvider` (SSR-safe) + `<Outlet />`. The `.client.tsx` provider chain renders inside the layout route.

- **Loaders for SSR, React Query for authenticated queries only**: Page route loaders (course-overview, module-page, lesson-page) fetch public course data server-side via `gateway.server.ts` — this provides fast SSR with no client waterfall. React Query is used only for authenticated client-side queries (commitment status, credentials list, dashboard data) and for cache invalidation after TX success. No dehydrate/hydrate complexity.

- **Simple textarea + URL for evidence** over TipTap rich text: Developer PBL audience. Minimal dependency surface. Text + URLs is sufficient for code submissions and writeups.

- **No module prerequisites for Phase 1**: Learners complete modules in any order. Simplifies enrollment flow. Prerequisites can be added later since the API already supports the `prerequisites` field.

- **Course-level credential claiming**: The `COURSE_STUDENT_CREDENTIAL_CLAIM` TX takes only `course_id`. Claim button appears on dashboard when all 6 modules have ASSIGNMENT_ACCEPTED status.

- **Access Token mint as registration flow**: API requires `andamio_access_token_unit` for browser wallet auth. First-time users choose an alias and mint an access token (on-chain TX) before full authentication. This is a separate flow triggered when no access token is detected in the wallet.

## Open Questions

### Resolved During Planning

- **Mesh SDK v2 + RR7 compatibility**: Mesh SDK is pure React hooks — no Next.js dependency. Using `.client.tsx` convention avoids SSR entirely. The `useWallet()` hook and `MeshProvider` work in any React app. The WASM issue is solved by excluding from server bundle.

- **API proxy pattern**: Catch-all resource route at `route("api/gateway/*", ...)` with `loader` (GET) and `action` (POST). This is architecturally equivalent to the Next.js `[...path]/route.ts` pattern.

- **Transaction flow in RR7**: Client-side `useTransaction` hook calls resource routes (`/api/tx/build`, `/api/tx/register`) for server steps and wallet methods for client steps. SSE stream via resource route at `/api/tx/stream/:txHash`.

- **Enrollment = commitment to assignment**: Following existing Andamio app pattern. "Enroll" means committing to a module's assignment (on-chain TX with slt_hash). Evidence can be submitted simultaneously or updated later.

- **ASSIGNMENT_DENIED allows resubmission**: Matches existing app behavior. Denied status resets to IN_PROGRESS. Feedback shown if available.

### Deferred to Implementation

- **Exact Zod schemas for API responses**: Start with soft validation, tighten to strict as response shapes are confirmed against preprod API.
- **SSE stream reliability**: May need polling fallback if SSE disconnects. Existing app has `tx-polling-fallback.ts` as reference.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Route Architecture

```
routes.ts:
  / (landing page)
  └─ layout: app-shell
     ├─ /learn (course overview - all 6 modules)
     ├─ /learn/:moduleCode (module detail - intro, SLTs, lessons)
     ├─ /learn/:moduleCode/:lessonIndex (individual lesson)
     ├─ /learn/:moduleCode/assignment (assignment + submission)
     └─ /dashboard (enrollment status + credentials)

  Resource routes (no UI):
  ├─ /api/gateway/* (catch-all API proxy)
  ├─ /api/tx/build (TX build endpoint)
  ├─ /api/tx/register (TX register endpoint)
  └─ /api/tx/stream/:txHash (SSE stream)
```

### Data Flow

```
[Browser]                    [RR7 Server]               [Andamio API]
    │                              │                          │
    │── GET /learn ────────────────│                          │
    │                              │── loader: GET /course/user/modules/:id ──│
    │                              │◄─────── modules JSON ────│
    │◄──── HTML + loader data ─────│                          │
    │                              │                          │
    │── POST /api/gateway/... ─────│                          │
    │   (via gateway.ts client)    │── + X-API-Key header ───►│
    │                              │◄─────── response ────────│
    │◄──── proxied response ───────│                          │
    │                              │                          │
    │── useTransaction: build ─────│                          │
    │   POST /api/tx/build         │── POST /tx/course/... ──►│
    │                              │◄──── unsigned CBOR ──────│
    │◄──── CBOR hex ───────────────│                          │
    │── wallet.signTxReturnFullTx(cbor, true) ───────│                          │
    │── wallet.submitTx(signed) ───│                          │
    │── POST /api/tx/register ─────│── POST /tx/register ────►│
    │── GET /api/tx/stream/:hash ──│── SSE /tx/stream/:hash ─►│
    │◄──── SSE events ─────────────│◄──── SSE events ─────────│
```

### Authentication State Machine

```
DISCONNECTED ──[connect wallet]──► WALLET_CONNECTED
    │                                     │
    │                     [check for access token in wallet]
    │                           ┌─────────┴──────────┐
    │                    [found]│                     │[not found]
    │                           ▼                     ▼
    │                  AUTO_AUTH_START         NEEDS_REGISTRATION
    │                        │                        │
    │                [nonce → sign → validate]   [alias → mint TX → confirm]
    │                        │                        │
    │                        ▼                        ▼
    │                  AUTHENTICATED ◄────────── RE_AUTH_AFTER_MINT
    │                        │
    │                [JWT expired / wallet switch]
    │                        │
    │                        ▼
    └────────────────── DISCONNECTED
```

## Implementation Units

- [ ] **Unit 1: Project Scaffolding & Midnight Design System**

**Goal:** Set up React Router v7 framework mode project with Tailwind CSS configured for Midnight's brand. Create base UI components and layout shell.

**Requirements:** R17, R18, R19

**Dependencies:** None

**Files:**
- Create: `package.json`, `vite.config.ts`, `react-router.config.ts`, `tsconfig.json`
- Create: `app/root.tsx`, `app/routes.ts`, `app/routes/landing.tsx`
- Create: `app/env.server.ts` (Zod validation for server env vars)
- Create: `app/styles/globals.css` (Tailwind imports + Midnight CSS custom properties)
- Create: `tailwind.config.ts` (Midnight theme: colors, fonts, border-radius)
- Create: `app/config/midnight.ts` (course config: courseId, network, routes)
- Create: `app/config/branding.ts` (brand constants: colors, fonts, metadata)
- Create: `app/components/ui/card.tsx`, `button.tsx`, `badge.tsx`, `skeleton.tsx`
- Create: `app/components/layout/app-shell.tsx`, `nav.tsx`, `footer.tsx`
- Create: `.env.example`
- Create: `app/components/error/error-boundary.tsx` (styled error page with retry button)
- Modify: `app/root.tsx` (export ErrorBoundary for unhandled errors)
- Test: `app/__tests__/config.test.ts`

**Approach:**
- Initialize with `npx create-react-router@latest` then customize
- Tailwind config extends with Midnight palette: bg-midnight (`#0b0e1a`), primary (`#2a48ff`/`#5bb6f2`), violet (`#7a5cff`), card-bg (`#0a0e19`), text (`#f7f8ff`)
- Google Fonts: Outfit, Urbanist. Self-host Geist Mono or use fontsource
- CSS custom properties for the full `--mn-*` token set
- Base UI components follow glassmorphic card pattern: semi-transparent bg, `#ffffff1a` border, sky-blue glow on hover, 20px radius
- App shell: sticky nav with course title + wallet connect button, `<Outlet />` for content, footer
- Root loader exposes public env vars (gateway URL, network, course ID, access token policy ID) to client
- Root renders QueryClientProvider (SSR-safe) + `<Outlet />`. **MeshProvider and AuthProvider are NOT in root** — they go in the app-layout route (Unit 2) because they need browser APIs
- QueryClient: created per-request on server (no singleton), singleton on client. Standard RR7 pattern to prevent cross-request data leakage
- `env.server.ts` validates `ANDAMIO_API_KEY` (required), `ANDAMIO_GATEWAY_URL` (required), `CARDANO_NETWORK`, `COURSE_ID`. `ACCESS_TOKEN_POLICY_ID` validated in Unit 3 where it's consumed.
- Install core dependencies: `react-router`, `@react-router/node`, `@react-router/serve`, `tailwindcss`, `@tanstack/react-query`, `zustand`, `zod`

**Patterns to follow:**
- `cardano-xp:/src/config/branding.ts` for brand constants structure
- `cardano-xp:/src/config/cardano-xp.ts` for single-course config pattern
- Midnight CSS variables documented in memory (reference_midnight_brand.md)

**Test scenarios:**
- Happy path: env validation passes with all required vars set, returns typed config object
- Edge case: env validation throws descriptive error when ANDAMIO_API_KEY is missing
- Happy path: Midnight CSS custom properties are defined and used by card component
- Happy path: root loader returns public env vars subset (no secrets)

**Verification:**
- `npm run dev` starts without errors
- Landing page renders with Midnight dark theme (navy background, correct fonts)
- Tailwind classes produce Midnight-branded colors

---

- [ ] **Unit 2: API Gateway Proxy & Course Content Pages**

**Goal:** Implement the server-side API proxy and build all public course browsing pages (overview, module, lesson). This is the core read-only experience.

**Requirements:** R1, R2, R3, R4 (display only), R8, R14, R15, R16

**Dependencies:** Unit 1

**Files:**
- Create: `app/routes/api/gateway-proxy.ts` (catch-all resource route)
- Create: `app/lib/gateway.ts` (client-side API helper)
- Create: `app/lib/gateway.server.ts` (server-side API client with retry + timeout)
- Create: `app/lib/api-utils.ts` (error classes, retry logic, timeout wrapper)
- Create: `app/hooks/api/course/use-course.ts` (course + modules hook)
- Create: `app/hooks/api/course/use-course-content.ts` (SLTs, lessons, assignments, introductions)
- Create: `app/hooks/api/query-keys.ts` (query key factories)
- Create: `app/routes/app-layout.tsx` (layout route with nav + outlet)
- Create: `app/routes/course-overview.tsx` (all 6 modules)
- Create: `app/routes/module-page.tsx` (intro, SLTs, lessons list)
- Create: `app/routes/lesson-page.tsx` (markdown content)
- Create: `app/routes/assignment-page.tsx` (assignment prompt — submission UI in Unit 5)
- Create: `app/components/course/module-card.tsx`, `lesson-content.tsx`, `slt-list.tsx`, `module-header.tsx`
- Create: `app/components/providers/query-provider.tsx` (React Query client provider)
- Test: `app/__tests__/gateway.test.ts`, `app/__tests__/api-utils.test.ts`

**Approach:**
- Gateway proxy resource route: splat route at `api/gateway/*`. Loader handles GET, action handles POST. Injects `X-API-Key` from `process.env`, forwards `Authorization` header. Returns upstream response.
- Server-side gateway client (`gateway.server.ts`): direct fetch to Andamio API with API key. Used in route loaders for SSR data. Includes `fetchWithRetry` for 5xx (2 retries, 1s/2s backoff) and `withTimeout` (10s default).
- Client-side gateway (`gateway.ts`): routes through `/api/gateway/`. Custom `GatewayError` with type guards (`isNotFound`, `isUnauthorized`). Framework-agnostic, pure fetch.
- Course hooks follow colocated types pattern: define app-level interfaces (camelCase), transform functions (snake_case → camelCase), React Query hooks. Transform functions are shared between hooks and server gateway for hydration parity.
- Route loaders prefetch course data server-side via `gateway.server.ts`. `course-overview.tsx` loader fetches modules. `module-page.tsx` loader fetches module detail + SLTs. `lesson-page.tsx` loader fetches lesson content. Components access data via `loaderData` prop (RR7 typed).
- Content routes export `shouldRevalidate` returning `false` — course content is static and should not re-fetch on back-navigation.
- Markdown rendering: install `react-markdown` + `remark-gfm` for GFM support. Code blocks with syntax highlighting via `rehype-highlight` or `shiki`.
- **Data loading strategy: loaders for SSR, React Query for authenticated queries only.** No dehydrate/hydrate pattern. Public course data comes from loaders. React Query used only in Units 5-6 for authenticated queries (commitment status, credentials).
- All routes use `courseId` from config (not URL params). Module code and lesson index from URL params.
- App-layout route wraps all content pages. It renders the nav shell + `<Outlet />`. The `.client.tsx` MeshProvider + AuthProvider chain will be added here in Unit 3 (not in root.tsx).
- Error boundaries at layout level to catch loader failures (API down) with user-friendly error page + retry.

**Patterns to follow:**
- `cardano-xp:/src/lib/gateway.ts` for client gateway structure
- `cardano-xp:/src/lib/gateway-server.ts` for server gateway
- `cardano-xp:/src/app/api/gateway/[...path]/route.ts` for proxy pattern
- `cardano-xp:/src/hooks/api/course/use-course.ts` for colocated types pattern
- `cardano-xp:/src/hooks/api/course/use-course-content.ts` for content hooks

**Test scenarios:**
- Happy path: gateway proxy forwards GET request to Andamio API with X-API-Key, returns JSON
- Happy path: gateway proxy forwards POST request with Authorization header passthrough
- Error path: gateway proxy returns 401 when upstream returns 401 (no swallowing errors)
- Error path: server gateway retries on 502, succeeds on second attempt
- Error path: server gateway times out after 10s, throws descriptive error
- Happy path: course overview loader returns 6 modules with titles and descriptions
- Happy path: lesson page renders markdown content with code syntax highlighting
- Edge case: lesson with empty content shows placeholder message
- Integration: course overview → click module → module page loads with SLTs and lesson list

**Verification:**
- All 6 modules display on course overview with correct Midnight styling
- Clicking a module navigates to module page showing introduction, SLTs, lesson links
- Clicking a lesson navigates to lesson page rendering markdown
- API key is never visible in client-side network requests (only in server-to-API calls)

---

- [ ] **Unit 3: Wallet Connection & Authentication**

**Goal:** Implement Mesh SDK wallet connection (client-only), Andamio auth flow (nonce → sign → JWT), access token detection, and the registration/mint flow for first-time users.

**Requirements:** R5, R6, R6a, R7, R8

**Dependencies:** Unit 2 (gateway proxy for auth API calls)

**Files:**
- Create: `app/components/providers/mesh-provider.client.tsx` (MeshProvider wrapper — `.client.tsx` excludes from server)
- Create: `app/components/auth/connect-wallet.client.tsx` (wallet connect button)
- Create: `app/components/auth/registration-flow.client.tsx` (access token mint for first-time users)
- Create: `app/components/auth/auth-gate.tsx` (wrapper requiring authentication)
- Create: `app/contexts/auth-context.client.tsx` (auth state — `.client.tsx` because it imports `useWallet` from Mesh SDK)
- Create: `app/types/auth.ts` (auth type exports — server-importable, no Mesh dependency)
- Create: `app/lib/andamio-auth.ts` (auth service: buildSession, validateSignature, JWT management)
- Create: `app/lib/wallet-address.ts` (getWalletAddressBech32, Mesh v2 → v1 fallback)
- Create: `app/lib/access-token-utils.ts` (scan wallet for access token by policy ID)
- Modify: `app/routes/app-layout.tsx` (wrap Outlet with .client.tsx MeshProvider + AuthProvider chain)
- Modify: `app/components/layout/nav.tsx` (add wallet connect button)
- Test: `app/__tests__/andamio-auth.test.ts`, `app/__tests__/timeout.test.ts`

**Approach:**
- `mesh-provider.client.tsx`: Wraps children in `MeshProvider` from `@meshsdk/react`. The `.client.tsx` suffix ensures RR7 excludes this from the server bundle (solves WASM SSR crash).
- `auth-context.client.tsx`: Also `.client.tsx` because it imports `useWallet` from `@meshsdk/react`. In RR7, there is no `"use client"` directive — any file importing Mesh at module scope crashes SSR. Auth type definitions (AuthUser, AuthState) exported from separate `types/auth.ts` for server-importable type checking.
- Auth context provides: `isAuthenticated`, `user` (alias, address), `jwt`, `isAuthenticating`, `authenticate()`, `logout()`, `authenticatedFetch()`. JWT stored in localStorage. Auto-triggers auth when wallet connects. 500ms delay before auto-auth (CIP-30 race condition fix).
- Provider chain lives in `app-layout.tsx` (the layout route), NOT in `root.tsx`. Root only has QueryClientProvider (SSR-safe).
- Auth flow: `POST /api/v2/auth/login/session` → nonce → `wallet.signData(address, nonce)` → `POST /api/v2/auth/login/validate` with `{id, signature, address, andamio_access_token_unit}` → JWT.
- Access token detection: on wallet connect, **after the 500ms CIP-30 delay**, scan wallet UTXOs for tokens matching `ACCESS_TOKEN_POLICY_ID`. If found, extract alias and proceed to auth. If not found, show registration flow. If scan fails (timeout/error), treat as "not found" and allow the user to retry the scan before falling through to registration.
- Registration flow: User enters alias → builds access token mint TX via `POST /api/tx/global/user/access-token/mint` → wallet signs → wallet submits → register TX → wait for confirmation → re-scan wallet → proceed to auth.
- All wallet API calls wrapped in `withTimeout()`: 10s for reads, 15s for API calls, 60s for signing.
- `auth-gate.tsx`: renders children only when `isAuthenticated`. Shows `ConnectWalletPrompt` otherwise.
- Browser-API-safe patterns: JWT read from localStorage in `useEffect`, not during render.

**Patterns to follow:**
- `cardano-xp:/src/lib/andamio-auth.ts` for auth service structure
- `cardano-xp:/src/contexts/andamio-auth-context.tsx` for context shape
- `cardano-xp:/src/components/providers/combined-provider.tsx` for MeshProvider setup
- `andamio-app-v2:/src/components/landing/registration-flow.tsx` for access token mint flow
- `andamio-app-v2:/src/lib/access-token-utils.ts` for token scanning
- Learnings: meshsdk-libsodium-wasm-ssr-init.md, cip30-wallet-api-race-condition-first-login-hang.md

**Test scenarios:**
- Happy path: wallet connects → access token found → auto-auth → JWT stored → isAuthenticated true
- Happy path: first-time user → no access token → registration flow shown → alias entered → mint TX completes → auth proceeds
- Error path: wallet.signData times out after 60s → auth error shown, user can retry
- Error path: auth validate returns 401 (invalid signature) → clear error message, no crash
- Edge case: wallet disconnects during auth flow → state resets to DISCONNECTED
- Edge case: user has stored JWT but it's expired → re-triggers sign flow on page load
- Edge case: user switches wallet → detects address change → logs out and re-authenticates
- Happy path: withTimeout(500ms) rejects if promise doesn't resolve in time
- Integration: auth-gate renders children when authenticated, shows prompt when not

**Verification:**
- Wallet selector appears in nav, lists available CIP-30 wallets
- Connecting a wallet with an access token triggers auto-auth without user interaction beyond wallet approval
- Connecting a wallet without an access token shows registration/mint flow
- JWT persists across page navigations
- No SSR errors — mesh-provider.client.tsx is excluded from server bundle

---

- [ ] **Unit 4: Transaction Infrastructure**

**Goal:** Build the transaction execution system: a client-side hook orchestrating server/client TX steps, a Zustand store for TX state, and resource routes for build, register, and SSE stream.

**Requirements:** R9, R12 (infrastructure for both)

**Dependencies:** Unit 3 (auth context for JWT, wallet for signing)

**Files:**
- Create: `app/hooks/tx/use-transaction.ts` (transaction execution hook)
- Create: `app/stores/tx-store.ts` (Zustand store for TX state machine)
- Create: `app/routes/api/tx-build.ts` (resource route: POST to build TX)
- Create: `app/routes/api/tx-register.ts` (resource route: POST to register TX)
- Create: `app/routes/api/tx-stream.ts` (resource route: SSE stream for TX status)
- Create: `app/config/transaction-ui.ts` (TX type → endpoint mapping + UI strings)
- Create: `app/components/tx/transaction-button.tsx` (button with TX lifecycle states)
- Create: `app/components/tx/tx-status.tsx` (progress indicator during TX)
- Create: `app/lib/assignment-status.ts` (status normalizer: API values → canonical frontend values)
- Modify: `app/routes.ts` (add TX resource routes)
- Test: `app/__tests__/tx-store.test.ts`, `app/__tests__/assignment-status.test.ts`

**Approach:**
- **TX state split**: React local state (`useState`) in the `useTransaction` hook for synchronous execution flow (IDLE → BUILDING → SIGNING → SUBMITTING → SUCCESS/ERROR). Zustand store only for post-submission SSE watching that must survive navigation. 30s timeout on confirmed state to prevent infinite spinners. Human-readable error messages. Simplified watcher (no subscriber-aware toasting — overkill for 4 TX types).
- `useTransaction` hook: orchestrates the flow — calls `/api/tx/build` action → receives unsigned CBOR → `wallet.signTx()` → `wallet.submitTx()` → calls `/api/tx/register` action → hands off to Zustand store for SSE monitoring. Returns `{ execute, state, result, error, reset }`. **JWT check is per-TX-type**: access token mint (`GLOBAL_GENERAL_ACCESS_TOKEN_MINT`) does not require JWT. Other TX types check JWT and re-auth if expired.
- On TX success, `invalidateQueries` is called for the relevant React Query keys (commitment status, credentials list) to refresh displayed data.
- Resource routes: `tx-build.ts` action: receives TX type + params, calls the appropriate Andamio TX endpoint (looked up via `transaction-ui.ts` mapping), returns unsigned CBOR. `tx-register.ts` action: receives txHash + tx_type, calls `POST /tx/register`. `tx-stream.ts` loader: returns `new Response(upstreamResponse.body, { headers })` — a raw piped SSE stream, NOT RR7's `data()` helper. This preserves the event stream.
- TX types for this app: `GLOBAL_GENERAL_ACCESS_TOKEN_MINT`, `COURSE_STUDENT_ASSIGNMENT_COMMIT`, `COURSE_STUDENT_ASSIGNMENT_UPDATE`, `COURSE_STUDENT_CREDENTIAL_CLAIM`.
- Assignment status normalizer: maps raw API status strings to canonical values. Handles V1/V2 format differences defensively.
- TransactionButton component: renders different states (idle, building, signing, submitting, confirming, success, error) with appropriate UI and messaging.

**Patterns to follow:**
- `andamio-app-v2:/src/hooks/tx/use-transaction.ts` for hook structure
- `andamio-app-v2:/src/stores/tx-watcher-store.ts` for Zustand TX state
- `andamio-app-v2:/src/config/transaction-ui.ts` for TX type mapping
- `andamio-app-v2:/src/lib/assignment-status.ts` for status normalization
- Learnings: tx-confirmed-timeout-store-bridge.md, tx-confirmed-state-timeout-and-error-recovery.md

**Test scenarios:**
- Happy path: useTransaction local state transitions IDLE → BUILDING → SIGNING → SUBMITTING → SUCCESS, then hands off to Zustand store for SSE watching
- Error path: wallet.signTx rejected by user → local state transitions to ERROR with "User declined" message
- Error path: build endpoint returns 400 (invalid params) → local state transitions to ERROR with API error
- Error path: submit succeeds but SSE stream disconnects → Zustand store's 30s timeout fires → polling fallback checks final status
- Edge case: user navigates away during SSE watching → Zustand store persists (timer survives unmount)
- Happy path: GLOBAL_GENERAL_ACCESS_TOKEN_MINT TX executes without JWT (first-time user has no JWT yet)
- Happy path: COURSE_STUDENT_ASSIGNMENT_COMMIT TX checks JWT, blocks if expired
- Happy path: assignment status normalizer maps "pending_approval" to PENDING_APPROVAL canonical value
- Edge case: assignment status normalizer handles unknown status string gracefully (returns raw value)
- Happy path: tx-build resource route calls correct Andamio endpoint based on TX type
- Happy path: tx-register resource route forwards txHash and receives confirmation

**Verification:**
- TransactionButton shows correct state progression during a mock TX flow
- TX state persists in Zustand store across route navigations
- SSE stream resource route proxies events from Andamio API
- Status normalizer handles all known Andamio API status values

---

- [ ] **Unit 5: Assignment Submission & Enrollment**

**Goal:** Build the assignment interaction UI: evidence submission form, enrollment flow (commit TX), evidence update, and status display. Wire up the TX infrastructure from Unit 4 with course-specific flows.

**Requirements:** R4, R9, R10, R11

**Dependencies:** Units 2 (assignment page shell), 3 (auth), 4 (TX infrastructure)

**Files:**
- Create: `app/hooks/api/course/use-assignment-commitment.ts` (student commitment status + mutations)
- Create: `app/components/assignment/evidence-form.tsx` (textarea + URL input)
- Create: `app/components/assignment/commitment-status.tsx` (status display per state)
- Create: `app/components/assignment/enrollment-flow.tsx` (enroll → commit TX orchestration)
- Modify: `app/routes/assignment-page.tsx` (wire up submission UI for authenticated users)
- Test: `app/__tests__/evidence-form.test.ts`

**Approach:**
- `use-assignment-commitment.ts`: fetches student's commitment status for a module via `POST /course/student/assignment-commitment/get`. Returns current status, evidence, assessment outcome. Query key includes courseId + moduleCode.
- Evidence form: textarea for notes/description + repeatable URL input field (add/remove URLs). Submitted as JSON object with `notes` and `urls` fields.
- Assignment page states based on auth + commitment status:
  - **Unauthenticated**: shows assignment prompt only, "Connect wallet to submit" CTA
  - **Authenticated, NOT_STARTED**: shows assignment prompt + evidence form + "Enroll & Submit" button (triggers commit TX)
  - **Authenticated, IN_PROGRESS**: shows evidence form pre-filled + "Update Submission" button (triggers update TX)
  - **Authenticated, PENDING_APPROVAL**: shows submitted evidence (read-only) + "Awaiting teacher review" status
  - **Authenticated, ACCEPTED**: shows "Assignment accepted" + link to dashboard for credential claim
  - **Authenticated, DENIED**: shows feedback (if available) + evidence form for resubmission
  - **Authenticated, CREDENTIAL_CLAIMED**: shows "Credential earned" badge
- Enrollment flow: evidence form submit → `POST /api/v2/course/student/assignment-commitment/create` (save to DB) → `useTransaction.execute({ txType: COURSE_STUDENT_ASSIGNMENT_COMMIT, params: { alias, course_id, slt_hash, assignment_info } })` → TX lifecycle runs → commitment created on-chain.
- Update flow: evidence form submit → `POST /api/v2/course/student/assignment-commitment/update-evidence` → TX update if needed.

**Patterns to follow:**
- `andamio-app-v2:/src/hooks/api/course/use-assignment-commitment.ts` for commitment hook
- `cardano-xp:/src/hooks/api/course/use-course-content.ts` for content hook patterns
- Learnings: commitment-status-normalization-api-change.md for status normalization

**Test scenarios:**
- Happy path: unauthenticated user sees assignment prompt with "connect wallet" CTA, no form
- Happy path: authenticated user with NOT_STARTED status sees evidence form and enroll button
- Happy path: user submits evidence → commit TX executes → status transitions to IN_PROGRESS
- Happy path: user with IN_PROGRESS status sees pre-filled form and "Update" button
- Happy path: user with DENIED status sees feedback text and can edit/resubmit evidence
- Edge case: evidence form validates that at least notes or one URL is provided before submission
- Error path: commitment create API call fails → error message shown, form state preserved
- Integration: enrollment flow calls commitment/create API then triggers TX, both complete successfully

**Verification:**
- Assignment page renders different UI states based on commitment status
- Evidence form captures text + URLs and submits correctly
- Enrollment TX flow executes end-to-end (build → sign → submit → register → confirm)
- Status updates reflect in UI after TX confirmation

---

- [ ] **Unit 6: Dashboard & Progress Tracking**

**Goal:** Build the learner dashboard showing enrollment status across all 6 modules, earned credentials, and the credential claim action.

**Requirements:** R11, R12, R13

**Dependencies:** Units 3 (auth), 4 (TX for credential claim), 5 (commitment status patterns)

**Files:**
- Create: `app/hooks/api/use-dashboard.ts` (aggregate commitments + credentials)
- Create: `app/routes/dashboard.tsx` (dashboard page with auth gate)
- Create: `app/components/dashboard/module-progress.tsx` (per-module status card)
- Create: `app/components/dashboard/credentials-list.tsx` (earned credentials display)
- Create: `app/components/dashboard/claim-credential.tsx` (claim button + TX flow)
- Modify: `app/components/layout/nav.tsx` (add dashboard link for authenticated users)
- Test: `app/__tests__/module-progress.test.ts`

**Approach:**
- Dashboard route loader (server-side): fetches modules list (public) only. Student commitments and credentials are fetched client-side via React Query hooks (use-assignment-commitment.ts, use-dashboard.ts) which pass the JWT from auth context. This is consistent with the data loading strategy: loaders for public data, React Query for authenticated queries.
- Module progress card: shows module title, current status (badge), and link to assignment page. Status colors mapped from canonical assignment statuses.
- Credential claim: when ALL 6 modules have ASSIGNMENT_ACCEPTED status, show "Claim Course Credential" button. Triggers `COURSE_STUDENT_CREDENTIAL_CLAIM` TX. After TX confirms, credential appears in credentials list.
- Dashboard is auth-gated: unauthenticated users see "Connect wallet to view progress" prompt.
- `use-dashboard.ts` hook: combines commitments list and credentials list. Computes `allModulesAccepted` boolean for claim eligibility.

**Patterns to follow:**
- `cardano-xp:/src/hooks/api/use-dashboard.ts` for dashboard aggregation pattern
- `cardano-xp:/src/components/dashboard/` for dashboard component structure

**Test scenarios:**
- Happy path: dashboard shows 6 module cards with correct status per module
- Happy path: all modules accepted → "Claim Credential" button appears
- Happy path: claim TX executes → credential appears in earned credentials list
- Edge case: 5 of 6 modules accepted → claim button disabled with "Complete all modules" message
- Edge case: user with no enrollments → all modules show NOT_STARTED
- Error path: commitments API call fails → error state with retry option
- Happy path: unauthenticated user on /dashboard sees auth prompt, not module data

**Verification:**
- Dashboard shows accurate status for each module based on API data
- Credential claim button appears only when all modules are accepted
- Credential claim TX executes and reflects in UI
- Navigation includes dashboard link only for authenticated users

## System-Wide Impact

- **Interaction graph:** Auth context → consumed by nav (wallet button), auth-gate, assignment pages, dashboard. TX store (Zustand, post-submission only) → consumed by useTransaction hook → used by enrollment flow, credential claim flow, registration flow. Query client → shared across all data hooks. Loaders → serve public content pages. React Query → serves authenticated queries + cache invalidation.
- **Error propagation:** API errors from gateway proxy surface as GatewayError with status codes → hooks map to user-friendly messages → components display. TX errors → useTransaction hook local state → component state. Wallet errors → withTimeout wrapper → auth context → UI feedback. **Loader failures** (API down during SSR) → RR7 ErrorBoundary at layout level → user-friendly error page with retry.
- **State lifecycle risks:** JWT expiry during a multi-step TX flow — auth context should block TX initiation if JWT is expired, re-auth first. **Exception: access token mint TX must work without JWT** (the user doesn't have one yet). The useTransaction hook checks JWT requirement per-TX-type, not as a blanket gate. Zustand TX watcher handles browser tab close by fetching current status from API on return, not preserving stale pending state.
- **Cache invalidation after TX:** TX resource routes don't trigger RR7 loader revalidation (they're not page actions). After TX success, `useTransaction.onSuccess` calls React Query `invalidateQueries` with the relevant query keys (commitment status, credentials list) to refresh displayed data.
- **SSE stream proxy:** The tx-stream resource route must return `new Response(upstreamResponse.body, { headers })` — a raw piped response, not RR7's `data()` helper. This preserves the SSE event stream.
- **Content route revalidation:** Public course content (modules, lessons) is static for the session lifetime. Content route loaders should export `shouldRevalidate` returning `false` to prevent re-fetching on back-navigation. Authenticated routes (dashboard, assignment status) always revalidate.
- **QueryClient SSR safety:** QueryClient must be created per-request on the server (no singleton) and as a singleton on the client, to prevent cross-request data leakage.
- **API surface parity:** Server gateway (in loaders) and client gateway (via proxy) share transform functions to ensure data shape consistency.
- **Integration coverage:** Gateway proxy → Andamio API (end-to-end with preprod). TX lifecycle → wallet → blockchain → gateway confirmation. Auth flow → wallet signing → API validation.
- **Unchanged invariants:** The Andamio API contract is consumed read-only. This app does not modify API behavior, create new endpoints, or affect other Andamio apps.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Mesh SDK v2 beta may have breaking changes | Pin exact versions in package.json. `.client.tsx` isolates WASM from SSR. Test wallet connect early (Unit 3). |
| Andamio Preprod API may be unavailable or return unexpected shapes | Server-side retry for 5xx. Zod validation (soft mode initially). Graceful error states in UI. |
| React Router v7 is new territory for Andamio — no existing patterns | Thorough RR7 docs research completed. Core patterns (loaders, resource routes, .client convention) are well-documented and stable. |
| Course content not yet imported to Preprod API | App can be tested structurally with empty/error states. James provides course_id when content is ready. |
| On-chain TX confirmation times (20-90s on Cardano) | TX status UI with progress states. SSE stream for real-time updates. 30s timeout fallback to polling. |
| Access token mint adds significant first-time user friction | Clear UX explaining why it's needed. The registration flow is a one-time step. Preprod faucet for test ADA. |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-03-29-midnight-pbl-site-requirements.md](docs/brainstorms/2026-03-29-midnight-pbl-site-requirements.md)
- **React Router v7 docs:** reactrouter.com — route modules, loaders, resource routes, .client convention
- **Andamio gateway pattern:** `cardano-xp:/src/lib/gateway.ts`, `gateway-server.ts`, `app/api/gateway/[...path]/route.ts`
- **Auth flow:** `cardano-xp:/src/lib/andamio-auth.ts`, `contexts/andamio-auth-context.tsx`
- **TX system:** `andamio-app-v2:/src/hooks/tx/use-transaction.ts`, `stores/tx-watcher-store.ts`
- **Access token mint:** `andamio-app-v2:/src/components/landing/registration-flow.tsx`
- **Learnings:** `andamio-app-v2:/docs/solutions/runtime-errors/meshsdk-libsodium-wasm-ssr-init.md`, `cip30-wallet-api-race-condition-first-login-hang.md`, `tx-confirmed-timeout-store-bridge.md`
- **Midnight brand:** midnight.network, docs.midnight.network CSS custom properties
