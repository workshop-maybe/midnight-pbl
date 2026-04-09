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

[Fork this repo](https://github.com/workshop-maybe/midnight-pbl/fork), then:

1. Replace the content in `content/` with your own course
2. Import to Andamio: `andamio course import-all compiled/<your-course> --course-id <YOUR_COURSE_ID>`
3. Deploy — the same Astro app serves your course on the web, and the same `.claude/` harness powers agent-based learning

This repo is an open-source example of Andamio tooling for course delivery. It shows how to build a course that works as a deployed web app, an agent-consumable experience, and a forkable template.

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
