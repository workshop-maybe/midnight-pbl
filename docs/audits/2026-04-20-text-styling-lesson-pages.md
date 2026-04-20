---
date: 2026-04-20
surface: lesson-pages
tooling_used:
  - "@axe-core/cli@4.11.2 (rule engine axe-core 4.11.3)"
  - "Lighthouse 13.1.0 (npx headless Chrome)"
  - "manual keyboard walk (pending — Unit 3)"
  - "manual screen-reader walk (pending — Unit 3; target tool: Orca 44 on Linux)"
status: draft
site_commit: 065ed99
---

# Lesson pages — Accessibility & Readability Audit

## Summary

<One paragraph: scope, method, headline finding.>

**Severity counts:** P0: <n>  ·  P1: <n>  ·  P2: <n>  ·  Cross-surface (X-): <n>

## Audit URL Inventory

Every URL audited, with the environment each was tested against.

| URL | Env | Auth required |
|---|---|---|
| `/learn/101/1` | `https://midnight-pbl.io` | no |
| … | … | … |

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

Dry-run only — this is the Unit 2 tooling-verification capture, not a finalized audit. Unit 3 (per-URL sweep) will re-run axe across every lesson URL and move real findings into the table above. The capture below proves the tool runs end-to-end against the deployed site and the output is parseable.

- **Command:** `npx @axe-core/cli https://midnight-pbl.io/learn/101/1 --chromedriver-path <matched-chromedriver>`
- **CLI package:** `@axe-core/cli@4.11.2` (rule engine `axe-core@4.11.3`, reported by `--version` and the JSON `testEngine.version`)
- **Runner:** `chrome-headless` via webdriverjs (CLI default)
- **Exit code:** `0` (without `--exit`/`-q` the CLI reports findings and exits 0; rerun with `-q` to gate CI)
- **Captured:** 2026-04-20T16:44:10.496Z against `https://midnight-pbl.io/learn/101/1` (deployed `065ed99`)
- **Headline:** 2 violations across 9 nodes (8 `color-contrast` + 1 `landmark-unique`); 36 passes; 1 incomplete; 53 inapplicable
- **Raw JSON:** the full axe report is 19,797 lines of JSON — truncated here to the rule-level summary plus verbatim first nodes per rule. A full re-run lives with Unit 3 output.

Rule-level summary (verbatim trimmed JSON):

```json
{
  "testEngine": { "name": "axe-core", "version": "4.11.3" },
  "testEnvironment": {
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.0.0 Safari/537.36",
    "viewport": "780x437"
  },
  "url": "https://midnight-pbl.io/learn/101/1",
  "timestamp": "2026-04-20T16:44:10.496Z",
  "counts": { "violations": 2, "passes": 36, "incomplete": 1, "inapplicable": 53 },
  "ruleLevelSummary": [
    {
      "id": "color-contrast",
      "impact": "serious",
      "tags": ["cat.color", "wcag2aa", "wcag143"],
      "nodeCount": 8,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=webdriverjs"
    },
    {
      "id": "landmark-unique",
      "impact": "moderate",
      "tags": ["cat.semantics"],
      "nodeCount": 1,
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/landmark-unique?application=webdriverjs"
    }
  ]
}
```

First violation node — `color-contrast` (verbatim from `violations[0].nodes[0]`):

```json
{
  "any": [
    {
      "id": "color-contrast",
      "data": {
        "fgColor": "#555555",
        "bgColor": "#1e1e1e",
        "contrastRatio": 2.23,
        "fontSize": "9.6pt (12.75px)",
        "fontWeight": "normal",
        "messageKey": null,
        "expectedContrastRatio": "4.5:1"
      },
      "relatedNodes": [
        { "html": "<pre>", "target": ["pre:nth-child(23)"] }
      ],
      "impact": "serious",
      "message": "Element has insufficient color contrast of 2.23 (foreground color: #555555, background color: #1e1e1e, font size: 9.6pt (12.75px), font weight: normal). Expected contrast ratio of 4.5:1"
    }
  ],
  "all": [],
  "none": [],
  "impact": "serious",
  "html": "<span class=\"hljs-comment\"># Your smart contract</span>",
  "target": [".hljs-comment:nth-child(3)"],
  "failureSummary": "Fix any of the following:\n  Element has insufficient color contrast of 2.23 (foreground color: #555555, background color: #1e1e1e, font size: 9.6pt (12.75px), font weight: normal). Expected contrast ratio of 4.5:1"
}
```

