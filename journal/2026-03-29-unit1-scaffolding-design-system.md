# Unit 1: Project Scaffolding & Midnight Design System

**Date:** 2026-03-29
**Branch:** feature/unit1-scaffolding-design-system

## What was built

Scaffolded the Midnight PBL site using React Router v7 framework mode with Tailwind CSS v4, configured for the Midnight Network brand.

### Files created

**Configuration:**
- `app/env.server.ts` — Zod 4 validation for server env vars (ANDAMIO_API_KEY, ANDAMIO_GATEWAY_URL, CARDANO_NETWORK, COURSE_ID)
- `app/config/midnight.ts` — Single-course config (routes, title, description)
- `app/config/branding.ts` — Brand constants (colors, fonts, metadata, links)
- `.env.example` — Documented env var template

**Design system (Tailwind v4 @theme):**
- `app/styles/globals.css` — Full `--mn-*` custom property set + Tailwind v4 theme tokens for Midnight palette, fonts (Outfit/Urbanist/Geist Mono), border radii
- `app/components/ui/card.tsx` — Glassmorphic card (semi-transparent #0a0e19eb bg, #ffffff1a border, sky-blue glow hover, 20px radius)
- `app/components/ui/button.tsx` — Primary (blue-violet gradient), secondary (ghost), danger variants with loading spinner
- `app/components/ui/badge.tsx` — Status badges (success/warning/error/info/violet)
- `app/components/ui/skeleton.tsx` — Animated loading placeholders

**Layout:**
- `app/components/layout/app-shell.tsx` — Page wrapper (nav + content + footer)
- `app/components/layout/nav.tsx` — Sticky nav with course title + wallet button placeholder
- `app/components/layout/footer.tsx` — Minimal footer with Andamio/Midnight links

**Root & routes:**
- `app/root.tsx` — Root Layout, loader (public env vars), QueryClientProvider + Outlet, ErrorBoundary
- `app/routes.ts` — Initial route config (landing page only)
- `app/routes/landing.tsx` — Landing page with hero, CTA buttons, feature cards
- `app/components/error/error-boundary.tsx` — Styled error page with retry
- `app/components/providers/query-provider.tsx` — SSR-safe React Query provider (per-request server, singleton client)

## Key decisions

- **Tailwind v4 @theme block** instead of tailwind.config.ts — Tailwind v4 uses CSS-first configuration via `@theme` directives in CSS files. No separate config file needed.
- **Root loader exposes public env only** — ANDAMIO_API_KEY stays server-side. Gateway URL, network, and course ID are safe for the client.
- **QueryClientProvider in root, Mesh/Auth providers deferred to Unit 3** — keeps root SSR-safe. Browser-dependent providers go in the app-layout route.
- **Zod 4 compatibility** — The `safeParse` + `.issues` pattern works identically to Zod 3. The project installed Zod 4.3.6.

## Verification

- `npx tsc --noEmit` passes with zero errors
- `npm run dev` starts successfully on port 5173
- Landing page renders with Midnight dark theme, correct fonts, all content visible
- Custom Tailwind tokens (`bg-midnight`, `text-mn-text`, `font-heading`, `font-body`) resolve correctly
