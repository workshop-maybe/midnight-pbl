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

<One paragraph: scope, method, headline finding.>

**Severity counts:** P0: <n>  ·  P1: <n>  ·  P2: <n>  ·  Cross-surface (X-): <n>

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
| L-1 | P0 | WCAG 2.2 AA — 1.4.3 Contrast (Minimum) | `/learn/101/1` | `src/styles/globals.css:N — .prose-midnight a @ color: #…` yields 3.1:1 on `--color-midnight` | Raise to ≥ 4.5:1 (small text) or ≥ 3:1 (large text) | lesson pages only | #<tbd> |
| L-2 | … | … | … | … | … | … | … |

## Cross-Surface Patterns

Populated after both per-surface audits are complete (see plan Unit 7). Each row maps an `X-N` ID to the per-surface findings it spans.

| ID | Pattern | Root cause (file) | Appears in | Consolidating issue # |
|---|---|---|---|---|
| X-1 | <Token X fails AA across all prose contexts> | `src/styles/globals.css:N — --color-…` | lesson pages, marketing | #<tbd> |

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

All captures in this section ran against the deployed site at short SHA `b089512` (resolved via `git rev-parse --short origin/main` at capture time). Runs used Chrome 146.0.7680.165 via `browser-driver-manager` with a matching ChromeDriver binary passed as `--chromedriver-path`. The axe headless default viewport was `780x437`; reruns at standard breakpoints (`375`, `768`, `1440`) were not performed in this unit and are flagged as a gap for #16 to cover manually (R7).

---

#### `/` (landing) — `https://midnight-pbl.io/`

- **Command:** `npx @axe-core/cli https://midnight-pbl.io/ --chromedriver-path <matched-chromedriver> --save axe-root.json --dir /tmp/agency-15`
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

- **Command:** `npx @axe-core/cli https://midnight-pbl.io/learn --chromedriver-path <matched-chromedriver> --save axe-learn.json --dir /tmp/agency-15`
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

- **Command:** `npx @axe-core/cli https://midnight-pbl.io/404 --chromedriver-path <matched-chromedriver> --save axe-404.json --dir /tmp/agency-15`
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

- **Command:** `npx @axe-core/cli https://midnight-pbl.io/500 --chromedriver-path <matched-chromedriver> --save axe-500.json --dir /tmp/agency-15`
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

- **Method:** `npx lighthouse@13 https://midnight-pbl.io/ --only-categories=accessibility --output=json --output-path=/tmp/agency-15/lh-root.json --chrome-flags="--headless=new --no-sandbox" --chrome-path=<matched-chrome>` (Chrome DevTools panel was not available in this agent environment — `npx` headless was the R4 acceptable fallback, matching the lesson-pages pattern)
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

- **Method:** `npx lighthouse@13 https://midnight-pbl.io/learn --only-categories=accessibility --output=json --output-path=/tmp/agency-15/lh-learn.json --chrome-flags="--headless=new --no-sandbox" --chrome-path=<matched-chrome>`
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

- **Keyboard:** <what focused where, visible vs invisible, any trap>
- **Screen reader:** <heading structure, landmarks, labels, code-block pronunciation>
- **Typography measurements:** <viewport → font-size / line-height / measure in ch>
- **Component sweep:** <ad-hoc text utility classes found outside of design-system tokens>
