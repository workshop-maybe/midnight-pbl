# Autonomous Session Context

This project builds on the Andamio API. You are running with `--dangerously-skip-permissions`. These instructions are your operating constraints — follow them exactly.

## Permissions Boundary

### Allowed

- **Write** to any file in the current project directory and its subdirectories
- **Read** from any directory under `~/projects/`
- **Git**: all commands except `push` — commit, branch, checkout, rebase, merge, log, diff, stash, etc.
- **GitHub CLI** (`gh`): read operations — view issues, PRs, checks, releases. Create PRs and branches.
- **Package management**: `npm install`, `yarn add`, `pnpm add`, `go get`, `cargo add`, etc. — project-level only
- **Build/test/lint**: any command that builds, tests, or lints the project
- **Web**: fetch documentation, search for technical references

### Forbidden

- `git push` — never push to any remote. James reviews and pushes.
- `gh pr merge`, `gh pr review --approve` — never approve or merge PRs
- Writing or editing files outside the current project directory
- Reading files outside `~/projects/`
- Deleting `.git/`, `.claude/`, or `.github/` directories
- Installing global packages (`npm install -g`, `go install` to GOPATH, etc.)
- Running destructive commands on the filesystem (`rm -rf /`, etc.)
- Accessing secrets, credentials, or environment files (`.env`) from other projects

If you're unsure whether an action is allowed, it isn't. Stop and say so.

## Work Methodology: Compound Engineering Cycles

Every task follows this cycle. Use the compound engineering skills — they exist for exactly this workflow. Do not skip steps.

### 1. Brainstorm — `/ce-brainstorm`

For anything beyond a straightforward bug fix, start here. Explore requirements, surface ambiguity, and frame the problem before committing to a solution. If the task is clear and small, move directly to Plan.

### 2. Plan — `/ce-plan`

- Run `/ce-plan` to produce a structured implementation plan grounded in repo patterns
- Create a new branch from the current base: `git checkout -b <descriptive-branch-name>`
- One branch per plan. Never mix unrelated work on the same branch.

### 3. Implement — `/ce-work`

- Run `/ce-work` to execute the plan
- Make focused, atomic commits with clear messages
- Each commit should be independently meaningful — no "WIP" or "fix" commits
- Run tests and linting after implementation. Fix what breaks.

### 4. Review — `/ce-review`

- Run `/ce-review` before declaring done
- Structured code review with tiered persona agents catches what self-review misses
- Fix any issues surfaced by the review before moving on

### 5. Compound — `/ce-compound`

- Always run `/ce-compound` after completing meaningful work
- This documents what was learned or decided that isn't obvious from the code
- Patterns that emerge here feed back into future cycles — this is how we get smarter

### 6. Journal

- After completing a feature, fix, or meaningful session, add a journal entry to `journal/`
- Brief, timestamped, focused on what was built and what was learned
- The journal is evidence that anyone can follow to reproduce the build

### 7. Ideate — `/ce-ideate`

- Run `/ce-ideate` to surface follow-up ideas grounded in what was just built
- This step generates options, not commitments — James decides what's worth doing next

### 8. Stop

- Do not push. Do not merge. Do not approve PRs.
- Report what was done, what branch the work is on, and what James should review.
- Include a short ranked list of ideas from the ideate step, with your recommendation on which are worth pursuing next and why.

## Git Discipline

### Branching

- One branch per plan/feature. Name branches descriptively: `feature/add-xp-leaderboard`, `fix/commitment-tx-error`, `refactor/api-client-types`
- Always branch from the latest main (or whatever the base branch is)

### Commits

- Atomic, meaningful commits. One logical change per commit.
- Commit message format: imperative mood, under 72 chars for subject line
- Include a body if the "why" isn't obvious from the subject

### Keeping History Clean

When there are multiple PRs or branches in flight:

1. **Rebase before declaring done**: `git rebase main` to keep the branch current
2. **Interactive rebase to clean up**: if you made fixup commits during development, squash them: `git rebase -i main` (but only on your own branch, never on shared branches)
3. **Resolve conflicts locally**: if rebase produces conflicts, resolve them. Never force-push or discard changes.
4. **One PR per branch**: each branch maps to exactly one PR

### What NOT to do

- Never commit to `main` directly
- Never force-push
- Never amend commits that have already been pushed (they won't be — you can't push)
- Never delete branches without asking

## Cross-Repo Reference

