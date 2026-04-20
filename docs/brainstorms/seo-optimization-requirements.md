# SEO Optimization — Requirements

**Date:** 2026-04-18
**Status:** Ready for planning
**Scope:** Standard

## Goal

Make midnight-pbl.io the top organic search result for a tight set of niche terms (Phase 1), then expand reach into broader Cardano/Midnight developer queries (Phase 2). Every new learner who searches their way to the course should land on a page that matches their intent and funnels them to "Start learning" or "Clone and /learn".

## Target keyword clusters

### Phase 1 — Niche terms (own these fast; weeks-to-months)

Low competition today. Most are either novel terminology coined by Andamio/Midnight, or long-tail compounds nobody's explicitly targeted.

- **Credential-themed:** `midnight credentials`, `midnight badges`, `midnight network credentials`, `on-chain midnight credentials`
- **Learning-themed:** `proof of learned`, `learn midnight network`, `midnight network tutorial`, `midnight for cardano developers`
- **Tooling-themed:** `aiken to compact`, `compact language tutorial`, `midnight developer course`

### Phase 2 — Broader Cardano terms (long horizon; months)

Competitive against IOG, Emurgo, Cardano Academy, Gimbalabs, Aiken docs. Expect slow organic growth supported by content additions and external backlinks.

- `cardano learning`, `cardano development`, `cardano credentials`
- `learn cardano`, `cardano developer course`, `cardano smart contracts learn`

## Users and intent

| Searcher | Example query | What they want | Where we land them |
|---|---|---|---|
| Cardano dev curious about Midnight | "midnight for cardano developers" | Overview + start learning | `/` homepage hero + "Start learning" CTA |
| Someone told to earn a credential | "midnight credentials" | What is this, how do I get one | New `/` section: *What is a Midnight credential?* |
| Learner researching the system | "proof of learned" | Explanation of the learning model | New `/` section: *How proof-of-learned works* |
| Hands-on dev searching for tutorials | "compact language tutorial" | Actual lessons | Lesson pages (prerendered, richly indexed) |
| Forker / course author | "open source course template" | Fork-and-teach story | Existing "Fork and teach" section |

## Current state

- `BaseLayout.astro` sets only `<title>` and viewport. No description, OG, Twitter, canonical, or JSON-LD.
- No `sitemap.xml` or `robots.txt` in `public/`.
- `BRANDING.logo.ogImage` references `/og-image.png`, but the file does not exist in `public/`.
- Homepage `/` and all `/learn/[moduleCode]/[lessonIndex]` pages are prerendered → already good for indexing; they just need head metadata.
- Assignment/dashboard pages are SSR and auth-gated → should be `noindex`.

## Phase 1 — Scope (what we're shipping first)

### A. Technical SEO foundations

1. **Meta description, author, theme-color** — set in `BaseLayout.astro`, accept a `description` prop, default to `BRANDING.description`.
2. **Canonical URL** — `<link rel="canonical" href={canonical}>` on every page. For forks, document via comment and README how to override the site origin.
3. **Open Graph + Twitter cards** — full set (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `twitter:card`, `twitter:site`, `twitter:image`). Accept per-page overrides so lesson pages can set their own title/description.
4. **OG image** — create `public/og-image.png` (1200×630) with the Midnight wordmark + tagline. One static image for launch; dynamic per-lesson OG can come later.
5. **`robots.txt`** — allow all, point to sitemap, explicitly disallow `/dashboard` and assignment pages.
6. **`sitemap.xml`** — prerendered at build. Include `/` and every `/learn/[moduleCode]/[lessonIndex]`. Exclude SSR/auth pages. Use `@astrojs/sitemap` integration.
7. **JSON-LD structured data:**
   - Homepage: `Course` schema with name, description, provider (Andamio), hasCourseInstance, educationalCredentialAwarded.
   - Lesson pages: `LearningResource` schema with name, description, isPartOf (the Course), position, timeRequired.
   - `BreadcrumbList` on lesson pages: Home → Module → Lesson.
8. **`noindex` on auth/dashboard pages** — `<meta name="robots" content="noindex, nofollow">` on `/dashboard` and `/learn/[moduleCode]/assignment`.
9. **Per-lesson title + description** — pull from lesson frontmatter/API. Pattern: `{Lesson title} | {Module name} | Midnight PBL`.

### B. Homepage content expansion (intent-matched sections)

Add three short, scannable sections to `src/pages/index.astro`. Each is heading-anchored so it can show up as a featured snippet / sitelink.

