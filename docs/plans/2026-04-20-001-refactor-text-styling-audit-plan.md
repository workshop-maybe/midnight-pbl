---
title: "refactor: Text styling accessibility & readability audit"
type: refactor
status: active
date: 2026-04-20
origin: docs/brainstorms/2026-04-20-text-styling-accessibility-requirements.md
---

# refactor: Text styling accessibility & readability audit

## Overview

Discovery-first plan. No text styling changes land directly from this plan — instead, the plan produces two audit documents (one per in-scope surface) plus a set of GitHub issues that each subsequent PR implements. Think of it as a characterization pass: measure the current state against WCAG 2.2 AA and long-read readability targets, document every finding with enough context that an Agency-dispatched worker can fix it without reproducing the audit work.

The core deliverables are:

1. `docs/audits/2026-04-20-text-styling-lesson-pages.md` — findings for the lesson-page surface (the high-stakes long-read experience)
2. `docs/audits/2026-04-20-text-styling-marketing-dashboard.md` — findings for the marketing + dashboard + auth surfaces
3. Agency-sized GitHub issues for every P0 finding and any cohesive P1 cluster

## Problem Frame

Typography on the web app has evolved reactively — three commits in the last two weeks touched `.prose-midnight` h2 sizing, landing-page `<dl>` hierarchy, and code-block treatment. There has been no systematic audit against WCAG 2.2 AA or a long-read readability standard. Three concerns have accumulated: accessibility compliance, readability for multi-hour learner sessions, and consistency across marketing/dashboard/lesson surfaces that share `globals.css` but have divergent needs (see origin: `docs/brainstorms/2026-04-20-text-styling-accessibility-requirements.md`).

The audit establishes a baseline and turns ambiguous "looks ok" into binary pass/fail findings before any fixes ship.

## Requirements Trace

From origin document — carried forward unchanged:

- **R1.** Lesson pages pass WCAG 2.2 AA (contrast, focus, keyboard, hit targets)
- **R2.** Lesson pages support multi-hour reading (line-height ≥ 1.5, measure ≤ 75ch, consistent hierarchy)
- **R3.** Marketing + dashboard pages pass WCAG 2.2 AA
- **R4.** Typography hierarchy is internally consistent across all in-scope pages
- **R5.** Audit produces two findings docs under `docs/audits/`
- **R6.** Each finding: severity tier, WCAG criterion or readability rationale, `file:line` reference, proposed change, cross-surface blast radius
- **R7.** Each surface's findings become one or more Agency-sized GitHub issues

Success criteria (origin): two audit docs reviewed, every in-scope page checked, every P0 finding has a board issue, user validates subjective readability after fixes.

## Scope Boundaries

Carried forward from origin:

- Out of scope: lesson markdown content, `/learn` agent-mode rendering, forker-facing docs, new design directions (palette/fonts)
- Not a redesign — work within the existing Charcoal design system
- WCAG 2.2 Level **AA** target (AAA deferred)
- Static + live checks only — no user-research readability study

Additional boundary introduced here: the audit plan does **not** include executing fixes. Fixes are out-of-scope for this plan; they are delivered via the GitHub issues produced in Unit 7. The plan is complete when issues have been filed.

## Context & Research

### Relevant Code and Patterns

