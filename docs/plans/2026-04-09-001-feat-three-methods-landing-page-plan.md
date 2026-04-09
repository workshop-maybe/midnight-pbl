---
title: "feat: Tell the three delivery methods story on landing page and README"
type: feat
status: completed
date: 2026-04-09
---

# feat: Tell the three delivery methods story on landing page and README

## Overview

Add a prominent section to the landing page presenting the three ways to take this course (web, agent harness, fork as template). Update the README to lead with quick-start instructions for each method. The goal is to make the three-way model a visible product feature, not a buried implementation detail.

## Problem Frame

Midnight PBL is one of the first courses to implement a three-way delivery model: deployed web app, agent harness, and open-source template — all from a single content source. This is a differentiating story that visitors should encounter immediately. Currently the landing page has no mention of the three methods, and the README covers them but could lead with clearer quick-start instructions.

Ref: workshop-maybe/midnight-pbl#4

## Requirements Trace

- R1. Landing page has a visible section presenting all three delivery methods
- R2. Each method has a clear CTA that routes visitors to the right next step
- R3. README leads with the three methods and quick-start instructions for each
- R4. Framing connects to the broader thesis (single source of truth, same credentials)

## Scope Boundaries

- No new components or React islands — this is static Astro markup with Tailwind
- No changes to routing, API calls, or build configuration
- No new dependencies
- Visual treatment should match the existing charcoal design system, not introduce new patterns

## Context & Research

### Relevant Code and Patterns

- `src/pages/index.astro` — Current landing page. Prerendered, max-w-3xl container, Tailwind-only styling. Sections separated by `mb-12 sm:mb-16` spacing.
- `src/components/course/ModuleCard.astro` — Row component pattern: flex layout, muted meta text, group hover utilities, divider borders.
- `src/config/branding.ts` — Centralized strings and links. Any new copy could live here or inline.
- `src/styles/globals.css` — Design tokens: `mn-text`, `mn-text-muted`, `mn-primary` (amber), `midnight-border`, `midnight-surface`. Border radius is 2px (flat, not rounded).
- `README.md` — Already has "Three ways to use this repo" section with descriptions. Needs quick-start tightening per the issue.

### Design Tokens to Use

