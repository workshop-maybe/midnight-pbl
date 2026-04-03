# Coaching Readiness Assessment

Course: Midnight for Cardano Developers
Assessed: 2026-04-02

## Calibration Note

Based on 41 previous assessments across 4 courses:
- Overall tier-level accuracy: 100%
- Dimension accuracy: 90%
- Known overconfidence: Conceptual dimension for platform-specific SLTs (assumed wrong behavior in 2 cases)
- Adjustment applied: For Developer Documentation SLTs involving Compact/Midnight SDK, defaulting Code Demo to Weak — this is a niche, fast-moving ecosystem with limited training data. High confabulation risk for API signatures, compiler flags, and SDK patterns.

## Summary

- **Total SLTs assessed**: 18
- **Distribution**: 8 Ready / 5 Needs Context / 5 Needs Human
- **Overview**: Strong on conceptual territory (Exploration SLTs) — Cardano architecture, privacy models, and cross-chain reasoning are well-grounded. Weak on Compact/Midnight SDK code — the compiler is at v0.30.0, the CLI at v0.5.0, and the ecosystem is pre-mainnet. Code examples from research notes help but need verification against current SDK. The How To Guide (101.1) needs current `create-mn-app` output verified.

## Readiness by Module

| Module | Ready | Needs Context | Needs Human | Notes |
|--------|-------|---------------|-------------|-------|
| 101: Your First Midnight DApp | 1 | 1 | 1 | Exploration is solid; scaffolding procedure needs live verification |
| 102: Architecture Through Cardano Eyes | 3 | 0 | 0 | Strongest module — pure conceptual, well-researched |
| 103: Compact for Cardano Developers | 1 | 1 | 1 | Mental model is strong; Compact code needs SDK verification |
| 104: Privacy Model in Practice | 1 | 1 | 1 | Reasoning solid; full app build needs working code |
| 105: Token Economics and Application Design | 1 | 1 | 1 | Economics well-researched; sponsored tx DApp needs SDK |
| 106: When Midnight, When Cardano, When Both? | 1 | 1 | 1 | Architectural reasoning strong; open questions need current status |

---

## Per-SLT Assessment

### Module 101: Your First Midnight DApp

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 101.1 | Scaffold and deploy using `create-mn-app` | Strong | N/A | Partial | Uncertain | Needs Context |
| 101.2 | Identify key components, relate to Cardano equivalents | Strong | N/A | Strong | Current | Ready |
| 101.3 | Describe proof generation and tx lifecycle role | Strong | N/A | Partial | Uncertain | Needs Human |

#### Gap Analysis

**SLT 101.1: "I can scaffold and deploy a Midnight DApp to the Preprod testnet using `create-mn-app`."**
- **Partial/Uncertain dimensions**: Assessment (Partial) — can't verify learner's deployment succeeded without knowing current preprod state. Currency (Uncertain) — `create-mn-app` templates may have changed since research notes.
- **What I would need**: Live `create-mn-app` output from current CLI version, confirmed preprod deployment steps, current template list and project structure.
- **Risk if coached without context**: Wrong CLI flags, outdated project structure, broken deployment steps. Research note 009 has a project structure but it may not reflect current scaffolder output.

**SLT 101.3: "I can describe proof generation and its role in the Midnight transaction lifecycle."**
- **Partial/Uncertain dimensions**: Assessment (Partial) — can explain the concept but can't verify learner's timing claims or proof server behavior. Currency (Uncertain) — proof generation times, proof server setup, and infrastructure requirements are moving targets.
- **What I would need**: Current proof generation benchmarks from preprod, proof server setup confirmation, actual timing data from a deployed contract.
- **Risk if coached without context**: Cited benchmarks may be wrong. Proof server infrastructure may have changed. Learner assessment would rely on theoretical rather than empirical data.

---

### Module 102: Midnight Architecture Through Cardano Eyes

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 102.1 | Compare dual-state model to EUTXO | Strong | N/A | Strong | Current | Ready |
| 102.2 | Explain Kachina transcripts | Strong | N/A | Strong | Current | Ready |
| 102.3 | Describe partner chain relationship | Strong | N/A | Strong | Current | Ready |

