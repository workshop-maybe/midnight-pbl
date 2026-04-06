# Lesson Type Classification: Midnight for Cardano Developers

Classified: 2026-04-02

## Summary

| Lesson Type | Count | SLTs |
|-------------|-------|------|
| Exploration | 12 | 101.2, 101.3, 102.1, 102.2, 102.3, 103.2, 104.2, 104.3, 105.1, 105.3, 106.1, 106.2, 106.3 |
| Developer Documentation | 4 | 103.1, 103.3, 104.1, 105.2 |
| How To Guide | 1 | 101.1 |
| Product Demo | 0 | — |
| Organization Onboarding | 0 | — |

**Pattern:** This course follows a recurring sandwich structure — conceptual framing (Exploration), build something (Developer Documentation), then reason about what you built (Exploration). Module 106 is all Exploration because it's the capstone synthesis.

---

## Classifications

### Module 101: Your First Midnight DApp

#### SLT 101.1: "I can scaffold and deploy a Midnight DApp to the Preprod testnet using `create-mn-app`."
- **Lesson Type**: How To Guide
- **Key Factors**: CLI procedure — run scaffolder, inspect output, deploy. Learner follows steps, doesn't write code.
- **Edge Notes**: Could be Developer Documentation for a dev audience, but `create-mn-app` does the heavy lifting. The learner is running commands, not writing a contract.
- **Inputs Needed**: Step-by-step CLI commands, expected output at each stage, preprod deployment details.

#### SLT 101.2: "I can identify the key components of a Midnight project and relate them to Cardano equivalents."
- **Lesson Type**: Exploration
- **Key Factors**: "Identify" + "relate" — conceptual mapping between two systems. No code produced.
- **Inputs Needed**: Framing questions that connect Midnight project structure to what Cardano devs already know (validator → circuit, signing key → wallet seed, etc.)

#### SLT 101.3: "I can describe proof generation and its role in the Midnight transaction lifecycle."
- **Lesson Type**: Exploration
- **Key Factors**: "Describe" — understanding a process and its implications. The timing comparison to Cardano tx building is a thinking tool.
- **Inputs Needed**: Transaction lifecycle diagram/description, proof generation timing data.

---

### Module 102: Midnight Architecture Through Cardano Eyes

#### SLT 102.1: "I can compare Midnight's dual-state model to Cardano's EUTXO model."
- **Lesson Type**: Exploration
- **Key Factors**: "Compare" — conceptual territory. Two state models, structural differences, design implications.
- **Inputs Needed**: Framing questions around dual-state vs EUTXO tradeoffs.

#### SLT 102.2: "I can explain how Kachina transcripts handle concurrent state updates."
- **Lesson Type**: Exploration
- **Key Factors**: "Explain" — architectural concept. Analogies (Terraform plan/apply, optimistic concurrency) are thinking tools.
- **Inputs Needed**: Kachina protocol reference, analogy framing.

#### SLT 102.3: "I can describe Midnight's relationship to Cardano as a partner chain."
- **Lesson Type**: Exploration
- **Key Factors**: "Describe" — structural and political context. What's shared, what's independent, who builds what.
- **Inputs Needed**: Partner chain architecture reference, validator selection details, token economics link.

---

### Module 103: Compact for Cardano Developers

#### SLT 103.1: "I can write a Compact contract that uses `disclose()` to control what crosses the public/private boundary."
- **Lesson Type**: Developer Documentation
- **Key Factors**: "Write" — producing code. Learner writes and deploys a Compact contract.
- **Inputs Needed**: Compact code examples showing `disclose()` usage, contract skeleton, deployment steps.

#### SLT 103.2: "I can compare Compact's privacy annotations to the client-side/server-side mental model."
- **Lesson Type**: Exploration
- **Key Factors**: "Compare" — mental model mapping. The lesson may include code illustrations but the capability is conceptual reasoning.
- **Edge Notes**: Lesson content should include code snippets from all three modes (web app, Compact, Cardano) as illustrations, but the SLT is about developing the mental model.
- **Inputs Needed**: Framing questions connecting web dev patterns to Compact privacy model.

#### SLT 103.3: "I can implement a TypeScript witness function that provides private data to a Compact circuit."
- **Lesson Type**: Developer Documentation
- **Key Factors**: "Implement" — producing TypeScript code. The learner writes a witness function.
- **Inputs Needed**: Witness function code examples, DApp integration pattern, Compact circuit that consumes witness data.

---

### Module 104: The Privacy Model in Practice

#### SLT 104.1: "I can build a privacy-preserving application on Midnight that uses ZK proofs to hide user inputs while updating public state."
- **Lesson Type**: Developer Documentation
- **Key Factors**: "Build" — producing a working application. Code-heavy, end-to-end.
- **Inputs Needed**: Full application code (Compact contract + TypeScript DApp), deployment instructions, privacy verification steps.

#### SLT 104.2: "I can compare the transaction lifecycle of a shielded Midnight transaction to an equivalent Cardano transaction."
- **Lesson Type**: Exploration
- **Key Factors**: "Compare" — tracing two processes side by side. What an observer sees at each stage.
- **Inputs Needed**: Transaction lifecycle diagrams for both chains, observer-visibility analysis.

#### SLT 104.3: "I can evaluate the cost of privacy in a concrete scenario and articulate when the cost is justified."
- **Lesson Type**: Exploration
- **Key Factors**: "Evaluate" + "articulate" — judgment and reasoning about tradeoffs. Measurement feeds into opinion formation.
- **Inputs Needed**: Proof generation benchmarks, compute requirements, cost comparison framework.