1. **"What is a Midnight credential?"** — 3-4 sentence definition. Covers: on-chain, issued via Andamio, verifiable, portable. Targets: `midnight credentials`, `midnight badges`, `cardano credentials`.
2. **"How proof-of-learned works"** — 3-4 sentence explanation of the SLT → assignment → on-chain credential flow. Targets: `proof of learned`, long-tail learning-science queries.
3. **Short FAQ** (3-5 Q&As, using `FAQPage` JSON-LD):
   - *Do I need ADA to take this course?* (no, wallet-signed auth; tx sponsorship if relevant)
   - *What's the difference between Aiken and Compact?*
   - *Are credentials verifiable outside Andamio?*
   - *Can I fork this course?*
   - *How long does the course take?*

Sections use existing typography. Each gets an `id` attribute so internal links (and AI-Overview answer boxes) can deep-link.

### C. Measurement (minimal)

1. **Google Search Console** verification via `<meta name="google-site-verification">` (server-side env var, overridable per deployment).
2. **One structured-data test** before merge: run URLs through validator.schema.org / Google Rich Results Test.
3. No analytics added as part of this brainstorm — flag as separate decision.

## Phase 2 — Out of scope for this requirements doc (noted for later)

These are valuable but should be their own brainstorm once Phase 1 ships traffic:

- Dedicated `/credentials`, `/badges`, `/about`, `/glossary` routes
- Blog/posts section with ongoing articles
- Cross-site backlink strategy (Cardano Forum, Gimbalabs, IOG docs, awesome-cardano lists)
- Dynamic per-lesson OG images (Satori / Vercel OG equivalent for Astro)
- Multilingual / `hreflang`
- Performance/Core Web Vitals audit (likely already strong — prerendered, minimal JS)

## Non-goals

- Ranking for generic "learn blockchain" / "learn smart contracts" queries — too broad, wrong audience.
- Paid SEO tools or monitoring SaaS — use GSC + manual checks.
- Rewriting any lesson content for SEO — lessons already teach; keep them pedagogically first.
- Any change that would compromise the fork-as-template story (no hard-coded midnight-pbl.io URLs in code that forks inherit).

## Success criteria

**Phase 1 (2-4 weeks after launch):**
- midnight-pbl.io indexed in GSC for all prerendered URLs.
- Rich result eligible in Google Rich Results Test for homepage (Course) and one lesson (LearningResource).
- Top-3 result for at least 3 of these: `midnight credentials`, `midnight badges`, `proof of learned`, `midnight for cardano developers`, `aiken to compact`.
- Social share cards render correctly on Twitter/X, LinkedIn, Discord, Slack previews.

**Phase 2 (3-6 months):**
- First-page result for `learn midnight network` and `midnight network tutorial`.
- Measurable organic traffic visible in GSC (baseline from Phase 1, track delta).
- Top-10 result for at least one broader term (`cardano credentials` or `cardano developer course`).

## Constraints

- **Fork safety.** Every meta tag, canonical, OG URL, and sitemap must derive site origin from config (not be hard-coded to `midnight-pbl.io`). Forkers edit one file (likely `src/config/branding.ts` or a new `src/config/seo.ts`) and their fork works correctly.
- **Prerender compatibility.** Everything SEO-critical must work at build time — no client-side injection of meta tags.
- **Zero new runtime dependencies if possible.** Astro has sitemap + integrations built-in; prefer those over extra npm packages.
- **No changes to lesson content pipeline.** Lesson content is authored in `content/midnight-for-cardano-devs/`; SEO additions happen in layouts and the homepage, not in lesson markdown.

## Open questions to resolve during planning

1. **Fork-friendly site origin.** Add `PUBLIC_SITE_URL` env var, or derive from `BRANDING.links` by adding a `siteUrl` field? (Recommend: new `BRANDING.siteUrl` field, since branding is already the fork-edit point.)
2. **Twitter handle for `twitter:site`.** Is there a `@midnightpbl` or `@andamio_io` handle to use?
3. **GSC verification.** Who owns the Search Console property — James personally, or an Andamio org account? Also verify Bing Webmaster Tools?
4. **Per-lesson description source.** Do lessons in the Andamio API have a `description` / `summary` field we can surface, or do we extract first 150 chars of markdown body?
5. **`og:image` per module.** One static image for launch is fine. Should each of the 6 modules get its own OG image variant later, or is this always one image?
6. **Andamio protocol term: "proof of learned" vs "proof of learning."** Which is the canonical phrase? Worth aligning with Andamio docs.

## Handoff to planning

Phase 1 breaks cleanly into two implementation tracks that a plan can tackle in parallel:
- **Track A (infra):** sitemap, robots, canonical/OG/meta plumbing in `BaseLayout.astro`, `og-image.png` asset, GSC verification.
- **Track B (content + schema):** homepage section additions, JSON-LD (Course / LearningResource / BreadcrumbList / FAQPage), lesson title/description wiring.

Both are low-risk and fully reversible. Recommend shipping as one PR so Google sees a coherent SEO uplift rather than churn.
