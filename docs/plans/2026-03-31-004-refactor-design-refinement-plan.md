---
title: "refactor: Design refinement — kill rounded corners, vertical course list, landing page"
type: refactor
status: active
date: 2026-03-31
---

# Design Refinement — Phase 2

## Overview

Three changes to continue the content-first design direction:
1. Remove rounded corners everywhere — they're a hallmark of AI-generated Tailwind sites
2. Replace the 3x2 card grid on course overview with a single vertical module list
3. Add a proper landing page with Midnight logo and clear value proposition

## Problem Frame

The charcoal palette landed in the previous pass, but the layout still carries AI slop patterns: `rounded-xl` on every surface, a card grid that prioritizes visual symmetry over readability, and a landing page that's just a title + button. Content-first means the content itself should drive the layout — a course outline reads better as a vertical list than a grid of boxes.

## Requirements Trace

- R1. Remove all decorative rounded corners (`rounded-xl`, `rounded-2xl`, `rounded-lg`) — use `rounded-sm` (2-4px) only where functional (inputs, badges, small interactive elements)
- R2. Course overview: replace 3x2 card grid with a vertical numbered list showing module title, description, and lesson count
- R3. Landing page: add a Midnight wordmark/logo, a clear course description, and the course outline inline (no separate page needed for 6 modules)
- R4. Preserve all existing functionality, responsive behavior, and touch targets

## Scope Boundaries

- No color changes (charcoal palette stays)
- No font changes
- No layout changes to the learn sidebar or lesson pages (those already work)
- No component API changes

## Key Technical Decisions

- **Reduce all border-radius to near-zero, not literally zero**: `rounded-sm` (4px in the current theme, will change to 2px) gives a subtle softness without looking like a template. Inputs and badges keep small rounding for usability. Cards, containers, and sections go to 0 or 2px.

- **Vertical list, not accordion**: The course overview should show all modules in a simple vertical stack. No expand/collapse — there are only 6 modules, each with 3 lessons. Show everything.

- **Landing page becomes the course overview**: Merge the landing content into the course overview page. The `/about` route stays as a simple redirect. The home page (`/`) shows: Midnight logo → course title → description → vertical module list → CTA. No separate "landing" and "overview" pages.

- **SVG wordmark for Midnight**: Create a simple SVG text wordmark using the Outfit font (already loaded). No external logo file needed — an inline SVG or styled text element is cleaner and loads instantly.

## Implementation Units

- [ ] **Unit 1: Flatten border-radius tokens and sweep rounded classes**

**Goal:** Remove rounded-xl/lg/2xl from all components. Reduce radius tokens.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `app/styles/globals.css` (radius tokens + all border-radius in custom CSS)
- Modify: `app/components/ui/card.tsx`
- Modify: `app/components/ui/button.tsx`
- Modify: `app/components/ui/badge.tsx`
- Modify: `app/components/ui/skeleton.tsx`
- Modify: All component files with `rounded-xl`, `rounded-lg`, `rounded-2xl`, `rounded-md`

**Approach:**
- Change radius tokens: `--radius-xl: 2px`, `--radius-lg: 2px`, `--radius-md: 2px`, `--radius-sm: 2px`
- Replace `rounded-xl` with `rounded-sm` on cards, containers, error boundaries
- Replace `rounded-2xl` with `rounded-sm`
- Replace `rounded-lg` with `rounded-sm` on buttons, inputs, nav elements
- Keep `rounded-md` on badges (small elements benefit from slight rounding)
- Keep `rounded-full` on pills/avatars (functional, not decorative)
- Update `.prose-midnight pre` border-radius from 12px to 2px
- Update `.learn-sidebar-toggle` — keep `rounded-full` (it's a FAB)

**Verification:**
- `grep -rn "rounded-xl\|rounded-2xl\|rounded-lg" app/` returns zero outside of `rounded-full` and intentional pills

---

- [ ] **Unit 2: Replace course overview grid with vertical list**

**Goal:** Show modules as a clean vertical numbered list instead of a 3x2 card grid.

**Requirements:** R2

**Dependencies:** Unit 1

**Files:**
- Modify: `app/routes/course-overview.tsx`
- Modify: `app/components/course/module-card.tsx` (simplify or replace with inline list item)

**Approach:**
- Remove the `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` wrapper
- Replace with a `space-y-0 divide-y divide-midnight-border` vertical list
- Each module is a row: module number (left), title + description + lesson count (right), the whole row is a link
- No Card component needed — just a simple div with padding and a bottom border
- Keep the hover state as a subtle background change, not a glow
- The `ModuleCard` component can be simplified to a `ModuleRow` or the list can be inlined in the overview

**Verification:**
- Course overview shows a single-column list of modules, not a grid

---

- [ ] **Unit 3: Redesign landing page with logo and course outline**

**Goal:** Create a proper landing page with Midnight wordmark, course description, and inline course outline.

**Requirements:** R3

**Dependencies:** Unit 2

**Files:**
- Modify: `app/routes/landing.tsx`
- Modify: `app/routes/course-overview.tsx` (may merge content)

**Approach:**
- The landing page (`/about`) shows: Midnight wordmark at top (styled text in Outfit font, not an image), "From Aiken to Compact" subtitle, course description paragraph, then the full module list (reuse the vertical list from Unit 2 or link to it)
- Keep it simple — no hero sections, no gradient backdrops, no feature cards
- The Midnight "logo" is just the word "midnight" in Outfit 700 weight, tracked out slightly, with a subtle amber accent on the dot or a period. This is intentionally minimal.
- CTA button at bottom: "Start Learning" linking to `/`

**Verification:**
- Landing page shows wordmark, description, and course content in a clean vertical flow
- No decorative elements, no card grids, no gradient effects

---

- [ ] **Unit 4: Final sweep**

**Goal:** Verify no rounded corners remain, build passes, visual consistency.

**Requirements:** R1, R4

**Dependencies:** Units 1-3

**Files:**
- Any remaining files with old radius values

**Approach:**
- Grep for `rounded-xl`, `rounded-2xl`, `rounded-lg` — fix any stragglers
- Verify build passes
- Check that all border-radius in globals.css custom classes are 2px or less

**Verification:**
- Clean grep
- Clean build

## Sources & References

- Previous design overhaul: `docs/plans/2026-03-31-002-refactor-charcoal-design-overhaul-plan.md`
- Anti-slop pass commit: `21878df`
- Current globals.css border-radius tokens: lines 42-45
- Current course overview grid: `app/routes/course-overview.tsx`
- Current landing page: `app/routes/landing.tsx`
