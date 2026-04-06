---
name: assess-assignment
description: "Assessment guide for evaluating Midnight for Cardano Developers module assignments. Used by the assessor agent — not invoked directly. Covers how to evaluate evidence against SLT criteria, apply rubrics, and provide constructive feedback."
---

# Assess Assignment

How to evaluate a "Midnight for Cardano Developers" module assignment. This skill is read by the assessor agent before evaluating any submission.

## Assessment Protocol

### Step 1: Read the Assignment File

Read `content/midnight-for-cardano-devs/assignments/m{moduleCode}-assignment.md` for the module being assessed. This file defines:
- Exactly what evidence each SLT requires
- What a strong answer looks like
- The format expected (written response, code snippet, architecture diagram, etc.)

Also read the SLT definitions from `content/midnight-for-cardano-devs/01-slts.md` for the canonical wording.

### Step 2: Evaluate Each SLT

For each SLT in the module, assess the learner's evidence:

**Written responses** (explain, describe, compare, evaluate):
- Does the answer demonstrate the capability the SLT names?
- Does it include the specific elements the assignment says a "strong answer" should include?
- Is the reasoning sound, or is it vague hand-waving?
- Minor phrasing differences from the rubric are fine — the reasoning matters, not the wording.
- For Cardano comparisons: does the learner show genuine understanding of both sides, or just superficial mapping?

**Code submissions** (Compact contracts, TypeScript witnesses):
- Is the code syntactically plausible?
- Does it demonstrate the concept the SLT targets (e.g., using `disclose()` for selective revelation)?
- Does the accompanying explanation show the learner understands what the code does, not just that they copied an example?

**Architecture designs** (especially M106):
- Is the design coherent? Do the pieces fit together?
- Are bridge points between Cardano and Midnight clearly identified?
- Are trust assumptions named?
- Does the design solve the stated problem, or is it a generic template?

### Step 3: Assess Feedback Section

Part 2 of every assignment is feedback on the module. This is required but not graded.

- Check that it's present and non-empty
- If the learner wrote something substantive, acknowledge it specifically
- If they wrote "everything was fine" — accept it
- Note any actionable feedback that could improve the course

### Step 4: Determine Verdicts

**Per-SLT verdicts:**

| Verdict | Criteria |
|---------|----------|
| **Pass** | Evidence is present AND demonstrates the SLT capability. Minor gaps in phrasing are OK if reasoning is sound. |
| **Revise** | Evidence is present but incomplete, vague, or partially incorrect. Or the Cardano comparison is superficial. |
| **Missing** | No evidence provided for this SLT. |

**Module verdict:**

| Verdict | Criteria |
|---------|----------|
| **Accept** | All SLTs pass AND feedback section present |
| **Revise** | One or more SLTs are Revise or Missing. List exactly which ones. |

### Step 5: Write the Assessment

Use this structure:

```markdown
## Module {moduleCode} Assessment

### SLT {moduleCode}.1 — {title}
**Verdict:** Pass | Revise | Missing
{2-3 sentences: what was strong, what needs work. Be specific.}

### SLT {moduleCode}.2 — {title}
**Verdict:** Pass | Revise | Missing
{2-3 sentences}

### SLT {moduleCode}.3 — {title}
**Verdict:** Pass | Revise | Missing
{2-3 sentences}

### Feedback Section
{Acknowledge the learner's feedback. Quote anything particularly useful.}

### Module Verdict: Accept | Revise
{If Accept: congratulate. Name what the learner can now do.}
{If Revise: list exactly which SLTs need revision and what's missing. Be constructive.}
```

## Calibration Notes

**This course teaches a new technology through the lens of one the learner already knows.** The strongest signal of understanding is when a learner can articulate both the parallel and the divergence between Cardano and Midnight. "It's like Plutus but private" is not enough — they need to explain what "private" means structurally.

**Common revision patterns:**
- Learner paraphrases the lesson without adding their own understanding → Revise. Ask them to explain in their own words.
- Learner's Cardano comparison is too shallow (just naming equivalents without explaining differences) → Revise. Ask for the divergence point.
- Learner provides code but no explanation of what it does → Revise. Code without understanding doesn't pass.
- Learner's design (M105, M106) is generic rather than grounded in the specific scenario → Revise. Ask them to make concrete choices.
- Learner wrote "I don't know" for one SLT → Missing. Point them back to the specific lesson.

**Resubmissions:**
When evaluating a resubmission, focus on whether the specific gaps from the previous assessment were addressed. Don't re-evaluate SLTs that already passed unless the learner changed their answer. Acknowledge improvement.

## Module-Specific Notes

### M101 (Your First Midnight DApp)
- SLT 101.1 is hands-on — look for evidence of actual deployment, not just description
- SLT 101.2 asks for Cardano equivalents — the mapping should be specific, not vague
- SLT 101.3 is conceptual but precise — proof generation has a specific role and timing

### M102 (Architecture)
- This is the hardest conceptual module. All three SLTs require deep understanding.
- SLT 102.2 (Kachina transcripts) is the trickiest — accept any answer that shows the learner understands why concurrency is handled differently than UTxO contention
- SLT 102.3 (partner chain) — watch for confusion between "sidechain" and "partner chain"

### M103 (Compact)
- Code-heavy module. All three SLTs involve writing or reading code.
- SLT 103.1 — the key is intentional use of `disclose()`, not just presence
- SLT 103.3 — witness functions are the bridge between private data and ZK circuits. The explanation matters as much as the code.

### M104 (Privacy in Practice)
- This module asks for judgment, not just knowledge
- SLT 104.3 (cost of privacy) — the counter-example is as important as the justified case. Can the learner recommend against Midnight?

### M105 (Tokens and Credentials)
- The most technically dense module
- SLT 105.3 (Merkle commitments + nullifiers) — this is a specific cryptographic pattern. Look for precision.

### M106 (When to Use What)
- Capstone module. Synthesizes everything.
- SLT 106.2 — the recommendation must be grounded, not generic
- SLT 106.3 — "open questions" means current limitations, not wishlist features. The learner should distinguish what works today.

## Input/Output Protocol

**Input:** Module code + learner's evidence (written responses, code, designs)
**Output:** Structured assessment with per-SLT verdicts and module verdict.
