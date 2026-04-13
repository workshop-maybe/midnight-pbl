# Midnight PBL

Learn Midnight as a Cardano developer. 6 modules, 18 SLTs, hands-on from lesson one.

One source of truth — whether you read it in a browser, learn it with an AI instructor, or fork it to teach your own version, the content, SLTs, assignments, and credentials are the same.

Built on the [Andamio API](https://preprod.api.andamio.io).

## Three ways to use this repo

### 1. Take the course in Claude Code

```bash
git clone https://github.com/workshop-maybe/midnight-pbl.git
cd midnight-pbl
```

Open in [Claude Code](https://claude.ai/code) and type `/learn`.

An AI instructor delivers lessons conversationally, guides exercises, and adapts to your level. When you finish a module, an assessor evaluates your work against the SLT rubrics. Progress is tracked locally in `progress.json`.

If you have an Andamio access token and headless auth set up, you can submit assignments on-chain. If not, share feedback via [GitHub Issues](https://github.com/workshop-maybe/midnight-pbl/issues).

### 2. Take the course on the web

Visit [midnight-pbl.io](https://midnight-pbl.io) and start reading. Lessons are prerendered, assignments are submitted on-chain via wallet connection. No setup required.

### 3. Fork it as a template

[Fork this repo](https://github.com/workshop-maybe/midnight-pbl/fork), then follow the [Fork this template](#fork-this-template) checklist below.

---

## Course: Midnight for Cardano Developers

| Module | Title |
|--------|-------|
| 101 | Your First Midnight DApp |
| 102 | Midnight Architecture Through Cardano Eyes |
| 103 | Compact for Cardano Developers |
| 104 | The Privacy Model in Practice |
| 105 | Token Economics and Application Design |
| 106 | When Midnight, When Cardano, When Both? |

**Prerequisites:** Working knowledge of Cardano (EUTXO, native assets, validators), TypeScript, Docker.

## Project structure

```
content/midnight-for-cardano-devs/   # Source of truth for all course content
  00-course.md                       # Course metadata
  01-slts.md                         # Student Learning Targets
  lessons/module-{101-106}/          # Lesson markdown files
  assignments/m{101-106}-assignment.md  # Assignment rubrics

compiled/                            # Build artifact for Andamio API import
src/                                 # Astro 6 web app source
  config/
    branding.ts                      # Brand strings, links, asset paths
    networks.ts                      # Network profiles (preprod/mainnet)
    network.ts                       # Resolves CURRENT_NETWORK at build time
  styles/globals.css                 # Colors, fonts, design tokens
.claude/                             # Agent harness (skills, agents)
```

## Development

```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run typecheck    # Type checking
```

Content update workflow:
```bash
andamio course import-all compiled/midnight-for-cardano-devs --course-id <COURSE_ID>
npm run build
```

## Switching networks

Flip one env var:

```bash
PUBLIC_ANDAMIO_NETWORK=mainnet  # or "preprod"
```

Everything network-dependent (gateway URL, course ID, access token policy ID, Cardano network) is resolved at build time from `src/config/networks.ts`. See [`docs/DEPLOY.md`](./docs/DEPLOY.md) for the full list of env vars (there are only two).

---

## Fork this template

This repo is structured so that a rebrand touches a known, small set of files. Work through the checklist below in order.

### 1. Andamio prerequisites

Before you can deploy, you need:

- An **Andamio API key** — request one from the Andamio team.
- A **course ID** — publish your course to Andamio (see step 4 below) and grab the ID that `andamio course import-all` prints.
- A **minted access token** for each learner — the Andamio global access-token policy is per-network and already hardcoded in `src/config/networks.ts`. Learners connect a wallet that holds one of these tokens.

### 2. Edit `src/config/branding.ts`

This is the single source of truth for every brand-specific string and link. Edit every field:

- `name`, `tagline`, `fullTitle`, `description`, `longDescription` — text shown in nav, titles, and meta tags
- `hero.title`, `hero.subtitle` — the big title and subtitle on the homepage
- `logo.favicon`, `logo.ogImage`, `logo.heroSymbol`, `logo.wordmark` — paths to asset files under `public/`
- `links.midnight`, `links.andamio`, `links.docs` — external links shown in footer / landing
- `links.github`, `links.githubFork`, `links.githubIssues` — **your** forked repo URLs

### 3. Edit `src/config/networks.ts`

Fill in `courseId` for the network(s) you're publishing to. `accessTokenPolicyId` stays as the Andamio global value unless you're running your own Andamio instance.

```ts
preprod: {
  gatewayUrl: "https://preprod.api.andamio.io",
  cardanoNetwork: "preprod",
  accessTokenPolicyId: "aa1cbea2524d369768283d7c8300755880fd071194a347cf0a4e274f", // leave as-is
  courseId: "<YOUR_COURSE_ID>",                                                    // fill this
},
```

### 4. Edit `src/styles/globals.css`

Colors and fonts live here, not in `branding.ts` — Tailwind v4's `@theme` block needs compile-time tokens. Edit the `@theme` block at the top, then duplicate the same values into the `:root` block right below. The file has inline comments telling you which tokens to change.

### 5. Replace files in `public/`

- `favicon.ico`
- `og-image.png`
- Any logo files referenced by `BRANDING.logo.*` (the default template uses a Midnight logo pack under `/midnight_logo_pack/`)

### 6. Replace course content

Swap out `content/midnight-for-cardano-devs/` for your own course directory. Keep the same structure:

```
content/<your-course>/
  00-course.md
  01-slts.md
  lessons/module-<code>/
  assignments/m<code>-assignment.md
```

Then import to Andamio and rebuild:

```bash
andamio course import-all compiled/<your-course> --course-id <YOUR_COURSE_ID>
npm run build
```

### 7. Update the agent harness references

The Claude Code agent harness (`.claude/`) references the course directory by name in several skill and agent files (the instructor and assessor read lessons and rubrics from there). If you renamed the content directory in step 6, update those references:

```bash
grep -rl "midnight-for-cardano-devs" .claude/
# then edit each match to point at content/<your-course>/
```

Feedback URLs are already resolved from `src/config/branding.ts` → `links.githubIssues`, so no extra step is needed once step 2 is done.

### 8. Deploy

Follow [`docs/DEPLOY.md`](./docs/DEPLOY.md) — only two env vars to set.

---

## Architecture

See [`CLAUDE.md`](./CLAUDE.md) for the full architectural overview (Astro rendering strategy, two-tier API access, React islands, auth flow, transaction flow, and key constraints).