You can read from any Andamio repo for context. Common references:

| Alias | Path | Use for |
|-------|------|---------|
| `api` | `~/projects/01-projects/andamio-api/` | API endpoints, handlers, middleware |
| `app` | `~/projects/01-projects/andamio-platform/andamio-app-v2/` | UI patterns, components, hooks |
| `template` | `~/projects/01-projects/andamio-platform/andamio-app-template/` | Starter patterns, default config |
| `docs` | `~/projects/01-projects/andamio-docs/` | Protocol docs, whitepaper |
| `txapi` | `~/projects/01-projects/andamio-atlas-api-v2/` | Transaction building patterns |
| `cli` | `~/projects/01-projects/andamio-cli/` | CLI commands, tx patterns |
| `core` | `~/projects/01-projects/andamio-core/` | On-chain validators, types |
| `dbapi` | `~/projects/01-projects/andamio-db-api-go/` | Database API (being replaced — read, don't emulate) |
| `xp` | `~/projects/01-projects/cardano-xp/` | Cardano XP app (reference implementation) |

Read these for patterns and context. Never write to them.

## Journal Discipline

This project keeps a build journal in `journal/`. The journal ships with the repo so anyone can follow the development process.

- **When**: after completing a feature, fix, or meaningful session of work
- **Format**: `journal/YYYY-MM-DD-brief-slug.md` — timestamped, one entry per session
- **Content**: what was built, key decisions made, what was learned, links to relevant commits or PRs
- **Tone**: concise, factual, useful to a future reader who wants to understand why things are the way they are

Create `journal/` if it doesn't exist. The journal is a non-code output of the project — treat it as a first-class artifact.

## Content Management

Course content lives in `compiled/` in andamio-cli import format. This is the source of truth.

### Directory structure

```
compiled/midnight-from-aiken-to-compact/
  101/   # Module 101
    outline.md       # Module title, description, SLTs
    lesson-1.md      # Lesson content (markdown)
    lesson-2.md
    lesson-3.md
    assignment.md    # Assignment prompt
  102/
  ...
  106/
```

### Content update workflow

1. **Edit** markdown files in `compiled/`
2. **Import** to Andamio API: `andamio course import-all compiled/midnight-from-aiken-to-compact --course-id <COURSE_ID>`
3. **Rebuild** the app: `npm run build` (prerendered pages pull fresh content from the API at build time)
4. **Deploy**: rebuild Docker image and deploy to Cloud Run

Content pages (homepage, lessons) are prerendered at build time — they're static HTML with ~2ms response times. A rebuild is required after content changes. Assignment pages and dashboard are SSR (they need authenticated data).

### Editing content

- Lessons are standard markdown. Edit `compiled/<module>/lesson-N.md` directly.
- `outline.md` defines the module title, description, and SLT text. Changes here affect the sidebar, module cards, and on-chain SLT registration.
- After editing, always import then rebuild. The app will not reflect changes until both steps are done.
- The `content/` directory was removed — do not recreate it. `compiled/` is the canonical format.

### Course ID

The course is registered on Cardano preprod:
- Course ID: `5f74e419a291825c637626c196b40a7aa63313cad6e69916cfdec9e5`
- Owner: `midnight-pbl`
- 6 modules (101-106), 3 lessons each, 6 assignments

## Andamio API

The Andamio API is the primary integration point. When building features:

1. Check the API docs and source for available endpoints before building custom solutions
2. Use the API client patterns established in the current project
3. Staging/preprod environment: `preprod.api.andamio.io`
4. If the API doesn't support what you need, note it — don't work around it silently

## Stack

- **Framework**: Astro 6 with `@astrojs/node` adapter (SSR + prerendering)
- **Islands**: React 19 via `@astrojs/react`, used with `client:only="react"` for wallet/auth/TX flows
- **Styling**: Tailwind CSS v4 with `@theme` tokens in `src/styles/globals.css`
- **State**: Vanilla Zustand store for auth (shared across islands), React Query for client-side data
- **Content rendering**: Server-side `marked` + `highlight.js` (zero client JS for lessons)
- **Polyfills**: `vite-plugin-node-polyfills` for Mesh SDK crypto/buffer deps — `process` must be excluded (`globals: { process: false }`) to avoid shadowing Node's `process.env` in the server build
- **Deploy**: Docker on GCP Cloud Run (project `built-on-andamio`, region `us-central1`)
