# Audits

This directory holds **audit artifacts** — point-in-time evaluations of a specific aspect of the codebase against a defined standard. An audit produces findings; findings become issues; issues become implementation work via separate plans. The audit doc itself is the durable record that ties current state to a standard.

Audit artifacts are distinct from:

- `docs/brainstorms/` — requirements documents defining *what* to build
- `docs/plans/` — implementation plans defining *how* to build
- This directory — evidence-based evaluations of the code *as it exists*

## Convention

One audit = one markdown file named `YYYY-MM-DD-<surface-or-topic>.md`, created from [`_template.md`](./_template.md). Each audit has frontmatter (`date`, `surface`, `tooling_used`, `status`), a summary with severity counts, a structured findings table, a cross-surface patterns section, and a tooling-output appendix for traceability.

Findings from an audit are filed as GitHub issues and the issue number is recorded on the finding row. The audit doc stays in the repo as the historical record — even after every finding ships, the doc is still useful as "what the state looked like on this date and what we decided."

## Current audits

- `2026-04-20-text-styling-lesson-pages.md` *(in progress)* — accessibility & readability audit of lesson-page typography
- `2026-04-20-text-styling-marketing-dashboard.md` *(in progress)* — accessibility & readability audit of marketing, dashboard, and auth surfaces

Both are scoped and sequenced by:

- Brainstorm: [`docs/brainstorms/2026-04-20-text-styling-accessibility-requirements.md`](../brainstorms/2026-04-20-text-styling-accessibility-requirements.md)
- Plan: [`docs/plans/2026-04-20-001-refactor-text-styling-audit-plan.md`](../plans/2026-04-20-001-refactor-text-styling-audit-plan.md)

## Adding a new audit

Copy `_template.md` to `YYYY-MM-DD-<surface>.md` and fill in the frontmatter. Keep findings in the table; put verbose tooling output in the appendix. Do not turn an audit doc into an implementation plan — if a finding needs design decisions, it becomes a brainstorm; if it needs scoping, it becomes a plan; the audit only captures state and proposed remediation.
