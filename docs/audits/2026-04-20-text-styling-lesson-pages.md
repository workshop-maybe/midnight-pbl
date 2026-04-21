---
date: 2026-04-20
surface: lesson-pages
tooling_used:
  - "@axe-core/cli@4.11.2 (rule engine axe-core 4.11.3)"
  - "Lighthouse 13.1.0 (npx headless Chrome)"
  - "manual keyboard walk"
  - "manual screen-reader walk (Orca 44 on Linux)"
status: draft
site_commit: 065ed99
---

# Lesson pages — Accessibility & Readability Audit

## Summary

This audit covers the lesson-page surface — one representative URL (`/learn/101/1`) walked at `site_commit` `065ed99` — using automated `axe-core` + Lighthouse sweeps (axe reported 2 violations across 9 nodes; Lighthouse scored 96/100), a manual keyboard walk, a degraded screen-reader check via Chrome DevTools DOM inspection (no Orca hardware this pass), typography measurements at 375 / 768 / 1440 px, and a `src/components/` grep for ad-hoc text utilities. Headline finding: keyboard focus disappears for a run of **19 consecutive Tab stops** across in-content code-copy buttons because `.code-copy-btn` is `opacity: 0` with no `:focus-visible` / `:focus-within` escape (row L-1, WCAG 2.4.7 Level AA failure). Additional notable findings: `.hljs-comment` code-comment text drops to 2.23:1 contrast against the dark code background (WCAG 1.4.3 AA failure, 8 nodes), three sibling `<nav>` landmarks ship unlabeled (axe `landmark-unique`), the lesson-page H1 renders smaller than its in-content H2 / H3 — inverting the visible hierarchy — and line measure overshoots the 75 ch upper bound at tablet and desktop widths.