- Background: `bg-midnight-surface` (#1e1e20) for cards, `bg-midnight-card` (#252527) for hover
- Text: `text-mn-text` (main), `text-mn-text-muted` (secondary)
- Accent: `text-mn-primary` (amber #d4a053) for icons/highlights
- Border: `border-midnight-border` (#ffffff12)
- Radius: `rounded-sm` (2px)
- Min touch target: `min-h-[44px]`

## Key Technical Decisions

- **Three-column grid on desktop, stacked on mobile**: The issue suggests a three-column layout. A responsive CSS grid (`grid-cols-1 md:grid-cols-3`) fits the existing max-w-3xl container and degrades cleanly to stacked cards on mobile. Rationale: three methods are parallel choices, not sequential steps — a grid communicates equality.

- **Section placement: after course description, before module list**: The three methods answer "how do I take this course?" which is the natural next question after "what is this course?" Placing it before the module list keeps the visitor flow logical: what → how → what's inside.

- **No new Astro component file**: The section is only used on the landing page. Extracting a component would add a file with no reuse benefit. If the template-fork use case later needs the same section, extract then.

- **README: tighten quick-starts, keep existing structure**: The README already has the right section. Add concrete commands (git clone, npm install) and the midnight-pbl.io URL more prominently. Don't restructure what's already working.

## Open Questions

### Resolved During Planning

- **Icons or illustrations for each method?** No. The existing design is typography-first with no illustrations anywhere. Adding icons would break the visual language. Use the amber accent color and clear headings to differentiate methods.

- **Should CTAs be buttons or links?** Links styled as the existing secondary button pattern (border + transparent bg + hover surface). Consistent with the "Give Feedback" button already on the page.

### Deferred to Implementation

- **Exact copy for each method's one-liner**: The issue provides guidance ("Start learning", "Clone and `/learn`", "Fork and teach") but final wording may need iteration during implementation.

## Implementation Units

- [x] **Unit 1: Add three-methods section to landing page**

  **Goal:** Add a visually prominent section to `index.astro` that presents the three delivery methods with CTAs.

  **Requirements:** R1, R2, R4

  **Dependencies:** None

  **Files:**
  - Modify: `src/pages/index.astro`

  **Approach:**
  - Insert a new section between the course description block (line ~53) and the module list block (line ~56)
  - Use a section heading matching the existing uppercase tracking style: `text-sm font-medium uppercase tracking-wider text-mn-text-muted`
  - Three-column responsive grid: `grid grid-cols-1 md:grid-cols-3 gap-4`
  - Each card: `midnight-surface` background, `midnight-border` border, `rounded-sm`, padding, with a heading (method name), one-line description, and a CTA link
  - CTAs: Web → `/learn/{first module code}/1` (first lesson), Agent → GitHub repo URL, Template → GitHub fork URL
  - Add a brief thesis line below the grid connecting the three methods to the single-source-of-truth concept: "One source of truth. Three interfaces. Same credentials."

  **Patterns to follow:**
  - Spacing rhythm from existing sections: `mb-12 sm:mb-16`
  - Button style from the "Give Feedback" button (line 101): border, transparent bg, hover surface, `rounded-sm`, `min-h-[44px]`
  - Section heading style from "Modules" heading (line 58)

  **Test scenarios:**
  - Three cards render on desktop in a row, stacked on mobile
  - Each CTA links to the correct destination
  - Visual weight feels like a product feature, not a footnote
  - Section fits the existing page flow without disrupting the module list or hero

  **Verification:**
  - `npm run typecheck` passes
  - `npm run build` succeeds (prerendered page still builds)
  - Visual inspection at desktop and mobile breakpoints shows the section renders correctly within the charcoal design system

- [x] **Unit 2: Tighten README quick-start instructions**

  **Goal:** Update the README's "Three ways to use this repo" section with concrete quick-start commands and clearer CTAs.

  **Requirements:** R3, R4

  **Dependencies:** None (can be done in parallel with Unit 1)

  **Files:**
  - Modify: `README.md`

  **Approach:**
  - Keep the existing three-subsection structure
  - Add concrete commands for the agent method: `git clone https://github.com/workshop-maybe/midnight-pbl.git && cd midnight-pbl`
  - Add the site URL more prominently for the web method
  - Add fork quick-start: fork → replace `content/` → `andamio course import-all` → deploy
  - Add a brief framing line at the top connecting to the thesis: same SLTs, same assignments, same credentials regardless of method
  - Keep it concise — the README already explains each method well

  **Patterns to follow:**
  - Existing README tone and structure
  - Code block formatting for commands

  **Test scenarios:**
  - Clone command is copy-pasteable and correct
  - Fork instructions reference the right content directory
  - All three methods have a clear "do this first" action

  **Verification:**
  - README renders correctly on GitHub (check markdown formatting)
  - All links are valid

## System-Wide Impact

- **Interaction graph:** Landing page only — no other pages, components, or API routes affected
- **Error propagation:** N/A — static markup only
- **State lifecycle risks:** None — no client state involved
- **API surface parity:** N/A
- **Integration coverage:** Build must still succeed since the landing page is prerendered at build time. The existing `fetchCourseModules` call is unaffected.

## Risks & Dependencies

- **Low risk:** This is additive static content on a prerendered page. No runtime behavior changes. Worst case is a visual layout issue caught during build preview.
- **First module link**: The CTA for "Start learning" links to the first lesson. The sorted module list is already computed in the page frontmatter — use `sorted[0]` to derive the link dynamically rather than hardcoding `/learn/101/1`.

## Sources & References

- Issue: workshop-maybe/midnight-pbl#4
- Landing page: `src/pages/index.astro`
- Design tokens: `src/styles/globals.css`
- Branding config: `src/config/branding.ts`
- Existing button pattern: line 101 of `src/pages/index.astro`