- **`src/styles/globals.css`** — single source of truth for typography. Two duplicated blocks (`@theme` for Tailwind v4, `:root` for vanilla CSS) that must stay in sync. `.prose-midnight` (~line 139+) is the long-read container used by `LearnLayout.astro` and related; it defines explicit sizes for h1 (1.875rem), h2 (1.75rem), h3 (1.25rem) and styles for `p`, `a`, `strong`, `em`, lists, `blockquote`, `code`, `pre`, and highlight.js tokens.
- **`src/layouts/LearnLayout.astro`** — 17 references to text-related classes; the lesson page shell and the primary measure/hierarchy target.
- **`src/layouts/BaseLayout.astro`** / **`AppLayout.astro`** — cross-surface layouts; global `<head>`, fonts, body classes. Any change to base tokens propagates through here.
- **`src/pages/index.astro`**, **`dashboard.astro`**, **`404.astro`**, **`500.astro`**, **`learn/index.astro`**, **`learn/[moduleCode]/[lessonIndex].astro`**, **`learn/[moduleCode]/assignment.astro`** — all in-scope top-level pages.
- **`src/components/`** — 20 files with text styling. Clusters: `layout/` (Nav, Footer), `course/` (ModuleCard), `dashboard/` (AccountDetails, CredentialsList, ModuleProgress, ClaimCredential), `assignment/`, `auth/`, `tx/`, `ui/` (Button, Badge, Skeleton), `seo/` (head components — low text-styling relevance), `editor/` (TipTap — low priority since it's only used in authoring).
- **Existing a11y primitives** — 43 `aria-*` / `role=` / `sr-only` / `tabIndex` / `alt=` references across 17 files. Coverage is partial: `Nav.astro` (7 refs) appears thoughtfully labeled, but many components have ≤1 reference suggesting incidental rather than systematic labeling.
- **`:focus-visible`** at `globals.css` — a global outline ring exists, which is the right primitive; audit confirms every interactive element actually receives it.

### Institutional Learnings

- `docs/solutions/` does not exist in this repo (that convention is Agency-specific). No prior accessibility solutions to reference.
- `docs/brainstorms/seo-optimization-requirements.md` and the corresponding `docs/plans/2026-04-18-001-feat-seo-phase-1-plan.md` + `-validation-checklist.md` show the repo's own convention for staged deliverables with validation checklists. The audit docs should borrow that "deliverable + validation step" shape.

### External References

Relying on established standards rather than research agents:

- **WCAG 2.2** — [w3.org/TR/WCAG22](https://www.w3.org/TR/WCAG22/). Target: Level AA. Relevant success criteria for this audit include 1.4.3 (contrast, 4.5:1 normal / 3:1 large), 1.4.4 (resize), 1.4.10 (reflow), 1.4.11 (non-text contrast, 3:1 for UI), 1.4.12 (text spacing), 2.1.1 (keyboard), 2.4.7 (focus visible), 2.4.11 (focus not obscured, new in 2.2), 2.5.8 (target size ≥ 24x24 CSS px, new in 2.2), 3.2.3/3.2.4 (consistent nav/identification).
- **Bringhurst / standard typography** — measure 45–75ch, line-height 1.4–1.6 for body, 1.2–1.3 for headings, modular scale for hierarchy. These are internal heuristics — findings cite the rule they target but don't need external citations per finding.

## Key Technical Decisions

- **Tooling stack: `axe-core` via `@axe-core/cli` + Lighthouse CI + manual screen-reader walk-through.** Rationale: `axe-core` is the industry-standard rule engine (used inside both Lighthouse and pa11y under the hood), the CLI runs against live URLs without project setup, and Lighthouse catches a few issues axe misses. Manual walk-through is non-negotiable for focus order, screen-reader pronunciation, and keyboard-only flows — automated tools catch ~30% of real accessibility issues. Rejected: pa11y (wraps axe, adds no value here); Jest-axe (requires component test infrastructure that doesn't exist and isn't worth introducing for a one-time audit).

- **Audit tooling is ephemeral — not added as a long-lived project dep.** Install via `npx @axe-core/cli` and the Lighthouse Chrome flag for one-off runs; capture raw output in the audit doc as an appendix; do not add any audit dependency to `package.json`. Rationale: no tests currently depend on it, and introducing permanent dev deps for a one-shot audit violates the origin doc's "not a redesign" spirit. If a later plan introduces continuous a11y testing, deps can be added then.

- **Audit docs use a structured findings table, not prose.** Each finding is a row: `ID | severity | criterion | page | current (file:line) | expected | blast radius | issue #`. Rationale: the origin doc requires findings become issues — a table maps 1:1 to issue rows. Prose audits are hard to convert mechanically.

- **Severity tiers, explicit:**
  - **P0** — WCAG AA failure (automated or manual) affecting lesson pages or authenticated flows. Becomes an issue immediately.
  - **P1** — WCAG AA failure on lower-traffic surfaces (error pages, dashboard edge cases) OR a readability target miss with real learner-experience impact (measure > 85ch, line-height < 1.4 on prose). Clustered into issues by cohesion.
  - **P2** — polish / aspirational improvements (AAA contrast, typography refinement, consistency nits). Stays in the audit doc as a backlog; no issue unless a future reader pulls one forward.

- **Cross-surface findings are flagged in both docs with a shared ID prefix (`X-1`, `X-2`, …) and a single consolidating issue.** Rationale: if `globals.css` has a bad contrast token, it affects every surface. One issue, not two. Doing this post-audit (Unit 7) means we can spot the pattern across docs rather than inside each one.

- **Lesson pages audited before marketing/dashboard.** Rationale: higher stakes (multi-hour reading), larger typography surface (`.prose-midnight` is custom-styled), and findings here tend to inform the marketing/dashboard audit (e.g. body text contrast decisions carry forward).

- **No test-first execution posture needed.** The audit IS the test. Implementing the fixes (later plans) may use test-first if characterization coverage is warranted.

## Open Questions

### Resolved During Planning

- **Q: Use Playwright or manual Chrome for audit?** → Manual Chrome + axe CLI against the deployed preview URL. Playwright would require test infrastructure that doesn't exist; one-off scripted runs via `npx @axe-core/cli https://midnight-pbl.io/learn/101/1` plus manual interaction is cheaper and sufficient for a single audit pass.
- **Q: Where do audit docs live?** → `docs/audits/` (new directory). Keeps them separate from `docs/brainstorms/` (requirements) and `docs/plans/` (implementation plans). The audit doc is a distinct artifact type.
- **Q: How granular are issues?** → "Sized so Agency can plan and ship in one pass." Concretely: one issue per clean fix that touches ≤3 files and has an obvious AC. Issues with coupled cross-file changes (e.g. "normalize all heading sizes across surfaces") get split or scoped.

### Deferred to Implementation

- **Which specific WCAG AA criteria fail on lesson pages?** — Unknown until Unit 3 runs. Plan is not a prediction.
- **Is the measure within 45–75ch at all viewports?** — Requires live measurement in Unit 3.
- **Does every interactive element have a visible focus ring?** — Requires the keyboard walk-through in Unit 3.
- **Are there contrast failures in the charcoal palette?** — Known: `--color-mn-text-muted` (#bdbdc2) on `--color-midnight` (#161618) is ~10:1, fine. `--color-mn-primary` (#d4a053) on `--color-midnight` is lower, needs measurement. Actual failure list comes from Unit 3's axe output.
- **Which components use ad-hoc utilities vs design-system tokens?** — Requires systematic grep + cross-reference in Unit 3 / Unit 5.

## Implementation Units

### Phase 1: Setup

- [x] **Unit 1: Create audit scaffolding**

**Goal:** Establish `docs/audits/` with a consistent findings-doc template ready for Units 4 and 6 to fill in.

**Requirements:** R5, R6

**Dependencies:** None

**Files:**
- Create: `docs/audits/README.md` — explains what the directory is, links to origin brainstorm + this plan
- Create: `docs/audits/_template.md` — the findings template (frontmatter + structured table + validation checklist)

**Approach:**
- Template mirrors the shape of `docs/plans/2026-04-18-001-feat-seo-phase-1-validation-checklist.md` for consistency with existing repo conventions
- Frontmatter: `date`, `surface`, `tooling_used`, `status`
- Body sections: **Summary** (1 paragraph + severity counts), **Findings Table** (columns defined in Key Technical Decisions above), **Cross-surface patterns** (populated post-Unit 7), **Tooling output appendix** (raw axe/Lighthouse dumps for traceability)

**Patterns to follow:**
- Frontmatter convention from existing `docs/plans/*.md` and `docs/brainstorms/*.md`
- "Validation checklist" deliverable pattern from SEO Phase 1

**Test scenarios:** None — this is scaffolding.

**Verification:**
- `docs/audits/` exists with README and template
- Template is copy-able and immediately usable for Unit 4

---

### Phase 2: Lesson pages audit

- [ ] **Unit 2: Tooling dry-run + audit URL inventory**

**Goal:** Confirm tooling works against the deployed site and enumerate every lesson-page URL that must be audited.

**Requirements:** R1, R2

**Dependencies:** Unit 1

**Files:**
- Modify: `docs/audits/2026-04-20-text-styling-lesson-pages.md` (created from template; populate "tooling_used" and "audit URL inventory" sections)

**Approach:**
- Resolve all dynamic lesson URLs by reading `src/pages/learn/[moduleCode]/[lessonIndex].astro` and cross-referencing `content/midnight-for-cardano-devs/lessons/module-{101..106}/` to enumerate every `(moduleCode, lessonIndex)` pair
- Capture the full URL list (likely 18+ lesson pages)
- Run `npx @axe-core/cli <one-lesson-url>` end-to-end once to verify the tool works against the deployed site and output is parseable
- Pick one representative lesson page (suggest `/learn/101/1` — the entry point learners see first) as a sanity check

**Execution note:** Characterization-first — this unit captures baseline before any change.

**Patterns to follow:**
- URL enumeration approach used in sitemap generation (`src/pages/robots.txt.ts` or the astro sitemap integration)

**Test scenarios:**
- URL list is complete (every lesson in every module included)
- `axe-core` returns parseable JSON against at least one live URL
- Lighthouse accessibility category score is captured for the same URL

**Verification:**
- Findings doc has populated "audit URL inventory" section with a URL per line
- Tooling appendix has at least one raw axe run + one Lighthouse score as evidence the tools work

---

- [ ] **Unit 3: Execute lesson pages audit — automated + manual + typography**

**Goal:** Run every audit check against every lesson URL and capture raw results. No triage yet — this is collection.

**Requirements:** R1, R2, R4

**Dependencies:** Unit 2

**Files:**
- Modify: `docs/audits/2026-04-20-text-styling-lesson-pages.md` (populate "raw findings" appendix)

**Approach:**
- **Automated pass:** run `@axe-core/cli` against every URL from Unit 2's inventory. Capture failures with rule ID, severity, and affected nodes.
- **Automated pass (Lighthouse):** run Lighthouse accessibility category against the representative lesson URL and the module index. Capture category score and failing audits.
- **Manual keyboard walk-through:** for the representative lesson, tab through the entire page (nav, table of contents if any, main content, code-copy buttons, next/prev navigation, footer). Log: anything that receives focus invisibly, any keyboard trap, any focus-appearance violation (WCAG 2.4.7 / 2.4.11), any target size < 24x24 CSS px.
- **Manual screen-reader walk-through:** with Orca (Linux) or VoiceOver, read the representative lesson start-to-finish. Log: missing landmarks, incorrect heading levels, untitled interactive elements, code-block pronunciation issues.
- **Typography measurement:** measure `.prose-midnight` at three viewports — narrow (375px), tablet (768px), wide (1440px). Capture: computed body font-size, line-height, container max-width, effective measure in ch units, h1/h2/h3 rendered sizes. Compare to targets (measure 45–75ch, line-height ≥ 1.5, modular hierarchy).
- **Component sweep:** grep for ad-hoc text classes in `src/components/` and identify any usage that should be a design-system token but isn't (e.g. hardcoded `text-[#...]` literals, duplicated `text-base leading-7` instead of referring to `.prose-midnight`).

**Execution note:** Characterization-first. Collect raw, triage in Unit 4.

**Patterns to follow:**
- The "Typography measurement" approach is novel for this repo — document the DevTools inspection steps explicitly in the audit doc so the marketing/dashboard audit (Unit 5) can follow them

**Test scenarios:**
- Every lesson URL has an axe result (pass or fail)
- At least one lesson page has both keyboard and screen-reader manual notes
- Measure is captured at all three viewport widths
- Component sweep finds every text-styling utility class outside of `.prose-midnight` / semantic tokens

**Verification:**
- Raw findings appendix has: N axe runs, 1+ Lighthouse run, manual keyboard notes, manual screen-reader notes, viewport measurement table, component sweep list

---

- [ ] **Unit 4: Triage lesson findings + write the findings doc**

**Goal:** Transform Unit 3's raw collection into the structured findings document — each finding severity-tagged, traced to a criterion, with a proposed change and blast radius.

**Requirements:** R5, R6

**Dependencies:** Unit 3

**Files:**
- Modify: `docs/audits/2026-04-20-text-styling-lesson-pages.md` (replace "raw findings" with structured table + summary)

**Approach:**
- Deduplicate the raw list (axe often reports the same rule on many nodes — collapse into one finding per rule with a node count)
- For each unique finding, fill every column: ID (L-N for lesson pages), severity (per the tiers in Key Technical Decisions), criterion (WCAG reference or readability rule), page (URL or "global"), current state with `file:line`, expected state, blast radius ("lesson pages only" / "cross-surface — touches `globals.css`"), issue # (empty until Unit 7)
- Write a 1-paragraph summary with severity counts
- Flag any finding that will clearly touch `globals.css` tokens as cross-surface (they'll feed Unit 7 synthesis)

**Patterns to follow:**
- The table shape defined in Key Technical Decisions

**Test scenarios:**
- Every raw failure has a structured finding OR an explicit note in the appendix explaining why it was dismissed (e.g. false positive, out-of-scope)
- Cross-surface findings are marked with blast radius
- No finding is left severity-unclassified

**Verification:**
- Findings doc has complete table, summary, and severity counts
- User can read the summary and understand what's about to become issues

---

### Phase 3: Marketing / dashboard audit

- [ ] **Unit 5: Execute marketing + dashboard audit**

**Goal:** Same depth of audit as Unit 3, applied to the remaining in-scope surfaces.

**Requirements:** R3, R4

**Dependencies:** Unit 4 (lesson-page methodology is now battle-tested)

**Files:**
- Create: `docs/audits/2026-04-20-text-styling-marketing-dashboard.md` (from template)

**Approach:**
- URL inventory: `/`, `/learn` (module index), `/dashboard`, `/learn/<module>/assignment` (one per module, or a representative pair), `/404`, `/500`. Auth-gated pages may need mock session or headed-browser testing.
- Automated + manual + typography sweep as in Unit 3, but:
  - Typography targets differ — marketing/UI typography is shorter reads, tighter line-height, more varied sizes. Focus on hierarchy consistency (h1 vs hero sizing) and contrast rather than measure.
  - Dashboard/assignment have more interactive elements — spend disproportionate time on focus order, button/form labeling, error states, live regions.
  - Error pages (`404`, `500`) are low-priority but must be walked once for completeness.

**Execution note:** Reuse the methodology from Unit 3 rather than re-inventing.

**Patterns to follow:**
- Unit 3's approach, adapted for UI-chrome typography

**Test scenarios:**
- Every in-scope page has an axe result
- Dashboard has manual focus-order + form-labeling notes
- Assignment flow has at least one end-to-end keyboard walk

**Verification:**
- Findings doc has raw findings appendix populated

---

- [ ] **Unit 6: Triage marketing + dashboard findings**

**Goal:** Same as Unit 4, but for the marketing/dashboard doc. Flag any cross-surface findings that match ones already in the lesson-page doc.

**Requirements:** R5, R6

**Dependencies:** Unit 5

**Files:**
- Modify: `docs/audits/2026-04-20-text-styling-marketing-dashboard.md` (structured findings table + summary)

**Approach:**
- Triage exactly as in Unit 4, with IDs `M-N`
- When a finding appears to match one already in the lesson-page doc (same root cause — typically a `globals.css` token), note it in both docs: in this one with `(see cross-surface X-<n>)`, and add/update the cross-surface entry in the lesson-page doc's cross-surface section

**Patterns to follow:**
- Unit 4

**Test scenarios:**
- Every raw failure triaged
- Cross-surface IDs (`X-N`) introduced where patterns span both surfaces

**Verification:**
- Both audit docs now have consistent cross-surface tagging

---

### Phase 4: Synthesis + ship

- [ ] **Unit 7: Cross-surface synthesis + file issues to the Agency board**

**Goal:** Collapse findings into a minimal set of well-sized GitHub issues. Every P0 gets an issue; P1s get clustered by cohesion; P2s stay in the docs as backlog. Update both docs with issue numbers.

**Requirements:** R7

**Dependencies:** Unit 4, Unit 6

**Files:**
- Modify: `docs/audits/2026-04-20-text-styling-lesson-pages.md` (fill issue # column)
- Modify: `docs/audits/2026-04-20-text-styling-marketing-dashboard.md` (fill issue # column)

**Approach:**
- **Cluster first, file second.** For each P0 finding, decide: standalone issue, or merge with another finding? Merge only if: same root cause (one `globals.css` token), touches the same files, and AC can be stated cleanly for both.
- **Cross-surface findings get ONE consolidating issue** — title should reference both surfaces, body explains the shared token/pattern, AC covers both contexts. These are the highest-impact issues.
- **Issue body shape** (same AC-N format the existing #2/#8 used, since Agency's planner handles it cleanly): Problem → Requirements → Where (file paths) → Tests → Acceptance Criteria → Anti-Requirements.
- **Add each issue to the Agency project board at `Ready-for-Planning`** — same two GraphQL mutations used earlier (addProjectV2ItemById + updateProjectV2ItemFieldValue). The board index lag means the item may not appear for ~5 min; if blocked, delete-and-re-add.
- Backfill the `issue #` column in both audit docs.

**Patterns to follow:**
- Issue body shape from `#8` (lesson content update) — tight, file-path-specific, explicit AC + anti-requirements
- Board-add flow used earlier in this session for `#2` and `#8`

**Test scenarios:**
- Every P0 finding maps to exactly one GitHub issue
- No issue spans more than ~3 files (size guardrail)
- Cross-surface issues explicitly list both surface files in "Where"
- P2 findings are documented in the audit docs but NOT filed as issues

**Verification:**
- Both audit docs have every P0 row's issue # populated
- The Agency project board has the new issues at `Ready-for-Planning`
- `bun run status` shows the new items
- User can scan either audit doc and trace each finding to its issue

## System-Wide Impact

- **Interaction graph:** the audit itself changes nothing at runtime. The issues it produces will, in aggregate, touch `globals.css`, `LearnLayout.astro`, `.prose-midnight` styles, focus behavior, and individual component labeling. The blast radius is concentrated in shared styles.
- **Error propagation:** not applicable — no code changes in this plan.
- **State lifecycle risks:** none in the audit itself. Individual follow-up PRs may introduce token-level changes that propagate across every page; each such PR is responsible for its own blast-radius verification.
- **API surface parity:** not applicable.
- **Integration coverage:** axe-core covers programmatic criteria; manual walks cover focus order and screen-reader behavior. Coverage is incomplete by design — a one-shot audit, not continuous testing. Introducing continuous testing is a future plan, out of scope here.

## Risks & Dependencies

- **Deployed preview availability.** Running axe against a live URL requires the deployed site to be up and on the version being audited. If midnight-pbl.io lags behind `main` during a content push, the audit may measure stale markup. Mitigation: run `npm run build` locally and audit against `npm run preview` as a cross-check; note the commit SHA of the audited site in the audit doc's frontmatter.
- **Auth-gated pages.** Dashboard and assignment pages require a wallet-authenticated session. axe-core can be run headed by passing an authenticated session cookie; if that proves brittle, Unit 5 falls back to manual-only checks for those pages.
- **Screen-reader availability.** If Orca/NVDA aren't readily usable, the manual screen-reader portion of Units 3 and 5 can be reduced to "heading structure + landmark check via axe + DevTools Accessibility pane." This degrades coverage but does not invalidate the audit.
- **Findings volume.** A comprehensive first audit of an un-audited codebase often produces 30+ findings. If the issue count after Unit 7 exceeds ~15, reconsider the P1 clustering — the goal is Agency-sized work, not a 40-issue avalanche.

## Documentation / Operational Notes

- Both audit docs live under `docs/audits/` — add a short note to `CLAUDE.md` explaining that this directory exists and what it's for (one line is fine).
- No monitoring, rollout, or feature-flag concerns — the audit doesn't ship code.
- The produced issues, when they ship, may require a `docs/DEPLOY.md` refresh if `globals.css` changes touch the build (unlikely but possible).

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-20-text-styling-accessibility-requirements.md](../brainstorms/2026-04-20-text-styling-accessibility-requirements.md)
- **Related plans:** `docs/plans/2026-04-18-001-feat-seo-phase-1-plan.md` — referenced for deliverable-shape patterns
- **External:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [axe-core rules](https://dequeuniversity.com/rules/axe/), [@axe-core/cli](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/cli)
- **Related prior art in repo:** `src/styles/globals.css` (lines 25–73 for tokens, 139+ for `.prose-midnight`), `src/layouts/LearnLayout.astro`, `src/components/layout/Nav.astro` (reference for good aria labeling)
