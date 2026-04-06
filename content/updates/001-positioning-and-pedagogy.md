# Positioning & Pedagogy Notes

Date: 2026-04-02
Status: Raw notes for refinement

## Core Principle

The Midnight PBL teaches Midnight honestly. It does NOT argue for Andamio directly. Instead, conversations in the course build toward a question the learner arrives at themselves:

**When do you need Midnight vs. when do you need Andamio?**

## The Question Emerges From Experience

Learners build real things with Midnight — private state, ZK proofs, the full Kachina flow. They feel the complexity: proof generation time, local state management, dual-state mental model.

Through conversation prompts and reflection, the edge cases surface naturally:
- What if the data should be public?
- What if proof of work matters more than privacy of it?
- When is this complexity worth it, and when isn't it?

## Key Frameworks (for conversation design, not lecture content)

### Two Sides of the Coin
- Midnight's narrative: "for blockchain to work at scale, some data must be private"
- The other side: some data is more valuable when it's public
- Privacy where it matters, publicity where it's valuable

### Three Tiers of Credentials
| Type | Assertion | Evidence | Enterprise value |
|------|-----------|----------|-----------------|
| Badges | Private assertion by issuer | None verifiable | "Trust us, they passed" |
| ZK proofs | Verifiable assertion | Hidden | "Trust the math, they qualified" |
| Andamio credentials | Verifiable assertion | Public, on-chain | "Here's what they did — verify it yourself" |

### The Commitment Double Meaning
- Midnight: cryptographic commitment = hash that locks in a value without revealing it
- Andamio: commitment = public declaration of intent to contribute, tracked on-chain
- Same word, opposite trust models — hiding vs. showing
- Potential conversation prompt: "What does 'commitment' mean in your context?"

### Cost of Privacy (from the sequence diagrams)
- Midnight flow: 6 steps (local state, ZK prover, proof generation, submission, verification, finalization)
- Andamio flow for public actions: 3 steps (do work, submit evidence, on-chain validation)
- ZKPs are powerful but they're a cost. When should you pay it?

### EUTXO and Datums
- Midnight Academy frames EUTXO datums as "different thinking that Ethereum devs find unfamiliar"
- The deeper story: datums let you attach structured data + spending rules to value
- This is what makes Andamio credentials possible — the datum IS the credential
- Conversation prompt: "What can you put in a datum that you can't put in an account balance?"

## Course Design Principles

1. **Hooks to what devs already know.** Every concept connects to something familiar — Terraform plans, client/server state, HTTP boundaries, Git commits. Midnight isn't alien. It's a new enforcement layer on decisions developers already make.

2. **Honor the developer.** No multiple choice. No "select the correct definition." Show them something actionable and inspiring from the first moment. Respect their time and intelligence.

3. **Build the mental model first.** Don't start with definitions. Start with a decision the developer recognizes, then show how Midnight changes the tradeoffs. The mental model is the curriculum — the tools and syntax follow from it.

4. **Hands-on from the beginning.** Learners build from the start. Conceptual framing comes through doing, not reading. (Hands-on examples TBD — James is building these first.)

5. **The course builds a question, not an answer.** Learners arrive at "when do I need Midnight vs. when do I need Cardano vs. when do I need both?" through experience, not lecture.

## What the Academy Does Well (don't replicate)
- Clear conceptual explanations (rational privacy, ACE freedoms, Kachina model)
- Account vs UTXO comparison
- Midnight's "why" narrative

## What the Academy Can't Do (PBL opportunity)
- Have learners build real things and experience the tradeoffs
- Ask hard questions about when privacy is the wrong default
- Produce verifiable credentials from course completion
- Demonstrate the alternative by being the alternative

## Polygon ID / ZKP Ecosystem Context
- Polygon ID: proves you HAVE a credential, not that you EARNED it
- Issuer bottleneck remains — bad issuer = worthless ZKP
- Andamio sidesteps this because the evidence IS the credential
- The three systems complement: Polygon ID (prove attributes), Midnight (prove computation), Andamio on Cardano (prove work)

## ML and Data Privacy (future enterprise positioning)
- ZKPs can prove a model was trained correctly without revealing training data
- Andamio angle: prove it was trained on VERIFIED contributor work
- Chain: Contributors do work (Cardano) → enterprise trains models → Midnight proves training provenance without exposure
- Premium tier, not launch. Architecture supports it. Don't build it yet.
