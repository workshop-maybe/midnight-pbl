# Lesson 101.3: Proof Generation and the Transaction Lifecycle

**SLT:** I can describe proof generation and its role in the Midnight transaction lifecycle.

**Type:** Exploration

---

## What the Wait Is For

When you called `submitAnswer()` or `storeMessage()` in Lesson 101.1, you waited 30-60 seconds. On Cardano, the same conceptual action — "change some on-chain state" — takes seconds to prepare and ~20 seconds to confirm.

Where does the extra time go?

It goes to proof generation. The ZK proof is the artifact that makes privacy possible. Understanding what it does, why it takes time, and what it costs is foundational to everything else in this course.

---

## The Proof in One Sentence

A zero-knowledge proof says: **"This computation was performed correctly on inputs I'm not showing you."**

That's it. The verifier (the network) learns that the computation happened correctly. The verifier does NOT learn what the inputs were. The prover (your machine) did the work and produced a certificate of correctness.

---

## Where Proof Generation Fits

Every Midnight transaction goes through three phases. Proof generation is the expensive part of Phase 1:

### Phase 1: Preparation (Your Machine)

1. **Circuit execution.** The Compact contract runs locally. Your circuit reads the current contract state, processes your inputs (including any private witness data), and produces two transcripts — a public one (what the world sees) and a private one (what stays secret).

2. **Proof generation.** The proof server takes the executed circuit and the private inputs and produces a succinct ZK proof. The proof is small (around 5KB) regardless of how complex the computation was. The proof server uses Halo 2 on the BLS12-381 curve — this is the heavy cryptographic computation.

3. **Transaction balancing.** The wallet selects DUST UTXOs for fees, generates spend proofs for those UTXOs, and packages everything into a submittable transaction.

### Phase 2: Validation (Network)

4. **Proof verification.** The block producer checks the ZK proof against the current ledger state. Verification is fast — around 6 milliseconds. The block producer doesn't re-execute your circuit. It checks the proof.

5. **State application.** If valid, the state transitions execute: contract ledger fields update, nullifiers are recorded, new coin commitments are created.

### Phase 3: Confirmation

6. **Sync.** The indexer watches the chain, your wallet subscribes, and your local view updates.

---

## The Timing

From the preprod deployment in Lesson 101.1:

| Step | Time | What's Happening |
|------|------|-----------------|
| Circuit execution | < 1 second | Contract runs locally, transcripts generated |
| **Proof generation** | **~1.2 seconds** (proof server) | ZK proof computed from circuit + witnesses |
| Transaction balancing | ~1-2 seconds | DUST selection, spend proofs, packaging |
| Network round-trip | ~5-10 seconds | Submission, propagation, block inclusion |
| Block confirmation | ~6 seconds | Block produced, proof verified, state applied |
| **Total** | **~30-60 seconds** | End-to-end, from call to confirmed |

The proof server itself is fast (~1.2 seconds for a simple circuit). The total round-trip is longer because of wallet sync, network latency, DUST balance checks, and block time. Complex circuits with more constraints take longer to prove.

**Cardano comparison:** Transaction building takes seconds. Block time is ~20 seconds. Total: ~25 seconds. The gap is mostly proof generation overhead — which Cardano doesn't have because Cardano doesn't have privacy.

## Complexity Scaling: Artifact Sizes

Proof generation time scales with circuit complexity. The compilation artifacts show this concretely:

| Artifact | Counter (simplest) | Bulletin Board (stateful) | What It Tells You |
|----------|-------------------|--------------------------|-------------------|
| Proving key | 14 KB | 2.7 MB | Prover's workload — 200x larger for real contracts |
| Verification key | 1.3 KB | 2.1 KB | Verifier's workload — stays small regardless |
| ZKIR | 784 B | 4.5-6.0 KB | Circuit constraint count |

The critical insight: **proving key size explodes with complexity; verification key stays small.** This is why proving is expensive and verification is cheap — and why the asymmetry grows with contract complexity. A credential circuit with Merkle tree operations and signature verification (Module 105) will have a proving key much larger than the bulletin board's.

The 500MB universal parameters downloaded on first compilation are shared across all contracts — they're the mathematical foundation for the proof system (Halo 2 on BLS12-381).

---

## Why It's Expensive to Prove and Cheap to Verify

This asymmetry is the core engineering tradeoff of zero-knowledge systems.

**Proving** requires the prover to perform the full computation AND generate a cryptographic certificate. The proof server manipulates polynomial commitments, evaluates witness polynomials, and constructs an argument that survives adversarial verification. This is CPU-intensive. It runs as a native binary (not JavaScript) for performance.

