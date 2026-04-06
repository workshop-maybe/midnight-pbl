# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Three Uses for This Repo

1. **Deployed app** — Source code for midnight-pbl.io. Astro 6 hybrid app serving the course via Andamio API.
2. **Agent-consumable course** — Clone the repo, run `/learn` in Claude Code, take the course interactively with an AI instructor and assessor. No web app needed.
3. **Open-source template** — Fork this repo as an example of Andamio tooling for building your own course app with agentic learning support.

## Learning Mode

The `/learn` skill orchestrates an interactive course experience. Two sub-agents handle delivery:

- **Instructor** (`.claude/agents/instructor.md`) — Delivers lessons conversationally, guides exercises, adapts to learner level. Reads from `content/midnight-for-cardano-devs/lessons/`.
- **Assessor** (`.claude/agents/assessor.md`) — Evaluates module assignments against SLT rubrics in `content/midnight-for-cardano-devs/assignments/`.

All course content lives in `content/midnight-for-cardano-devs/` — single source of truth for both the web app (via `andamio course import-all`) and the agent harness.

Course metadata: `content/midnight-for-cardano-devs/00-course.md`
SLT definitions: `content/midnight-for-cardano-devs/01-slts.md`
Progress tracking: `progress.json` (created on first `/learn` run)

Skills:
- `.claude/skills/learn/SKILL.md` — Course orchestrator (routes to instructor or assessor)
- `.claude/skills/deliver-lesson/SKILL.md` — Pedagogy guide for the instructor
- `.claude/skills/assess-assignment/SKILL.md` — Assessment guide for the assessor

## Content Management

`content/midnight-for-cardano-devs/` is the source of truth. `compiled/` is the build artifact for Andamio API import.

```
content/midnight-for-cardano-devs/
  00-course.md                       # Course metadata
  01-slts.md                         # Student Learning Targets (canonical)
  lessons/module-{101-106}/          # Lesson markdown (SLT-numbered filenames)
  assignments/m{101-106}-assignment.md  # Assignment rubrics

compiled/midnight-for-cardano-devs/  # Import artifact — don't edit directly
  {101-106}/outline.md, lesson-{N}.md
```

Content update workflow:
```bash
andamio course import-all compiled/midnight-for-cardano-devs --course-id 5f74e419a291825c637626c196b40a7aa63313cad6e69916cfdec9e5
npm run build   # prerendered pages pull fresh content at build time
```

Course ID (preprod): `5f74e419a291825c637626c196b40a7aa63313cad6e69916cfdec9e5`

## Autonomous Session Guardrails

When running with `--dangerously-skip-permissions`:

### Allowed
- Write to any file in this project directory
- Read from any directory under `~/projects/`
- Git: all commands except `push` — James reviews and pushes
- GitHub CLI: read operations, create PRs and branches
- Package management: project-level only (no global installs)
- Build/test/lint commands

### Forbidden
- `git push` — never push to any remote
- `gh pr merge`, `gh pr review --approve`
- Writing files outside this project directory
- Accessing `.env` files from other projects
- `rm -rf` on directories, deleting `.git/`, `.claude/`, `.github/`

## Cross-Repo Reference

Read from any Andamio repo for context. Never write to them.

| Alias | Path | Use for |
|-------|------|---------|
| `api` | `~/projects/01-projects/andamio-api/` | API endpoints, handlers |
| `app` | `~/projects/01-projects/andamio-platform/andamio-app-v2/` | UI patterns, components |
| `template` | `~/projects/01-projects/andamio-app-template/` | Starter patterns |
| `docs` | `~/projects/01-projects/andamio-docs/` | Protocol docs |
| `txapi` | `~/projects/01-projects/andamio-atlas-api-v2/` | Transaction building |
| `cli` | `~/projects/01-projects/andamio-cli/` | CLI commands, tx patterns |
| `core` | `~/projects/01-projects/andamio-core/` | On-chain validators |
| `xp` | `~/projects/01-projects/cardano-xp/` | Reference implementation |

## Commands

```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build (prerendered pages fetch from Andamio API)
npm run preview      # Preview production build locally
npm run start        # Run built server: node --env-file=.env ./dist/server/entry.mjs
npm run typecheck    # astro check && tsc --noEmit
```

No test runner is configured. Validate changes with `npm run typecheck` and `npm run build`.

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
