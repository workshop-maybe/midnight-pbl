---
title: "feat: SEO optimization — Phase 1 (niche terms + technical foundations)"
type: feat
status: active
date: 2026-04-18
origin: docs/brainstorms/seo-optimization-requirements.md
---

# feat: SEO optimization — Phase 1 (niche terms + technical foundations)

## Overview

Ship Phase 1 of the SEO optimization effort in a single PR: technical SEO foundations (meta, OG, Twitter, canonical, sitemap, robots, JSON-LD structured data) plus homepage content expansion targeting low-competition niche terms (`midnight credentials`, `midnight badges`, `proof of learned`, `midnight for cardano developers`, `aiken to compact`). Everything is fork-safe — site origin, Twitter handle, GSC verification, OG image, and canonical URLs all resolve from a single `BRANDING` config block, so a forker editing `src/config/branding.ts` inherits correct SEO behavior for their own course.

Phase 2 (competitive Cardano terms, dedicated landing routes, blog, backlink strategy) is explicitly deferred to a separate plan.

## Problem Frame

- `src/layouts/BaseLayout.astro` currently sets only `<title>` and `<meta name="viewport">`. No description, OG, Twitter, canonical, theme-color, or robots directives.
- `public/` contains no `og-image.png` despite `BRANDING.logo.ogImage` referencing `/og-image.png` in `src/config/branding.ts`.
- No `sitemap.xml`, no `robots.txt`.
- Homepage (`/`) and lesson pages (`/learn/[moduleCode]/[lessonIndex]`) are prerendered → search-engine-friendly in shape, but currently invisible to crawlers because there's nothing indicating what they are or a sitemap to find them.
- Assignment (`/learn/[moduleCode]/assignment`) and dashboard (`/dashboard`) are SSR and auth-gated → must be excluded from indexing.
- The "fork and teach" story means any hard-coded `midnight-pbl.io` in SEO plumbing breaks for forkers; all origin/URL values must derive from config.

See origin: `docs/brainstorms/seo-optimization-requirements.md`.

## Requirements Trace

- **R1** — Top-3 Google result within 2-4 weeks for 3+ of: `midnight credentials`, `midnight badges`, `proof of learned`, `midnight for cardano developers`, `aiken to compact` (see origin: success criteria Phase 1).
- **R2** — Rich result eligible in Google Rich Results Test for homepage (`Course` schema) and one lesson (`LearningResource` schema).
- **R3** — Social share cards render correctly on Twitter/X, LinkedIn, Discord, Slack previews (OG + Twitter Card tags present, image resolves).
- **R4** — Fork-safety: all SEO plumbing derives site origin and identity from `BRANDING` config; no hard-coded `midnight-pbl.io` anywhere the forker doesn't edit.
- **R5** — Auth-gated pages (`/dashboard`, `/learn/[moduleCode]/assignment`) are `noindex, nofollow`.
- **R6** — All prerendered URLs appear in a generated `sitemap.xml` referenced by `robots.txt`.
- **R7** — Homepage adds three intent-matched sections (*What is a Midnight credential?*, *How proof-of-learned works*, FAQ) with heading anchors and FAQ entries backed by `FAQPage` JSON-LD.
- **R8** — Per-lesson title, description, and canonical URL are set per page (not the homepage defaults).

## Scope Boundaries

- No new routes (`/credentials`, `/badges`, `/about`, `/glossary`).
- No blog or posts section.
- No dynamic per-lesson OG image generation.
- No analytics tooling added (Plausible, GA, etc.) — flagged as separate decision in origin doc.
- No rewrites of lesson content for keyword density; lessons stay pedagogically-first.
- No `hreflang` / multilingual.
- No Core Web Vitals / performance audit (already strong due to prerendering).

### Deferred to Separate Tasks

- **Phase 2 plan** (dedicated landing routes, blog, backlinks, competitive Cardano keyword pursuit): separate brainstorm + plan, after Phase 1 ships and baseline GSC data is available.
- **Per-module/per-lesson dynamic OG images**: a follow-up once Phase 1 is in production.
- **Bing Webmaster Tools setup**: operational task, not code.

## Context & Research

### Relevant Code and Patterns

