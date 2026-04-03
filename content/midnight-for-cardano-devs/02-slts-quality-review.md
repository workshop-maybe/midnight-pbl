# SLT Quality Review

Course: Midnight for Cardano Developers
Reviewed: 2026-04-02

## Summary

- **18 SLTs reviewed**
- **Post-review: all Strong or Acceptable**
- Bloom's distribution: Apply (4), Analyze (5), Evaluate (4), Understand (2), Create (3) — no low-level clustering
- Progression ramps well: build (101) → map concepts (102) → write code (103) → experience tradeoffs (104) → understand economics (105) → design systems (106)

## Changes Applied

### Consistent pattern: removed "as demonstrated by" clauses
13 of 18 SLTs contained how-clauses prescribing assessment method. Moved all assessment criteria to assignment design (Phase 7). This matches the proven pattern from andamio-for-contributors, andamio-for-course-creators, and nostr-relay-operations.

### Removed parenthetical lists
6 SLTs contained inline lists (e.g., specific Cardano equivalents, transaction steps, rubric dimensions). These belong in lesson content.

### Changed "We can" to "I can"
All SLTs now use first-person singular per Andamio convention.

## Rewrites

| SLT | Before (abbreviated) | After |
|-----|---------------------|-------|
| 101.1 | ...as demonstrated by a running contract... | I can scaffold and deploy a Midnight DApp to the Preprod testnet using `create-mn-app`. |
| 101.2 | ...(Compact contract, proof server...) by inspecting... | I can identify the key components of a Midnight project and relate them to Cardano equivalents. |
| 101.3 | ...as evidenced by timing a proof... | I can describe proof generation and its role in the Midnight transaction lifecycle. |
| 102.1 | ...(public on-chain, private local)...as demonstrated by mapping... | I can compare Midnight's dual-state model to Cardano's EUTXO model. |
| 102.2 | ...as demonstrated by describing...in terms of...(Terraform...) | I can explain how Kachina transcripts handle concurrent state updates. |
| 102.3 | ...as demonstrated by accurately identifying... | I can describe Midnight's relationship to Cardano as a partner chain. |
| 103.1 | ...that declares public ledger state and private local state...as demonstrated by... | I can write a Compact contract that uses `disclose()` to control what crosses the public/private boundary. |
| 103.2 | ...as demonstrated by building the same feature three ways: (1)...(2)...(3)... | I can compare Compact's privacy annotations to the client-side/server-side mental model. |
| 103.3 | ...as demonstrated by a working DApp where... | I can implement a TypeScript witness function that provides private data to a Compact circuit. |
| 104.1 | ...(e.g., private voting...)...as demonstrated by... | I can build a privacy-preserving application on Midnight that uses ZK proofs to hide user inputs while updating public state. |
| 104.2 | ...as demonstrated by a side-by-side walkthrough...(local execution, proof generation...) | I can compare the transaction lifecycle of a shielded Midnight transaction to an equivalent Cardano transaction. |
| 104.3 | ...proof generation time, local compute...as demonstrated by measuring... | I can evaluate the cost of privacy in a concrete scenario and articulate when the cost is justified. |
| 105.1 | ...(NIGHT/DUST separation...)...by mapping...(ADA for both...) | I can explain Midnight's token architecture and map it to Cardano equivalents. |
| 105.2 | ...(developer fronts DUST...)...as demonstrated by...and an explanation of why... | I can build a DApp that uses sponsored transactions so new users can interact without holding tokens. |
| 105.3 | ...(privacy-at-risk...)...as demonstrated by scoring... | I can assess a DApp against Midnight's deployment risk rubric and draft a deployment proposal. |
| 106.1 | ...as demonstrated by an architecture document that specifies... | I can design a dual-chain architecture where public credential verification runs on Cardano and private attribute proofs run on Midnight. |
| 106.2 | ...against the framework "when does evidence..."...at least three real-world scenarios... | I can evaluate a use case and recommend when to use Cardano, Midnight, or both. |
| 106.3 | ...(cross-chain state verification...)...as demonstrated by a written analysis... | I can identify the open questions in Cardano-Midnight interoperability and distinguish what works today from what's unsolved. |

## No Issues Found

- No gaps in coverage
- No redundancy between SLTs
- No clustering at low Bloom's levels
- Prerequisite progression is sound
