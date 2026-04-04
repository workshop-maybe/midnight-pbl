# Two Transaction Lifecycles

## Same Goal, Different Paths

Both Cardano and Midnight process transactions. Both go from "user wants to change state" to "state changed on-chain." But the paths are different — and the differences reveal what each chain optimizes for.

Cardano optimizes for determinism. You know the outcome before you submit.

Midnight optimizes for privacy. The network verifies correctness without seeing your inputs.

---

## Cardano: Build, Sign, Submit, Validate

A Cardano transaction follows four steps:

**1. Build.** Your off-chain code (Lucid, Mesh, cardano-cli) constructs the transaction. Select UTXOs for inputs, define outputs with values and datums, calculate fees, add script references. If validators are involved, include the redeemer. The transaction builder evaluates the script locally — you know the execution cost (ExUnits) before submission.

**2. Sign.** The wallet signs the transaction with the spending key. This is fast — just cryptographic signing, no heavy computation.

**3. Submit.** Send the signed transaction to a node. The node places it in the mempool.

**4. Validate.** When a slot leader includes the transaction in a block, every node validates it: check signatures, run validators against datums and redeemers, verify ExUnits are within budget. If everything passes, UTXOs are consumed and new ones are created.

**Total time:** Seconds to build, seconds to submit, ~20 seconds to land in a block. The entire cycle is under a minute.

**What an observer sees:** Everything. Inputs, outputs, datums, redeemers, script addresses, fee amount, signing keys. The entire transaction is a public record.

---

## Midnight: Execute, Prove, Balance, Submit, Verify

A shielded Midnight transaction follows a longer path:

### Phase 1: Local Execution (Your Machine)

**1. Execute the circuit locally.** The contract runs on YOUR machine, not on-chain. Your Compact circuit reads the current contract state, processes your inputs (including private witness data), and produces two transcripts:
- **Public transcript** — what the world will see: ledger field changes, disclosed values, token movements
- **Private transcript** — what stays secret: witness inputs, intermediate computations, private state changes

The state changes are not applied yet. The circuit produces a plan, not a result.

**2. Generate the ZK proof.** The proof server (a local Docker container) takes the circuit, the witness data, and the transcripts, and generates a succinct zero-knowledge proof. This proof says: "this public transcript was honestly computed from valid inputs that I'm not showing you."

This is the expensive step. Proof generation takes seconds to tens of seconds depending on circuit complexity. For the hello world contract, the proof server takes about 1.2 seconds. The total round-trip (including network overhead) is approximately 60 seconds.

**3. Balance the transaction.** The wallet selects DUST UTXOs to cover fees, adds spend proofs for those UTXOs, and packages everything into a submittable transaction.

### Phase 2: Network Validation

**4. Submit.** The proven transaction goes to the network. There is no public mempool — transactions are submitted directly to block producers. This eliminates MEV (Miner Extractable Value) attacks that plague Ethereum.

**5. Verify.** The block producer checks:
- **Well-formedness** (state-independent): Are proofs present? Do inputs/outputs balance? Are fees correct?
- **Proof verification** (state-dependent): Does the ZK proof check out against the current ledger state? Are nullifiers unspent? Is the contract state transition valid?

Verification is fast — milliseconds. The block producer doesn't re-execute your circuit. It checks the proof.

**6. Apply.** If valid, the state transitions execute: Merkle tree updates, nullifiers recorded, new coin commitments created, contract ledger fields updated.

### Phase 3: Confirmation

**7. Sync.** The indexer watches the chain. Your wallet subscribes. Coin sets update (spent coins removed, new coins added). The DApp refreshes its view of public contract state.

---

## Side by Side

| Step | Cardano | Midnight | What's Different |
|------|---------|----------|-----------------|
| **Where contract runs** | On-chain (every validator node) | Your machine only | Privacy: nobody else executes your logic |
| **What goes on-chain** | Full tx: inputs, outputs, datums, redeemers | Proof + public transcript | Privacy: private inputs never leave your machine |
| **Computation cost** | Borne by every validating node | Borne by you (proof generation) | Asymmetry: proving is expensive, verification is cheap |
| **Fee model** | Pay based on script execution size (ExUnits) | Pay DUST based on proof verification cost | DUST is shielded — fee payments don't link to identity |
| **Time to prepare** | Seconds (tx building + signing) | Tens of seconds (circuit execution + proof generation) | The proof is the bottleneck |
| **Time to confirm** | ~20 seconds (one block) | ~6 seconds (one block) | Midnight has faster blocks |
| **Mempool** | Public — pending txs visible | None — direct to block producer | No front-running, no MEV |
| **Failure mode** | Tx rejected entirely, no cost | Guaranteed phase pays fees, fallible phase might fail | Partial failure is possible on Midnight |
| **Observer sees** | Everything | Proof was valid + disclosed values | The privacy gap |

