---
date: 2026-03-29
topic: midnight-pbl-site
---

# Midnight PBL Site

## Problem Frame

Andamio needs a single-course learning app for "Midnight: From Aiken to Compact" — a 6-module, 18-lesson PBL course teaching Cardano developers to build privacy-focused applications on Midnight. Existing Andamio apps are all Next.js. This project delivers the course and explores a different framework (React Router v7) to expand Andamio's template library for single-course deployments.

## Requirements

**Course Content Delivery**
- R1. Display course overview with all 6 modules and their descriptions
- R2. Each module page shows its introduction, Student Learning Targets (SLTs), and lessons
- R3. Individual lesson pages render lesson content (markdown) fetched from Andamio API
- R4. Assignment page per module shows the assignment prompt and submission interface

**Wallet Connection & Authentication**
- R5. Users connect a Cardano CIP-30 wallet via Mesh SDK
- R6. Wallet connection triggers Andamio auth flow (session nonce, sign, validate, JWT)
- R7. Authenticated state persists across navigation (JWT in localStorage, auto-refresh)
- R8. Unauthenticated users can browse course content; wallet required only for enrollment and assignments

**Learner Workflow**
- R9. Authenticated users can enroll in a module (commit to assignment via API)
- R10. Enrolled users can submit assignment evidence (text/URLs) and update submissions
- R11. Users can view their enrollment status and submission history per module
- R12. Users can claim credentials after teacher approval (on-chain transaction)

**Progress & Dashboard**
- R13. A learner dashboard shows enrollment status across all modules and earned credentials

**API Integration**
- R14. All Andamio API calls proxy through server-side loaders/actions (X-API-Key never exposed to client)
- R15. Single course_id configured via environment variable (not URL parameter)
- R16. Targets Andamio Preprod environment (preprod.api.andamio.io)

**Branding & Design**
- R17. Dark-mode-first design using Midnight's brand palette (deep navy backgrounds, blue-to-violet accents, glassmorphic cards)
- R18. Typography: Outfit (headings), Urbanist (body), Geist Mono (code blocks)
- R19. Responsive layout — functional on mobile, polished on desktop

## Success Criteria

- A learner can browse all 6 modules and 18 lessons without connecting a wallet
- A learner can connect a Cardano preprod wallet, enroll in a module, and submit assignment evidence
- The app runs against Andamio Preprod API with a valid course_id
- The site visually reflects Midnight's brand identity, not generic Andamio or default styling
- The codebase is clean enough to serve as a starting point for future single-course apps

## Scope Boundaries

- No teacher/admin views — grading happens via andamio-cli or the main Andamio app
- No project/task workflows — this app handles courses only
- No content editing or studio features
- No image upload or file attachment for assignments (text/URL evidence only)
- No social wallet (UTXOS/Web3 SDK) — CIP-30 browser wallets only for Phase 1
- No light mode — dark-mode only, matching Midnight's brand presence
- Content management via andamio-cli is Phase 2 (out of scope here)

## Key Decisions

- **React Router v7 (framework mode)**: Server loaders proxy API calls (keeps X-API-Key server-side), nested routing maps to course > module > lesson hierarchy, full React means Mesh SDK works without island-architecture friction. Genuinely different from Next.js reference implementations.
- **Learner-only scope**: Keeps the app focused and the codebase clean for template extraction. Teachers use existing tools.
- **Dark-mode only**: Midnight's brand is dark-mode-first. Supporting light mode adds complexity with no brand alignment benefit.
- **CIP-30 wallets only**: Social wallet (UTXOS SDK) adds significant complexity. Browser wallets are sufficient for a developer-focused PBL course about blockchain development.

## Dependencies / Assumptions

- Andamio Preprod API is available and the course endpoints work as documented
- James will provide a valid course_id after the course content is imported to Andamio Preprod
- Mesh SDK (@meshsdk/react) works with React Router v7 (React hooks, no Next.js-specific dependencies)
- Course content (lessons, assignments) is already imported to the API by the time the app is tested end-to-end

## Outstanding Questions

### Resolve Before Planning

(none)

### Deferred to Planning

- [Affects R5][Needs research] Verify Mesh SDK v2 compatibility with React Router v7 — may need specific SSR/hydration configuration
- [Affects R9, R12][Technical] Map the exact transaction flow for enrollment (commit) and credential claiming — determine which tx endpoints to call and what UI states to handle
- [Affects R14][Technical] Decide whether to use a single catch-all proxy route (like Next.js gateway pattern) or individual loader/action functions per API call

## Next Steps

-> /ce:plan for structured implementation planning
