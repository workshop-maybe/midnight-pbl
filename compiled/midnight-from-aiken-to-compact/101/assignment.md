# Module Assignment

## Task

Design a dual-chain credential architecture for a real-world scenario of your choice, evaluate the interoperability constraints, and apply the decision framework to determine which features belong on each chain.

## Deliverables

1. A dual-chain architecture for one of these scenarios (or a comparable one from your domain): (a) a professional association where members prove certification status without revealing the membership list, (b) a university where graduates prove degrees and competencies without exposing transcripts, or (c) a development team proving collective capability without revealing individual identities. Specify what data lives on Cardano and why, what lives on Midnight and why, the user coordination flow between chains, and the verification flow from the verifier's perspective
2. A failure mode analysis of your architecture: what happens if the Cardano credential mint succeeds but the Midnight commitment registration fails, what happens if a credential is revoked on Cardano but the Midnight MerkleTree still contains the commitment, how you would design the off-chain relay to minimize the inconsistency window, and the minimum trust assumption your relay requires
3. An evaluation of three use cases from your own domain using the three-question framework (data vs result, composability, harm potential). For each, decide Cardano only, Midnight only, or dual-chain, and identify the specific privacy property Midnight provides or explain why Cardano is sufficient

## Notes

**Estimated time:** 90-120 minutes

**Key constraints to address:** no cross-chain contract calls, no atomic cross-chain transactions, one-way observation only (Midnight reads Cardano), DUST non-persistence, current testnet limitations
