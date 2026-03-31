---
title: "refactor: Charcoal design overhaul — content-first, no slop"
type: refactor
status: active
date: 2026-03-31
---

# Charcoal Design Overhaul

## Overview

Strip the Midnight blockchain branding (navy blues, violet gradients, glassmorphism, glow effects) and replace with a charcoal-based, content-first design system. The result should feel like a well-designed reading experience — closer to a Stripe docs page or a quality textbook site than a crypto dashboard.

## Problem Frame

The current design is tightly coupled to Midnight Network brand colors (blues, violets, sky) and uses typical dark-mode crypto UI patterns (glassmorphic cards, gradient text, glow hovers, backdrop-blur). This makes it look like every other AI-generated blockchain site. The content — which is the actual product — gets lost behind decorative chrome.

The goal is a design that:
- Puts content first (lessons are the product, not the UI)
- Uses charcoal/warm dark grays instead of cold navy blues
- Has a single, restrained accent color instead of a gradient system
- Strips all glassmorphism, glow, and gradient decorations
- Feels unique — not Midnight-branded, not generic Tailwind dark mode

## Requirements Trace

- R1. Replace all navy blue backgrounds (#0b0e1a, #0a0e19, #141828) with charcoal grays
- R2. Replace the blue/violet/sky accent system with a single warm accent color
- R3. Remove all glassmorphism (backdrop-blur, translucent backgrounds, glow hovers)
- R4. Remove gradient-text utility and gradient decorations on code blocks
- R5. Preserve the serif/sans-serif typography split (Lora prose, Outfit headings, Urbanist body)
- R6. Preserve all responsive behavior, touch targets, safe-area insets, and accessibility
- R7. Maintain the anti-slop patterns already established (no decorative badges, no translate-y hovers)
- R8. Update branding.ts to reflect the new palette
- R9. Keep the syntax highlighting theme cohesive with the new palette

## Scope Boundaries

- Dark mode only — no light mode toggle
- No layout changes (grid, sidebar, responsive breakpoints stay the same)
- No component API changes (Card, Button, Badge props unchanged)
- No font changes (keep Outfit, Urbanist, Lora, Geist Mono)
- No new dependencies
- No changes to data flow, API calls, or state management

## Context & Research

### Relevant Code and Patterns

- `app/styles/globals.css` — All design tokens, prose styles, sidebar styles, code block theme
- `app/config/branding.ts` — JS color/font constants
- `app/routes/root.tsx` — Google Fonts links, body classes
- `app/components/ui/card.tsx` — Glassmorphic card (needs stripping)
- `app/components/ui/button.tsx` — Variant color styles
- `app/components/ui/badge.tsx` — Variant color styles
- `app/components/layout/nav.tsx` — Glassmorphic nav bar
- `app/components/layout/footer.tsx` — Semi-transparent footer
- `app/components/course/module-card.tsx` — Uses Card + Badge violet
- `app/components/dashboard/module-progress.tsx` — Status-colored borders, accent links
- `app/routes/landing.tsx` — gradient-text, gradient backdrop
- `app/routes/course-overview.tsx` — Surface colors for empty state
- `app/routes/lesson-page.tsx` — Border colors in nav
- `app/routes/assignment-page.tsx` — Surface colors, loading dots

### Anti-Slop Pass Already Done

Commit `21878df` removed: decorative badges on headers, gradient-text outside landing, translate-y hovers, gradient buttons, hero badge/FeatureCard grid. These must not be reintroduced.

## Key Technical Decisions

- **Charcoal palette, not gray**: Base background `#1c1c1c` (warm charcoal), surface `#242424`, card `#2a2a2a`. These are warm neutrals, not blue-tinted grays or cold slate. The slight warmth prevents the "generic dark mode" feeling.

- **Single accent: warm amber `#d4a053`**: A muted gold/amber replaces the entire blue/violet/sky system. It reads as intentional and distinctive without screaming "blockchain." Used sparingly — links, active states, primary buttons. Not used for decorative gradients.

- **Borders become structural, not decorative**: `#ffffff12` (7% white) — barely visible, just enough to define edges. No glow, no hover shadow changes.

- **Cards are flat surfaces**: Solid `bg-[card-color]` with thin border. No backdrop-blur, no translucency, no glow hover. Cards are containers, not decorations.

- **Nav and footer are solid**: No backdrop-blur, no translucency. Solid charcoal background. The nav still sticks but doesn't pretend to be glass.

- **Code blocks get a subtle left border instead of gradient top**: A thin amber accent line on the left edge replaces the blue-to-violet gradient bar on top. Cleaner, more editorial.

- **Syntax highlighting shifts to warm neutrals**: Keywords in amber, strings in muted rose, types in warm gray. No blues or violets.

- **Primary button uses amber, secondary stays ghost-like**: `bg-amber text-charcoal` for primary. Secondary is `border + text` only. Ghost stays transparent.

- **Landing page gradient-text becomes plain bold white**: The hero title doesn't need a gradient to be impactful. Bold white Outfit at large size is enough.

## Open Questions

### Resolved During Planning

- **Should we keep the gradient-text class?** No — remove it entirely. It's only used on the landing hero and the effect fights the content-first goal.
- **Keep the `.glass-card` class?** No — remove it. Replace Card with flat background.
- **What about the `--mn-glow` hover effect?** Remove. Cards get a simple `border-color` transition on hover instead, or nothing.

### Deferred to Implementation

- Exact hex values for syntax highlighting may need fine-tuning after seeing rendered code blocks
- The amber accent may need slight warmth/coolness adjustment after seeing it in context with prose text

## New Color Palette

| Token | Old Value | New Value | Usage |
|-------|-----------|-----------|-------|
| `--color-midnight` | `#0b0e1a` | `#1c1c1c` | Page background |
| `--color-midnight-surface` | `#0a0e19` | `#242424` | Surface backgrounds |
| `--color-midnight-card` | `#141828` | `#2a2a2a` | Card backgrounds |
| `--color-midnight-border` | `#ffffff26` | `#ffffff12` | Borders (subtle) |
| `--color-mn-blue` | `#0000fe` | *remove* | |
| `--color-mn-primary` | `#2a48ff` | `#d4a053` | Primary accent (amber) |
| `--color-mn-primary-light` | `#5bb6f2` | `#d4a053` | Same accent (no light variant needed) |
| `--color-mn-violet` | `#7a5cff` | *remove* | |
| `--color-mn-purple` | `#8756ff` | *remove* | |
| `--color-mn-sky` | `#5bb6f2` | `#d4a053` | Links, inline code accent |
| `--color-mn-text` | `#f7f8ff` | `#e8e8e8` | Primary text (slightly warmer) |
| `--color-mn-text-muted` | `#e1e1e6` | `#999999` | Muted text (more contrast from primary) |
| `--color-mn-glow` | `#5bb6f240` | *remove* | |
| `--color-primary` | `#2a48ff` | `#d4a053` | Semantic alias |
| `--color-primary-light` | `#5bb6f2` | `#d4a053` | Semantic alias |
| Prose body text | `#c8ccd4` | `#b0b0b0` | Warm gray prose |

## Implementation Units

- [ ] **Unit 1: Rewrite design tokens in globals.css**

**Goal:** Replace all color tokens with the charcoal palette, remove unused tokens (violet, purple, blue, glow), update border radius if needed.

**Requirements:** R1, R2, R3

**Files:**
- Modify: `app/styles/globals.css` (lines 10-69 — `@theme` block and `:root` block)

**Approach:**
- Replace `@theme` color values with new palette
- Remove `--color-mn-blue`, `--color-mn-violet`, `--color-mn-purple`, `--color-mn-glow`
- Rename remaining tokens: keep `mn-` prefix for now to minimize find/replace across components
- Update `:root` custom properties to match
- Remove `.glass-card` class entirely (lines 107-118)
- Remove `.gradient-text` class entirely (lines 121-126)

**Patterns to follow:**
- Tailwind v4 `@theme` syntax (already established)

**Test scenarios:**
- All Tailwind utility classes using the old tokens should resolve to new colors
- No broken CSS references after removing deleted tokens

**Verification:**
- `grep -r "mn-violet\|mn-purple\|mn-blue\|mn-glow\|glass-card\|gradient-text" app/` should return zero matches after all units complete

---

- [ ] **Unit 2: Update prose and code block styles**

**Goal:** Shift prose colors and code block treatment to charcoal palette. Replace gradient accent line with left border. Update syntax highlighting.

**Requirements:** R4, R5, R9

**Dependencies:** Unit 1

**Files:**
- Modify: `app/styles/globals.css` (lines 152-425 — `.prose-midnight` and hljs overrides)

**Approach:**
- Update prose body color to `#b0b0b0`
- Update prose heading color to `#e8e8e8`
- Update link color to amber accent
- Update inline code background to `#2a2a2a`, text to amber
- Code block background to `#1e1e1e`, border to `#ffffff12`
- Replace `pre::before` gradient top bar with `border-left: 3px solid #d4a05380` (amber at 50%)
- Language label badge: update background to `#2a2a2a`
- Syntax highlighting: keywords → amber, strings → muted rose (`#c9826b`), functions → warm light (`#d4d4d4`), types → warm gray (`#a0a0a0`), comments → `#555555`
- Update blockquote left border to amber

**Test scenarios:**
- Prose renders with warm gray body text, bright headings, amber links
- Code blocks have left amber accent, no top gradient
- Syntax colors are distinguishable and readable

**Verification:**
- No blue/violet hex values remain in prose or hljs sections
- Code blocks visually distinct from surrounding prose

---

- [ ] **Unit 3: Update UI components (Card, Button, Badge)**

**Goal:** Strip glassmorphism from Card, update Button variant colors, update Badge variant colors.

**Requirements:** R2, R3

**Dependencies:** Unit 1

**Files:**
- Modify: `app/components/ui/card.tsx`
- Modify: `app/components/ui/button.tsx`
- Modify: `app/components/ui/badge.tsx`

**Approach:**

Card:
- Replace `bg-[#0a0e19eb]` with `bg-midnight-card` (resolves to `#2a2a2a`)
- Remove `backdrop-blur-sm`
- Replace hover glow `hover:shadow-[0_0_24px_var(--mn-glow)]` with `hover:border-[#ffffff20]` (simple border brighten)
- Keep `rounded-xl border border-midnight-border`

Button:
- Primary: `bg-[#d4a053] text-[#1c1c1c] hover:bg-[#ddb06a]` — dark text on amber
- Secondary: `border border-midnight-border text-mn-text hover:bg-midnight-surface` (unchanged pattern, just new colors flow through tokens)
- Ghost: unchanged pattern, new colors flow through
- Danger: unchanged pattern
- Focus ring: update from `outline-mn-primary-light` to `outline-[#d4a053]`

Badge:
- Remove `violet` variant (replace usages with `default`)
- Keep success/warning/error/info/default variants

**Test scenarios:**
- Card renders as flat surface with border, no blur or glow
- Primary button is amber with dark text, readable
- Badge colors remain distinct for each semantic variant

**Verification:**
- No `backdrop-blur`, `shadow-[0_0_24px`, or glow references in component files
- Button contrast ratio meets WCAG AA for amber-on-charcoal

---

- [ ] **Unit 4: Update layout components (Nav, Footer)**

**Goal:** Replace glassmorphic nav/footer with solid charcoal backgrounds.

**Requirements:** R1, R3, R6

**Dependencies:** Unit 1

**Files:**
- Modify: `app/components/layout/nav.tsx`
- Modify: `app/components/layout/footer.tsx`

**Approach:**

Nav:
- Replace `bg-midnight/80 backdrop-blur-md` with `bg-midnight-surface` (solid)
- Keep `border-b border-midnight-border`, `sticky top-0 z-50`
- Replace `hover:text-mn-primary-light` brand hover with `hover:text-[#d4a053]`
- Mobile menu: replace `bg-midnight/95 backdrop-blur-md` with `bg-midnight-surface`
- Active link: `text-mn-text`, inactive: `text-mn-text-muted` (unchanged pattern)
- Keep all safe-area inset support

Footer:
- Replace `bg-midnight/50` with `bg-midnight-surface`
- Replace `text-mn-primary-light` Andamio link color with amber
- Keep all safe-area and responsive behavior

**Test scenarios:**
- Nav is solid, no transparency or blur
- Mobile menu is solid, no transparency
- Footer is solid
- All touch targets and safe-area insets preserved

**Verification:**
- No `backdrop-blur` references in nav or footer
- No `/80`, `/95`, `/50` opacity modifiers on background colors

---

- [ ] **Unit 5: Update page routes and remaining components**

**Goal:** Update all route files and domain components that reference old colors.

**Requirements:** R1, R2, R4

**Dependencies:** Units 1-4

**Files:**
- Modify: `app/routes/landing.tsx`
- Modify: `app/routes/course-overview.tsx`
- Modify: `app/routes/lesson-page.tsx`
- Modify: `app/routes/assignment-page.tsx`
- Modify: `app/components/course/module-card.tsx`
- Modify: `app/components/dashboard/module-progress.tsx`
- Modify: `app/components/assignment/commitment-status.tsx`

**Approach:**

landing.tsx:
- Remove `gradient-text` class from hero title — use plain `text-mn-text font-bold`
- Remove the gradient backdrop div (`bg-gradient-to-b from-mn-primary/5 ...`)

course-overview.tsx:
- Empty state `bg-midnight-surface/50` → `bg-midnight-surface` (no opacity)

module-card.tsx:
- Badge variant `violet` → `default`
- Colors flow through updated tokens

module-progress.tsx:
- Replace `border-mn-primary/30` with `border-[#d4a053]/30`
- Replace `text-mn-primary-light` link color with token (flows through)
- Completed gradient bar: keep success green (it's semantic, not branding)

lesson-page.tsx:
- Colors flow through updated tokens, no direct changes expected

assignment-page.tsx:
- Loading dots: `bg-mn-primary-light` flows through to amber via token

commitment-status.tsx:
- Check for any violet/blue badge references and update

**Test scenarios:**
- Landing hero shows bold white title, no gradient
- Module cards use default badge, not violet
- Dashboard progress cards use amber for in-progress borders

**Verification:**
- `grep -rn "gradient-text\|mn-violet\|mn-purple\|mn-blue\|mn-glow" app/routes/ app/components/` returns zero matches

---

- [ ] **Unit 6: Update branding.ts and sidebar styles**

**Goal:** Sync branding.ts with new palette. Update sidebar CSS classes.

**Requirements:** R8

**Dependencies:** Units 1-5

**Files:**
- Modify: `app/config/branding.ts`
- Modify: `app/styles/globals.css` (lines 427-626 — sidebar styles)

**Approach:**

branding.ts:
- Update all color values to match new palette
- Remove `blue`, `violet`, `purple`, `sky`, `glow` keys
- Add `accent: "#d4a053"`
- Update `bgDark`, `bgSurface`, `bgCard`, `textOnDark`, `textMuted`, `borderDark`

Sidebar styles:
- `.sidebar-slt-item--active`: Replace `background-color: #2a48ff18` with `background-color: #d4a05318`
- `.sidebar-slt-item--active .sidebar-slt-index`: Replace `background-color: var(--mn-primary-light)` with amber
- `.sidebar-assignment-link--active`: Replace `#2a48ff18` with `#d4a05318`
- `.learn-sidebar-toggle:hover`: Remove glow shadow, use simple border brighten
- `.learn-sidebar`: border-right color flows through token

**Test scenarios:**
- Sidebar active states use amber tint, not blue
- Active lesson index badge is amber with dark text
- Sidebar toggle hover is subtle, not glowing

**Verification:**
- branding.ts has no blue/violet hex values
- No `#2a48ff` or `#7a5cff` hex values remain anywhere in the codebase

---

- [ ] **Unit 7: Final sweep and consistency check**

**Goal:** Grep the entire `app/` directory for any remaining old-palette references and fix them.

**Requirements:** All

**Dependencies:** Units 1-6

**Files:**
- Any remaining files with old color references

**Approach:**
- `grep -rn` for all old hex values: `#0b0e1a`, `#0a0e19`, `#141828`, `#2a48ff`, `#7a5cff`, `#8756ff`, `#5bb6f2`, `#0000fe`, `#5bb6f240`
- `grep -rn` for old class/token names: `mn-glow`, `mn-violet`, `mn-purple`, `mn-blue`, `mn-sky`, `glass-card`, `gradient-text`, `backdrop-blur`
- Fix any remaining references
- Verify the app builds cleanly

**Test scenarios:**
- Zero old-palette hex values in `app/`
- Zero old token names in `app/`
- `npm run build` succeeds

**Verification:**
- Clean grep results
- Clean build

## System-Wide Impact

- **No API surface changes** — purely visual
- **No state or data flow changes** — purely CSS/className updates
- **Branding.ts consumers** — any component importing BRANDING.colors gets updated values
- **No external interface parity concerns** — this is a standalone PBL site

## Risks & Dependencies

- **Risk: Amber on charcoal contrast** — May need slight lightening of accent if WCAG contrast fails on small text. Mitigation: test with contrast checker, adjust in Unit 7.
- **Risk: Syntax highlighting readability** — New warm-palette hljs theme may have readability issues with certain language constructs. Mitigation: test with actual lesson code blocks, adjust in Unit 7.
- **Risk: Missing color references** — Some components may have hardcoded hex values not caught in initial review. Mitigation: Unit 7 full grep sweep.

## Sources & References

- Anti-slop pass commit: `21878df`
- Typography iteration commits: `d78c4e2`, `5596ac2`
- Current globals.css: `app/styles/globals.css`
- Current branding.ts: `app/config/branding.ts`
