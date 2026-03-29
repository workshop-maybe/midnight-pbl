# Unit 3: Wallet Connection & Authentication

**Date:** 2026-03-29

## What was built

Implemented CIP-30 wallet connection and Andamio auth flow for the Midnight PBL site using Mesh SDK v2 and React Router v7's `.client.tsx` convention.

### Files created

- `app/types/auth.ts` — Server-importable type definitions (AuthUser, AuthState, AuthContextValue, API response types). Zero Mesh SDK imports.
- `app/lib/andamio-auth.ts` — Auth service: buildSession, validateSignature, JWT storage/expiry helpers. Uses gateway proxy for API calls. No Mesh imports.
- `app/lib/wallet-address.ts` — bech32 address utility with v2/v1 fallback. Lazy `import("@meshsdk/core")` for hex conversion.
- `app/lib/access-token-utils.ts` — UTXO scanning for access tokens, alias extraction, unit building.
- `app/components/providers/mesh-provider.client.tsx` — Thin MeshProvider wrapper (.client.tsx).
- `app/contexts/auth-context.client.tsx` — Full auth context: auto-detect token, nonce-sign-validate flow, JWT persistence, 10s wallet polling, NEEDS_REGISTRATION state.
- `app/components/auth/connect-wallet.client.tsx` — CardanoWallet button with auth state display.
- `app/components/auth/registration-flow.client.tsx` — Alias input + mint button UI shell (TX placeholder for Unit 4).
- `app/components/auth/auth-gate.tsx` — Non-client gate component that renders children only when authenticated.
- `app/env.d.ts` — Vite ImportMetaEnv type declaration for VITE_ACCESS_TOKEN_POLICY_ID.

### Files modified

- `app/routes/app-layout.tsx` — Wraps Outlet with lazy-loaded MeshProvider > AuthProvider chain. SSR-safe via typeof window check + Suspense fallback.
- `app/components/layout/nav.tsx` — Replaced wallet placeholder with lazy-loaded ConnectWallet component.
- `app/config/midnight.ts` — Added ACCESS_TOKEN_POLICY_ID to PublicEnv interface.
- `app/root.tsx` — Added ACCESS_TOKEN_POLICY_ID to root loader public env.
- `.env.example` — Added VITE_ACCESS_TOKEN_POLICY_ID.
- `vite.config.ts` — Added vite-plugin-node-polyfills for crypto/stream/buffer (Mesh SDK transitive deps).

### Dependencies added

- `@meshsdk/react@2.0.0-beta.2`
- `@meshsdk/core@^1.9.0-beta.101`
- `vite-plugin-node-polyfills@0.25.0`

## Key decisions

1. **`.client.tsx` over dynamic import()** — RR7 excludes `.client.tsx` from the server bundle at build time. Cleaner than runtime React.lazy workarounds. The server build confirms: each .client.tsx file is a 0.06KB empty stub.

2. **React.lazy in app-layout and nav** — Even though .client.tsx files aren't in the server bundle, they need to be lazily imported from non-.client files. React.lazy + Suspense handles the async boundary. During SSR, `typeof window === "undefined"` renders children without providers.

3. **Auth types in separate file** — `types/auth.ts` has zero Mesh SDK imports, making it safe to import from server-side loaders, actions, and non-client components.

4. **vite-plugin-node-polyfills** — Mesh SDK's transitive dependency chain (@utxos/sdk -> @meshsdk/core-cst) imports Node crypto.pbkdf2Sync. Without polyfills, the Vite client build fails. This plugin provides browser-compatible stubs.

5. **VITE_ prefix for policy ID** — Vite only exposes env vars with the VITE_ prefix to the client bundle. Using `import.meta.env.VITE_ACCESS_TOKEN_POLICY_ID` in the auth context.

6. **Registration flow as UI shell** — The actual mint TX is deferred to Unit 4. The UI, state management, and retry flow are complete. The `handleMint` function has a clear TODO with the expected Unit 4 integration pattern.

## What was learned

- Mesh SDK v2's `getBalance()` returns a raw string (CBOR), not the structured array. Use `getBalanceMesh()` for the `{ unit, quantity }[]` format.
- The 14MB client chunk from Mesh SDK WASM is expected — it's lazily loaded and only needed when the wallet connects. Code splitting via the .client.tsx boundary means non-wallet pages never load it.
- React Router v7 server builds correctly stub .client.tsx files as empty modules, preventing any SSR crashes from WASM initialization.