---

### Module 105: Token Economics and Application Design

#### SLT 105.1: "I can explain Midnight's token architecture and map it to Cardano equivalents."
- **Lesson Type**: Exploration
- **Key Factors**: "Explain" + "map" — conceptual comparison. NIGHT/DUST model is a mental model to internalize.
- **Inputs Needed**: Token architecture reference, Cardano equivalents mapping, token matrix documentation.

#### SLT 105.2: "I can build a DApp that uses sponsored transactions so new users can interact without holding tokens."
- **Lesson Type**: Developer Documentation
- **Key Factors**: "Build" — producing a working DApp with sponsored tx pattern.
- **Inputs Needed**: Sponsored transaction code pattern, DApp code, deployment and testing steps.

#### SLT 105.3: "I can assess a DApp against Midnight's deployment risk rubric and draft a deployment proposal."
- **Lesson Type**: Exploration
- **Key Factors**: "Assess" + "draft" — understanding the framework IS the skill. Matches the edge case pattern: protocol designs different consequence levels, so judgment matters more than mechanics.
- **Inputs Needed**: Deployment risk rubric reference, sample deployment proposals, scoring criteria.

---

### Module 106: When Midnight, When Cardano, When Both?

#### SLT 106.1: "I can design a dual-chain architecture where public credential verification runs on Cardano and private attribute proofs run on Midnight."
- **Lesson Type**: Exploration
- **Key Factors**: "Design" — output is an architecture document with rationale, not running code. Decisions about what lives where and why.
- **Edge Notes**: "Design" at Bloom's Create level could suggest Developer Documentation, but the artifact is a reasoned architecture, not a codebase.
- **Inputs Needed**: Architecture decision framework, current interop capabilities and limitations, enterprise scenario examples.

#### SLT 106.2: "I can evaluate a use case and recommend when to use Cardano, Midnight, or both."
- **Lesson Type**: Exploration
- **Key Factors**: "Evaluate" + "recommend" — pure judgment. The capstone question the whole course builds toward.
- **Inputs Needed**: Use case scenarios, evaluation framework, real-world examples.

#### SLT 106.3: "I can identify the open questions in Cardano-Midnight interoperability and distinguish what works today from what's unsolved."
- **Lesson Type**: Exploration
- **Key Factors**: "Identify" + "distinguish" — mapping the frontier honestly. Intellectual honesty about what exists and what doesn't.
- **Inputs Needed**: Current interop status, roadmap references, open research questions.

---

## Heuristics Developed

### Verb Patterns
- "write", "implement", "build" → Developer Documentation (100% in this course)
- "compare", "describe", "explain", "evaluate", "identify", "assess" → Exploration (100% in this course)
- "scaffold" + CLI tool → How To Guide (when the scaffolder does the work, not the learner)

### Subject Matter Patterns
- Compact/TypeScript code production → Developer Documentation
- Cross-chain comparison or architectural reasoning → Exploration
- CLI procedure with scaffolding tool → How To Guide
- Token economics, governance, deployment policy → Exploration (even when it could involve code)

### Course-Level Pattern: The Sandwich
This course follows a recurring structure within modules:
1. Exploration (frame the concept)
2. Developer Documentation (build something)
3. Exploration (reason about what you built)

Module 101 substitutes How To Guide for Developer Documentation (scaffolder, not custom code). Module 106 is all Exploration (capstone synthesis).

### New Heuristic: Developer Course with No Product Demo
A developer-audience course about a protocol/language can have zero Product Demo SLTs. When the learner's primary interface is code and terminal (not a platform UI), the Product Demo type doesn't apply even for "try it out" SLTs.

---

## Context Shopping List

### Code Examples Needed (Developer Documentation)
- [ ] 103.1: Compact contract with `disclose()` — public/private state, selective revelation
- [ ] 103.3: TypeScript witness function — private data flow into Compact circuit
- [ ] 104.1: Full privacy-preserving app — Compact contract + TypeScript DApp + deployment
- [ ] 105.2: Sponsored transaction DApp — developer fronts DUST, user interacts without tokens

### Framing Questions Needed (Exploration)
- [ ] 101.2: What's the Cardano equivalent of each Midnight project component?
- [ ] 101.3: Why does proof generation take longer than building a Cardano tx?
- [ ] 102.1: Where does EUTXO's concurrency advantage go in Midnight's dual-state model?
- [ ] 102.2: What analogy from your experience best maps to Kachina transcripts?
- [ ] 102.3: What does "partner chain" mean vs sidechain/L2/fork?
- [ ] 103.2: When is client-side/server-side enough, and when do you need cryptographic proof?
- [ ] 104.2: What can an observer see at each stage of a shielded tx vs a Cardano tx?
- [ ] 104.3: When is the cost of privacy justified?
- [ ] 105.1: What does Cardano have that Midnight doesn't, and vice versa?
- [ ] 105.3: How would you score a sample app against the deployment risk rubric?
- [ ] 106.1: Which data lives on Cardano, which on Midnight, and why?
- [ ] 106.2: For a given use case, should evidence be inspectable or privately provable?
- [ ] 106.3: What works today, what's on the roadmap, what's unsolved?

### Step-by-Step Procedures Needed (How To Guide)
- [ ] 101.1: `create-mn-app` scaffold → inspect → deploy to preprod sequence
