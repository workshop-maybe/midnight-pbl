# Module 106 Assignment — When Midnight, When Cardano, When Both?

## Part 1: Evidence

### SLT 106.1 — Design a dual-chain architecture

**Evidence required:**
- An architecture diagram or detailed written design for a system where public credential verification runs on Cardano and private attribute proofs run on Midnight
- Identification of the bridge points: what data moves between chains, in what direction, and what trust assumptions apply

**Strong answer:** Designs a concrete system (e.g., a hiring platform, a compliance check, a gated community). Cardano handles: issuing credentials as NFTs, public verification that a credential exists, transparent audit trail. Midnight handles: proving attributes of the credential (age, qualification, membership) without revealing them. The bridge points are clearly identified — typically a commitment root published on Cardano that Midnight circuits verify against. Trust assumptions are named: who publishes the root, how often, what happens if roots diverge.

### SLT 106.2 — Evaluate a use case

**Evidence required:**
- A use case evaluation that recommends Cardano, Midnight, or both — with reasoning
- The reasoning must address: privacy requirements, performance constraints, developer complexity, and user experience

**Strong answer:** Picks a non-trivial use case (not the examples from the lessons). The recommendation is grounded in the specific requirements, not generic enthusiasm. "Use Midnight because privacy" is insufficient — the answer should explain what specific data needs protection, whether ZK proofs are proportionate to the privacy need, what the UX cost is (proof generation time, wallet complexity), and whether a simpler approach (off-chain + Cardano) would suffice.

### SLT 106.3 — Open questions in interoperability

**Evidence required:**
- At least 3 open questions or unsolved problems in Cardano-Midnight interoperability
- For each: what works today and what's aspirational or unsolved

**Strong answer:** Identifies real open questions — not vague concerns but specific technical gaps. Examples: trustless bridging (today: federated; aspiration: cryptographic), unified wallet UX (today: separate wallets; aspiration: single wallet managing both chains), cross-chain atomic swaps (today: not possible; aspiration: hash-time-locked contracts spanning both ledgers), proof verification on Cardano (today: off-chain; aspiration: on-chain ZK verifier in Plutus). Distinguishes clearly between "works today" and "roadmap/research."

## Part 2: Feedback

How was Module 106 and the course overall? What was the most valuable thing you learned? What's still unclear? Your feedback shapes the next version.
