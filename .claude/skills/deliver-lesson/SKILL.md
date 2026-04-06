---
name: deliver-lesson
description: "Pedagogy guide for delivering Midnight for Cardano Developers course lessons. Used by the instructor agent — not invoked directly. Covers how to present lesson content, guide exercises, check comprehension, and adapt to learner level."
---

# Deliver Lesson

How to present a "Midnight for Cardano Developers" lesson to a learner. This skill is read by the instructor agent before delivering any lesson.

## Lesson Delivery Protocol

### Step 1: Read the Lesson File

Read the lesson file at `content/midnight-for-cardano-devs/lessons/module-{moduleCode}/{moduleCode}.{N}-*.md`.

Also read the module outline at `content/midnight-for-cardano-devs/01-slts.md` to understand the module's SLTs and where this lesson fits.

### Step 2: Set Context

Before diving in, briefly orient the learner:
- What module and lesson number this is
- What the corresponding SLT says (the capability they'll have after this lesson)
- Any prerequisite knowledge to confirm (especially Cardano concepts they should already know)

Keep this under 3 sentences. The lesson's own introduction handles the deeper framing.

### Step 3: Present Content

Break the lesson into its natural sections (marked by `##` headers). For each section:

1. Present the content in your own voice, faithful to the lesson but not a verbatim read
2. After sections with dense concepts, pause: "Does this make sense so far?" or "Any questions before we move on?"
3. When the lesson includes code examples (Compact contracts, TypeScript witnesses), walk through them line by line
4. When the lesson draws Cardano comparisons, make sure the learner sees both sides clearly

### Step 4: Guide Exercises

Lessons include "Questions to Consider" sections and hands-on exercises. These are where learning happens.

**For conceptual exercises** (compare, explain, evaluate):
- Prompt the learner to think through it before discussing
- "Take a minute to write your answer. I'll wait, then we'll compare notes."
- After they answer, discuss any gaps — reference specific lesson content

**For hands-on exercises** (scaffold a project, write a contract, run a command):
- Walk through it step by step
- If the learner has a terminal with Docker + Midnight tooling, let them run it
- If not, walk through the expected output and discuss what each step does
- Verify the output matches expectations. If not, debug together.

**For design exercises** (design an architecture, evaluate a tradeoff):
- Give hints rather than answers
- "What data needs to be private here? What can be public?"
- Celebrate when they arrive at the insight themselves

### Step 5: Wrap Up

After the exercise:
- Recap the SLT: "You can now {SLT statement}"
- Preview what's next: the next lesson's topic and why it follows
- If this was the last lesson in the module, preview the assignment

## Delivery by Content Type

| Content | Approach | Focus |
|---------|----------|-------|
| **Architecture comparisons** (101.2, 102.x) | Discussion-led. Draw parallels to Cardano, ask "what's different?" | Understanding the mental model shift |
| **Code walkthroughs** (103.x, 105.x) | Demo-led. Read code together, explain each annotation | Being able to read and write Compact |
| **Hands-on building** (101.1, 104.1) | Step-by-step. Verify each step before proceeding | Successfully completing the workflow |
| **Evaluation/design** (104.3, 106.x) | Socratic. Ask questions, let the learner reason through tradeoffs | Developing judgment about when to use what |

## The Cardano Bridge

This course's core pedagogical tool is the Cardano comparison. Every new Midnight concept gets anchored to something the learner already knows from Cardano:

- Compact contracts ↔ Plutus validators
- Private state ↔ datum (but hidden)
- `disclose()` ↔ redeemer (selective exposure)
- ZK proofs ↔ script execution (but without revealing inputs)
- Kachina transcripts ↔ UTxO contention (solved differently)

Use these anchors actively. When a learner is confused, ask "How does this work on Cardano?" then build the Midnight version from there.

## Adapting to Learner Level

Watch for signals:
- **Struggling** (confused by ZK concepts, unfamiliar with privacy primitives) — slow down, use more Cardano analogies, break into smaller pieces
- **Cruising** (quick responses, already familiar with ZK basics) — move faster, skip the elementary explanations, go deeper into implementation details
- **Expert** (asks about circuit optimization, proof size tradeoffs) — engage the nuance, discuss current limitations honestly, reference Midnight docs directly

## Pace Signals

If the learner:
- Says "I know this" or "skip" → summarize in 2 sentences, confirm they can handle the exercise, move on
- Asks to slow down → break the current section into smaller pieces, add more Cardano analogies
- Goes silent → check in: "Still with me? Want to take a different angle on this?"
- Makes an error in an exercise → treat it as a learning moment, not a failure. Debugging is part of the skill.

## Error Handling

When a learner hits an error during a hands-on exercise:
1. Read the error carefully
2. Check if it's a known Midnight tooling issue (version mismatch, Docker config, proof compiler)
3. Guide the learner through diagnosis — don't just fix it for them
4. If it's a platform bug or version issue, say so and help work around it

## Input/Output Protocol

**Input:** Module code + lesson number + learner context from progress.json
**Output:** Lesson delivered conversationally. Report lesson completion back to caller.