**Severity counts:** P0: 3  ·  P1: 4  ·  P2: 1  ·  Cross-surface (X-): 5

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
| L-1 | P0 | WCAG 2.2 AA — 2.4.7 Focus Visible | `/learn/101/1` | `src/components/CodeCopyButton.astro:48–71` — `.code-copy-btn { opacity: 0 }` with visibility gated only on `pre:hover`; no `:focus-visible` / `:focus-within` rule, so 19 consecutive Tab stops paint the global focus ring on a transparent element (see Appendix keyboard walk) | Add `.prose-midnight pre:focus-within .code-copy-btn { opacity: 1 }` and `.code-copy-btn:focus-visible { opacity: 1 }`; keep the existing hover rule for mouse users | cross-surface — `<CodeCopyButton>` renders wherever `.prose-midnight` does (lesson pages, assignments, and other prose surfaces) | #<tbd> |
| L-2 | P1 | WCAG 2.2 AA — 1.3.1 Info and Relationships / 2.4.1 Bypass Blocks | `/learn/101/1` | Three unlabeled `<nav>` landmarks on every lesson page: `src/components/layout/Nav.astro:14` (top nav `#main-nav`), `src/layouts/LearnLayout.astro:124` (sidebar lesson list), `src/pages/learn/[moduleCode]/[lessonIndex].astro:156` (prev/next pagination) — axe `landmark-unique` violation plus DOM-inspection confirmation | Add `aria-label="Primary"` to top nav, `aria-label="Lesson navigation"` (or `role="none"` nested under the already-labeled `<aside>`) to sidebar nav, `aria-label="Lesson pagination"` to prev/next nav | cross-surface — `Nav.astro` is the shared site top nav and ships on every page | #<tbd> |
| L-3 | P0 | WCAG 2.2 AA — 1.4.3 Contrast (Minimum) | `/learn/101/1` | 8 nodes, all `.hljs-comment` @ 2.23:1 on `#555555` over `#1e1e1e` (9.6 pt / 12.75 px) — token defined in `src/styles/globals.css` (hljs-theme block) — see Appendix axe-core | Raise the `.hljs-comment` foreground token to ≥ 4.5:1 against the `#1e1e1e` code-block background | cross-surface — `globals.css` token affects every surface rendering highlight.js code blocks | #<tbd> |
| L-4 | P1 | Readability target (plan §Context — body ≥ 16 px) + WCAG 2.2 AA 1.4.4 Resize Text adjacent | `/learn/101/1` | `src/styles/globals.css:141` — `.prose-midnight { font-size: 0.875rem }` yields ~14.9 px at the measured 17 px root, flat across 375 / 768 / 1440 | Raise `.prose-midnight` body to ≥ 1 rem (16 px) at the default root font-size | cross-surface — `.prose-midnight` renders wherever long-form content lives (lessons, assignments, and any future prose surface) | #<tbd> |
| L-5 | P0 | Readability: modular hierarchy (plan §Context) — H1 must render larger than H2/H3 | `/learn/101/1` | `src/pages/learn/[moduleCode]/[lessonIndex].astro:133` — lesson-page H1 computes to 17 px at every viewport (smaller than in-content H2 @ 29.75 px and H3 @ 21.25 px); `text-2xl` / `sm:text-3xl` utilities are not overriding Tailwind v4's base-reset `h1 { font-size: inherit }` | Diagnose the cascade / utility-generation failure and ensure the lesson title H1 renders visibly larger than any in-content H2 / H3 across all breakpoints | lesson pages only | #<tbd> |
| L-6 | P1 | Readability target (plan §Context — measure 45–75 ch) | `/learn/101/1` | `src/pages/learn/[moduleCode]/[lessonIndex].astro:126` — container is `max-w-5xl` with no prose-level measure cap; measured ~45 ch @ 375 px (in-band), ~95 ch @ 768 px (+27% over 75 ch), ~139 ch @ 1440 px (+85% over 75 ch) | Narrow the prose container (e.g. `max-w-3xl` ≈ 48 rem) or apply `max-width: 75ch` to `.prose-midnight` body copy | lesson pages only | #<tbd> |
| L-7 | P2 | Readability target (plan §Context — line-height ≥ 1.5) | `/learn/101/1` | `src/pages/learn/[moduleCode]/[lessonIndex].astro:133` — lesson-page H1 computed line-height is 1.2 (20.4 / 17 px), below the ≥ 1.5 target | Resolves with L-5 fix (H1 size), plus an explicit layout-level `line-height ≥ 1.5` on the lesson H1 since it renders outside `.prose-midnight` | lesson pages only | #<tbd> |
| L-8 | P1 | Readability target (plan §Context — sub-12 px text) + WCAG 2.2 AA 1.4.4 Resize Text adjacent | global | 3 occurrences of the arbitrary `text-[11px]` utility: `src/layouts/LearnLayout.astro:160` (TOC label), `src/components/editor/EvidenceEditor.tsx:150` (H2 toolbar button), `src/components/editor/EvidenceEditor.tsx:153` (H3 toolbar button) | Replace the arbitrary `text-[11px]` with `text-xs` (12 px) or a dedicated label token in the design system | cross-surface — spans the lesson-page TOC label and the `EvidenceEditor` toolbar, which renders on authored-flow pages outside the lesson view | #<tbd> |

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

Representative lesson audited: `https://midnight-pbl.io/learn/101/1` (deployed `065ed99`).

#### Keyboard walk-through

Tab through the page in order. For every focus stop, record whether focus is **visible** (ring / outline visible) and whether behaviour matches expectation. Flag any keyboard trap, any skipped target, any target < 24×24 CSS px.

| # | Expected focus target | Visible? (Y/N) | Notes | WCAG |
|---|---|---|---|---|
| 1 | Skip-link (if present) — first Tab from URL bar | – | Not observed as a distinct first stop — to confirm in a follow-up pass | 2.4.1 |
| 2 | Main-nav logo / home link | Y | Ring visible on all top-nav stops | 2.4.7 |
| 3 | Main-nav section links (left → right) | Y |  | 2.4.7 |
| 4 | Main-nav auth / wallet control | Y |  | 2.4.7 |
| 5 | In-page TOC / lesson sidebar links | Y | Side-menu navigation all visible | 2.4.7 |
| 6 | First in-content link inside `.prose-midnight` | **N** | See below — part of the 19-stop invisible run | 2.4.7 |
| 7 | Code-block copy button (first `<pre>`) | **N** | Root cause of the 19-stop invisible run, see finding L-1 below | 2.4.7 / 2.5.8 |
| 8 | Subsequent code-block copy buttons | **N** | Same cause as row 7 | 2.4.7 / 2.5.8 |
| 9 | Prev / Next lesson buttons (bottom nav) | Y |  | 2.4.7 |
| 10 | Footer links | Y |  | 2.4.7 |

**Headline keyboard finding (candidate L-1, P0, WCAG 2.4.7 — Focus Visible, Level AA):**

