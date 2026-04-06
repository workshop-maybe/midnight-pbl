# Lesson Type Classification: Building on Midnight — From Aiken to Compact

## Summary

| Lesson Type | Count | SLTs |
|-------------|-------|------|
| Exploration | 10 | 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 6.1, 6.2, 6.3 |
| Developer Documentation | 5 | 2.3, 3.3, 5.1, 5.2, 5.3 |
| How To Guide | 3 | 4.1, 4.2, 4.3 |
| Product Demo | 0 | — |
| Organization Onboarding | 0 | — |

## Classifications

### Module 1: Midnight Architecture for Cardano Developers

#### SLT 1.1: "I can compare Midnight's execution model to Cardano's eUTxO model."
- **Lesson Type**: Exploration
- **Key Factors**: `compare` verb + architectural concepts. No code, no terminal.
- **Inputs Needed**: Comparison framework (Impact VM vs Plutus VM, hybrid UTXO+account vs eUTxO)

#### SLT 1.2: "I can describe the dual-ledger system and when data lives on the public ledger versus the private ledger."
- **Lesson Type**: Exploration
- **Key Factors**: `describe` verb + conceptual boundary. The "when" question invites judgment.
- **Inputs Needed**: Dual-ledger diagrams, shielded vs unshielded examples

#### SLT 1.3: "I can explain how Midnight relates to Cardano as a partner chain."
- **Lesson Type**: Exploration
- **Key Factors**: `explain` verb + architectural relationship.
- **Inputs Needed**: Partner chain architecture overview, comparison to sidechain/L2 models

### Module 2: Compact Language Fundamentals

#### SLT 2.1: "I can describe the core components of a Compact contract."
- **Lesson Type**: Exploration
- **Key Factors**: `describe` verb + language concepts. Mental model before code.
- **Inputs Needed**: Annotated Compact contract example

#### SLT 2.2: "I can compare Aiken concepts to their Compact equivalents."
- **Lesson Type**: Exploration
- **Key Factors**: `compare` verb + cross-language mapping.
- **Inputs Needed**: Side-by-side code snippets (Aiken validator vs Compact circuit)

#### SLT 2.3: "I can write a Compact contract that declares ledger state and exposes a circuit to modify it."
- **Lesson Type**: Developer Documentation
- **Key Factors**: `write` verb + code artifact. Counter contract is the natural starting point.
- **Inputs Needed**: Counter contract code example, Compact syntax reference

### Module 3: The Privacy Model — Proving Without Revealing

#### SLT 3.1: "I can explain how Compact's disclose() primitive controls what becomes public versus what stays private."
- **Lesson Type**: Exploration
- **Key Factors**: `explain` verb + core privacy concept.
- **Inputs Needed**: Before/after examples of `disclose()`

#### SLT 3.2: "I can describe how a ZK proof is generated from a Compact circuit and verified on-chain by the Impact VM."
- **Lesson Type**: Exploration
- **Key Factors**: `describe` verb + proof pipeline concept.
- **Inputs Needed**: Pipeline diagram, Halo 2 / BLS12-381 overview

#### SLT 3.3: "I can implement a witness function in TypeScript that provides private data to a Compact circuit."
- **Lesson Type**: Developer Documentation
- **Key Factors**: `implement` verb + TypeScript code artifact.
- **Inputs Needed**: Witness function code example, WitnessContext API reference

### Module 4: Developer Workflow — Compile, Prove, Deploy

#### SLT 4.1: "I can install the Compact toolchain and run the proof server locally via Docker."
- **Lesson Type**: How To Guide
- **Key Factors**: `install`/`run` verbs + terminal procedure.
- **Inputs Needed**: Installation commands, Docker compose config

#### SLT 4.2: "I can compile a Compact contract and identify its output artifacts."
- **Lesson Type**: How To Guide
- **Key Factors**: `compile`/`identify` verbs + terminal procedure.
- **Inputs Needed**: Compile command, output directory walkthrough

#### SLT 4.3: "I can deploy a contract to the Midnight preprod testnet and interact with it via the TypeScript SDK."
- **Lesson Type**: How To Guide
- **Key Factors**: Terminal procedure (user confirmed).
- **Inputs Needed**: Preprod config, faucet URL, deployment commands

### Module 5: Building Credential Systems on Midnight

#### SLT 5.1: "I can design a Compact contract that verifies a signed credential without revealing its attributes."
- **Lesson Type**: Developer Documentation
- **Key Factors**: `design` verb + code artifact. Brick Towers identity project is reference.
- **Inputs Needed**: CredentialSubject struct example, signature verification pattern

#### SLT 5.2: "I can use MerkleTree commitments and nullifiers to prove credential membership without exposing which credential."
- **Lesson Type**: Developer Documentation
- **Key Factors**: `use` verb + cryptographic primitives in code.
- **Inputs Needed**: MerkleTree API reference, commitment/nullifier pattern

#### SLT 5.3: "I can implement selective disclosure — proving a specific claim about a credential holder without revealing their identity."
- **Lesson Type**: Developer Documentation
- **Key Factors**: `implement` verb + capstone code artifact.
- **Inputs Needed**: Age verification circuit example, integration test

### Module 6: Dual-Chain Architecture — Cardano + Midnight (Optional)

#### SLT 6.1: "I can design an architecture where public credential verification runs on Cardano and private attribute proofs run on Midnight."
- **Lesson Type**: Exploration
- **Key Factors**: `design` verb + architectural thinking. Artifact is a design document.
- **Inputs Needed**: Dual-chain architecture diagram, decision framework

#### SLT 6.2: "I can describe the current interoperability constraints between Cardano and Midnight."
- **Lesson Type**: Exploration
- **Key Factors**: `describe` verb + current-state analysis.
- **Inputs Needed**: Native Token Observation docs, bridge status

#### SLT 6.3: "I can evaluate when a use case requires Midnight's privacy features versus when Cardano's public verification is sufficient."
- **Lesson Type**: Exploration
- **Key Factors**: `evaluate` verb + judgment framework. Capstone for entire course.
- **Inputs Needed**: Use case scenarios, decision tree

## Heuristics Developed

### New Pattern: "Code Course" Distribution
First course with zero Product Demo SLTs. The Exploration-heavy distribution (10/18) reflects that Midnight requires significant mental model shifts before code is useful. **For courses that bridge two technical paradigms, expect 50%+ Exploration.**

## Context Shopping List

### Code Examples Needed (Developer Documentation)
- [ ] Counter contract in Compact (2.3)
- [ ] Witness function in TypeScript with WitnessContext (3.3)
- [ ] CredentialSubject verification circuit (5.1)
- [ ] MerkleTree commitment + nullifier pattern (5.2)
- [ ] Selective disclosure circuit (5.3)

### Terminal Procedures Needed (How To Guide)
- [ ] Compact toolchain installation + proof server Docker setup (4.1)
- [ ] `compact compile` walkthrough with output inspection (4.2)
- [ ] Preprod deployment: faucet, config, deploy, verify (4.3)

### Framing Questions / Diagrams Needed (Exploration)
- [ ] Impact VM vs Plutus VM comparison framework (1.1)
- [ ] Dual-ledger diagram (1.2)
- [ ] Partner chain architecture diagram (1.3)
- [ ] Compact component overview (2.1)
- [ ] Aiken↔Compact side-by-side comparison (2.2)
- [ ] `disclose()` before/after examples (3.1)
- [ ] ZK proof pipeline diagram (3.2)
- [ ] Dual-chain architecture diagram (6.1)
- [ ] Interoperability status overview (6.2)
- [ ] Use case decision tree (6.3)