First violation node — `landmark-unique` (verbatim from `violations[1].nodes[0]`):

```json
{
  "any": [
    {
      "id": "landmark-is-unique",
      "data": { "role": "navigation", "accessibleText": null },
      "relatedNodes": [
        {
          "html": "<nav class=\"flex flex-col gap-3 border-t border-midnight-border pt-6 sm:flex-row sm:items-center sm:justify-between\">",
          "target": [".pt-6"]
        }
      ],
      "impact": "moderate",
      "message": "The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable"
    }
  ],
  "all": [],
  "none": [],
  "impact": "moderate",
  "html": "<nav class=\"sticky top-0 z-50 border-b border-midnight-border bg-midnight-surface supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]\" id=\"main-nav\">",
  "target": ["#main-nav"],
  "failureSummary": "Fix any of the following:\n  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable"
}
```

Additional `color-contrast` nodes (7 more, truncated): targets `.hljs-comment:nth-child(5|6|7|8|9|1)` and `pre:nth-child(55) > .language-.hljs > .hljs-comment`; all report `contrastRatio: 2.23` on `#555555` over `#1e1e1e`. These consolidate to a single hljs-comment token regression — a likely `X-` cross-surface candidate in Unit 7.

Environment note: axe's headless viewport was `780x437` — narrower than a typical desktop audit. Unit 3 should re-run at the standard breakpoints (`375`, `768`, `1440`) to catch reflow-sensitive rules (`1.4.10`, `1.4.12`) missed at the default width. The Chrome binary version shipped with this agent (`146.0.7680.164`) lagged the bundled ChromeDriver; runs used `browser-driver-manager`-installed Chrome 146.0.7680.165 + matching ChromeDriver via `--chromedriver-path`. `midnight-pbl.io/learn/101/1` returned HTTP 200 — no local-preview fallback was needed (R8 did not trigger).

### Lighthouse

Dry-run only — records the score + failing-audit list as tooling evidence. Unit 3 will re-run Lighthouse per URL and fold findings into the table above.

- **Method:** `npx lighthouse@latest https://midnight-pbl.io/learn/101/1 --only-categories=accessibility --output=json --chrome-flags="--headless=new --no-sandbox" --chrome-path=<matched-chrome>` (Chrome DevTools panel was not available in this agent environment — `npx` headless was the R4 acceptable fallback)
- **Lighthouse version:** 13.1.0 (reported by the JSON `lighthouseVersion`)
- **User agent:** `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.0.0 Safari/537.36`
- **URL audited:** `https://midnight-pbl.io/learn/101/1` (deployed `065ed99`)
- **Accessibility score:** **96 / 100**

Failing audits (score < 1, non-manual):

- `color-contrast` — *Background and foreground colors do not have a sufficient contrast ratio.* (score 0) — overlaps with axe's `color-contrast` nodes above; both tools surface the same hljs-comment token regression.

Manual-review audits Lighthouse cannot automate (to be covered by the Unit 3 keyboard + screen-reader walk):

- `focusable-controls`, `interactive-element-affordance`, `logical-tab-order`, `visual-order-follows-dom`, `focus-traps`, `managed-focus`, `use-landmarks`, `offscreen-content-hidden`, `custom-controls-labels`, `custom-controls-roles`

### Manual walk-through notes

- **Keyboard:** <what focused where, visible vs invisible, any trap>
- **Screen reader:** <heading structure, landmarks, labels, code-block pronunciation>
- **Typography measurements:** <viewport → font-size / line-height / measure in ch>
- **Component sweep:** <ad-hoc text utility classes found outside of design-system tokens>
