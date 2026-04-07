# Module 104 Assignment — The Privacy Model in Practice

## Part 1: Evidence

### SLT 104.1 — Build a privacy-preserving application

**Evidence required:**
- A working application (or detailed code walkthrough) that uses ZK proofs to hide user inputs while updating public state
- Description of what's private, what's public, and how the proof connects them

**Strong answer:** Shows an application where users submit private inputs (e.g., a secret vote, a hidden bid, a private credential), a ZK proof verifies the input is valid without revealing it, and the public state updates accordingly (e.g., tally increments, auction state changes, access is granted). The learner can articulate the full flow from user action to on-chain settlement.

### SLT 104.2 — Compare shielded Midnight TX to Cardano TX

**Evidence required:**
- A side-by-side comparison of a specific transaction on both chains (e.g., "transfer 100 tokens" or "submit a vote")
- For each step in the lifecycle, identify what's visible to a public observer on each chain

**Strong answer:** Walks through both lifecycles step by step. On Cardano: build TX with visible datum/redeemer → sign → submit → validator runs publicly → state change visible on-chain. On Midnight: build TX with private inputs → generate ZK proof locally → submit proof + public outputs → verifier checks proof → public state updates, private inputs never appear. The key contrast: a Cardano block explorer shows everything; a Midnight block explorer shows the proof was valid but not what was proven.

### SLT 104.3 — Evaluate the cost of privacy

**Evidence required:**
- A concrete scenario where privacy adds cost (proof generation time, circuit complexity, UX friction)
- A judgment: is the cost justified in this case? Why or why not?
- A counter-example: a scenario where the cost is NOT justified

**Strong answer:** Picks a real scenario (e.g., private voting vs public voting, private credentials vs public badges). Quantifies the cost honestly — proof generation takes seconds, circuits limit what you can compute, users need local proving. The justified/unjustified judgment shows critical thinking, not cheerleading. The counter-example demonstrates the learner can recommend against Midnight when simpler tools suffice.

## Part 2: Feedback

How was Module 104? What was clear, what was confusing, what would you change?