Between the last sidebar link and the "Next lesson" button, Tab advances **19 times with no visible focus indicator anywhere**. Confirmed on `https://midnight-pbl.io/learn/101/1` (commit `065ed99`) in Chrome.

Root cause: `src/components/CodeCopyButton.astro:48–71` defines `.code-copy-btn { opacity: 0 }` with visibility gated only on mouse hover of the parent `<pre>` (`.prose-midnight pre:hover .code-copy-btn { opacity: 1 }`). There is no `:focus-visible` / `:focus-within` rule. Keyboard focus lands on each button and the global `:focus-visible` ring from `src/styles/globals.css:114` does paint — but it paints on a fully-transparent element, so it's invisible.

The 19 stops are the code-copy buttons plus any inline `.prose-midnight a` links interleaved between them on `/learn/101/1`. The copy buttons are the dominant cause; in-prose links share the global focus style and will re-test cleanly once the button visibility is fixed (they'll need a spot-check pass).

Proposed fix (recorded here for Unit 7 issue filing, not implemented in this unit):
- `.prose-midnight pre:focus-within .code-copy-btn { opacity: 1 }`
- `.code-copy-btn:focus-visible { opacity: 1 }`
- Keep the existing hover rule for mouse users.

Blast radius: lesson pages **and likely marketing/dashboard** wherever `<CodeCopyButton>` is imported — this is a strong cross-surface (`X-`) candidate once Unit 6 audit is in.

Keyboard traps / issues: none observed — Tab eventually reaches "Next lesson" without trapping.

Focus-appearance summary (WCAG 2.4.11 / 2.4.13): where the ring IS visible (top nav, sidebar, prev/next, footer), it's the global `outline: 2px solid var(--mn-primary)` at `outline-offset: 2px` defined in `src/styles/globals.css:114–117`. Contrast against the `#1e1e1e`-family dark surface needs a spot check, but the primary token is the brand green — likely passes ≥ 3:1. To measure in a follow-up pass.

Target-size summary (WCAG 2.5.8 — ≥ 24×24 CSS px): `.code-copy-btn` is `1.75rem × 1.75rem` = 28×28 px (`CodeCopyButton.astro:56–57`) — passes the 24×24 minimum once visibility is fixed. No other sub-24px interactive elements observed on the top/side/footer walk.

#### Screen-reader walk-through

**Degradation documented:** Machine has no speakers; Orca screen-reader walk skipped (allowed by spec AC-2). Degraded to a Chrome DevTools a11y-DOM inspection — enumerated landmarks, headings, and interactive-element accessible names via console queries against `https://midnight-pbl.io/learn/101/1` (commit `065ed99`). Full console output archived below in the Raw DOM a11y capture subsection.

| Check | Result |
|---|---|
| Landmark list — banner / nav / main / contentinfo present | **Partial pass.** `<main>`, `<footer>`, and `<aside id="learn-sidebar">` (aria-label: "Module navigation") all present. No `<header role="banner">` landmark — the top nav is only tagged as a `<nav>` with no banner role above it. Note: implicit `<header>` `banner` role only applies when not nested in another landmark; inspection did not find a top-level `<header>`. |
| Heading outline — h1 → h2 → h3 logical, no skipped levels | **Pass (with a spot-check).** Main flow is h1 → h2 → h3 monotone, 18 visible headings. One h2 ("Your First Midnight DApp") appears in DOM order before the h1 and reports `offsetParent = null` from a desktop viewport — confirmed source: the sidebar's module-title heading at `src/layouts/LearnLayout.astro:145`. It's inside the labeled `<aside>` landmark (valid scoping) and likely becomes `display: none` at certain breakpoints; not a finding, but worth a manual recheck at mobile width. |
| All nav links have accessible name | Pass — no interactive element missing an accessible name anywhere on the page. |
| `<nav>` landmarks disambiguated (axe flagged `landmark-unique`) | **Fail, confirmed and sharpened.** Three `<nav>` landmarks, **zero** with an aria-label: (1) top nav `Nav.astro:14` id=`main-nav`, (2) sidebar lesson list `LearnLayout.astro:124`, (3) prev/next lesson `[lessonIndex].astro:156`. Candidate finding L-2. |
| Inline code / `<code>` narration reasonable | Not verified — requires actual SR. Left for future re-audit when hardware allows. |
| Code-block content announced with language / context | Not verified — same reason. |
| Prev / Next lesson buttons have action-describing names | Pass — visible text "Previous Lesson" / "Next Lesson" / "View Assignment" available via accessible name. |
| Wallet / login control has accessible name + state | Pass — no interactive element on the page came up in the "missing accessible name" console filter. |

**Candidate L-2 (P1, WCAG 1.3.1 + 2.4.1, Level A):** Multiple unlabeled `<nav>` landmarks on every lesson page. axe `landmark-unique` violation confirmed. Fix: add `aria-label` to each:
- `src/components/layout/Nav.astro:14` → `aria-label="Primary"`
- `src/layouts/LearnLayout.astro:124` → `aria-label="Lesson navigation"` (or rely on the parent `<aside aria-label="Module navigation">` and remove the inner nav's landmark role via `role="none"` — either works)
- `src/pages/learn/[moduleCode]/[lessonIndex].astro:156` → `aria-label="Lesson pagination"`

Blast radius: `Nav.astro` is the shared top nav — affects **every page**, strong cross-surface (`X-`) candidate. The other two navs are lesson-page-specific.

**Spot-checks deferred to a future re-audit with actual SR hardware:**
- Inline `<code>` narration (letter-by-letter vs as-a-word behaviour varies by SR and by content)
- Code-block content / language announcement (depends on highlight.js output + any `<pre aria-label>` hints)
- Live-region / error-state behaviour on dynamic pages (not relevant for the prerendered lesson view)

##### Raw DOM a11y capture (2026-04-21)

Source: pasted Chrome DevTools console output against `https://midnight-pbl.io/learn/101/1`, commit `065ed99`.

Landmarks (6):
```
0  nav     id=main-nav          aria-label=(none)
1  main                          aria-label=(none)
2  aside   id=learn-sidebar     aria-label="Module navigation"
3  nav                           aria-label=(none)   (sidebar lesson list)
4  nav                           aria-label=(none)   (prev/next)
5  footer                        aria-label=(none)
```

Headings (19 — 18 visible + 1 sidebar module title flagged offsetParent=null from the desktop viewport at time of capture):
```
H2  "Your First Midnight DApp"                      visible=false  (sidebar module title)
H1  "Lesson 101.1: Scaffold and Deploy …"          visible=true
H2  "Prerequisites"                                 visible=true
H3  "Install the Compact Compiler"                  visible=true
H2  "Step 1: Scaffold"                              visible=true
H2  "Step 2: Start the Proof Server"                visible=true
H2  "Step 3: Compile the Contract"                  visible=true
H2  "Step 4: Deploy to Preprod"                     visible=true
H3  "4a. Wallet Setup"                              visible=true
H3  "4b. Fund the Wallet"                           visible=true
H3  "4c. DUST Registration"                         visible=true
H3  "4d. Contract Deployment"                       visible=true
H3  "4e. Set the Answer Key (for PBL examples)"     visible=true
H2  "Step 5: Interact"                              visible=true
H2  "Verify from the Outside"                       visible=true
H2  "What Can Go Wrong"                             visible=true
H2  "The Working Version Combo"                     visible=true
H2  "What You Just Did"                             visible=true
H2  "Questions to Consider"                         visible=true
```

Interactive elements missing accessible name: **zero.**

#### Typography measurements

Open DevTools → Elements → Computed. Pick a representative `<p>` inside `.prose-midnight` and the first `<h1>/<h2>/<h3>` of the lesson. Record computed values at each viewport width.

Targets (from plan): body ≥ 16px, line-height ≥ 1.5, measure between 45–75ch.

**Baseline from `src/styles/globals.css:139` (static):** `.prose-midnight` body = `0.875rem / 1.7`; `h1 = 1.875rem`; `h2 = 1.75rem`; `h3 = 1.25rem` (rem-based). Measured root font-size at runtime: **17px** (body = `0.875rem × 17 ≈ 14.875px`). Measurements below are DevTools computed values at each viewport width, captured 2026-04-21 against `/learn/101/1` (commit `065ed99`).

Headings measured:
- **H1** = the lesson-page title at `src/pages/learn/[moduleCode]/[lessonIndex].astro:133` (outside `.prose-midnight`, `class="text-2xl font-bold font-heading text-mn-text sm:text-3xl"`)
- **H2 / H3** = first in-content headings inside `.prose-midnight`

| Viewport | body `<p>` size / line-height | container width | measure (ch) | H1 size / line-height | H2 size / line-height | H3 size / line-height |
|---|---|---|---|---|---|---|
| 375px  | 14.875 / 25.29 (1.7) | 333 px   | **~45 ch** (on target) | **17 / 20.4 (1.2)** | 29.75 / 38.68 (1.3) | 21.25 / 27.63 (1.3) |
| 768px  | 14.875 / 25.29 (1.7) | 709 px   | **~95 ch** (over 75 max) | **17 / 20.4 (1.2)** | 29.75 / 38.68 (1.3) | 21.25 / 27.63 (1.3) |
| 1440px | 14.875 / 25.29 (1.7) | 1037 px | **~139 ch** (over 75 max) | **17 / 20.4 (1.2)** | 29.75 / 38.68 (1.3) | 21.25 / 27.63 (1.3) |

Targets (from plan): body ≥ 16 px, line-height ≥ 1.5, measure 45–75 ch.

Observations → candidate findings:

**Candidate L-3 (P1, WCAG 1.4.4 adjacent + readability plan target):** Body prose renders at ~14.9 px at every viewport, below the plan's 16 px minimum. Root cause: `.prose-midnight { font-size: 0.875rem }` at `src/styles/globals.css:141`. Line-height (1.7) passes the ≥ 1.5 target.

**Candidate L-4 (P0, visual hierarchy — not a WCAG failure but a clear UX defect):** Lesson-page H1 renders at **17 px** (browser default 1 rem) at every viewport width — **smaller than the in-content H2 (29.75 px) and even smaller than H3 (21.25 px)**. The Tailwind utilities `text-2xl` / `sm:text-3xl` on `src/pages/learn/[moduleCode]/[lessonIndex].astro:133` are not overriding Tailwind v4's base-reset rule that sets `h1 { font-size: inherit }`. Either the class isn't winning the cascade or the utility isn't being generated — a code-level diagnosis is required when the fix ships. User-visible impact: the lesson title looks less prominent than any section heading, inverting the document hierarchy.

**Candidate L-5 (P1, readability plan target):** Measure (characters per line) runs **~45 ch at 375 px → ~95 ch at 768 px → ~139 ch at 1440 px**. Only the mobile width sits inside the 45–75 ch band; tablet exceeds the upper bound by 27%, desktop by 85%. Root cause: the lesson container at `src/pages/learn/[moduleCode]/[lessonIndex].astro:126` uses `max-w-5xl` (64 rem ≈ 1088 px) with no `prose`-style measure cap on the article. Candidate fix: add a narrower `max-w-*` (e.g. `max-w-3xl` ≈ 48 rem) or a CSS `max-width: 75ch` on `.prose-midnight` body copy. Blast radius: lesson-page-specific; cross-surface potential if the same container pattern shows up in Unit 6.

**Candidate L-6 (P2, readability plan target):** H1 computed line-height is **1.2** (20.4 / 17), under the ≥ 1.5 target. Will auto-resolve when L-4 (H1 size) is fixed since the heading h1 rule in `.prose-midnight` specifies `line-height: 1.3` — but the lesson title is outside prose, so the fix should also explicitly set line-height on the layout-level h1.

#### Component sweep

Grep of `src/components/` (ran 2026-04-21) for ad-hoc text-styling utilities that should be design-system tokens:

- **Arbitrary-value font-size** (`text-[<Npx>]`) — 3 occurrences, all `text-[11px]`:
  - `src/layouts/LearnLayout.astro:160` — `<p class="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider …">` (TOC label)
  - `src/components/editor/EvidenceEditor.tsx:150` — `<span className="text-[11px] … leading-none">H2</span>` (editor toolbar)
  - `src/components/editor/EvidenceEditor.tsx:153` — `<span className="text-[11px] … leading-none">H3</span>` (editor toolbar)
- **Arbitrary-value line-height** (`leading-[…]`) — 0 occurrences
- **Arbitrary hex text colour** (`text-[#…]`) — 0 occurrences
- **Duplicated `text-base leading-N` pairings** — 0 occurrences

Verdict: the only ad-hoc text utility in the codebase is `text-[11px]` (sub-12px, below WCAG 1.4.4 / general-readability thresholds). Candidate P1 finding: replace with a `text-xs` (12px) token or a dedicated label token. All other text uses go through Tailwind's scale (`text-xs` … `text-4xl`) or `.prose-midnight` — no widespread ad-hoc text styling to consolidate.
