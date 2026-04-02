# Token Matrix — Cardano Dev Framing

Date: 2026-04-02
Status: Raw notes for lesson development

## Midnight's Token Matrix

Four token types from two dimensions: location (ledger vs contract) x privacy (shielded vs unshielded).

1. **Shielded Ledger Tokens** — Native privacy, max efficiency. Private payments, confidential transfers.
2. **Unshielded Ledger Tokens** — Full transparency, high performance. NIGHT is the example. Public treasuries, exchange-listed assets.
3. **Shielded Contract Tokens** — Programmable privacy with custom logic. Private equity, confidential rewards.
4. **Unshielded Contract Tokens** — Full programmability, full transparency. Traditional DeFi/governance tokens. ERC-20 equivalent.

## Mapping to What Cardano Devs Already Know

| Midnight | Cardano equivalent | Key difference |
|---|---|---|
| Ledger tokens (UTXO-based, native) | Native assets (minted via monetary policy, carried in UTXOs) | Midnight adds shielded variant |
| Contract tokens (account-based, ERC-20 style) | No direct equivalent — Cardano doesn't have account-based tokens | This is the Ethereum bridge |
| Shielded | No equivalent on Cardano | Midnight's core addition |
| Unshielded | Everything on Cardano | Cardano's default |

**The hook for Cardano devs:** You already work with ledger tokens. Every native asset on Cardano is a ledger token — lives in UTXOs, managed by the protocol, no smart contract trust required. Midnight's unshielded ledger tokens are architecturally the same thing.

What Midnight adds is two dimensions Cardano doesn't have:
1. **Shielding** — any token can be private
2. **Contract tokens** — account-based tokens managed by smart contract state (the Ethereum model, imported)

## The Datum Gap

**Critical Andamio observation:** Andamio credentials on Cardano are unshielded ledger tokens with datums. Native assets in UTXOs carrying structured evidence data.

On Midnight's token matrix they'd map to unshielded ledger tokens — but Midnight's ledger tokens don't carry datums the way Cardano's EUTXO does. Midnight gains privacy but loses the datum — the structured evidence attached to value.

This is a real architectural tradeoff:
- **Cardano UTXO:** value + datum (structured data) + spending rules → the datum IS the credential
- **Midnight shielded ledger token:** value + privacy → but where does the structured data go?
- **Midnight contract token:** value + programmable state + optional privacy → data lives in contract state, not attached to the token itself

When you shield a token, the data that made it meaningful as a credential becomes hidden. That's the right move for financial privacy. It's the wrong move for proof of contribution.

## Lesson Idea: What Do You Gain and Lose When You Shield a Token?

**Conversation prompt:** "What happens to the datum when you shield a token?"

**Hands-on:** Take a Cardano native asset with a datum (e.g., a credential). Map it to Midnight's token matrix. Which quadrant does it land in? What happens to the evidence data in each quadrant?

| Quadrant | What happens to the credential data |
|---|---|
| Unshielded ledger | Data visible in UTXO — but Midnight doesn't have datums like Cardano |
| Shielded ledger | Data hidden — privacy preserved, but nobody can verify the evidence |
| Unshielded contract | Data in contract state — visible, programmable, but account-model (no UTXO parallelism) |
| Shielded contract | Data in private contract state — can prove facts about it via ZK without revealing it |

**The punchline:** Shielded contract tokens are where Midnight and Andamio could meet. The credential data lives in private contract state. You can prove you hold it, prove facts about it, without revealing the specifics. But the underlying evidence — the work that earned the credential — was originally public on Cardano. The privacy layer is added after the proof of work, not instead of it.

## Where This Fits in the Course

This lesson belongs after learners have:
1. Built with Cardano native assets and datums (or have prior experience)
2. Understood Midnight's dual-state model
3. Worked with Compact contracts

It's a comparison lesson that surfaces the architectural tradeoffs between the two chains — and naturally leads to the question of when you need each.
