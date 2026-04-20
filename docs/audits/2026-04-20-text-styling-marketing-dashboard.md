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

```json
{ ... }
```

### Lighthouse

<score + top failing audits>

### Manual walk-through notes

- **Keyboard:** <what focused where, visible vs invisible, any trap>
- **Screen reader:** <heading structure, landmarks, labels, code-block pronunciation>
- **Typography measurements:** <viewport → font-size / line-height / measure in ch>
- **Component sweep:** <ad-hoc text utility classes found outside of design-system tokens>
