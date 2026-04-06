# Ledger Architecture & Decision Framework

Date: 2026-04-02
Status: Raw notes for lesson development

## Key Technical Detail: Midnight Runs on Polkadot SDK, Not Cardano

Midnight's ledger is built on the Polkadot SDK (Substrate). Core logic compiles to WebAssembly. The key component is `pallet-midnight` which handles privacy-preserving transaction logic.

**This matters for Cardano devs:** Midnight is NOT built on Cardano's infrastructure. Cardano SPOs can run Midnight nodes, but the ledger technology is a completely different stack. Don't assume Plutus/Haskell patterns carry over. Surface this early in the course so devs calibrate expectations.

## Transaction Validation: Two Paths

- **Shielded transactions:** Validators verify ZK proofs against current ledger state. If proof checks out, state transition is applied without seeing private details. New state committed on-chain including commitment to full ledger state.
- **Unshielded transactions:** Details visible, validators verify directly without ZK proofs. Simpler, faster.

## Zswap

Midnight's transaction scheme combining ideas from Zcash and SwapCT:
- Merges multiple transactions while keeping them confidential (efficiency + privacy)
- Supports multiple asset types natively (not limited to single shielded token)
- Enables atomic swaps between shielded assets in a single transaction
- Foundation for private DeFi

## The Decision Framework — Cardano Dev Mapping

| Decision | Cardano | Midnight | Key difference |
|---|---|---|---|
| Simple token transfer | Native asset in UTXO | Ledger token | Same mental model, Midnight adds shielding option |
| Programmable token logic | Validator script + datum on UTXO | Contract token (account model) | Different mental model — Cardano stays UTXO, Midnight switches to accounts |
| Privacy needed | Not available natively | Shielded variant of either | Midnight's core offering |
| Auditability needed | Default — everything public | Unshielded variant | Same outcome, explicit choice on Midnight |

## The Architectural Shift Cardano Devs Need to Internalize

On Cardano: programmable logic AND simple transfers happen in the same UTXO model. One paradigm. Datums, validators, native assets — all UTXO.

On Midnight: you switch models depending on the use case. Ledger tokens = UTXO. Contract tokens = account model. You're choosing between two paradigms per feature, not working within one unified model.

This is a real DX difference. Cardano devs are used to thinking in UTXOs for everything. On Midnight, the first question is "which model?" before you even start building.

## The Fifth Question the Academy Doesn't Ask

The Academy's decision framework covers:
1. Ledger vs contract tokens (performance vs programmability)
2. Shielded vs unshielded (privacy vs transparency)

Missing question: **"Does the evidence need to be inspectable?"**

If yes → shielding is wrong. You want the datum visible. That's Cardano's territory.

This is the question that separates credential/contribution use cases from financial privacy use cases. The Academy doesn't ask it because Midnight's entire framing is "when do you need privacy?" But the complementary question — "when do you need publicity?" — is equally important for the full picture.

**PBL conversation prompt:** "The Academy gives you four token types to choose from. What use case doesn't fit any of them? What would you build if the token needed to carry inspectable evidence?"

## Lesson Idea: The Token Decision Tree (Extended)

Walk learners through building the same feature in multiple quadrants:

1. **Unshielded ledger token** (Midnight) — simple, transparent, fast. But no datum, no programmable logic.
2. **Shielded ledger token** — private transfer. But now nobody can see what the token represents.
3. **Unshielded contract token** — programmable, transparent. ERC-20 style. Data in contract state.
4. **Shielded contract token** — programmable + private. Can prove facts via ZK.
5. **Cardano native asset with datum** — programmable via validator, transparent, UTXO-based, evidence attached to value. No privacy, but the evidence IS the value.

The learner sees: none of these alone covers every use case. The architecture you choose depends on whether you're optimizing for privacy, programmability, performance, or provability.