- `src/layouts/BaseLayout.astro` — root HTML shell, sole `<head>` owner today. Takes a `title` prop. Needs a broader `Props` interface (description, ogImage, canonical, noindex, jsonLd) and a `<slot name="head">` for page-specific structured data.
- `src/layouts/AppLayout.astro`, `src/layouts/LearnLayout.astro` — pass-through layouts that currently forward only `title`. Need to accept and forward SEO props.
- `src/pages/index.astro` — homepage. Prerendered. Already imports `BRANDING` and has clean section structure for adding new sections.
- `src/pages/learn/[moduleCode]/[lessonIndex].astro` — lesson pages. Prerendered. Already has `lesson.title` and `lesson.description` from the `Lesson` type (see `src/types/course.ts:63-76`). Resolves origin open question #4: use `lesson.description` directly, fall back to first 160 chars of `lesson.contentJson` plain-text extraction if absent.
- `src/pages/dashboard.astro`, `src/pages/learn/[moduleCode]/assignment.astro` — SSR, auth-gated. Need `noindex` signaling.
- `src/config/branding.ts` — single source of truth for course identity. Already the fork-edit point. Extend with `siteUrl`, `twitterHandle`, `gscVerification`, and (optional) `keywords`.
- `src/config/networks.ts` — per-network config (not relevant to SEO, but referenced by branding consumers).
- `astro.config.mjs` — needs `site:` field set from branding for sitemap generation.
- `src/lib/markdown.ts` — already handles TipTap JSON → HTML rendering. May need a `extractPlainText(contentJson)` helper for description fallback.

### Institutional Learnings

- No `docs/solutions/` directory in this repo. No institutional notes to carry forward.

### External References

- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — official integration, auto-generates sitemap from prerendered routes when `site` is configured. Filters support excluding SSR paths.
- [Google Search Central — Course structured data](https://developers.google.com/search/docs/appearance/structured-data/course) — schema requirements for `Course` rich result eligibility.
- [Google — FAQPage structured data](https://developers.google.com/search/docs/appearance/structured-data/faqpage) — FAQ rich result requirements.
- [Schema.org `LearningResource`](https://schema.org/LearningResource) — for lesson-level structured data.
- [Open Graph Protocol](https://ogp.me/) and [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image) — canonical specs.

## Key Technical Decisions

- **Single `SEOHead.astro` component instead of scattering meta tags across layouts.** One component owns `<title>`, description, canonical, OG (title/description/image/url/type/site_name), Twitter Card, theme-color, robots directives (including `noindex` mode), and an optional `jsonLd` array. Composes cleanly into `BaseLayout`. Rationale: meta-tag drift is the dominant SEO failure mode; centralize it.
- **`BRANDING.siteUrl` as the fork edit point.** Resolves origin open question #1. Add a single string field (e.g., `siteUrl: "https://midnight-pbl.io"`). `astro.config.mjs` imports it to set `site`. `SEOHead` reads it to build absolute URLs for canonical, OG, and Twitter. Forkers change one line and everything propagates.
- **Dynamic `robots.txt` via Astro endpoint** (`src/pages/robots.txt.ts` with `prerender = true`) instead of a static file in `public/`. Rationale: the `Sitemap:` directive must reference `BRANDING.siteUrl`; static file can't read config at build time in a fork-safe way.
- **`@astrojs/sitemap` for sitemap generation** (not hand-rolled). Prerendered routes auto-discovered. Filter function excludes `/dashboard`, `/learn/*/assignment`.
- **`src/lib/seo/schema.ts` module for JSON-LD builders.** Small, typed functions: `buildCourseSchema(course, modules, siteUrl)`, `buildLearningResourceSchema(lesson, module, siteUrl)`, `buildBreadcrumbList(items)`, `buildFAQPage(entries)`. Rationale: schemas are verbose JSON and benefit from type-checking; extracting them keeps page files readable.
- **FAQ content is data, not JSX.** Store FAQ entries in a `const FAQ_ENTRIES` array inside `src/pages/index.astro` (or `src/config/faq.ts` if it grows) → rendered twice: once as visible HTML, once as `FAQPage` JSON-LD. Single source of truth.
- **GSC verification via `BRANDING.gscVerification` field** (optional string). If set, `SEOHead` emits `<meta name="google-site-verification" content="...">`. Forkers set their own. No env var needed — branding is already the fork-edit point, and verification tokens aren't secrets.
- **Lesson description fallback strategy.** Use `lesson.description` when present. Otherwise extract the first 160 chars of plain text from `lesson.contentJson` via a new `extractPlainText()` helper in `src/lib/markdown.ts`. If both are empty, fall back to `"{module.title} — lesson {lessonIndex + 1} of the Midnight PBL course."`.
- **Keep `noindex` handling in `SEOHead` rather than a separate component.** It's just a `robots` meta value. `<SEOHead noindex={true} />` is clearer than a dedicated `<NoIndex />` tag.
- **No new runtime npm dependencies beyond `@astrojs/sitemap`.** All schema JSON is built from hand-rolled typed helpers. No `schema-dts`, no `next-seo`-style package.
- **OG image is a single static asset for launch.** `public/og-image.png` (1200×630, Midnight wordmark + tagline on the course dark background). Per-module variants are deferred.

## Open Questions

### Resolved During Planning

- **How does the forker override site origin?** → Add `BRANDING.siteUrl`. `astro.config.mjs` imports it to set `site`. Every SEO consumer reads it.
- **Where does per-lesson description come from?** → `lesson.description` field on the API-derived `Lesson` type. Plain-text fallback from `contentJson` via new helper.
- **Static vs. dynamic `robots.txt`?** → Dynamic (Astro prerendered endpoint) so the sitemap URL picks up `BRANDING.siteUrl` automatically for forks.
- **Sitemap tooling?** → `@astrojs/sitemap` official integration.

### Deferred to Implementation

- **Exact OG image design.** A designer should produce the 1200×630 image. Implementation can stub with a placeholder and swap when the final asset lands.
- **Twitter handle for `twitter:site`.** Origin open question #2. Default assumption: leave `BRANDING.twitterHandle` empty at landing, ship the code that reads it. James confirms `@midnightpbl` / `@andamio_io` / none out-of-band; a follow-up commit sets the value.
- **GSC verification token.** Origin open question #3. Same pattern: land the code that reads `BRANDING.gscVerification`, leave the value empty, fill in after GSC property is created.
- **"proof of learned" vs "proof of learning"** terminology. Origin open question #6. Implementer should grep the Andamio docs repo (`~/projects/01-projects/andamio-docs/`) before writing the homepage section copy to align with canonical usage. If both forms are used, pick the one with more hits; note the decision in the PR description.
- **First 160 chars of TipTap plain text** — exact extraction behavior (strip code blocks? collapse whitespace?) should be worked out during implementation against real lessons.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

**Data flow — SEO metadata resolution:**

```
BRANDING (src/config/branding.ts)
  ├─ siteUrl, twitterHandle, gscVerification  ─────────────┐
  ├─ name, fullTitle, description, logo.ogImage ───────────┤
                                                            ▼
page frontmatter  ──►  SEOHead component  ──►  BaseLayout <head>
  (page-specific                ▲              (title, meta,
   title, desc,                 │               OG, Twitter,
   canonical,                   │               canonical,
   jsonLd[])                    │               robots, JSON-LD)
                                │
                      src/lib/seo/schema.ts
                      (buildCourseSchema,
                       buildLearningResourceSchema,
                       buildBreadcrumbList,
                       buildFAQPage)
```

**Implementation unit dependency graph:**

```
Unit 1 (foundation: BRANDING fields, SEOHead, layout wiring)
   │
   ├─►  Unit 2 (sitemap + robots + noindex on private pages)
   │
   ├─►  Unit 3 (JSON-LD schema library)
   │       │
   │       ├─►  Unit 4 (homepage content expansion + FAQPage + Course schema)
   │       │
   │       └─►  Unit 5 (per-lesson metadata + LearningResource + BreadcrumbList)
   │
   └─►  Unit 6 (fork guidance in README + Rich Results validation)
```

Units 2, 3 can start in parallel once Unit 1 lands. Units 4, 5 can start in parallel once Unit 3 lands.

## Implementation Units

- [ ] **Unit 1: SEO foundation — BRANDING fields, `SEOHead` component, layout wiring**

**Goal:** Establish the single-source-of-truth config + the reusable component that every page uses for head metadata.

**Requirements:** R3, R4, R8

**Dependencies:** None

**Files:**
- Modify: `src/config/branding.ts` (add `siteUrl`, `twitterHandle`, `gscVerification`, `keywords` fields)
- Modify: `astro.config.mjs` (import `BRANDING`, set `site: BRANDING.siteUrl`)
- Create: `src/components/seo/SEOHead.astro`
- Modify: `src/layouts/BaseLayout.astro` (replace inline meta tags with `<SEOHead />`, accept extended props)
- Modify: `src/layouts/AppLayout.astro` (forward SEO props)
- Modify: `src/layouts/LearnLayout.astro` (forward SEO props)
- Create: `public/og-image.png` (placeholder PNG, 1200×630; final asset lands later — stub is OK for this unit)

**Approach:**
- `SEOHead` props: `title`, `description?`, `canonical?` (absolute or path), `ogImage?`, `ogType?` (`"website"` default; `"article"` for lessons), `noindex?` (boolean), `jsonLd?` (unknown[]). Defaults pull from `BRANDING`.
- Canonical URL resolution: if `canonical` is a path, prefix with `BRANDING.siteUrl`; if absent, use `Astro.url.pathname` joined with `siteUrl`.
- `BaseLayout` keeps the existing `process` shim and font preconnects; only meta-tag logic moves into `SEOHead`.
- `AppLayout` and `LearnLayout` accept `{ title, description?, canonical?, ogImage?, ogType?, noindex?, jsonLd? }` and pass through.
- Branding `keywords: readonly string[]` drives an optional `<meta name="keywords">` (low SEO impact but keeps the config complete for forkers).

**Patterns to follow:**
- Existing BRANDING shape in `src/config/branding.ts` — use `as const`, JSDoc each field, explain what a forker should edit.
- Existing Astro component style in `src/components/` — frontmatter fence, `interface Props`, destructure from `Astro.props`.

**Test scenarios:**
- Happy path: homepage renders with `<title>`, `<meta name="description">`, `<link rel="canonical">`, full OG set, Twitter summary_large_image, and `og-image.png` URL.
- Happy path: per-page override — a page passing `title="X"` and `description="Y"` renders those in both `<title>` and the OG/Twitter tags.
- Edge case: `BRANDING.twitterHandle` is empty string → `twitter:site` meta tag is omitted (not rendered as empty).
- Edge case: `BRANDING.gscVerification` is empty → `google-site-verification` meta tag is omitted.
- Edge case: `noindex={true}` → `<meta name="robots" content="noindex, nofollow">` is present and `canonical` is still rendered (canonical valid even when noindexed).
- Integration: homepage `view-source:/` via `npm run build && npm run preview` shows all expected tags; no `undefined` or empty-content meta tags.

**Verification:**
- `npm run typecheck` passes.
- `npm run build` produces prerendered `/` and lesson pages with the new head block.
- Manual check via `view-source:` or `curl http://localhost:4321/ | grep -E '<meta|<link rel'` confirms tag set.

---

- [ ] **Unit 2: Sitemap + `robots.txt` + `noindex` on auth-gated pages**

**Goal:** Make prerendered URLs discoverable to crawlers; hide SSR/auth pages from indexing.

**Requirements:** R5, R6

**Dependencies:** Unit 1 (needs `BRANDING.siteUrl` and `SEOHead` with `noindex` support)

**Files:**
- Modify: `package.json` (add `@astrojs/sitemap` dependency)
- Modify: `astro.config.mjs` (register sitemap integration with filter excluding SSR/auth paths)
- Create: `src/pages/robots.txt.ts` (Astro endpoint, `prerender = true`)
- Modify: `src/pages/dashboard.astro` (pass `noindex={true}` to layout)
- Modify: `src/pages/learn/[moduleCode]/assignment.astro` (pass `noindex={true}` to layout)

**Approach:**
- Sitemap integration config: `filter: (page) => !page.includes('/dashboard') && !page.includes('/assignment')`. Prerendered routes auto-discovered from `site`.
- `robots.txt.ts` exports `GET`: returns plaintext with `User-agent: *`, `Allow: /`, `Disallow: /dashboard`, `Disallow: /learn/*/assignment`, `Sitemap: {BRANDING.siteUrl}/sitemap-index.xml`.
- `noindex` on dashboard/assignment relies on the `SEOHead` prop from Unit 1; the extra `robots.txt` `Disallow` is defense-in-depth for crawlers that ignore meta robots.

**Patterns to follow:**
- Astro endpoint shape: `src/pages/api/gateway/[...path].ts` already in the repo is a reference for endpoint handlers (though that one is SSR — this one is `prerender = true`).

**Test scenarios:**
- Happy path: `npm run build` produces `dist/client/sitemap-index.xml` and `dist/client/sitemap-0.xml` containing `/` and every `/learn/[moduleCode]/[lessonIndex]` URL.
- Happy path: built sitemap does not contain `/dashboard` or any `/assignment` path.
- Happy path: `curl http://localhost:4321/robots.txt` (after `npm run preview`) returns plaintext with the four directives and the sitemap URL using the configured `siteUrl`.
- Edge case: fork with different `BRANDING.siteUrl` builds a sitemap and robots.txt that reference the forker's domain, not midnight-pbl.io (verify by temporarily swapping the value and rebuilding).
- Integration: dashboard page served in preview includes `<meta name="robots" content="noindex, nofollow">` in the rendered HTML.

**Verification:**
- Built sitemap URL count matches expected prerendered route count (1 + number of lessons).
- `robots.txt` fetches `text/plain` and contains exactly the expected content.
- Dashboard HTML source contains `noindex`.

---

- [ ] **Unit 3: JSON-LD schema library**

**Goal:** Typed, reusable JSON-LD builders for `Course`, `LearningResource`, `BreadcrumbList`, and `FAQPage`.

**Requirements:** R2, R7

**Dependencies:** Unit 1 (consumers will pass output to `SEOHead`'s `jsonLd` prop)

**Files:**
- Create: `src/lib/seo/schema.ts`
- Create: `src/lib/seo/schema.types.ts` (if types grow beyond trivial; otherwise inline)

**Approach:**
- Each builder returns a plain JS object that `SEOHead` will serialize via `JSON.stringify` into a `<script type="application/ld+json">` tag.
- `buildCourseSchema({ course, modules, siteUrl })` → `@type: "Course"` with `name`, `description`, `provider` (Andamio as Organization with `url: BRANDING.links.andamio`), `url` (canonical homepage), `hasCourseInstance` (one per module), `educationalCredentialAwarded`.
- `buildLearningResourceSchema({ lesson, module, siteUrl })` → `@type: "LearningResource"` with `name`, `description`, `url`, `isPartOf` (Course reference), `learningResourceType: "Lesson"`, optional `timeRequired`.
- `buildBreadcrumbList(items)` → `@type: "BreadcrumbList"`, `itemListElement` with `position`, `name`, `item`.
- `buildFAQPage(entries)` → `@type: "FAQPage"`, `mainEntity` array of `Question`/`Answer` pairs.
- All builders accept plain data in; no Astro or fetch calls inside.

**Patterns to follow:**
- Existing `src/lib/` module shape — typed, pure functions, no side effects.
- TypeScript strictness: existing tsconfig.

**Test scenarios:**
- Test expectation: none — these are pure functions that produce JSON; their correctness is verified end-to-end by running built pages through Google's Rich Results Test in Unit 6. If the implementer wants smoke coverage, one snapshot test per builder against a minimal fixture is sufficient, but not required given there's no test runner configured in the repo (per `CLAUDE.md`).

**Verification:**
- `npm run typecheck` passes.
- Output of each builder, when serialized and pasted into schema.org's validator, produces zero errors.

---

- [ ] **Unit 4: Homepage content expansion + `FAQPage` + `Course` schema**

**Goal:** Add three SEO-intent sections to the homepage and emit `Course` + `FAQPage` JSON-LD.

**Requirements:** R1, R2, R7

**Dependencies:** Unit 1, Unit 3

**Files:**
- Modify: `src/pages/index.astro` (add three sections, wire up JSON-LD via `SEOHead`)
- Possibly create: `src/config/faq.ts` (if FAQ entries grow past ~5; otherwise keep inline)

**Approach:**
- Three new sections inserted after the existing "Modules" section, before "Three ways to take this course" (or wherever the reviewer finds them most coherent):
  1. **"What is a Midnight credential?"** — `<section id="what-is-a-midnight-credential">` with h2 + 3-4 sentence paragraph. Mentions on-chain issuance via Andamio, verifiability, portability. Targets: `midnight credentials`, `midnight badges`, `cardano credentials`.
  2. **"How proof-of-learned works"** — `<section id="how-proof-of-learned-works">` with h2 + 3-4 sentence paragraph explaining SLT → assignment → credential flow. Targets: `proof of learned`.
     - **Terminology check** — before writing, grep the Andamio docs repo for the canonical form (see Deferred Questions). If Andamio docs say "proof of learning," use that. Update R1 targets accordingly.
  3. **FAQ** — `<section id="faq">` with h2 + 5 Q&A pairs from a `FAQ_ENTRIES` constant. Each Q&A rendered as `<details>` (or plain h3/p) for visible HTML; same data fed into `buildFAQPage()` for JSON-LD.
- FAQ seed (implementer finalizes copy):
  1. Do I need ADA to take this course?
  2. What's the difference between Aiken and Compact?
  3. Are my credentials verifiable outside Andamio?
  4. Can I fork this course?
  5. How long does the course take?
- Homepage frontmatter: build `courseJsonLd = buildCourseSchema(...)` and `faqJsonLd = buildFAQPage(FAQ_ENTRIES)`, pass `jsonLd={[courseJsonLd, faqJsonLd]}` to the layout.
- Update homepage `description` passed to layout to mention the niche keywords naturally (not stuffed).

**Patterns to follow:**
- Existing section structure in `src/pages/index.astro` — already uses inline style attributes for some sections; keep consistent.
- `BRANDING.longDescription` style for prose tone.

**Test scenarios:**
- Happy path: homepage HTML contains `<section id="what-is-a-midnight-credential">`, `<section id="how-proof-of-learned-works">`, `<section id="faq">` with the expected visible copy.
- Happy path: homepage `<head>` contains two `<script type="application/ld+json">` blocks; parsing each as JSON succeeds.
- Happy path: `Course` JSON-LD contains `name`, `description`, `provider`, `url` fields and at least one `hasCourseInstance` entry per module.
- Happy path: `FAQPage` JSON-LD mirrors the visible FAQ text exactly (Google enforces visible-text parity).
- Integration: Google Rich Results Test (run manually in Unit 6) reports homepage as eligible for Course and FAQ rich results.
- Edge case: if a module has no `description`, `Course` schema still validates (falls back to empty string or omits the field cleanly).

**Verification:**
- `npm run build` succeeds.
- Preview the homepage; visible sections match JSON-LD content exactly.
- Rich Results Test eligibility confirmed in Unit 6.

---

- [ ] **Unit 5: Per-lesson metadata + `LearningResource` + `BreadcrumbList` schema**

**Goal:** Each lesson page gets its own title, description, canonical, and structured data.

**Requirements:** R2, R8

**Dependencies:** Unit 1, Unit 3

**Files:**
- Modify: `src/lib/markdown.ts` (add `extractPlainText(contentJson, maxLen?)` helper)
- Modify: `src/pages/learn/[moduleCode]/[lessonIndex].astro` (pass full SEO props + JSON-LD to layout)
- Modify: `src/layouts/LearnLayout.astro` (already forwards SEO props per Unit 1 — verify and extend if needed)

**Approach:**
- In lesson frontmatter, after loading `lesson`:
  - `description = lesson.description ?? extractPlainText(lesson.contentJson, 160) ?? \`${module.title} — lesson ${lessonIndex + 1} of the Midnight PBL course.\``
  - `canonical = \`/learn/${moduleCode}/${lessonIndex}\`` (SEOHead will prefix with siteUrl)
  - `ogImage` defaults to `BRANDING.logo.ogImage` unless `lesson.imageUrl` is set (in which case use lesson's own)
  - `learningResourceJsonLd = buildLearningResourceSchema({ lesson, module, siteUrl })`
  - `breadcrumbJsonLd = buildBreadcrumbList([{ name: "Home", item: "/" }, { name: module.title, item: \`/learn/${moduleCode}/1\` }, { name: lesson.title, item: canonical }])`
  - Pass `jsonLd={[learningResourceJsonLd, breadcrumbJsonLd]}`, `ogType="article"`, and description to `<LearnLayout>`.
- `extractPlainText(contentJson, maxLen = 160)`: walk the TipTap JSON tree, concatenate `text` fields, collapse whitespace, skip `codeBlock` nodes (too dense, bad for SEO snippets), truncate at `maxLen` on a word boundary, append `…` if truncated.

**Patterns to follow:**
- Existing traversal of `contentJson` in `src/lib/markdown.ts` — reuse the same walking approach for consistency.
- `getPageTitle()` helper in `src/config/branding.ts` — already used for lesson title formatting.

**Test scenarios:**
- Happy path: lesson page renders `<title>{lesson.title} | Midnight PBL</title>`, `<meta name="description">` with lesson's own description, `<link rel="canonical">` pointing to `{siteUrl}/learn/{moduleCode}/{lessonIndex}`.
- Happy path: lesson page `<head>` contains two JSON-LD blocks: `LearningResource` and `BreadcrumbList`.
- Happy path: `LearningResource` `isPartOf` references the Course identifier used by the homepage's `Course` schema (they link up).
- Edge case: lesson with no `description` field falls back to extracted plain text from `contentJson`.
- Edge case: lesson with empty `contentJson` falls back to the module-level description string.
- Edge case: lesson with a code-block-only content renders a sensible (module-level) fallback description, not an empty one.
- Edge case: `extractPlainText` handles deeply nested TipTap nodes without stack overflow on realistic lessons.
- Integration: one lesson URL passes Google Rich Results Test for `LearningResource` + `BreadcrumbList` rich results (validated in Unit 6).

**Verification:**
- Build succeeds across all lesson paths (currently 18 per origin doc).
- Spot-check 3 lessons from different modules — all have distinct titles and descriptions; none default to homepage description.

---

- [ ] **Unit 6: Fork guidance in README + Rich Results validation**

**Goal:** Document the fork-edit points for SEO and validate structured data before merge.

**Requirements:** R2, R4

**Dependencies:** Units 1–5

**Files:**
- Modify: `README.md` (add "SEO for forks" section)
- Modify: `CLAUDE.md` (optional — add a one-line reference to where SEO config lives, so future agents don't guess)

**Approach:**
- README section explaining:
  - `BRANDING.siteUrl`, `BRANDING.twitterHandle`, `BRANDING.gscVerification`, `BRANDING.keywords` are the fork edit points.
  - Replace `public/og-image.png` with your own 1200×630 image.
  - Create a Google Search Console property for your domain, paste the verification token into `BRANDING.gscVerification`, rebuild, redeploy, verify in GSC.
  - Submit your sitemap URL (`{siteUrl}/sitemap-index.xml`) in GSC.
- Validation checklist (run once, before PR merge; results go in PR description):
  - Paste production homepage URL into [Google Rich Results Test](https://search.google.com/test/rich-results) — confirm `Course` and `FAQPage` eligible, no errors.
  - Paste one lesson URL into Rich Results Test — confirm `LearningResource` and `BreadcrumbList` eligible, no errors.
  - Paste homepage URL into [Twitter Card Validator](https://cards-dev.twitter.com/validator) or share to X in a draft — confirm summary_large_image renders.
  - Paste homepage into [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) — confirm preview renders.
  - `curl -s https://midnight-pbl.io/robots.txt` → expected directives present.
  - `curl -s https://midnight-pbl.io/sitemap-index.xml` → lists prerendered routes only.

**Patterns to follow:**
- Existing README structure.

**Test scenarios:**
- Test expectation: none — this unit is documentation + manual validation. Pass/fail is captured in the PR description.

**Verification:**
- README renders correctly on GitHub (check headings, code blocks).
- PR description includes pasted screenshots or text from each validator confirming zero errors.

## System-Wide Impact

- **Interaction graph:** Every page rendered through `BaseLayout` (which is all of them) now emits the `SEOHead` tag set. No behavior change for users; significant behavior change for crawlers.
- **Error propagation:** If `BRANDING.siteUrl` is misconfigured (e.g., missing trailing slash, http instead of https, wrong domain), every canonical, OG URL, and sitemap entry is wrong. Mitigation: type-narrow `siteUrl` to a template literal type `\`https://${string}\`` or add a runtime assert at import time. At minimum, a code comment and README guidance.
- **State lifecycle risks:** None. Build-time concern only; no runtime state.
- **API surface parity:** None — SEO is read-only metadata; no API changes.
- **Integration coverage:** JSON-LD correctness can't be proven by unit tests; only rich result validators confirm it. Unit 6's manual checklist is the integration test.
- **Unchanged invariants:** The existing `process` shim in `BaseLayout.astro` remains (Mesh SDK depends on it). Font preconnects remain. `globals.css` import remains. Zero changes to authentication, transaction, or lesson-content rendering code paths. `/api/*` routes untouched. Fork-as-template story preserved: a forker changing `BRANDING` values gets a working SEO surface on their own domain.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `BRANDING.siteUrl` hard-coded in a place we missed (e.g., old markdown link), leaking midnight-pbl.io to forks. | Grep for `midnight-pbl.io` after Unit 1 lands; fail fast if any non-docs file still contains it. Add a test-later check in Unit 6 via a shell grep in the PR checklist. |
| FAQ visible text drifts from `FAQPage` JSON-LD text → Google demotes the rich result. | Single source of truth: `FAQ_ENTRIES` array feeds both the visible render and the schema builder. Review in PR. |
| `@astrojs/sitemap` doesn't play well with the `server` output + `prerender = true` mixed setup. | Sitemap filter explicitly includes prerendered routes by URL pattern; if the integration misbehaves, fall back to a hand-rolled sitemap endpoint (same shape as `robots.txt.ts`). Low likelihood — this is a common Astro config. |
| OG image placeholder ships to production. | Unit 1 stub is for code enablement; Unit 6's PR checklist requires the final image before merge. |
| `extractPlainText` produces bad descriptions on lessons heavy with code blocks. | Fallback chain: `lesson.description` → extracted text → module-level static string. Implementer spot-checks 3 lessons. |
| Google re-crawls slowly; success criteria expect top-3 in 2-4 weeks but indexing alone can take that long. | Origin doc already phrases success as "within 2-4 weeks" — if indexing is slow, submit the sitemap via GSC manually (documented in Unit 6). |
| Fork guidance in README is incomplete; forkers miss the GSC step. | Unit 6's README section must include the full forker checklist, not just the `BRANDING` field list. |

## Documentation / Operational Notes

- After merge + deploy:
  1. Verify GSC property, paste verification token into `BRANDING.gscVerification`, redeploy.
  2. Submit `https://midnight-pbl.io/sitemap-index.xml` in GSC.
  3. Share homepage + one lesson URL in a Twitter/X post — confirm social cards render.
  4. Request indexing in GSC for homepage + top 3 lesson URLs.
- Baseline metric to capture on merge day: GSC "Performance" zeros (no impressions/clicks yet). Compare at 2-week and 4-week marks to measure success criteria.
- No monitoring alert setup — SEO is a weekly manual GSC check, not a paging concern.

## Sources & References

- **Origin document:** [docs/brainstorms/seo-optimization-requirements.md](../brainstorms/seo-optimization-requirements.md)
- Related code:
  - `src/config/branding.ts` (fork-edit point)
  - `src/layouts/BaseLayout.astro:17-49` (current head block)
  - `src/pages/index.astro` (homepage)
  - `src/pages/learn/[moduleCode]/[lessonIndex].astro` (lesson page)
  - `src/types/course.ts:63-76` (Lesson type with description/imageUrl fields)
  - `src/lib/markdown.ts` (target for `extractPlainText` helper)
- External docs:
  - @astrojs/sitemap — https://docs.astro.build/en/guides/integrations-guide/sitemap/
  - Course structured data — https://developers.google.com/search/docs/appearance/structured-data/course
  - FAQPage structured data — https://developers.google.com/search/docs/appearance/structured-data/faqpage
  - LearningResource — https://schema.org/LearningResource
  - Open Graph — https://ogp.me/
  - Twitter Cards — https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image
