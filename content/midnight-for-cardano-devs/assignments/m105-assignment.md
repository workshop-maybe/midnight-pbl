# Module 105 Assignment — Token Economics and Application Design

## Part 1: Evidence

### SLT 105.1 — Token architecture and Cardano equivalents

**Evidence required:**
- A mapping of Midnight's token architecture (NIGHT/DUST, the token matrix) to Cardano's native asset model
- Identification of at least two fundamental differences (not just naming)

**Strong answer:** Maps tDUST ↔ tADA (fee token), NIGHT ↔ ADA (governance/staking), Midnight native tokens ↔ Cardano native assets. The fundamental differences go deeper than naming: Midnight tokens can have private balances (shielded amounts), transfers can hide sender/receiver/amount via ZK proofs, and the NIGHT/DUST split separates governance from gas in a way Cardano's single-token model doesn't. The token matrix (four token types from the Academy) shows how different use cases map to different token designs.

### SLT 105.2 — Sponsored transactions DApp

**Evidence required:**
- A design or working implementation of a DApp that uses sponsored transactions so new users can interact without holding tokens
- An explanation of who pays, how the sponsorship flow works, and what trust assumptions are involved

**Strong answer:** Designs a DApp where a sponsor (project owner, DAO, onboarding service) covers transaction fees for new users. The explanation covers: how the sponsor pre-funds a pool, how the DApp routes transactions through the sponsor's signing flow, what happens when the pool runs dry, and what the sponsor can/can't see about the user's activity. The trust assumption is clear: the sponsor pays but shouldn't be able to censor or surveil. Connects to Cardano's model where every user must hold ADA — sponsored transactions lower the barrier to entry.

### SLT 105.3 — Deployment risk assessment

**Evidence required:**
- An assessment of a DApp (your own or a hypothetical one) against Midnight's deployment risk rubric
- A draft deployment proposal that addresses the rubric's concerns

**Strong answer:** Walks through the rubric systematically — what data is at risk, what happens if the circuit has a bug, what the worst-case privacy failure looks like, how the DApp handles key compromise. The deployment proposal isn't a formality; it's a forcing function for thinking about consequences before shipping. Contrasts with Cardano where deployment is permissionless — the learner can articulate the tradeoff between "deploy freely, fix later" and "get reviewed, deploy safely."

## Part 2: Feedback

How was Module 105? What was clear, what was confusing, what would you change?
