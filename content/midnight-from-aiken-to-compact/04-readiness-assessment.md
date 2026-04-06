# Coaching Readiness Assessment: Building on Midnight — From Aiken to Compact

## Summary

- **Total SLTs assessed**: 18
- **Distribution**: 2 Ready / 6 Needs Context / 10 Needs Human
- **Overview**: Strong on architectural/conceptual comparisons (Modules 1, 6) leveraging existing Cardano knowledge. Weak on all Compact code production — Midnight is pre-mainnet, Compact is niche with limited training data, cannot pass Confabulation Test for any Compact code.

## Readiness by Module

| Module | Ready | Needs Context | Needs Human | Notes |
|--------|-------|---------------|-------------|-------|
| 1: Architecture | 1 | 2 | 0 | Conceptual strength, need docs to confirm current specifics |
| 2: Compact Fundamentals | 0 | 1 | 2 | Can compare concepts but cannot write Compact code reliably |
| 3: Privacy Model | 0 | 1 | 2 | Can explain concepts but cannot write witnesses or trace proofs |
| 4: Developer Workflow | 0 | 1 | 2 | Terminal procedures need version-confirmed commands |
| 5: Credential Systems | 0 | 0 | 3 | Cannot write credential circuits, MerkleTree patterns, or selective disclosure |
| 6: Dual-Chain Architecture | 1 | 1 | 1 | Architectural judgment strong; interop constraints need current docs |

## Lesson Prioritization

### Tier 1: Build First (Ready)
| # | SLT | Module | Rationale |
|---|-----|--------|-----------|
| 1.3 | Explain partner chain relationship | Architecture | Leverages general Cardano + Substrate knowledge. Exploration — no code risk. |
| 6.1 | Design dual-chain architecture | Dual-Chain | Architectural thinking, not code. Draws on today's research. |

### Tier 2: Built with Context (Session 1 complete — 2026-03-23)
| # | SLT | Module | Status |
|---|-----|--------|--------|
| 1.1 | Compare execution models | Architecture | **Lesson drafted** |
| 1.2 | Describe dual-ledger system | Architecture | **Lesson drafted** |
| 2.1 | Describe Compact components | Compact Fundamentals | **Lesson drafted** |
| 3.1 | Explain disclose() | Privacy Model | **Lesson drafted** |
| 4.1 | Install toolchain | Dev Workflow | **Lesson drafted** |
| 6.2 | Describe interop constraints | Dual-Chain | **Lesson drafted** |

### Tier 3a: Built with Verified Code (Session 2 complete — 2026-03-23)
| # | SLT | Module | Status |
|---|-----|--------|--------|
| 2.2 | Compare Aiken to Compact | Compact Fundamentals | **Lesson drafted** — verified with compiled bboard code |
| 2.3 | Write a Compact contract | Compact Fundamentals | **Lesson drafted** — counter + bboard as examples |
| 3.2 | Describe ZK proof pipeline | Privacy Model | **Lesson drafted** — artifact sizes from compilation |
| 3.3 | Implement witness in TypeScript | Privacy Model | **Lesson drafted** — bboard witness as canonical example |
| 4.2 | Compile and identify artifacts | Dev Workflow | **Lesson drafted** — verified output from both contracts |
| 4.3 | Deploy to preprod | Dev Workflow | **Lesson drafted** — preprod faucet + standalone confirmed |

### Tier 3b: Defer (Needs Human)
| 5.1 | Design credential circuit | Credentials | Cannot verify Compact credential code compiles |
| 5.2 | MerkleTree + nullifiers | Credentials | MerkleTree API surface unknown |
| 5.3 | Selective disclosure | Credentials | Compound confabulation risk |
| 6.3 | Evaluate Midnight vs Cardano | Dual-Chain | Decision framework needs dual-chain practitioner |

## Context Shopping List

| Resource | Type | SLTs Unlocked | Priority |
|----------|------|---------------|----------|
| Midnight docs full crawl (Compact ref, Impact VM, ZSwap, deployment) | Docs | 1.1, 1.2, 2.1, 3.1, 3.2, 4.1, 4.2, 6.2 | **High** |
| Brick Towers midnight-identity repo — clone + compile | Example Code + Human Review | 5.1, 5.2, 5.3 | **High** |
| Midnight example repos (counter, bboard) — clone + compile + deploy | Example Code | 2.2, 2.3, 3.3, 4.2, 4.3 | **High** |
| Compact developer — review all code examples for Modules 2-5 | Human Review | 2.2, 2.3, 3.3, 5.1, 5.2, 5.3 | **High** |
| Midnight.js SDK TypeScript API reference | Docs | 3.3, 4.3 | **Medium** |
| Current preprod testnet config + faucet URL | Version Confirmation | 4.1, 4.3 | **Medium** |
| Dual-chain practitioner interview | Human Review | 6.3 | **Low** |

## Critical Path

**Single highest-leverage action:** Clone and compile the Midnight example repos (counter, bulletin board, Brick Towers identity). If they compile on current Compact compiler, they unlock 11 of 18 SLTs by providing verified code examples.

## Confabulation Risk Zones

Modules 2-5: all red zones. Any Compact code, TypeScript SDK call, or terminal command produced without verification should be treated as a draft requiring human confirmation before publishing.
