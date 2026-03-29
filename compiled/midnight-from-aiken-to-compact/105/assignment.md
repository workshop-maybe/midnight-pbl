# Module Assignment

## Task

Take an Aiken validator you have written (or use a simple counter/escrow example) and translate it into a Compact contract design. This exercise tests your ability to map Aiken concepts to Compact equivalents and write basic Compact contract structure.

## Deliverables

1. A component-by-component mapping of your Aiken validator to Compact: datum to ledger fields, redeemer to circuit parameters and witnesses, validation logic to circuit execution logic, and identification of any data that would benefit from being private
2. A complete Compact contract for a token vault with: an owner (public key), a balance (Uint<64>), a locked/unlocked state, a constructor, deposit/withdraw circuits with proper disclose() usage, and lock/unlock circuits with owner verification via witness
3. An annotation of a provided Compact contract skeleton identifying each component (pragma, ledger, witness, constructor, circuit), what data is public vs private, and why the constructor increments the round counter

## Notes

**Estimated time:** 60-90 minutes

**Key concepts to address:** ledger fields vs datums, circuits vs validators, witnesses for private input, disclose() for visibility control, assert for guards, the shift from validation to execution