---

## The Fundamental Asymmetry

**Proving is expensive. Verification is cheap.**

You do the heavy computation once — proof generation on your machine, tens of seconds. The network does fast verification — proof checking, milliseconds. This is the inverse of Ethereum, where every node re-executes the same computation.

The asymmetry has a practical consequence: **user-facing latency increases, but network throughput improves.** Each user waits longer for their transaction to be ready, but the network processes proven transactions faster than it could process re-executed ones.

For Cardano developers, this is a shift in where you feel the cost. On Cardano, transaction building is fast and validation is fast — the bottleneck is block time. On Midnight, block time is faster (6 seconds vs 20), but preparation time is longer.

---

## Guaranteed vs Fallible: The Partial Failure Model

This is the most surprising difference for Cardano developers.

On Cardano, a transaction either succeeds entirely or is rejected entirely. If the validator fails, the transaction never existed. No fees paid, no state changed. You retry with updated state.

On Midnight, each transaction has two phases:

- **Guaranteed phase** — fee payments and must-succeed operations. This always executes.
- **Fallible phase** — your contract logic. This might fail if the ledger state has changed since you computed your transcript (see Lesson 102.2 on Kachina concurrency).

If the fallible phase fails, the guaranteed phase still applies. **You pay fees for a transaction that didn't do what you wanted.**

This is closer to Ethereum's gas model than Cardano's all-or-nothing model. The practical implication: build your UX to handle failed transactions gracefully. Show the user "your transaction was submitted but the state had changed — retrying" rather than silently losing fees.

---

## What the Observer Sees

Trace the same action on both chains — storing a message.

**Cardano observer sees:**
- Transaction hash
- Input UTXOs consumed (addresses, values)
- Output UTXOs created (addresses, values, datums)
- The message text (in the datum)
- Fee paid (in ADA)
- Signing key (which wallet paid)
- Script address and validator hash

**Midnight observer sees (shielded):**
- A valid transaction occurred
- A proof was verified
- Contract state changed (if disclosed — in hello world, the message is disclosed)
- Fees were paid (but DUST payments are shielded — can't link to a specific wallet)

Even the "transparent" hello world contract on Midnight gives less information than a Cardano transaction. The fee payment doesn't link to the caller's identity. The transaction structure doesn't reveal UTXO selection patterns.

For a fully shielded transaction (one that discloses only pass/fail or aggregate results), the observer sees almost nothing: a proof was valid, some state changed. That's it.

---

## The Proof Server as Infrastructure

On Cardano, your transaction building infrastructure is lightweight: a library, a node connection, and a signing key. On Midnight, you also need a proof server — a Docker container running a native binary that does the expensive proof generation.

This is a deployment consideration with no Cardano equivalent. The proof server:
- Must run close to the user (latency matters — proof generation is the bottleneck)
- Sees private inputs (it needs them to generate the proof)
- Requires non-trivial compute resources (proof generation is CPU-intensive)
- May need timeout configuration (default 5 minutes for cold starts)

For developer tools and CLIs, running the proof server locally in Docker is fine. For user-facing applications, you'll need to think about proof server deployment — who runs it, where, and what trust relationship the user has with it.

---

## Questions to Consider

- Proof generation takes ~60 seconds end-to-end for a simple hello world transaction. On Cardano, the same action takes seconds. What UX patterns would you build to make this latency acceptable? How do you set user expectations?
- Midnight has no public mempool — transactions go directly to block producers. On Cardano, the mempool lets you observe pending transactions. What applications depend on mempool visibility, and what happens when it's not available?
- The guaranteed/fallible split means you can pay fees for a failed transaction. On Cardano, failed transactions cost nothing. How does this change your approach to retry logic and error handling?

---

## What's Next

Module 104 has covered the privacy model through experience. You built something private (104.1), compared the transaction lifecycles (this lesson), and will evaluate the cost of privacy in concrete terms (104.3). The question you're building toward: when is this complexity worth the cost?

---

## Conversation Starters

Trace a single action through both chains: a user submits a vote.

On Cardano:
- What's in the transaction? (inputs, outputs, datum, redeemer)
- What can an observer learn? (who voted, how they voted, when, from which wallet)

On Midnight:
- What happens locally? (circuit execution, witness data, transcript generation)
- What goes to the proof server? (circuit + witnesses → proof)
- What goes on-chain? (proof + public transcript)
- What can an observer learn?

Draw the full lifecycle for both. Where does Midnight add steps? Where does it remove information? Is the tradeoff — more steps, less leakage — worth it for a voting application?
