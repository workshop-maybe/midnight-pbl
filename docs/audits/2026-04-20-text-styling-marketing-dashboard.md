---
date: 2026-04-20
surface: marketing-dashboard
tooling_used:
  - "@axe-core/cli@4.11.2 (rule engine axe-core 4.11.3)"
  - "Lighthouse 13.1.0 (npx headless Chrome)"
  - "manual keyboard walk"
  - "manual screen-reader walk (Orca 44 on Linux)"
status: draft
site_commit: b089512
---

# Marketing + dashboard + auth — Accessibility & Readability Audit

## Summary

This audit covers the marketing, dashboard, and error-page surfaces (`/`, `/learn`, `/dashboard`, `/learn/101/assignment`, `/404`, `/500`) at `site_commit` `b089512` using automated `axe-core` + Lighthouse sweeps against the deployed site, plus an automated Playwright typography pass (`scripts/audit/measure-typography.mjs`) at 375 / 768 / 1440 CSS px. Manual keyboard and screen-reader walks are deferred to a post-deploy re-audit pending the X-1 cascade fix (see "Manual walk-through notes" scope note). Headline finding: **H1 renders at the 17 px root font-size on every surface inspected — dashboard, landing, and assignment all collapse the visible heading hierarchy** (M-1, part of X-1; `text-2xl`/`sm:text-3xl` utilities are not overriding Tailwind v4's base `h1 { font-size: inherit }` reset). The dashboard is the worst case: H1/H2/H3 all at 17 px with body copy at 19.13 px, so every heading is *smaller* than its own body prose. Additional notable findings: `src/pages/index.astro:96` uses a `<p>` for the hero title so the landing has no `<h1>` at all (axe `page-has-heading-one`); the decorative Midnight-wordmark footer link at `src/pages/index.astro:287–295` has no accessible name (axe `link-name`); `/learn` serves a `<meta http-equiv="refresh">` redirect shim that fails WCAG 2.2.1 and drops lang/landmark/heading semantics on the shim HTML itself (axe critical `meta-refresh`); `/404` and `/500` via `BaseLayout.astro:78` never wrap their slot in a `<main>` landmark (axe `landmark-one-main` + `region`).

**Severity counts:** P0: 1  ·  P1: 3  ·  P2: 1  ·  Cross-surface (X-): 3

## Audit URL Inventory

Every URL audited, with the environment each was tested against.

| URL | Env | Auth required |
|---|---|---|
| `/` | `https://midnight-pbl.io` | no |
| `/learn` | `https://midnight-pbl.io` | no (redirects to `/` via `<meta http-equiv="refresh">` — see `src/pages/learn/index.astro:6`) |
| `/dashboard` | `https://midnight-pbl.io` | yes |
| `/learn/101/assignment` | `https://midnight-pbl.io` | yes |
| `/404` | `https://midnight-pbl.io` | no |
| `/500` | `https://midnight-pbl.io` | no |

## Findings

Each finding row is self-contained — severity, criterion, current state with a `file:line` anchor, proposed change, and blast radius. ID prefixes: `L-` for lesson pages, `M-` for marketing/dashboard, `X-` for cross-surface patterns that appear in more than one audit doc.

| ID | Severity | Criterion | Page | Current (`file:line`) | Expected | Blast radius | Issue # |
|---|---|---|---|---|---|---|---|
| M-1 | P0 | Readability: modular hierarchy (plan §Context — H1 > H2 > H3 > body) | `/dashboard` | `src/pages/dashboard.astro:38` (H1 declares `text-2xl sm:text-3xl md:text-4xl` but computes to 17 px at 375/768/1440), `src/components/dashboard/AccountDetails.tsx:62` (H2 declares `text-lg` but computes to 17 px), `src/components/dashboard/ModuleProgress.tsx:66` (H3 declares `text-sm` and computes to 17 px). Body `<p>` at `src/pages/dashboard.astro:41` renders 19.13 px — larger than every heading. | Declare explicit heading sizes that resolve to H1 > H2 > H3 > body at every breakpoint (do not rely on prose-default inheritance; dashboard uses no `.prose-*` wrapper). H1 fix likely shared with X-1. | cross-surface at the H1 level (X-1); H2 + H3 flattening is dashboard-specific because no `.prose-*` wrapper applies | #<tbd> |
| M-2 | P1 | WCAG 2.2 A — 1.3.1 Info and Relationships (axe `page-has-heading-one` best-practice) | `/` | `src/pages/index.astro:96` — hero title (`BRANDING.hero.title`) is rendered as `<p class="font-heading text-4xl font-bold tracking-tight text-mn-text sm:text-5xl md:text-6xl">` instead of `<h1>`. Confirmed by axe on `/` and by the typography script's "body p" selector matching the display-size hero copy rather than the course description | Promote the hero title element from `<p>` to `<h1>` at `src/pages/index.astro:96` (utility classes unchanged). Side-effect fix: axe's `page-has-heading-one` violation on `/` clears, and the typography measurement script then selects the real course-description `<p>` at `src/pages/index.astro:107` as the body sample. | landing page only | #<tbd> |
| M-3 | P1 | WCAG 2.2 A — 2.4.4 Link Purpose + 4.1.2 Name, Role, Value | `/` | `src/pages/index.astro:287–295` — decorative Midnight-wordmark footer link: `<a href={BRANDING.links.midnight} target="_blank" rel="noopener noreferrer"><img src={BRANDING.logo.wordmark} alt="" class="h-6 opacity-20 …"/></a>`. Image's `alt=""` intentionally suppresses the logo from AT, leaving the `<a>` with no accessible name. Flagged by both axe (`link-name`, 1 node) and Lighthouse (`link-name`, score 0). | Add `aria-label="Midnight Network"` to the `<a>` (or provide a non-empty, purpose-describing `alt` on the `<img>`). Keep the visual styling unchanged. | landing page only (single instance in repo) | #<tbd> |
| M-4 | P1 | WCAG 2.2 A — 2.2.1 Timing Adjustable (axe `meta-refresh`, impact critical) | `/learn` | `src/pages/learn/index.astro:6` — `Astro.redirect("/")` on a prerendered page emits a `<meta http-equiv="refresh" content="2;url=/">` shim HTML. The shim fails `meta-refresh` (2 s delay, no user control) and additionally drops `html[lang]` (WCAG 3.1.1), a `<main>` landmark, a level-1 heading, and puts page content outside any landmark (the fallback `<a>`). Five axe rules total. | Either (a) delete `src/pages/learn/index.astro` entirely if `/learn` no longer needs to exist as a distinct route, or (b) replace the meta-refresh shim with a server-issued 301/302 HTTP redirect so no shim HTML is rendered. The single consolidating fix clears all five rules flagged on this URL. | `/learn` redirect shim only | #<tbd> |
| M-5 | P2 | axe best-practice — `landmark-one-main` + `region` | `/404`, `/500` | `src/layouts/BaseLayout.astro:78` — the base layout renders `<slot />` directly inside `<body>` with no `<main>` wrapper. `src/pages/404.astro:7` and `src/pages/500.astro:6` wrap content in a plain `<div class="flex min-h-screen items-center justify-center">`, so neither a `<main>` landmark nor any other landmark contains the error copy. Axe flags both rules on both pages. Not a strict WCAG AA failure, but AppLayout (`src/layouts/AppLayout.astro:37`) already wraps its slot in `<main class="flex-1">`, so BaseLayout is the one-off divergence. | Add a `<main class="flex-1">` wrapper around `<slot />` in `BaseLayout.astro` (parallels the AppLayout pattern) OR switch `404.astro` and `500.astro` to AppLayout so they inherit the `<main>` wrapper. Either fix clears both `landmark-one-main` and `region` on both pages in one change. | `/404`, `/500`, and any future page that extends BaseLayout directly | #<tbd> |

## Cross-Surface Patterns

Populated after both per-surface audits are complete (see plan Unit 7). Each row maps an `X-N` ID to the per-surface findings it spans. IDs are stable — once introduced, they are not renumbered, so both audit docs can reference the same `X-N` by name.

| ID | Pattern | Root cause (file) | Appears in | Consolidating issue # |
|---|---|---|---|---|
| X-1 | H1 renders at the 17 px root font-size on every surface audited — `text-2xl` / `sm:text-3xl` / `sm:text-3xl md:text-4xl` utilities on `<h1>` elements do not override Tailwind v4's preflight `h1 { font-size: inherit }` reset | Tailwind v4 preflight + utility-cascade failure for the `h1` element. Surfaces it at: `src/pages/learn/[moduleCode]/[lessonIndex].astro:133` (lesson), `src/pages/dashboard.astro:38` (dashboard), `src/pages/learn/[moduleCode]/assignment.astro` (assignment H1), and hero-title `<p>` at `src/pages/index.astro:96` (landing has no `<h1>` — see M-2). | lesson pages (L-5), marketing/dashboard (M-1 at H1 level; also landing + assignment) | #<tbd> |
| X-2 | `.prose-midnight` body prose renders at ~14.9 px (0.875rem @ 17 px root), below the 16 px readability target at every viewport | `src/styles/globals.css:141` — `.prose-midnight { font-size: 0.875rem }` | lesson pages (L-4); marketing/dashboard — assignment surface inherits `.prose-midnight` (14.88 px at 375/768 px per typography script); fix propagates without a separate M-ID | #<tbd> |
| X-3 | `.prose-midnight` line measure overshoots the 75 ch upper bound at ≥ 768 px — no prose-level `max-width` cap on the reading container | `src/pages/learn/[moduleCode]/[lessonIndex].astro:126` (lesson, `max-w-5xl`) and the assignment layout both let `.prose-midnight` grow with the outer container; fix likely at `.prose-midnight` in `src/styles/globals.css` via `max-width: 75ch` on body copy | lesson pages (L-6: ~95 ch @ 768 px, ~139 ch @ 1440 px); marketing/dashboard — assignment surface ~79.7 ch @ 768 px; fix propagates without a separate M-ID | #<tbd> |

## Validation Checklist

Before marking this audit `status: complete`, confirm:

- [ ] Every URL in the inventory has been audited (automated + manual where applicable)
- [ ] Every raw finding from the appendix is either in the table or explicitly dismissed with a reason
- [ ] Every P0 has a filed issue # in the table
- [ ] Cross-surface patterns have been cross-referenced into the other audit doc (if one exists)
- [ ] Tooling output appendix contains the raw axe and Lighthouse results (JSON or scrollable capture) for traceability
- [ ] `site_commit` frontmatter field records the short SHA of the deployed site at audit time
- [ ] Summary paragraph + severity counts reflect the final table

## Appendix: Tooling Output

Raw tool output goes here for traceability — paste or link. Prefer committing compact JSON over lengthy HTML dumps; truncate and link to full output when the raw result is large.

### axe-core

Unit 5 automated pass — raw capture per auth-not-required URL. One block per URL: invocation, exit code, timestamp, counts, rule-level summary (verbatim trimmed JSON), and the first violation node verbatim per unique rule. Triage of these findings is deferred to #17; the table above is intentionally not populated by this unit.

All captures in this section ran against the deployed site at short SHA `b089512` (resolved via `git rev-parse --short origin/main` at capture time). The axe headless default viewport was `780x437`; reruns at standard breakpoints (`375`, `768`, `1440`) were not performed in this unit and are flagged as a gap for #16 to cover manually (R7).

**Resolve binaries (one-time preamble).** Chrome 146.0.7680.165 + matching ChromeDriver were installed via `browser-driver-manager` and exported to environment variables the subsequent commands reference:

```bash
npx browser-driver-manager@latest install chrome --version 146
export CHROME_PATH=$(npx browser-driver-manager@latest which chrome --version 146)
export CHROMEDRIVER_PATH=$(npx browser-driver-manager@latest which chromedriver --version 146)
```

Each axe and Lighthouse invocation below references `$CHROMEDRIVER_PATH` / `$CHROME_PATH` so the commands are re-runnable as-is given the preamble has been executed in the same shell.

---

#### `/` (landing) — `https://midnight-pbl.io/`

- **Command:** `npx @axe-core/cli https://midnight-pbl.io/ --chromedriver-path "$CHROMEDRIVER_PATH" --save axe-root.json --dir /tmp/agency-15`
- **CLI package:** `@axe-core/cli@4.11.2` (rule engine `axe-core@4.11.3`)
- **Runner:** `chrome-headless` via webdriverjs (CLI default)
- **Exit code:** `0`
- **Captured:** 2026-04-20T17:24:14.535Z against `https://midnight-pbl.io/` (deployed `b089512`)
- **Headline:** 2 violations across 2 nodes (1 `link-name` + 1 `page-has-heading-one`); 28 passes; 0 incomplete; 60 inapplicable

Rule-level summary (verbatim trimmed JSON):

```json
{
  "testEngine": { "name": "axe-core", "version": "4.11.3" },
  "testEnvironment": {
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.0.0 Safari/537.36",
    "viewport": "780x437"
  },
  "url": "https://midnight-pbl.io/",
  "timestamp": "2026-04-20T17:24:14.535Z",
  "counts": { "violations": 2, "passes": 28, "incomplete": 0, "inapplicable": 60 },
  "ruleLevelSummary": [
    {
      "id": "link-name",
      "impact": "serious",
      "tags": ["cat.name-role-value", "wcag2a", "wcag244", "wcag412"],
      "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/link-name?application=webdriverjs"
    },
    {
      "id": "page-has-heading-one",
      "impact": "moderate",
      "tags": ["cat.semantics", "best-practice"],
      "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/page-has-heading-one?application=webdriverjs"
    }
  ]
}
```

First violation node — `link-name` (verbatim from `violations[0].nodes[0]`):

```json
{
  "any": [
    { "id": "has-visible-text", "data": null, "impact": "serious",
      "message": "Element does not have text that is visible to screen readers" },
    { "id": "aria-label", "data": null, "impact": "serious",
      "message": "aria-label attribute does not exist or is empty" },
    { "id": "aria-labelledby", "data": null, "impact": "serious",
      "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty" },
    { "id": "non-empty-title", "data": { "messageKey": "noAttr" }, "impact": "serious",
      "message": "Element has no title attribute" }
  ],
  "all": [],
  "none": [
    { "id": "focusable-no-name", "data": null, "impact": "serious",
      "message": "Element is in tab order and does not have accessible text" }
  ],
  "impact": "serious",
  "html": "<a href=\"https://midnight.network\" target=\"_blank\" rel=\"noopener noreferrer\"> <img src=\"/midnight_logo_pack/01_symbol_wordmark/Horizontal/Midnight-RGB_Logo-Horizontal-White.svg\" alt=\"\" class=\"h-6 opacity-20 transition-opacity hover:opacity-40\"> </a>",
  "target": [".mt-16 > a[href$=\"midnight.network\"][target=\"_blank\"][rel=\"noopener noreferrer\"]"],
  "failureSummary": "Fix all of the following:\n  Element is in tab order and does not have accessible text\n\nFix any of the following:\n  Element does not have text that is visible to screen readers\n  aria-label attribute does not exist or is empty\n  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty\n  Element has no title attribute"
}
```

First violation node — `page-has-heading-one` (verbatim from `violations[1].nodes[0]`):

```json
{
  "any": [],
  "all": [
    { "id": "page-has-heading-one", "data": null, "impact": "moderate",
      "message": "Page must have a level-one heading" }
  ],
  "none": [],
  "impact": "moderate",
  "html": "<html lang=\"en\">",
  "target": ["html"],
  "failureSummary": "Fix all of the following:\n  Page must have a level-one heading"
}
```

---

#### `/learn` — `https://midnight-pbl.io/learn`

- **Command:** `npx @axe-core/cli https://midnight-pbl.io/learn --chromedriver-path "$CHROMEDRIVER_PATH" --save axe-learn.json --dir /tmp/agency-15`
- **Exit code:** `0`
- **Captured:** 2026-04-20T17:24:53.810Z against `https://midnight-pbl.io/learn` (deployed `b089512`)
- **Headline:** 5 violations across 5 nodes; 5 passes; 1 incomplete; 79 inapplicable
- **Note on redirect:** `/learn` is served by `src/pages/learn/index.astro:6` which issues a `meta-refresh` redirect to `/`. axe audits the intermediate redirect HTML (a bare `<html>` with a `<meta http-equiv="refresh">` and a fallback `<a>`) rather than the target. This is why the `/learn` capture surfaces rules that `/` does not (e.g. `meta-refresh`, `html-has-lang`) — they describe the redirect shim, not the landing page.

Rule-level summary (verbatim trimmed JSON):

```json
{
  "testEngine": { "name": "axe-core", "version": "4.11.3" },
  "testEnvironment": {
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.0.0 Safari/537.36",
    "viewport": "780x437"
  },
  "url": "https://midnight-pbl.io/learn",
  "timestamp": "2026-04-20T17:24:53.810Z",
  "counts": { "violations": 5, "passes": 5, "incomplete": 1, "inapplicable": 79 },
  "ruleLevelSummary": [
    { "id": "html-has-lang", "impact": "serious",
      "tags": ["cat.language", "wcag2a", "wcag311"], "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/html-has-lang?application=webdriverjs" },
    { "id": "landmark-one-main", "impact": "moderate",
      "tags": ["cat.semantics", "best-practice"], "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/landmark-one-main?application=webdriverjs" },
    { "id": "meta-refresh", "impact": "critical",
      "tags": ["cat.time-and-media", "wcag2a", "wcag221"], "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/meta-refresh?application=webdriverjs" },
    { "id": "page-has-heading-one", "impact": "moderate",
      "tags": ["cat.semantics", "best-practice"], "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/page-has-heading-one?application=webdriverjs" },
    { "id": "region", "impact": "moderate",
      "tags": ["cat.keyboard", "best-practice"], "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/region?application=webdriverjs" }
  ]
}
```

First violation node — `html-has-lang` (verbatim from `violations[0].nodes[0]`):

```json
{
  "any": [
    { "id": "has-lang", "data": { "messageKey": "noLang" }, "impact": "serious",
      "message": "The <html> element does not have a lang attribute" }
  ],
  "all": [], "none": [], "impact": "serious",
  "html": "<html><head><title>Redirecting to: /</title><meta http-equiv=\"refresh\" content=\"2;url=/\"><meta name=\"robots\" content=\"noindex\"><link rel=\"canonical\" href=\"https://midnight-pbl.io/\"></head><body>\t<a href=\"/\">Redirecting from <code>/learn/</code> to <code>/</code></a></body></html>",
  "target": ["html"],
  "failureSummary": "Fix any of the following:\n  The <html> element does not have a lang attribute"
}
```

First violation node — `landmark-one-main` (verbatim from `violations[1].nodes[0]`):

```json
{
  "any": [], "all": [
    { "id": "page-has-main", "data": null, "impact": "moderate",
      "message": "Document does not have a main landmark" }
  ], "none": [], "impact": "moderate",
  "html": "<html><head><title>Redirecting to: /</title>…</head><body>\t<a href=\"/\">Redirecting from <code>/learn/</code> to <code>/</code></a></body></html>",
  "target": ["html"],
  "failureSummary": "Fix all of the following:\n  Document does not have a main landmark"
}
```

First violation node — `meta-refresh` (verbatim from `violations[2].nodes[0]`):

```json
{
  "any": [
    { "id": "meta-refresh", "data": { "redirectDelay": 2 }, "impact": "critical",
      "message": "<meta> tag forces timed refresh of page (less than 20 hours)" }
  ],
  "all": [], "none": [], "impact": "critical",
  "html": "<meta http-equiv=\"refresh\" content=\"2;url=/\">",
  "target": ["meta[http-equiv=\"refresh\"]"],
  "failureSummary": "Fix any of the following:\n  <meta> tag forces timed refresh of page (less than 20 hours)"
}
```

First violation node — `page-has-heading-one` (verbatim from `violations[3].nodes[0]`):

```json
{
  "any": [], "all": [
    { "id": "page-has-heading-one", "data": null, "impact": "moderate",
      "message": "Page must have a level-one heading" }
  ], "none": [], "impact": "moderate",
  "html": "<html><head><title>Redirecting to: /</title>…</head><body>\t<a href=\"/\">Redirecting from <code>/learn/</code> to <code>/</code></a></body></html>",
  "target": ["html"],
  "failureSummary": "Fix all of the following:\n  Page must have a level-one heading"
}
```

First violation node — `region` (verbatim from `violations[4].nodes[0]`):

```json
{
  "any": [
    { "id": "region", "data": { "isIframe": false }, "impact": "moderate",
      "message": "Some page content is not contained by landmarks" }
  ],
  "all": [], "none": [], "impact": "moderate",
  "html": "<a href=\"/\">Redirecting from <code>/learn/</code> to <code>/</code></a>",
  "target": ["a"],
  "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
}
```

---

#### `/404` — `https://midnight-pbl.io/404`

- **Command:** `npx @axe-core/cli https://midnight-pbl.io/404 --chromedriver-path "$CHROMEDRIVER_PATH" --save axe-404.json --dir /tmp/agency-15`
- **Exit code:** `0`
- **Captured:** 2026-04-20T17:24:38.337Z against `https://midnight-pbl.io/404` (deployed `b089512`)
- **Headline:** 2 violations across 2 nodes (`landmark-one-main` + `region`); 13 passes; 0 incomplete; 75 inapplicable
- **Note:** `/404` is prerendered at build time (see `src/pages/404.astro`). axe audits the static HTML as served; it does not exercise the Cloud Run error path.

Rule-level summary (verbatim trimmed JSON):

```json
{
  "testEngine": { "name": "axe-core", "version": "4.11.3" },
  "testEnvironment": {
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.0.0 Safari/537.36",
    "viewport": "780x437"
  },
  "url": "https://midnight-pbl.io/404",
  "timestamp": "2026-04-20T17:24:38.337Z",
  "counts": { "violations": 2, "passes": 13, "incomplete": 0, "inapplicable": 75 },
  "ruleLevelSummary": [
    { "id": "landmark-one-main", "impact": "moderate",
      "tags": ["cat.semantics", "best-practice"], "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/landmark-one-main?application=webdriverjs" },
    { "id": "region", "impact": "moderate",
      "tags": ["cat.keyboard", "best-practice"], "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/region?application=webdriverjs" }
  ]
}
```

First violation node — `landmark-one-main` (verbatim from `violations[0].nodes[0]`):

```json
{
  "any": [], "all": [
    { "id": "page-has-main", "data": null, "impact": "moderate",
      "message": "Document does not have a main landmark" }
  ], "none": [], "impact": "moderate",
  "html": "<html lang=\"en\">",
  "target": ["html"],
  "failureSummary": "Fix all of the following:\n  Document does not have a main landmark"
}
```

First violation node — `region` (verbatim from `violations[1].nodes[0]`):

```json
{
  "any": [
    { "id": "region", "data": { "isIframe": false }, "impact": "moderate",
      "message": "Some page content is not contained by landmarks" }
  ],
  "all": [], "none": [], "impact": "moderate",
  "html": "<div class=\"flex min-h-screen items-center justify-center\">",
  "target": [".min-h-screen.items-center"],
  "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
}
```

---

#### `/500` — `https://midnight-pbl.io/500`

- **Command:** `npx @axe-core/cli https://midnight-pbl.io/500 --chromedriver-path "$CHROMEDRIVER_PATH" --save axe-500.json --dir /tmp/agency-15`
- **Exit code:** `0`
- **Captured:** 2026-04-20T17:24:41.487Z against `https://midnight-pbl.io/500` (deployed `b089512`)
- **Headline:** 2 violations across 2 nodes (`landmark-one-main` + `region`); 13 passes; 0 incomplete; 75 inapplicable
- **Note:** `/500` is a prerendered static asset (see `src/pages/500.astro`). Running axe against the static URL is valid but does not exercise the real 500 error path — Astro renders `500.astro` at build time, and Cloud Run's own 5xx response would bypass this asset entirely. Recording as static-HTML evidence per the edge case called out in the plan.

Rule-level summary (verbatim trimmed JSON):

```json
{
  "testEngine": { "name": "axe-core", "version": "4.11.3" },
  "testEnvironment": {
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.0.0 Safari/537.36",
    "viewport": "780x437"
  },
  "url": "https://midnight-pbl.io/500",
  "timestamp": "2026-04-20T17:24:41.487Z",
  "counts": { "violations": 2, "passes": 13, "incomplete": 0, "inapplicable": 75 },
  "ruleLevelSummary": [
    { "id": "landmark-one-main", "impact": "moderate",
      "tags": ["cat.semantics", "best-practice"], "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/landmark-one-main?application=webdriverjs" },
    { "id": "region", "impact": "moderate",
      "tags": ["cat.keyboard", "best-practice"], "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/region?application=webdriverjs" }
  ]
}
```

First violation node — `landmark-one-main` (verbatim from `violations[0].nodes[0]`):

```json
{
  "any": [], "all": [
    { "id": "page-has-main", "data": null, "impact": "moderate",
      "message": "Document does not have a main landmark" }
  ], "none": [], "impact": "moderate",
  "html": "<html lang=\"en\">",
  "target": ["html"],
  "failureSummary": "Fix all of the following:\n  Document does not have a main landmark"
}
```

First violation node — `region` (verbatim from `violations[1].nodes[0]`):

```json
{
  "any": [
    { "id": "region", "data": { "isIframe": false }, "impact": "moderate",
      "message": "Some page content is not contained by landmarks" }
  ],
  "all": [], "none": [], "impact": "moderate",
  "html": "<div class=\"flex min-h-screen items-center justify-center\">",
  "target": ["body > .min-h-screen"],
  "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
}
```

---

#### Auth-required URLs (R3)

- `/dashboard` — **manual-only — deferred to #16.** Wallet auth requires a CIP-30 signature loop (`WalletController` → `buildSession` → `validateSignature` → JWT in `localStorage`); a headed browser with a pre-saved session is not reproducible in this agent environment without exposing wallet secrets. The manual walk-through in #16 will audit this surface with an authenticated session.
- `/learn/101/assignment` — **manual-only — deferred to #16.** Same reason: the assignment route is SSR-gated behind the same wallet JWT as `/dashboard` (see `src/pages/learn/[moduleCode]/assignment.astro`). Module `101` is the representative choice per R8; if it fails to render at manual-audit time, fall back to `102` and note the substitution in #16.

### Lighthouse

Unit 5 automated pass — landing page plus one additional URL per R4/AC-4. The authenticated-page capture is deferred per the same CIP-30 constraint documented in the axe section above; the `/learn` fallback is used with the explicit note that it redirects to `/`. Triage of the findings below belongs to #17.

---

#### `/` (landing) — `https://midnight-pbl.io/`

- **Method:** `npx lighthouse@13 https://midnight-pbl.io/ --only-categories=accessibility --output=json --output-path=/tmp/agency-15/lh-root.json --chrome-flags="--headless=new --no-sandbox" --chrome-path="$CHROME_PATH"` (Chrome DevTools panel was not available in this agent environment — `npx` headless was the R4 acceptable fallback, matching the lesson-pages pattern)
- **Lighthouse version:** 13.1.0 (reported by the JSON `lighthouseVersion`)
- **User agent:** `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.0.0 Safari/537.36`
- **URL audited:** `https://midnight-pbl.io/` (deployed `b089512`)
- **Accessibility score:** **96 / 100**

Failing audits (score < 1, non-manual):

- `link-name` — *Links do not have a discernible name.* (score 0) — overlaps with axe's `link-name` node above; both tools surface the decorative Midnight-wordmark `<a>` in the footer as accessible-name-less. Likely an `X-` cross-surface candidate in Unit 7 if lesson pages share the same footer chrome.

Manual-review audits Lighthouse cannot automate (to be covered by #16 keyboard + screen-reader walk):

- `focusable-controls`, `interactive-element-affordance`, `logical-tab-order`, `visual-order-follows-dom`, `focus-traps`, `managed-focus`, `use-landmarks`, `offscreen-content-hidden`, `custom-controls-labels`, `custom-controls-roles`

---

#### `/learn` — `https://midnight-pbl.io/learn` (fallback per R4/AC-4)

- **Method:** `npx lighthouse@13 https://midnight-pbl.io/learn --only-categories=accessibility --output=json --output-path=/tmp/agency-15/lh-learn.json --chrome-flags="--headless=new --no-sandbox" --chrome-path="$CHROME_PATH"`
- **Lighthouse version:** 13.1.0
- **User agent:** `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.0.0 Safari/537.36`
- **Requested URL:** `https://midnight-pbl.io/learn`
- **Final displayed URL:** `https://midnight-pbl.io/` (Lighthouse followed the `meta-refresh` redirect emitted by `src/pages/learn/index.astro:6` and audited the target)
- **Accessibility score:** **96 / 100**

Explicit note on fallback (per AC-4): `/learn` redirects to `/`, so this Lighthouse run audited the landing page rather than a distinct module index. The authenticated-page Lighthouse pass against `/dashboard` or `/learn/101/assignment` is deferred to #16 because headed authenticated Chrome is not reproducible in this agent environment (CIP-30 wallet signature loop + JWT in localStorage; the R4 fallback is taken here).

Failing audits (score < 1, non-manual):

- `link-name` — identical to the `/` run above, as expected given the redirect target is `/`.

Manual-review audits Lighthouse cannot automate:

- `focusable-controls`, `interactive-element-affordance`, `logical-tab-order`, `visual-order-follows-dom`, `focus-traps`, `managed-focus`, `use-landmarks`, `offscreen-content-hidden`, `custom-controls-labels`, `custom-controls-roles`

### Manual walk-through notes

**Scope note (2026-04-22):** This pass covers AC-3 (typography hierarchy comparison) only. Keyboard walk (AC-1), screen-reader walk (AC-2), and error-page notes (AC-4) are deferred to a post-deploy re-audit — the expectation is that the H1-at-root-size defect (X-N candidate below) lands a fix first, after which the full manual walk runs against the fixed site. #16 stays open until all four ACs are covered.

Typography measurements are captured by an automated Playwright script committed at `scripts/audit/measure-typography.mjs`. Rerun at any time: `node scripts/audit/measure-typography.mjs` for public pages, or `STORAGE_STATE=scripts/audit/.auth/user.json node scripts/audit/measure-typography.mjs` for auth-gated surfaces after running `scripts/audit/save-auth.mjs` with an injected JWT.

#### Keyboard walk-through

**Deferred** to post-deploy re-audit. Scope choice by the audit owner for this pass.

#### Screen-reader walk-through

**Deferred** to post-deploy re-audit.

#### Typography measurements

Captured 2026-04-22 11:42 UTC against `https://midnight-pbl.io` via the Playwright script. The script visits each URL at 375 / 768 / 1440 CSS px, waits for `document.fonts.ready`, reads `getComputedStyle().fontSize` and `lineHeight` on the first *visible* H1 / H2 / H3 / `<p>` inside each page's declared content container, and computes `ch` measure from the actual "0"-glyph advance in that paragraph's font (i.e., the browser's own `ch` unit — the same unit Tailwind's `max-w-[75ch]` utility resolves against).

**Targets (from plan):** body ≥ 16 px, line-height ≥ 1.5, measure 45–75 ch.

**Baseline from `src/styles/globals.css:141` (static):** `.prose-midnight` body = `0.875rem / 1.7`. Root font-size measured at runtime: **17 px** across all four surfaces.

##### Landing — `/`

Content container: `main`. Title selector fallback: `main h1, main h2` (see matched-text note below — the landing has no distinct H1).

| Viewport | Container (px) | body `<p>` px / LH (ratio) | measure (ch) | H1 px / LH | H2 px / LH | H3 px / LH |
|---|---|---|---|---|---|---|
| 375px  | 375  | 38.25 / 42.5 (1.11) | ~8.7 | 17 / 24.29 (1.43) | 17 / 24.29 (1.43) | — |
| 768px  | 768  | 63.75 / 63.75 (1)   | ~8.6 | 17 / 24.29 (1.43) | 17 / 24.29 (1.43) | — |
| 1440px | 1440 | 63.75 / 63.75 (1)   | ~8.6 | 17 / 24.29 (1.43) | 17 / 24.29 (1.43) | — |

Matched text at 1440 px: H1/title = **"Modules"**, H2 = **"Modules"**, body `<p>` = **"midnight pbl"**. The only paragraph the script could find is the site title rendered at display size; the only headings are both the "Modules" section label. See M-2 finding below.

##### Dashboard — `/dashboard`

Content container: `main`. Auth: injected JWT via `scripts/audit/save-auth.mjs`.

| Viewport | Container (px) | body `<p>` px / LH (ratio) | measure (ch) | H1 px / LH | H2 px / LH | H3 px / LH |
|---|---|---|---|---|---|---|
| 375px  | 375  | 17 / 25.5 (1.5)     | ~34.1 | 17 / 22.67 (1.33) | 17 / 26.44 (1.56) | 17 / 23.38 (1.38) |
| 768px  | 768  | 19.13 / 29.75 (1.56)| ~64.9 | 17 / 18.89 (1.11) | 17 / 26.44 (1.56) | 17 / 23.38 (1.38) |
| 1440px | 1440 | 19.13 / 29.75 (1.56)| ~64.9 | 17 / 18.89 (1.11) | 17 / 26.44 (1.56) | 17 / 23.38 (1.38) |

Matched text at 1440 px: H1 = **"Your Progress"**, H2 = **"Account"**, H3 = **"Your First Midnight DApp"**, body `<p>` = **"Track your enrollment status across all 6 modules…"**. Body copy passes the 16 px target; every heading is at 17 px = root font-size. See M-1 finding below.

##### Assignment — `/learn/101/assignment`

Content container: `main`. Auth: same injected JWT.

| Viewport | Container (px) | body `<p>` px / LH (ratio) | measure (ch) | H1 px / LH | H2 px / LH | H3 px / LH |
|---|---|---|---|---|---|---|
| 375px  | 375  | 14.88 / 25.29 (1.7) | ~37.9 | 17 / 22.67 (1.33) | 29.75 / 38.67 (1.3)  | 21.25 / 27.63 (1.3) |
| 768px  | 768  | 14.88 / 25.29 (1.7) | ~79.7 | 17 / 20.4  (1.2)  | 29.75 / 38.67 (1.3)  | 21.25 / 27.63 (1.3) |
| 1440px | 1440 | 11 / 16.5 (1.5)     | ~35.7 | 17 / 20.4  (1.2)  | 17    / 21.25 (1.25) | 21.25 / 27.63 (1.3) |

Matched text at 1440 px: H1 = **"Module 101 Assignment — Your First Midnight DApp"**, H2 = **"Your First Midnight DApp"**, H3 = **"SLT 101.1 — Scaffold and deploy a Midnight DApp"**, body `<p>` = **"Lessons"**. At 375/768 px the assignment mirrors the lesson page (prose container = `.prose-midnight`, body 14.88 px, in-content H2 at 29.75 px). At 1440 px the layout shifts — the first visible `<p>` inside `<main>` becomes a sidebar lesson-list item at 11 px, not the prose body. This is a layout-mode change at a `lg:` breakpoint, not a typography change per se, but it means the prose is competing for visual weight with a narrow sidebar on desktop.

##### Lesson — `/learn/101/1` (reference)

Content container: `.prose-midnight`. Included as cross-reference; numbers match the lesson-pages audit (Unit 3) within rounding.

| Viewport | Container (px) | body `<p>` px / LH (ratio) | measure (ch) | H1 px / LH | H2 px / LH | H3 px / LH |
|---|---|---|---|---|---|---|
| 375px  | 341  | 14.88 / 25.29 (1.7) | ~37.9  | 17 / 22.67 (1.33) | 29.75 / 38.67 (1.3) | 21.25 / 27.63 (1.3) |
| 768px  | 717  | 14.88 / 25.29 (1.7) | ~79.7  | 17 / 20.4  (1.2)  | 29.75 / 38.67 (1.3) | 21.25 / 27.63 (1.3) |
| 1440px | 1037 | 14.88 / 25.29 (1.7) | ~115.2 | 17 / 20.4  (1.2)  | 29.75 / 38.67 (1.3) | 21.25 / 27.63 (1.3) |

Reading note on `ch`: Unit 3's manual walk reported ~45 / ~95 / ~139 ch using the `1ch ≈ 0.5em` approximation; the script uses the browser's own `ch` unit and reports ~37.9 / ~79.7 / ~115.2. Both are over the 75 ch target at 768 px and 1440 px — the direction of the L-5 finding stands.

##### AC-3 hierarchy comparison (1440 px snapshot)

The AC-3 deliverable. 1440 px chosen because inversions are most visually apparent at desktop widths; the same rows at 375 px and 768 px are recoverable from the per-surface tables above.

| Surface | Container (px) | H1 | H2 | H3 | Body `<p>` | Measure (ch) | Verdict |
|---|---|---|---|---|---|---|---|
| Landing    | 1440 | 17 | 17 | — | 63.75 *(display)* | ~8.6   | No hierarchy — only copy is the site title at display size; headings are 17 px = root |
| Dashboard  | 1440 | 17 | 17 | 17 | 19.13           | ~64.9  | Flat — every heading at root size; body copy passes 16 px |
| Assignment | 1440 | 17 | 17 *(sidebar)* | 21.25 | 11 *(sidebar)* | ~35.7  | Layout shift at `lg:`; sidebar wins "first visible" slot |
| Lesson     | 1037 | 17 | 29.75 | 21.25 | 14.88          | ~115.2 | Inverted H1 only (L-4); container exceeds 75 ch by 54% |

The pattern across three surfaces is the same: **H1 lands at 17 px (= root font-size) regardless of which Tailwind utility the page applies.** Only the lesson has in-content H2 / H3 rendering at their intended rem-scale sizes (29.75 px / 21.25 px from `.prose-midnight`). Dashboard and landing inherit no prose styles and their headings also collapse to 17 px.

#### Observations → candidate findings (for Unit 7 issue filing, NOT populated in the main table)

**Candidate X-1 (P0, UX hierarchy defect — WCAG-adjacent) — H1 renders at root font-size site-wide.**

Lesson (L-4), dashboard, assignment, and landing all render H1 at **17 px** at every viewport. Same root cause as lesson L-4: `text-2xl` / `sm:text-3xl` utilities on the H1 elements are not winning the cascade against Tailwind v4's base reset (`h1 { font-size: inherit }` or equivalent). What L-4 filed as "lesson pages only" is actually cross-surface. **Blast radius: every page on the site with an H1.** Proposed fix: diagnose whether Tailwind v4's preflight is being bypassed, or whether the utilities aren't being generated for these classes; add explicit `font-size` at the layout level if the utility path cannot be fixed.

**Candidate M-1 (P0, UX hierarchy defect) — Dashboard has zero visible heading hierarchy.**

All three levels on `/dashboard` render at 17 px (H1 "Your Progress", H2 "Account", H3 "Your First Midnight DApp"). Body copy (19.13 px) is *larger* than every heading. No reader can scan by heading size. Likely a corollary of X-1 at the H1 level, but H2 / H3 also collapse here because the dashboard uses no `.prose-*` wrapper — whatever Tailwind defaults apply, they flatten all three levels. Proposed fix: declare explicit heading sizes for dashboard components, do not rely on prose defaults.

**Candidate M-2 (P2, content/marketing defect — not strictly WCAG) — Logged-out landing has no body copy.**

The only `<p>` rendered on `/` is the site title "midnight pbl" at 38–63 px. The only heading is "Modules" at 17 px. A first-time visitor sees no onboarding prose, no hero explanation, no value proposition before attempting login. Surfaced by the typography sweep but primarily a product/marketing concern — flag for triage, not a WCAG issue.

**Related to L-3 (body ≥ 16 px):** Assignment inherits the same `.prose-midnight { font-size: 0.875rem }` at `src/styles/globals.css:141`, so at 375 / 768 px the assignment prose also renders at 14.88 px. When L-3 is fixed, assignment gets the fix for free — no separate M-finding needed.

**Related to L-5 (measure 45–75 ch):** Assignment at 768 px measures ~79.7 ch, over the 75 ch target. The container shares the `.prose-midnight` ancestry, so L-5's fix propagates. No separate M-finding.

#### Component sweep

**Deferred to the cross-surface synthesis (#18).** Unit 3's sweep of `src/components/` and `src/layouts/` (lesson-pages.md line 325–337) surfaced three `text-[11px]` occurrences, one in `LearnLayout.astro` and two in `EvidenceEditor.tsx`. A spot-check of `src/pages/dashboard.astro` and `src/pages/learn/[moduleCode]/assignment.astro` in this pass did not surface additional ad-hoc text utilities, but a full repeat against `src/pages/` is scoped to #18 so the cross-surface view is coherent with Unit 3's output.

### Triage dispositions — dismissals and absorptions

Every raw failure surfaced by axe, Lighthouse, or the typography script is accounted for in one of three places: it lives as an `M-N` row in the Findings table, as an `X-N` row in the Cross-Surface Patterns table, or it is explicitly dismissed / absorbed below. A row below is **not** a WCAG free pass — it is an explicit record that the finding was seen, considered, and either rolled into another finding or judged out-of-scope.

| Raw finding | URL | Disposition | Reason |
|---|---|---|---|
| axe `link-name` (1 node — footer wordmark `<a>`) | `/` | **Absorbed into M-3** | Same physical element; M-3 is the canonical row. |
| Lighthouse `link-name` (score 0) | `/` | **Duplicate of axe `link-name` — absorbed into M-3** | Lighthouse and axe both flag the same `<a>` at `src/pages/index.astro:287–295`. One fix clears both. |
| axe `page-has-heading-one` (1 node — no H1 on page) | `/` | **Absorbed into M-2** | Root cause is the hero title rendered as `<p>` at `src/pages/index.astro:96`. Promoting to `<h1>` clears the axe rule; M-2 is the canonical row. |
| axe `html-has-lang` (1 node — shim HTML missing `lang`) | `/learn` | **Absorbed into M-4** | The shim HTML emitted by `Astro.redirect("/")` at `src/pages/learn/index.astro:6` is not rendered through `BaseLayout.astro` (which sets `lang="en"` at line 41), so it has no `lang`. Deleting the shim or switching to an HTTP redirect clears all five `/learn` rules — M-4 is the consolidating row. |
| axe `landmark-one-main` (1 node — shim body has no `<main>`) | `/learn` | **Absorbed into M-4** | Same shim-structure root cause. |
| axe `page-has-heading-one` (1 node — shim has no H1) | `/learn` | **Absorbed into M-4** | Same shim-structure root cause. |
| axe `meta-refresh` (1 node — `<meta http-equiv="refresh" content="2;url=/">`, impact critical) | `/learn` | **Canonical — drives M-4** | The meta-refresh *is* the finding; the other four `/learn` rules are side-effects of the shim structure. M-4 is written so a single fix resolves all five. |
| axe `region` (1 node — fallback `<a>` outside any landmark) | `/learn` | **Absorbed into M-4** | Same shim-structure root cause. |
| Lighthouse `link-name` (score 0) | `/learn` | **Duplicate — absorbed into M-3** | Lighthouse followed the `meta-refresh` to `/` and audited the landing page (see `finalDisplayedUrl` in the appendix), so this is the same finding as the `/` `link-name` result. |
| axe `landmark-one-main` (1 node) | `/404` | **Absorbed into M-5** | `BaseLayout.astro:78` renders `<slot />` without a `<main>` wrapper; M-5 is the canonical row covering both `/404` and `/500`. |
| axe `region` (1 node — content div outside any landmark) | `/404` | **Absorbed into M-5** | Same root cause as `landmark-one-main`; one wrapper fix clears both rules. |
| axe `landmark-one-main` (1 node) | `/500` | **Absorbed into M-5** | Same as `/404`. |
| axe `region` (1 node) | `/500` | **Absorbed into M-5** | Same as `/404`. |
| Typography script "Landing has no body copy" observation (Playwright typography pass, 1440 px) | `/` | **Dismissed as a measurement artifact of M-2** | The script's "first visible `<p>` in `<main>`" selector matched the hero-title `<p>` at `src/pages/index.astro:96` (display-size text) rather than the course-description `<p>` at line 107. Promoting the hero title to `<h1>` (per M-2) makes the script select the real course-description body copy. The "no body copy" framing is not a WCAG finding — the page does have body copy (the `BRANDING.longDescription` paragraph), just not as the *first* `<p>` in the DOM. |
| Typography observation — "assignment body inherits `.prose-midnight` at 14.88 px" | `/learn/101/assignment` | **Absorbed into X-2** | Same `src/styles/globals.css:141` token as the lesson page. No separate M-finding; X-2 documents the cross-surface pattern. |
| Typography observation — "assignment measure ~79.7 ch at 768 px" | `/learn/101/assignment` | **Absorbed into X-3** | Same absence of a prose-level measure cap. No separate M-finding; X-3 documents the cross-surface pattern. |
| Lighthouse "manual-review" audits: `focusable-controls`, `interactive-element-affordance`, `logical-tab-order`, `visual-order-follows-dom`, `focus-traps`, `managed-focus`, `use-landmarks`, `offscreen-content-hidden`, `custom-controls-labels`, `custom-controls-roles` | `/`, `/learn` | **Deferred — not dismissed** | These are items Lighthouse cannot automate; they are covered by the deferred manual keyboard + screen-reader walk flagged in the "Manual walk-through notes" scope note. Not filed as M-findings in this pass; re-audit post-X-1 fix will either surface real findings or confirm pass. |
| axe headless viewport was `780x437` (not standard mobile/tablet/desktop) | all | **Deferred — not dismissed** | Reflow-sensitive rules (`1.4.10`, `1.4.12`) that depend on narrow viewports may have been missed. Rerun at `375` / `768` / `1440` flagged as a gap on the manual re-audit pass. Not a per-finding dismissal. |
