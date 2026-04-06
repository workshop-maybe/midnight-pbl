# Module 101 Assignment — Your First Midnight DApp

## Part 1: Evidence

### SLT 101.1 — Scaffold and deploy a Midnight DApp

**Evidence required:**
- Screenshot or terminal output showing a successful `create-mn-app` scaffold
- The deployed DApp URL or transaction hash from Preprod testnet deployment
- Brief description of any issues encountered during deployment and how you resolved them

**Strong answer:** Shows the full scaffold-to-deploy workflow completed successfully. If errors were encountered (version mismatches, Docker issues), the learner explains what happened and how they fixed it — debugging is part of the skill.

### SLT 101.2 — Key components and Cardano equivalents

**Evidence required:**
- A table or list mapping at least 5 Midnight project components to their Cardano equivalents
- For each mapping, a one-sentence explanation of how they differ

**Strong answer:** Maps components like Compact contracts ↔ Plutus validators, ZK proofs ↔ script execution, private state ↔ datum, public state ↔ UTxO ledger, DApp connectors ↔ CIP-30 wallets. The differences aren't just naming — they identify what's fundamentally different about the privacy model.

### SLT 101.3 — Proof generation in the transaction lifecycle

**Evidence required:**
- A written description (3-5 sentences) of when and why proof generation happens in a Midnight transaction
- An explanation of what the proof proves without revealing

**Strong answer:** Identifies that proof generation happens client-side before transaction submission. Explains that the ZK proof proves the transaction is valid (state transitions are legal, inputs satisfy circuit constraints) without revealing private inputs. Connects this to the Cardano model where validator execution is transparent.

## Part 2: Feedback

How was Module 101? What was clear, what was confusing, what would you change? Your feedback helps improve the course.