All three Ready. Architectural concepts are stable (Kachina paper published 2021, partner chain model well-documented). The existing compiled lessons cover this territory well. Research notes 003 (UC), 005 (ledger architecture) provide deep grounding. No confabulation risk on conceptual territory — these are structural facts, not API surfaces.

---

### Module 103: Compact for Cardano Developers

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 103.1 | Write Compact contract with `disclose()` | Strong | Partial | Partial | Uncertain | Needs Context |
| 103.2 | Compare privacy annotations to client/server model | Strong | N/A | Strong | Current | Ready |
| 103.3 | Implement TypeScript witness function | Partial | Weak | Weak | Likely Stale | Needs Human |

#### Gap Analysis

**SLT 103.1: "I can write a Compact contract that uses `disclose()` to control what crosses the public/private boundary."**
- **Partial/Uncertain dimensions**: Code Demo (Partial) — research notes have Compact code snippets that look correct (hello world contract, `disclose()` usage), but I can't confirm they compile against Compact v0.30.0. Assessment (Partial) — can evaluate logical structure but not compiler-specific errors. Currency (Uncertain) — Compact language is pre-1.0, syntax may shift.
- **What I would need**: Confirmed-compiling Compact contract examples from current SDK. Compiler error messages for common mistakes. `disclose()` behavior verification.
- **Risk if coached without context**: Compact syntax may have changed. Pragma version, import paths, type annotations may be wrong. Existing compiled lessons use `pragma language_version >= 0.20` — current is 0.30.

**SLT 103.3: "I can implement a TypeScript witness function that provides private data to a Compact circuit."**
- **Weak/Likely Stale dimensions**: Code Demo (Weak) — I cannot write the witness function TypeScript API with confidence. The `WitnessContext<Ledger, PrivateState>` type from the compiled lessons may not reflect current SDK. Specific imports, type signatures, and runtime patterns are high confabulation risk. Assessment (Weak) — can't catch SDK-specific errors. Currency (Likely Stale) — Midnight SDK is pre-mainnet, TypeScript API likely changed since compiled lessons were written.
- **What I would need**: Current Midnight SDK TypeScript API reference, working witness function example from current SDK, type definitions for `WitnessContext` and related types.
- **Risk if coached without context**: Wrong imports, non-existent types, broken patterns. This is the niche-library confabulation zone. Every line of TypeScript SDK code needs verification.

---

### Module 104: The Privacy Model in Practice

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 104.1 | Build privacy-preserving app with ZK proofs | Strong | Weak | Weak | Likely Stale | Needs Human |
| 104.2 | Compare shielded Midnight tx to Cardano tx | Strong | N/A | Strong | Current | Ready |
| 104.3 | Evaluate cost of privacy, articulate when justified | Strong | N/A | Partial | Uncertain | Needs Context |

#### Gap Analysis

**SLT 104.1: "I can build a privacy-preserving application on Midnight that uses ZK proofs to hide user inputs while updating public state."**
- **Weak/Likely Stale dimensions**: Code Demo (Weak) — full DApp build requires Compact contract + TypeScript integration + deployment. Can't write end-to-end working code with confidence. Assessment (Weak) — can't evaluate a learner's full app for SDK-specific correctness. Currency (Likely Stale) — SDK, deployment tooling, and proof server integration are all pre-mainnet moving targets.
- **What I would need**: Working end-to-end example app from current Midnight SDK (e.g., bulletin board template from `create-mn-app`), deployment scripts, proof server integration code.
- **Risk if coached without context**: The entire build pipeline may have changed. Deployment steps, proof server config, SDK integration patterns — all high risk.

**SLT 104.3: "I can evaluate the cost of privacy in a concrete scenario and articulate when the cost is justified."**
- **Partial/Uncertain dimensions**: Assessment (Partial) — can evaluate reasoning quality but not empirical claims without current benchmarks. Currency (Uncertain) — proof generation times improve with each release.
- **What I would need**: Current proof generation benchmarks, compute requirements for proof server, gas costs on preprod.
- **Risk if coached without context**: Outdated cost figures. Research note 006 has conceptual framework but no hard numbers.

---

### Module 105: Token Economics and Application Design

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 105.1 | Explain token architecture, map to Cardano | Strong | N/A | Strong | Current | Ready |
| 105.2 | Build sponsored tx DApp | Partial | Weak | Weak | Likely Stale | Needs Human |
| 105.3 | Assess DApp against deployment risk rubric | Strong | N/A | Partial | Uncertain | Needs Context |

