# 2026-04-01 — Astro Rewrite + Prerendering

## What was built

Rewrote the entire app from React Router v7 + Vite to Astro 6 with React islands. Then added build-time prerendering for content pages.

## Why

Two problems with the React Router stack:

1. **Polyfill conflict**: `vite-plugin-node-polyfills` injects a browser `process` shim into the SSR server bundle, shadowing Node's `process.env`. This broke Cloud Run deployments. Required a custom Vite plugin (`ssrStripProcessPolyfill`) to work around it. The workaround was fragile.

2. **Performance**: The client bundle was 14.8MB because Mesh SDK and its transitive dependencies were bundled even though most pages don't need wallet functionality. The `.client.tsx` convention prevents server-side *execution* but not server-side *resolution* of the import graph.

## Architecture decisions

### Astro islands replace React Context

Astro islands are independently hydrated React roots — they don't share a React context tree. The auth state that lived in `AuthProvider` (React Context) was replaced with a vanilla Zustand store (`src/stores/auth-store.ts`). Same pattern as the existing `tx-store.ts`. One `WalletController` island in the nav owns `MeshProvider` and writes auth state to the store. Other islands read from it.

### Prerendering for content pages

Content pages (homepage, 18 lesson pages, module redirects) are prerendered at build time using `export const prerender = true` + `getStaticPaths()`. Response times dropped from 1-3 seconds (SSR + API fetch to preprod) to ~2ms (static file serve).

Pages that need authenticated data (assignment pages, dashboard, API proxy endpoints) stay SSR.

Tradeoff: content updates via andamio-cli require a rebuild + redeploy. This is acceptable because content imports are intentional manual actions, not continuous updates.

### Polyfill issue persists in Astro

The `vite-plugin-node-polyfills` process shim issue reappeared in Astro — the plugin doesn't distinguish client vs server builds. Fixed with `exclude: ["process"]` and `globals: { process: false }` in the plugin config. Simpler than the React Router workaround but same root cause.

### Server-side markdown rendering

Replaced client-side `react-markdown` + `remark-gfm` + `rehype-highlight` with server-side `marked` + `highlight.js`. Content pages ship zero JavaScript for markdown rendering. Added HTML sanitization (XSS prevention) to the rendered output.

## Key files

| Concern | File |
|---------|------|
| Astro config | `astro.config.mjs` |
| Auth store | `src/stores/auth-store.ts` |
| Wallet island | `src/components/auth/WalletController.tsx` |
| Server API client | `src/lib/gateway.server.ts` |
| Markdown renderer | `src/lib/markdown.ts` |
| API proxy | `src/pages/api/gateway/[...path].ts` |
| Lesson page (prerendered) | `src/pages/learn/[moduleCode]/[lessonIndex].astro` |
| Assignment page (SSR) | `src/pages/learn/[moduleCode]/assignment.astro` |

## Security fixes applied during review

- HTML sanitization on markdown output (strip scripts, event handlers, javascript: URLs)
- Path allowlist on API proxy (restrict to known API prefixes)
- txType validation on TX register endpoint
- Link href protocol validation (http/https/mailto only)
- Concurrent execution guard on useTransaction hook

## Performance results

| Page | Before (SSR) | After (prerendered) |
|------|-------------|-------------------|
| Homepage | ~1-2s | 9ms |
| Lesson page | ~1-3s | 1-2ms |
| Assignment page | ~1-3s | SSR (unchanged) |

## What's next

- CI/CD pipeline with GitHub Actions for automated build + deploy
- Content update workflow: andamio-cli import -> rebuild -> deploy
- Evaluate code-splitting the 14.8MB Mesh SDK chunk
- View Transitions for smoother navigation between prerendered pages
