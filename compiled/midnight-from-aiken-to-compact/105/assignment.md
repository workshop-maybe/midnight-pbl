# Module Assignment

## Task

Build a complete selective disclosure credential system for a professional services firm. This capstone assignment for Module 5 synthesizes all three credential patterns: signature-based verification, MerkleTree anonymous membership, and selective disclosure.

## Deliverables

1. An individual proof circuit: a consultant proves they hold a specific certification (e.g., AWS Solutions Architect) without revealing their name or other certifications. Include the Compact circuit with credential struct, signature verification, ownership binding, and specify what enters via witness, what gets checked via assert, and what gets disclosed
2. A team proof circuit sketch: the firm proves it has at least 5 consultants with a specific certification, with individual identities remaining private. Use the MerkleTree + nullifier pattern to prevent double-counting. Specify ledger fields, witness signatures, and the aggregation logic
3. An expiry check circuit: a client verifies that a consultant's certification has not expired, where the exact issue and expiry dates stay private and the client only learns "valid" or "expired." Write the assertion logic and explain the disclosure level (boolean proof)

## Notes

**Estimated time:** 90-120 minutes

**Key patterns to combine:** signature-based verification (Lesson 5.1), MerkleTree commitments + nullifiers for anonymous membership (Lesson 5.2), selective disclosure with three disclosure levels: boolean proof, derived value, partial attribute (Lesson 5.3)