**Verification** requires the verifier to check a small proof (5KB) against public inputs. A few pairing operations on elliptic curves. Milliseconds.

The analogy: **proving is compilation, verification is execution.** You compile once (expensive), and everyone else runs the binary (cheap). The proof is the "compiled" version of your private computation.

This asymmetry is why Midnight can scale: each user does the expensive work once, and the network does fast verification. On Ethereum, every node re-executes every computation. On Midnight, the network only verifies proofs.

---

## What the Proof Guarantees

For the hello world contract, the proof guarantees:

- The `storeMessage` circuit was executed correctly
- The `customMessage` ledger field was updated to the disclosed value
- The transaction was properly balanced (fees paid)
- All of this happened according to the compiled contract logic

For the private-answer contract (Module 103-104), the proof guarantees more:

- The `submitAnswer` circuit was executed correctly
- The answer was hashed and compared to the stored key hash
- The `lastCorrect` boolean was computed honestly
- **The answer itself never appears in the proof or on-chain**

The proof doesn't reveal what the answer was. It reveals that a valid answer was checked and that the pass/fail result is honest. You can't fake a pass (the ZK proof would be invalid). But if you fail, nobody knows what you tried.

---

## The Proof Server as Infrastructure

On Cardano, your DApp infrastructure is:
- A node connection (or Blockfrost API)
- A transaction builder (Lucid, Mesh, Atlas)
- A signing key

On Midnight, add:
- **A proof server** — Docker container, native binary, handles the cryptographic heavy lifting

The proof server is the most significant new infrastructure requirement. It:
- Runs locally (your machine or a server you control)
- Sees your private inputs (necessary to generate the proof)
- Requires non-trivial CPU (proof generation is the bottleneck)
- Must be version-matched to the compiled contract's ZK artifacts

For development, `docker compose up -d` is enough. For production, proof server deployment is an architecture decision: who runs it, where, with what trust model. If you're building a web DApp, the proof server might run client-side (via WebAssembly, eventually) or on a trusted backend. Either way, whoever runs the proof server sees the pre-proof data.

---

## Proof Generation vs Cardano Transaction Building

| Aspect | Cardano Transaction Building | Midnight Proof Generation |
|--------|-----------------------------|--------------------------| 
| **What it produces** | A signed transaction with visible inputs/outputs | A ZK proof that hides private inputs |
| **Where it runs** | Your machine (off-chain code) | Your machine (proof server) |
| **What it needs** | UTXOs, datums, signing keys | Circuit, witness data, current state |
| **Time** | Milliseconds to seconds | Seconds to tens of seconds |
| **Output size** | Variable (depends on tx complexity) | ~5KB (constant, regardless of complexity) |
| **What the network does** | Re-executes the validator script | Checks the proof (no re-execution) |
| **Network cost** | ExUnits (CPU + memory) | Proof verification (~6ms) |
| **Privacy** | None — all inputs visible | Full — private inputs never leave your machine |

The fundamental tradeoff: Cardano makes the user's experience fast (quick tx building) at the cost of public data. Midnight makes the user's experience slower (proof generation) in exchange for private data.

---

## Questions to Consider

- Proof generation takes ~1.2 seconds for a simple circuit and will take longer for complex ones. At what circuit complexity does this become a UX problem? What's the threshold where users stop waiting?
- The proof server sees your private inputs. For a voting app, it sees your vote. For a credential app, it sees your credentials. If the proof server ran on a third-party server (to avoid users running Docker), what trust model would you need?
- On Cardano, you can predict ExUnits before submitting. On Midnight, proof generation time is harder to predict — it depends on circuit complexity and hardware. How would you communicate this uncertainty to users?

---

## What's Next

Module 101 is complete. You've scaffolded a project (101.1), identified its components and their Cardano equivalents (101.2), and understood proof generation (101.3). Module 102 goes deeper into Midnight's architecture — the dual-state model, Kachina transcripts, and the partner chain relationship.

---

## Conversation Starters

A product manager asks: "Why does our Midnight app take 60 seconds to confirm a transaction when Cardano takes 25?"

Explain:
- Where the extra time goes (proof generation, not block time — Midnight blocks are actually faster)
- What the user gets in return (privacy — their inputs never leave their machine)
- What the network gains (fast verification instead of full re-execution)
- How this might improve (faster proof servers, WebAssembly provers, hardware acceleration)

Frame it as a tradeoff, not a limitation. The proof generation time IS the privacy feature — it's the computation that makes private data verifiable without being visible.
