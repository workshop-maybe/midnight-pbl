# Student Learning Targets

Course: Midnight for Cardano Developers
Drafted: 2026-04-02

---

## Module 101: Your First Midnight DApp

*Design principle: Hands-on from minute one. Build before explaining. The docs quickstart (`create-mn-app`) gets learners to a deployed contract in minutes. Understanding comes from doing.*

### SLT 101.1
We can scaffold and deploy a Midnight DApp to the Preprod testnet using `create-mn-app`, as demonstrated by a running contract that responds to CLI interaction.

### SLT 101.2
We can identify the key components of a Midnight project (Compact contract, proof server, deployment config, wallet seed) by inspecting the scaffolded project and explaining what each file does in terms of Cardano equivalents (validator script, node, deployment address, signing key).

### SLT 101.3
We can describe the proof generation step and its role in the transaction lifecycle, as evidenced by timing a proof and explaining why it takes longer than building a Cardano transaction.

---

## Module 102: Midnight Architecture Through Cardano Eyes

*Design principle: Every concept hooks to something the learner already knows. EUTXO → dual ledger. Datums → public/private state. Validators → circuits. Terraform plans → Kachina transcripts.*

### SLT 102.1
We can compare Midnight's dual-state model (public on-chain, private local) to Cardano's EUTXO model (datum on UTXO), as demonstrated by mapping a Cardano validator + datum design to an equivalent Midnight contract with public and private state.

### SLT 102.2
We can explain how Kachina transcripts handle concurrent state updates, as demonstrated by describing the pattern in terms of a familiar analogy (Terraform plan/apply, optimistic concurrency, UTXO selection) and identifying when transcripts conflict vs. when they can be reordered.

### SLT 102.3
We can describe Midnight's relationship to Cardano as a partner chain — shared SPO infrastructure, separate ledger, separate consensus — as demonstrated by accurately identifying what is shared, what is independent, and what cross-chain capabilities exist (and don't yet exist).

---

## Module 103: Compact for Cardano Developers

*Design principle: The language connects to patterns devs recognize. Private/public annotations are like client-side/server-side variables. Circuits are like validators with privacy. Witnesses are like redeemers that stay secret.*

### SLT 103.1
We can write a Compact contract that declares public ledger state and private local state, and uses `disclose()` to control what crosses the boundary, as demonstrated by a working contract where the learner chooses what to make public.

### SLT 103.2
We can compare Compact's privacy annotations to the client-side/server-side mental model, as demonstrated by building the same feature three ways: (1) web app with selective POST, (2) Compact contract with annotations, (3) Cardano transaction with datum — and articulating what each approach guarantees.

### SLT 103.3
We can implement a TypeScript witness function that provides private data to a Compact circuit, as demonstrated by a working DApp where user input stays local and only the proof reaches the chain.

---

## Module 104: The Privacy Model in Practice

*Design principle: Experience the tradeoffs, don't just read about them. Build something private. Time the proofs. See what an observer can and can't see. Feel the cost of privacy.*

### SLT 104.1
We can build a privacy-preserving application (e.g., private voting, shielded message board) on Midnight that uses ZK proofs to hide user inputs while updating public state, as demonstrated by a deployed contract where the public outcome is verifiable but individual actions are hidden.

### SLT 104.2
We can compare the transaction lifecycle of a shielded Midnight transaction to an equivalent Cardano transaction, as demonstrated by a side-by-side walkthrough identifying each step (local execution, proof generation, submission, validation, confirmation) and what an observer sees at each stage.

### SLT 104.3
We can evaluate the cost of privacy in a concrete scenario — proof generation time, local compute requirements, proof server infrastructure — as demonstrated by measuring these costs in the application built in 104.1 and articulating when the cost is justified.

---

## Module 105: Token Economics and Application Design

*Design principle: The NIGHT/DUST split, token matrix, and deployment model are practical design decisions. Teach them through building, not lecture. Mini-apps show what the economics mean in practice.*

### SLT 105.1
We can explain Midnight's token architecture (NIGHT/DUST separation, shielded/unshielded, ledger/contract token matrix) by mapping each concept to Cardano equivalents (ADA for both value and fees, native assets in UTXOs, no shielding) and identifying what Midnight adds and what Cardano has that Midnight doesn't (datums on UTXOs).

### SLT 105.2
We can build a DApp that uses sponsored transactions (developer fronts DUST for users), as demonstrated by a working application where a new user interacts without holding any tokens — and an explanation of why this is harder to achieve on Cardano.

### SLT 105.3
We can assess a DApp against Midnight's deployment risk rubric (privacy-at-risk, value-at-risk, state-space-at-risk) and describe the deployment proposal process, as demonstrated by scoring a sample application and drafting a deployment proposal.

---

## Module 106: When Midnight, When Cardano, When Both?

*Design principle: The course builds toward this question. By now the learner has built on both chains and felt the tradeoffs. This module doesn't answer the question — it gives learners the framework to answer it for their own use cases.*

### SLT 106.1
We can design a dual-chain architecture where public credential verification runs on Cardano and private attribute proofs run on Midnight, as demonstrated by an architecture document that specifies which data lives where, why, and how the two chains communicate (including current limitations).

### SLT 106.2
We can evaluate a use case against the framework "when does evidence need to be inspectable (Cardano) vs. when does a fact need to be provable without revealing data (Midnight)?", as demonstrated by analyzing at least three real-world scenarios and recommending the appropriate chain (or both) with rationale.

### SLT 106.3
We can identify the open questions in Cardano-Midnight interoperability (cross-chain state verification, proof format compatibility, bridge mechanisms) and describe what would need to be true for full credential portability between chains, as demonstrated by a written analysis that distinguishes what works today from what's on the roadmap from what's unsolved.

---

## SLT Design Notes

### Changes from prior version ("From Aiken to Compact")
- **Broadened audience:** Cardano devs generally, not just Aiken developers. Aiken comparisons are hooks, not the frame.
- **Hands-on first:** Module 101 is now a build-first module (create-mn-app), not an architecture lecture. Architecture moves to 102 where it has context.
- **New material from research session:**
  - Kachina/Terraform transcript analogy (102.2)
  - Client-side/server-side mental model for Compact (103.2)
  - Token economics and NIGHT/DUST (105.1-2, new module)
  - Deployment risk rubric (105.3, new)
  - Sponsored transactions mini-app (105.2, new)
  - Cross-chain research questions (106.3, new — honest about what's unsolved)
- **Module 105 is entirely new.** Prior version jumped from privacy model to credentials. Token economics and application design fills a critical gap.
- **Module 106 reframed.** Prior version was "Dual-Chain Architecture." New version asks the question the whole course builds toward. SLTs are more evaluative and honest about open questions.
- **Assignment model preserved.** Feedback-as-contribution is the right model. Every assignment improves the course.

### Conversation prompts embedded in the course (not SLTs, but part of lessons)
These don't get assessed — they're thinking tools:
- "What does 'commitment' mean in your context?" (102)
- "What can you put in a datum that you can't put in an account balance?" (102)
- "You already decide what to send to the server in every web app you build. When is that decision enough, and when do you need cryptographic proof?" (103)
- "When would you *want* your data to leave your machine?" (104)
- "What happens to the datum when you shield a token?" (105)
- "The Academy gives you four token types. What use case doesn't fit any of them?" (105)
- "On Cardano, you deploy and it's live. On Midnight, you need approval. What are the tradeoffs?" (105)
- "You hold two credentials — a PNG from the Academy, an on-chain token from this PBL. Which one would you show to an employer? Why?" (106)
