# Token Economics — Mini-App Ideas

Date: 2026-04-02
Status: Raw notes — mini-app concepts to prototype

## Principle

The Academy explains NIGHT/DUST well. Don't rewrite it. Build a runnable mini-app that shows what the split means in practice. Background knowledge becomes lived experience.

## NIGHT/DUST Split — Cardano Comparison

| | Cardano | Midnight |
|---|---|---|
| Store of value | ADA | NIGHT |
| Pay fees with | ADA (same token) | DUST (different, generated from NIGHT) |
| Fee predictability | Fees tied to ADA market price | DUST decoupled from NIGHT market |
| Fee privacy | Public — every fee payment links wallet | Shielded — fee payments don't expose patterns |
| Sponsored transactions | Possible but awkward (send ADA first) | First-class via batchers |
| Identity model | One wallet = one history | NIGHT address + multiple DUST addresses |

## Mini-App Idea 1: Sponsored Onboarding

**Why it matters:** Onboarding users who don't hold crypto is constant friction on Cardano. Midnight's batcher model lets developers front DUST fees — user interacts, developer pays. Web2-like UX.

**Build:** A mini-app where a new user (no NIGHT, no DUST) completes an action (e.g., registers, casts a vote, submits something). Developer sponsors the transaction. Show the user never touched a token.

**Cardano comparison:** Show the same flow on Cardano — someone has to send the user ADA first, or use a custom relay. More steps, more friction.

**Andamio relevance:** This is directly relevant to learner onboarding. If Andamio builds on Midnight, new learners could start contributing before holding any tokens. The developer/organization sponsors their first interactions.

## Mini-App Idea 2: DUST Generation Visualizer

**Build:** Show DUST accumulating over time from staked NIGHT. Visualize:
- DUST growing toward cap
- Cap hit → stays at max
- NIGHT spent → DUST decays to zero
- Multiple NIGHT positions → multiple DUST streams

**The lesson:** This is a novel economic model. Devs need to feel it, not just read about it. The "solar panel / electricity" analogy comes alive when you see the numbers move.

## Mini-App Idea 3: Observer Comparison

**Build:** Same action performed on Cardano and Midnight. Show what an external observer can see in each case.

**Cardano view:** Sender address, receiver address, amount, fee paid, all linked to wallet history, datum contents visible.

**Midnight view (shielded):** A valid transaction occurred. That's it.

**The lesson:** Privacy isn't abstract. It's the difference between these two views. Cardano devs who've never thought about metadata leakage will see it immediately.

## Mini-App Idea 4: Multi-Address Privacy

**Build:** Show a NIGHT wallet anchoring multiple DUST addresses. Perform operations from different DUST addresses. Show that from the outside, these look like unrelated actors.

**Cardano comparison:** On Cardano, all transactions from the same wallet are trivially linkable. Even with multiple addresses, UTXO analysis often reconnects them.

**The lesson:** Midnight's identity model isn't just "privacy." It's structural separation of concerns. Developers can build role-based systems, multi-tenant apps, and identity-separated game logic.

## Viewing Keys — Enterprise Angle

Midnight supports viewing keys: read-only access to shielded transaction history.
- Share with auditor → they verify your history
- Share with regulator → prove compliance
- **Non-revocable once shared** — real constraint, share carefully

**Andamio connection:** This is the selective disclosure model applied to financial/operational data. Andamio's credential model is already selectively disclosed (contributor chooses what evidence to submit). Viewing keys add a similar mechanism for Midnight's private state.

**PBL conversation prompt:** "You can give an auditor a viewing key to see your shielded transactions. But you can't revoke it. How does this change how you design access control? Compare to sharing a credential publicly on Cardano — also non-revocable, but by design."

## Key Source Material (from Academy, don't rewrite)

- NIGHT: fixed supply 24B, unshielded, governance/consensus/staking
- DUST: shielded, non-transferable, decaying, generated from NIGHT
- No public mempool → no MEV
- Sponsored transactions via batchers
- Four token types: shielded/unshielded × ledger/contract
- NIGHT wallet anchors multiple private DUST execution addresses
