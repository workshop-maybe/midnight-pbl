---
title: "SEO Phase 1 — post-deploy validation checklist"
type: validation
status: pending
date: 2026-04-18
origin: docs/plans/2026-04-18-001-feat-seo-phase-1-plan.md
---

# SEO Phase 1 — post-deploy validation checklist

Run this once after the Phase 1 PR merges and the new head block, sitemap, and robots.txt reach production. Paste the results (or screenshots) into the PR description so the merge record shows rich-result eligibility.

All URLs below assume the production origin is `https://midnight-pbl.io`. For a fork, substitute the value of `BRANDING.siteUrl`.

## 1. Google Rich Results Test — homepage

URL: <https://search.google.com/test/rich-results>

- [ ] Paste `https://midnight-pbl.io/` into the Rich Results Test.
- [ ] Confirm **Course** is listed as a detected rich result with **zero errors** and zero warnings.
- [ ] Confirm **FAQPage** is listed as a detected rich result with **zero errors** and zero warnings.
- [ ] Click each result, verify the rendered fields (name, description, provider, FAQ entries) match the visible homepage copy exactly — Google demotes mismatches.

## 2. Google Rich Results Test — one lesson

Pick any prerendered lesson (e.g. `https://midnight-pbl.io/learn/101/1`).

- [ ] Paste the lesson URL into the Rich Results Test.
- [ ] Confirm **LearningResource** is detected with zero errors.
- [ ] Confirm **BreadcrumbList** is detected with zero errors.
- [ ] Verify the `isPartOf` reference on the LearningResource matches the homepage Course name exactly.

## 3. Schema.org validator (optional, catches issues Google ignores)

URL: <https://validator.schema.org/>

- [ ] Paste the homepage URL — confirm all emitted JSON-LD blocks validate with no errors.
- [ ] Paste one lesson URL — same check.

## 4. Twitter / X Card Validator

Twitter's public validator was retired; use the draft-tweet preview instead.

- [ ] In X, compose a new post with the homepage URL. Confirm the unfurled card shows the `og-image.png` (1200×630), the page title, and the description from `BRANDING`.
- [ ] If `BRANDING.twitterHandle` is set, confirm the `@handle` appears under the card.
- [ ] Repeat with one lesson URL — confirm the card uses `og:type=article` and the lesson-specific title + description.

## 5. LinkedIn Post Inspector

URL: <https://www.linkedin.com/post-inspector/>

- [ ] Paste the homepage URL. Confirm LinkedIn renders the OG image, title, and description.
- [ ] Paste one lesson URL. Confirm the lesson-specific title and description render.
- [ ] If LinkedIn shows a stale cache, click **Refresh** in the inspector and re-check.

## 6. Discord / Slack unfurl (quick smoke check)

- [ ] Paste the homepage URL into a private Discord or Slack channel. Confirm the unfurl shows the OG image + title + description.
- [ ] Paste one lesson URL. Confirm the lesson-specific preview.

## 7. `robots.txt`

- [ ] `curl -s https://midnight-pbl.io/robots.txt` — response is `text/plain`.
- [ ] Contains `User-agent: *`.
- [ ] Contains `Allow: /`.
- [ ] Contains `Disallow: /dashboard` and `Disallow: /learn/*/assignment` (or equivalents).
- [ ] Contains `Sitemap: https://midnight-pbl.io/sitemap-index.xml` — domain matches `BRANDING.siteUrl` (critical for forks).

## 8. Sitemap

- [ ] `curl -s https://midnight-pbl.io/sitemap-index.xml` — returns a sitemap index XML.
- [ ] Follow the nested sitemap URL(s) — confirm every prerendered route appears: `/`, each `/learn/{moduleCode}/{lessonIndex}`.
- [ ] Confirm no SSR / auth-gated URLs are listed: no `/dashboard`, no `/learn/*/assignment`, no `/api/*`.
- [ ] URL count equals `1 (homepage) + <number of lessons>` (currently 18 lessons → 19 URLs).

## 9. Per-page meta spot check

For the homepage and 3 lesson pages from different modules:

- [ ] View the page source. Confirm exactly **one** `<title>`, one `<meta name="description">`, one `<link rel="canonical">`.
- [ ] Canonical URL uses `https://` and matches the expected path (no duplicate slashes, no query strings).
- [ ] OG tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`) are present and populated (no empty `content=""`).
- [ ] Twitter tags (`twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`) present.
- [ ] Lesson pages use `og:type="article"`; homepage uses `og:type="website"`.
- [ ] Each lesson has a **distinct** `<meta name="description">` — none default to the homepage description.

## 10. `noindex` on auth-gated pages

- [ ] `curl -sL https://midnight-pbl.io/dashboard | grep -E 'name="robots"'` — confirm `content="noindex, nofollow"`.
- [ ] Repeat for one assignment URL (e.g. `/learn/101/assignment`) — same result.

## 11. Google Search Console (after verification)

Requires `BRANDING.gscVerification` to be set and redeployed first.

- [ ] GSC property is **Verified** (HTML tag method).
- [ ] Sitemap `sitemap-index.xml` submitted in GSC — status `Success`, discovered URL count matches step 8.
- [ ] Request indexing for the homepage and the top 3 lesson URLs.
- [ ] Baseline metric captured: GSC Performance tab shows zero impressions/clicks on merge day. Re-check at the 2-week and 4-week marks against the origin doc's success criteria.

## 12. Fork-safety grep

- [ ] From the repo root: `grep -rn "midnight-pbl.io" src/ public/ --exclude-dir=node_modules` — expected output is a single hit in `src/config/branding.ts:siteUrl`. Any other hit is a bug to fix before closing Phase 1.

---

If every checkbox above is green and pasted into the PR, Phase 1 is done. Any red items become follow-up issues, not blockers on the merge — indexing takes days to weeks regardless.
