# Module 102 Assignment — Midnight Architecture Through Cardano Eyes

## Part 1: Evidence

### SLT 102.1 — Compare dual-state model to EUTXO

**Evidence required:**
- A written comparison (4-6 sentences) of Midnight's public/private state split vs Cardano's EUTXO model
- At least one concrete example where the dual-state model enables something EUTXO cannot

**Strong answer:** Explains that Cardano's EUTXO model makes all state transitions publicly verifiable — every datum, every redeemer is on-chain. Midnight splits state into a public ledger (visible to all) and private local state (visible only to the participant). The concrete example should involve privacy — e.g., a voting system where tallies are public but individual votes are private, which is impossible on vanilla Cardano without off-chain coordination.

### SLT 102.2 — Kachina transcripts and concurrent state

**Evidence required:**
- An explanation (3-5 sentences) of what a Kachina transcript is and how it handles the problem of concurrent state updates
- A comparison to how Cardano handles concurrency (UTxO contention)

**Strong answer:** Identifies that Kachina transcripts are an ordered log of state transitions that allow multiple parties to update state without locking. Contrasts with Cardano's UTxO contention problem where two transactions spending the same UTxO results in one failing. The key insight: transcripts enable an account-like programming model on top of a UTXO-like settlement layer.

### SLT 102.3 — Midnight as a Cardano partner chain

**Evidence required:**
- A description (3-5 sentences) of Midnight's relationship to Cardano — what's shared, what's independent, and what the bridge looks like
- Identification of at least one thing that's currently unsolved or aspirational about this relationship

**Strong answer:** Explains that Midnight uses Cardano for settlement/finality while running its own consensus for privacy-preserving computation. Identifies shared elements (SPO set, security model) and independent elements (state, execution, fees). The unsolved piece could be trustless bridging, cross-chain token movement, or unified wallet experience.

## Part 2: Feedback

How was Module 102? What was clear, what was confusing, what would you change?
