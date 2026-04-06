# Cross-Chain Verification — Open Research

Date: 2026-04-02
Status: Open questions — to be answered as we build examples in coming weeks

## The Core Question

If something is true on Cardano, how is it proven true on Midnight?
If something is true on Midnight, how is it proven true on Cardano?

This is essential for building applications that get the best of both chains.

## Known Patterns for Cross-Chain Proof

| Pattern | Cardano → Midnight | Midnight → Cardano |
|---|---|---|
| Oracle/relay | Service watches Cardano, attests state on Midnight | Service watches Midnight, attests state on Cardano |
| Light client | Midnight runs Cardano light client, verifies block headers + merkle proofs | Cardano runs Midnight light client (needs Plutus to verify Midnight's proof format) |
| SPO attestation | SPOs running both chains sign cross-chain state claims | Same, reverse direction |
| ZK proof of state | ZK proof that a Cardano UTXO exists with specific datum | ZK proof that a Midnight state transition occurred |

## The Andamio-Specific Version

**Cardano → Midnight:** "This contributor has an Andamio credential on Cardano. Prove it to a Midnight contract without exposing which credential or who holds it."

Requires Midnight to verify a specific UTXO with a specific datum exists on Cardano. Options:
- Oracle attests (trust the oracle)
- ZK proof of Cardano state inclusion (trustless but hard — prove block header + merkle path to UTXO)
- SPO-signed attestation (trust the overlapping validator set)

**Midnight → Cardano:** "This person proved on Midnight that they hold 3+ credentials above threshold. Record that fact on Cardano."

Requires Cardano to verify a Midnight ZK proof. Open questions:
- Can Plutus verify Halo 2/Plonk proofs natively? BLS primitives being added, SNARK verification work ongoing — current status unknown
- If not native, need oracle or committee attestation

## Open Questions (To Answer as We Build)

1. **Is there a planned native bridge protocol?** "Partner chain" implies something deeper than shared SPOs, but no public spec for cross-chain state verification found yet.
2. **Can Cardano verify Midnight's proof format?** Halo 2 / Plonk-based. Plutus support TBD.
3. **Can Midnight verify Cardano's EUTXO state?** Substrate-based architecture — does it support external chain state verification?
4. **What's the role of the shared SPO set?** Operational convenience or designed trust mechanism for cross-chain attestation?
5. **What does the Midnight SDK expose for cross-chain operations?** Primitives for reading external chain state at mainnet?

## Architectural Decision Tree for Andamio

| If cross-chain proof is... | Then Andamio builds... |
|---|---|
| Native and trustless | Direct credential portability — earn on Cardano, prove on Midnight |
| Oracle-based | Attestation service that bridges credential state |
| Not available at launch | Dual-issuance — credential exists on both chains independently |
| Eventually trustless but not yet | Start with oracle, migrate to native when available |

## What We'll Learn Together

These questions get answered by building, not by reading. The PBL course development process IS the research process:
- Build a Midnight app that needs to reference Cardano state
- See what the SDK supports
- Document what works, what doesn't, what's missing
- Feed findings back into course content and Andamio strategy