#### Gap Analysis

**SLT 105.2: "I can build a DApp that uses sponsored transactions so new users can interact without holding tokens."**
- **Weak/Likely Stale dimensions**: Code Demo (Weak) — sponsored transaction pattern requires batcher integration. Can't write this code with confidence. The "batcher" concept is described in research note 007 but no API surface is documented. Assessment (Weak) — can't evaluate learner's sponsored tx implementation. Currency (Likely Stale) — batcher API is pre-mainnet, may not be publicly available yet.
- **What I would need**: Midnight SDK batcher/sponsored transaction API reference, working example of sponsored tx, current batcher availability status.
- **Risk if coached without context**: Sponsored transactions may not be developer-accessible yet. Building a lesson around an API that doesn't exist publicly would be worse than useless.

**SLT 105.3: "I can assess a DApp against Midnight's deployment risk rubric and draft a deployment proposal."**
- **Partial/Uncertain dimensions**: Assessment (Partial) — can evaluate reasoning but not whether learner's risk scores are accurate for specific use cases. Currency (Uncertain) — deployment process documented in research note 011 but may evolve pre-mainnet.
- **What I would need**: Current MIP repo structure, example deployment proposals, current rubric criteria (confirm 3-dimension model still current).
- **Risk if coached without context**: Deployment process may have changed. Rubric dimensions may have been updated.

---

### Module 106: When Midnight, When Cardano, When Both?

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 106.1 | Design dual-chain architecture | Strong | N/A | Partial | Uncertain | Needs Context |
| 106.2 | Evaluate use case, recommend chain | Strong | N/A | Strong | Current | Ready |
| 106.3 | Identify open interop questions | Strong | N/A | Partial | Uncertain | Needs Human |

#### Gap Analysis

**SLT 106.1: "I can design a dual-chain architecture where public credential verification runs on Cardano and private attribute proofs run on Midnight."**
- **Partial/Uncertain dimensions**: Assessment (Partial) — can evaluate architectural reasoning but not whether proposed integration patterns are currently feasible. Currency (Uncertain) — cross-chain capabilities are the fastest-moving part of the ecosystem.
- **What I would need**: Current cross-chain integration status, confirmed bridge/oracle capabilities, what the SDK supports for external chain state.
- **Risk if coached without context**: Might teach patterns that aren't yet possible, or miss patterns that now are.

**SLT 106.3: "I can identify the open questions in Cardano-Midnight interoperability and distinguish what works today from what's unsolved."**
- **Weak/Uncertain dimensions**: Assessment (Partial → Weak for "today" claims) — research note 010 identifies the right questions but explicitly says "to be answered as we build." Can't distinguish "works today" from "unsolved" without current hands-on testing. Currency (Uncertain) — the "what works today" answer changes with each release.
- **What I would need**: Current SDK capabilities for cross-chain operations, confirmed bridge/oracle status, developer forum threads on interop progress.
- **Risk if coached without context**: Teaching "this is unsolved" when it may now be solved, or "this works" when it may have regressed. This SLT requires the most current information of any in the course.

---

## Lesson Prioritization

### Tier 1: Build First (Ready — 8 SLTs)

| # | SLT | Module | Rationale |
|---|-----|--------|-----------|
| 101.2 | Identify key components, relate to Cardano | 101 | Stable conceptual mapping. Research notes + compiled lessons provide full grounding. |
| 102.1 | Compare dual-state to EUTXO | 102 | Architectural concepts stable since Kachina paper (2021). |
| 102.2 | Explain Kachina transcripts | 102 | UC framework and transcript model well-documented. Research note 003. |
| 102.3 | Describe partner chain relationship | 102 | Structural facts, well-sourced. Compiled lesson 1.3 covers this well. |
| 103.2 | Compare privacy annotations to client/server | 103 | Mental model lesson. No code, no currency risk. |
| 104.2 | Compare shielded tx to Cardano tx | 104 | Transaction lifecycle well-documented. Research note 006. |
| 105.1 | Explain token architecture, map to Cardano | 105 | Token matrix well-documented. Research notes 004, 007. |
| 106.2 | Evaluate use case, recommend chain | 106 | Framework-based reasoning. Decision tree from research note 005. |

