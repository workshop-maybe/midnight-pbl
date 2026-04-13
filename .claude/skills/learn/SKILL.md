---
name: learn
description: "Learn Midnight as a Cardano developer — take the course, get lessons delivered, do exercises, submit assignments, and track progress across 6 modules (18 SLTs). Use when the learner says 'learn', 'start the course', 'teach me', 'next lesson', 'continue', 'where am I', 'submit my assignment', 'what module am I on', or anything about learning or progressing through the Midnight for Cardano Developers course. Also handles: resume, go back, skip ahead, review a lesson, retake an assignment, check progress, restart."
---

# Midnight for Cardano Developers — Course Orchestrator

Manage the learner's journey through the "Midnight for Cardano Developers" course. Track progress, route to the instructor for lessons or assessor for assignments, enforce module gating.

## Execution Mode: Sub-agent

Two agents, called as needed:

| Agent | subagent_type | Role | Skill | When |
|-------|--------------|------|-------|------|
| instructor | instructor | Deliver lessons, guide exercises | deliver-lesson | Learner is working through a lesson |
| assessor | assessor | Evaluate module assignments | assess-assignment | Learner submits assignment evidence |

Both agents use `model: "opus"`.

## Course Structure

6 modules, sequential gating. Each module unlocks the next.

| Module | Name | SLTs | Lessons |
|--------|------|------|---------|
| 101 | Your First Midnight DApp | 3 | 3 |
| 102 | Midnight Architecture Through Cardano Eyes | 3 | 3 |
| 103 | Compact for Cardano Developers | 3 | 3 |
| 104 | The Privacy Model in Practice | 3 | 3 |
| 105 | Token Economics and Application Design | 3 | 3 |
| 106 | When Midnight, When Cardano, When Both? | 3 | 2 (lesson 3 pending) |

Lesson files: `content/midnight-for-cardano-devs/lessons/module-{moduleCode}/{moduleCode}.{N}-*.md`
SLT list: `content/midnight-for-cardano-devs/01-slts.md`
Assignment files: `content/midnight-for-cardano-devs/assignments/m{moduleCode}-assignment.md`
Course metadata: `content/midnight-for-cardano-devs/00-course.md`

## Workflow

### Phase 0: Context Check

1. Determine progress file location:
   - Plugin context: `${CLAUDE_PLUGIN_DATA}/progress.json`
   - Clone context: `./progress.json` (project root)
2. Read progress.json if it exists
3. Determine execution mode:
   - **No progress file** → First run. Initialize progress, start course introduction.
   - **Progress exists** → Returning learner. Show where they left off, ask how to continue.
   - **Learner requests specific action** ("next lesson", "submit assignment", "check progress") → Route directly.

### Phase 1: Route

Based on learner intent:

| Intent | Action |
|--------|--------|
| "Start the course" / first run | Initialize progress → deliver M101 lesson 1 |
| "Next lesson" / "Continue" | Read progress → deliver next incomplete lesson |
| "Lesson {N}.{M}" / specific lesson | Check prerequisites → deliver requested lesson |
| "Submit assignment" / "I'm ready" | Check all module lessons complete → launch assessor |
| "Where am I" / "Progress" | Show progress summary |
| "Go back" / "Review {lesson}" | Deliver requested lesson (no gating for review) |

### Phase 2: Deliver Lesson (via instructor agent)

Launch the instructor agent:

```
Agent(
  subagent_type: "instructor",
  model: "opus",
  prompt: "You are the instructor for the Midnight for Cardano Developers course.
    Read .claude/skills/deliver-lesson/SKILL.md for pedagogy instructions.
    
    Deliver lesson {N} from module {moduleCode} to the learner.
    Lesson file: content/midnight-for-cardano-devs/lessons/module-{moduleCode}/{moduleCode}.{N}-*.md
    Module outline: content/midnight-for-cardano-devs/01-slts.md (Module {moduleCode} section)
    
    Learner context: {summary from progress.json — what they've completed, current module}
    
    After delivering the lesson and completing the exercise, report back:
    - Did the learner complete the lesson? (yes/no/partial)
    - Any notes on learner level or issues encountered"
)
```

After instructor returns: update progress.json with lesson completion.

### Phase 3: Assess Assignment (via assessor agent)

Pre-check: verify all lessons in the module are marked complete in progress.json. If not, tell the learner which lessons remain.

Collect the learner's evidence. Then launch the assessor:

```
Agent(
  subagent_type: "assessor",
  model: "opus",
  prompt: "You are the assessor for the Midnight for Cardano Developers course.
    Read .claude/skills/assess-assignment/SKILL.md for assessment instructions.
    
    Evaluate Module {moduleCode} assignment.
    Assignment file: content/midnight-for-cardano-devs/assignments/m{moduleCode}-assignment.md
    SLT list: content/midnight-for-cardano-devs/01-slts.md
    
    Learner's evidence:
    {paste learner's submitted evidence}
    
    Return structured assessment with per-SLT verdicts and module verdict (Accept/Revise)."
)
```

After assessor returns:
- **Accept** → Update progress.json (module completed, next module unlocked). Tell the learner. Then offer on-chain submission (see Phase 3b).
- **Revise** → Show the assessor's feedback. Tell the learner what to improve. Don't update progress.

### Phase 3b: On-Chain Submission (optional)

After an assignment is accepted, offer the learner two paths to submit their feedback on-chain:

**If authenticated** (learner has an Andamio access token and is logged in via headless mode):
- Submit an assignment commitment via CLI: `andamio course assignment commit --course-id 5f74e419a291825c637626c196b40a7aa63313cad6e69916cfdec9e5 --module-code {moduleCode}`
- This registers their evidence on-chain and starts the credential path.

**If not authenticated:**
- Tell the learner they can share feedback as a GitHub issue. Read the URL from `src/config/branding.ts` → `links.githubIssues` so it stays correct across forks.
- This ensures all learners have a way to contribute back regardless of wallet/auth setup.

### Phase 4: Progress Update

Write progress.json after any state change. Schema in `references/progress-schema.md`.

Key transitions:
- Lesson completed → `modules.{moduleCode}.lessons.{N}: "completed"`
- Module accepted → `modules.{moduleCode}.status: "completed"`, next module status → `"unlocked"`
- `current_module` and `current_lesson` always reflect the learner's position

## Module Gating Rules

- M101: Always unlocked (entry point)
- M102–M106: Unlocked only when the previous module's assignment is accepted
- Within a module, lessons are sequential: lesson N+1 unlocks after lesson N is completed
- Exception: reviewing a completed lesson is always allowed regardless of gating

## Error Handling

| Situation | Strategy |
|-----------|----------|
| progress.json corrupted/invalid | Back up the broken file, initialize fresh, tell the learner |
| Lesson file missing | Report the gap, check if it's the known M106 lesson 3 gap |
| Assessor returns unclear verdict | Default to Revise, ask learner to resubmit with clearer evidence |
| Learner requests module they haven't unlocked | Explain gating, show what they need to complete first |
