# Student Learning Targets

Course: Midnight for Cardano Developers
Drafted: 2026-04-02

---

## Module 101: Your First Midnight DApp

*Design principle: Hands-on from minute one. Build before explaining. The docs quickstart (`create-mn-app`) gets learners to a deployed contract in minutes. Understanding comes from doing.*

### SLT 101.1
I can scaffold and deploy a Midnight DApp to the Preprod testnet using `create-mn-app`.

### SLT 101.2
I can identify the key components of a Midnight project and relate them to Cardano equivalents.

### SLT 101.3
I can describe proof generation and its role in the Midnight transaction lifecycle.

---

## Module 102: Midnight Architecture Through Cardano Eyes

*Design principle: Every concept hooks to something the learner already knows. EUTXO → dual ledger. Datums → public/private state. Validators → circuits. Terraform plans → Kachina transcripts.*

### SLT 102.1
I can compare Midnight's dual-state model to Cardano's EUTXO model.

### SLT 102.2
I can explain how Kachina transcripts handle concurrent state updates.

### SLT 102.3
I can describe Midnight's relationship to Cardano as a partner chain.

---

## Module 103: Compact for Cardano Developers

*Design principle: The language connects to patterns devs recognize. Private/public annotations are like client-side/server-side variables. Circuits are like validators with privacy. Witnesses are like redeemers that stay secret.*

### SLT 103.1
I can write a Compact contract that uses `disclose()` to control what crosses the public/private boundary.

### SLT 103.2
I can compare Compact's privacy annotations to the client-side/server-side mental model.

### SLT 103.3
I can implement a TypeScript witness function that provides private data to a Compact circuit.

---

## Module 104: The Privacy Model in Practice

*Design principle: Experience the tradeoffs, don't just read about them. Build something private. Time the proofs. See what an observer can and can't see. Feel the cost of privacy.*

### SLT 104.1
I can build a privacy-preserving application on Midnight that uses ZK proofs to hide user inputs while updating public state.

### SLT 104.2
I can compare the transaction lifecycle of a shielded Midnight transaction to an equivalent Cardano transaction.

### SLT 104.3
I can evaluate the cost of privacy in a concrete scenario and articulate when the cost is justified.

---

## Module 105: Token Economics and Application Design

*Design principle: The NIGHT/DUST split, token matrix, and deployment model are practical design decisions. Teach them through building, not lecture. Mini-apps show what the economics mean in practice.*

### SLT 105.1
I can explain Midnight's token architecture and map it to Cardano equivalents.

### SLT 105.2
I can build a DApp that uses sponsored transactions so new users can interact without holding tokens.

### SLT 105.3
I can assess a DApp against Midnight's deployment risk rubric and draft a deployment proposal.

---

## Module 106: When Midnight, When Cardano, When Both?

*Design principle: The course builds toward this question. By now the learner has built on both chains and felt the tradeoffs. This module doesn't answer the question — it gives learners the framework to answer it for their own use cases.*

### SLT 106.1
I can design a dual-chain architecture where public credential verification runs on Cardano and private attribute proofs run on Midnight.

### SLT 106.2
I can evaluate a use case and recommend when to use Cardano, Midnight, or both.

### SLT 106.3
I can identify the open questions in Cardano-Midnight interoperability and distinguish what works today from what's unsolved.

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
