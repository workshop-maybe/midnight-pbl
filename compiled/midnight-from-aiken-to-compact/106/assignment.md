# Module Assignment

## Task

Design the privacy architecture for a sealed-bid auction on Midnight and implement the TypeScript witness layer that supports it. This exercise tests your understanding of the full privacy pipeline: disclose() for visibility control, the proof generation lifecycle, and witness functions as the bridge between private data and ZK circuits.

## Deliverables

1. A sealed-bid auction design specifying: the submitBid circuit (what gets disclosed, what stays private, how the bid is stored on the ledger via commitment), the revealBid circuit (at what point and through which mechanism the bid amount becomes public), and the data flow through the privacy gradient
2. A trace of the bulletin board's takeDown circuit through all four pipeline stages (compile, prove, submit, verify): what artifacts are produced, what private inputs enter the proof, what public outputs emerge, what the transaction contains, and at which stage a wrong secret key causes failure
3. A TypeScript witness file for a credential contract with MerkleTree commitments and nullifiers, implementing: a CredentialPrivateState type, a loadCredential witness that returns the credential at the current counter position, and a deriveNullifier witness that derives a deterministic nullifier and increments the counter in private state

## Notes

**Estimated time:** 90-120 minutes

**Key concepts to address:** the privacy gradient (fully private, proven but hidden, hashed on ledger, fully public), persistentHash vs persistentCommit, the four-stage pipeline (compile, prove, submit, verify), WitnessContext interface, the [newPrivateState, returnValue] tuple pattern