### Tier 2: Build with Context (Needs Context — 5 SLTs)

| # | SLT | Module | Context Needed |
|---|-----|--------|---------------|
| 101.1 | Scaffold and deploy with `create-mn-app` | 101 | Live CLI output, current templates, confirmed preprod steps |
| 103.1 | Write Compact contract with `disclose()` | 103 | Confirmed-compiling Compact examples from current SDK |
| 104.3 | Evaluate cost of privacy | 104 | Current proof generation benchmarks from preprod |
| 105.3 | Assess against deployment risk rubric | 105 | Current MIP repo, example proposals, rubric confirmation |
| 106.1 | Design dual-chain architecture | 106 | Current cross-chain integration capabilities |

### Tier 3: Defer (Needs Human — 5 SLTs)

| # | SLT | Module | Reason for Deferral |
|---|-----|--------|-------------------|
| 101.3 | Describe proof generation | 101 | Needs empirical timing data from live preprod deployment |
| 103.3 | Implement TypeScript witness function | 103 | Midnight SDK TypeScript API — niche library, high confabulation risk, likely stale |
| 104.1 | Build privacy-preserving app | 104 | Full DApp build requires verified end-to-end SDK code |
| 105.2 | Build sponsored tx DApp | 105 | Batcher API may not be publicly available; needs SDK verification |
| 106.3 | Identify open interop questions | 106 | "What works today" requires hands-on current testing |

---

## Context Shopping List

| Resource | Type | SLTs Unlocked | Priority |
|----------|------|---------------|----------|
| Current `create-mn-app` output + preprod deployment walkthrough | Live verification | 101.1, 101.3 | **High** |
| Midnight SDK TypeScript API reference (current version) | Docs | 103.3, 104.1, 105.2 | **High** |
| Confirmed-compiling Compact contract examples (v0.30.0+) | Example Code | 103.1, 104.1 | **High** |
| Current proof generation benchmarks from preprod | Empirical data | 101.3, 104.3 | **High** |
| Sponsored transaction / batcher API reference | Docs | 105.2 | **Medium** |
| Current MIP repo + example deployment proposals | Docs | 105.3 | **Medium** |
| Current cross-chain integration capabilities | Docs + Human Review | 106.1, 106.3 | **Medium** |
| Midnight developer forum / Discord threads on SDK changes | Version Confirmation | 103.3, 104.1, 105.2, 106.3 | **Low** |

---

## Set-Level Observations

**Strength clusters:** All Exploration SLTs (12/18) are Ready or close. Conceptual territory — architectural comparisons, mental models, tradeoff reasoning — is well-grounded by the research notes, compiled lessons, and stable source material (Kachina paper, partner chain model, UC framework). This course's strength is its reasoning, not its code.

**Weakness clusters:** All Developer Documentation SLTs (4/4) are Needs Context or Needs Human. The common thread: Midnight SDK is pre-mainnet, niche, and fast-moving. Every line of Compact or TypeScript SDK code is a confabulation risk. This is exactly the niche-library pattern from calibration data.

**Critical path:** Two resources unlock the most:
1. **Current `create-mn-app` + live deployment** — unlocks 101.1 and 101.3, and provides the scaffolded project that 103.1 can build on.
2. **Midnight SDK TypeScript API reference** — unlocks 103.3, 104.1, and 105.2 (the three hardest SLTs).

**Sequencing implication:** Build all 8 Ready (Exploration) lessons first. These form the conceptual backbone. Then gather context for the 5 Needs Context SLTs. The 5 Needs Human SLTs should be built last, ideally after hands-on preprod experience.

**Confabulation risk zones:**
- Compact syntax details (pragma versions, import paths, type annotations)
- TypeScript SDK types (`WitnessContext`, witness function signatures, deployment API)
- Batcher/sponsored transaction API (may not be public yet)
- Proof server configuration and timing
- Cross-chain integration current status

**The sandwich pattern helps:** Because each module sandwiches Developer Documentation between Exploration lessons, we can build the conceptual framing first (Ready) and add the code-heavy lessons when context is gathered. Learners get the "why" immediately; the "how" arrives when we have verified code.
