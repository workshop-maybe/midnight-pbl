# Midnight PBL

Learn Midnight as a Cardano developer. 6 modules, 18 SLTs, hands-on from lesson one.

Built on the [Andamio API](https://preprod.api.andamio.io).

## Three ways to use this repo

### 1. Take the course in Claude Code

Clone the repo, open it in [Claude Code](https://claude.ai/code), and type `/learn`.

An AI instructor delivers lessons conversationally, guides exercises, and adapts to your level. When you finish a module, an assessor evaluates your work against the SLT rubrics. Progress is tracked locally in `progress.json`.

If you have an Andamio access token and headless auth set up, you can submit assignments on-chain. If not, share feedback via [GitHub Issues](https://github.com/workshop-maybe/midnight-pbl/issues).

### 2. Take the course on the web

The course is deployed at [midnight-pbl.io](https://midnight-pbl.io). Lessons are prerendered, assignments are submitted on-chain via wallet connection.

### 3. Fork it as a template

This repo is an open-source example of Andamio tooling for course delivery. It shows how to build a course app that works both as a deployed web app and as an agent-consumable learning experience. Fork it and adapt the structure for your own course.

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
