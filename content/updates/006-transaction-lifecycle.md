# Transaction Lifecycle — End-to-End

Date: 2026-04-02
Status: Raw notes for lesson development

## The Three Phases

### Phase 1: Preparation (Local)
- Contract executes on YOUR machine, not on-chain
- Two transcripts recorded: public (visible on-chain) and private (secret inputs, witness data)
- State changes rolled back — nothing persists yet, just transcripts
- Proof server (local native binary, not browser JS) generates ZK proof from circuit + witness
- Wallet balances transaction: selects UTXOs, covers DUST fees, generates spend proofs
- This is the expensive part — tens of seconds, not milliseconds

### Phase 2: Validation (Network)
- Well-formedness check first (state-independent): proofs present? Inputs/outputs balance? Fees correct?
- Block producer does full proof verification against current ledger state
- Shielded: verify spend proofs, contract call proofs, check nullifiers (double-spend prevention)
- Unshielded: simpler, details visible, direct verification
- State transitions execute: Merkle tree updates, nullifiers recorded, new coins created, contract state updated

### Phase 3: Confirmation (Sync)
- Indexer watches chain, wallet subscribes
- Wallet updates coin sets (spent → gone, new → added), recalculates balances
- DApp refreshes public state view, retrieves stored private transcripts
- Full picture: public outcome on-chain + private data local

## Guaranteed vs Fallible Phases

Each Midnight transaction has two execution phases:

1. **Guaranteed phase** — fee payments and must-succeed operations. If this fails, transaction not included at all.
2. **Fallible phase** — contract logic that might fail. If this fails, guaranteed phase effects still stick. Fees not refunded.

**Critical for Cardano devs:** On Cardano, a transaction either succeeds or fails entirely (deterministic). Midnight introduces partial failure where you still pay fees. This is an Ethereum-style pattern that Cardano devs will find surprising and possibly uncomfortable.

**PBL conversation prompt:** "On Cardano, you know before you submit whether your transaction will succeed. On Midnight, part of your transaction can fail and you still pay. What design decisions does this force?"

## The Fundamental Asymmetry

**Proving is expensive. Verification is cheap.**

You do heavy work once (proof generation, tens of seconds). Everyone else does fast verification. This is the inverse of Ethereum where every node re-executes the same computation.

| | Ethereum | Cardano | Midnight |
|---|---|---|---|
| Where contract executes | Every node | On-chain (validator checks) | Your machine only |
| What goes on-chain | Full transaction + execution | Transaction + datum | Proof (reveals nothing about private inputs) |
| Validation cost | Every node re-executes | Validator script runs | Proof verification (fast) |
| Failure model | Tx fails, gas still paid | Tx succeeds or doesn't exist | Guaranteed phase always pays, fallible phase might fail |

## The Proof Server — Deployment Reality

- Local native binary, NOT JavaScript/browser
- Handles contract call proofs and spend proofs
- Same pattern for both: circuit (what to prove) + witness (private data) → succinct proof
- Real deployment consideration Cardano devs won't be used to — there's a new piece of infrastructure to run

**PBL hands-on opportunity:** Have learners set up and interact with the proof server directly. Time the proof generation. Feel the latency. Compare to Cardano transaction building time.

## Wallet API — Transaction Types

1. **Transfer** — specify recipient, amount, token type. Wallet selects UTXOs, calculates change.
2. **Balance** — DApp builds contract call part, wallet adds inputs/outputs for fees and value.
3. **Prove** — takes unproven transaction, generates all ZK proofs.
4. **Submit** — sends proven transaction to network.

In practice: `balanceAndProveTransaction` combines balance + prove in one call. Most DApps use this.

## The Private Voting Example — Andamio Complement

The Academy's example: private vote in a DAO.
- Public record: "A valid vote was cast" (tally updates on-chain)
- Private: who you are, how you voted

This is exactly complementary to Andamio's model:
- **Midnight:** public accountability of the process (votes were counted) + private participation (individual choices hidden)
- **Andamio:** public accountability of the contribution (here's the work) + private source material (local notes/drafts never leave your machine)

Both have a public/private split. The boundary is in a different place depending on what needs protection.

**PBL conversation prompt:** "In the voting example, privacy protects the voter. In a credential example, publicity protects the credential holder. When does hiding help, and when does showing help?"

## Hooks to What Devs Already Know

- **Proof generation ≈ compilation.** You compile once (expensive), run many times (cheap). The proof is the "compiled" version of your private computation.
- **The proof server ≈ a build server.** Separate process, native code, does the heavy lifting so your app stays responsive.
- **Transaction balancing ≈ Cardano transaction building.** Cardano devs already do UTXO selection, fee calculation, change outputs. Same pattern, new privacy dimension.
- **Guaranteed vs fallible ≈ database transactions with savepoints.** The guaranteed phase is the outer transaction that always commits. The fallible phase is a savepoint that can roll back without killing the whole thing.
