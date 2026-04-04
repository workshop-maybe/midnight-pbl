# Midnight's Token Architecture

## One Token vs Two

On Cardano, ADA does everything. Store of value, pay fees, stake for rewards, vote in governance. One token, many roles.

Midnight splits this into two:

**NIGHT** — the store of value. Fixed supply of 24 billion. Unshielded (publicly visible). Used for governance and staking. cNIGHT is its representation on Cardano, observed by Midnight's Native Token Observation Pallet.

**DUST** — the gas token. Shielded (private). Non-transferable. Generated from staked NIGHT. Consumed by transactions. Decays over time — use it or lose it.

The split is a design decision that solves a problem Cardano doesn't have. On Cardano, every ADA transaction is publicly linked to a wallet. Fee payments create a transaction graph that reveals user behavior. On Midnight, DUST is shielded — fee payments don't link to identity. You can submit transactions without revealing which wallet paid for them.

---

## NIGHT and DUST: The Solar Panel Analogy

NIGHT is a solar panel. DUST is the electricity it generates.

- Stake NIGHT → DUST accumulates over time, up to a cap
- Use DUST → it's consumed by transactions (paying for proof verification)
- Stop staking NIGHT → DUST decays to zero
- Sell NIGHT → your DUST generation capacity disappears

You don't buy DUST. You generate it by holding NIGHT. This means:
- **New users can't just buy gas.** They need NIGHT first, or someone to sponsor their transactions.
- **Fee costs are decoupled from token price.** DUST isn't traded on exchanges. Its value is defined by what transactions cost, not by market speculation.
- **Heavy users burn DUST faster than they generate it.** High-throughput applications need proportionally more NIGHT staked.

**Cardano comparison:** On Cardano, if ADA's price doubles, your transaction fees effectively double in dollar terms (though the ADA amount stays the same). On Midnight, DUST generation is tied to NIGHT staking, not DUST's market price — because DUST has no market price. It's not transferable.

---

## The Token Matrix

Midnight doesn't just have two tokens. It has four token types, organized along two axes:

|  | **Ledger Token** (UTXO-based, native) | **Contract Token** (account-based, programmable) |
|--|---------------------------------------|------------------------------------------------|
| **Unshielded** (public) | NIGHT. Full transparency, high performance. Public treasuries, exchange-listed assets. | Traditional DeFi tokens, governance tokens. ERC-20 equivalent on Midnight. |
| **Shielded** (private) | Private payments, confidential transfers. Max efficiency, native privacy. | Programmable privacy with custom logic. Private equity, confidential rewards. |

### Ledger Tokens (UTXO-based)

Native to the protocol. Live in UTXOs managed by ZSwap (Midnight's UTXO token scheme). No smart contract needed. Fast, cheap, minimal trust.

**Cardano equivalent:** Native assets. Minted via monetary policy, carried in UTXOs. Ledger tokens on Midnight are architecturally the same — except Midnight adds a shielded variant. On Cardano, all native assets are unshielded by default.

### Contract Tokens (Account-based)

Managed by smart contract state. Balances live in contract ledger fields, not in UTXOs. Programmable rules govern minting, burning, and transfer.

**Cardano equivalent:** No direct equivalent. Cardano's native assets are always UTXO-based. For programmable token logic on Cardano, you use validators to guard UTXOs — but the tokens themselves are still native assets in the UTXO model. Midnight imports the Ethereum pattern: contract-managed token balances in an account model.

### Shielded Tokens

Either type — ledger or contract — can be shielded. Shielding uses ZSwap's commitment/nullifier scheme:
1. A commitment (hiding the token's value and owner) enters a Merkle tree
2. To spend, a nullifier is revealed that proves ownership without revealing which commitment
3. The nullifier is unlinkable to the commitment — observers can't trace the transaction graph

**Cardano equivalent:** None. Cardano has no native privacy mechanism. If you want privacy on Cardano, you hash data before putting it in a datum — but the Plutus VM doesn't enforce this, and the token transfer itself is always visible.

---

## Mapping to What You Know

| Concept | Cardano | Midnight | Key Difference |
|---------|---------|----------|----------------|
| Store of value | ADA | NIGHT | Same role, different privacy options |
| Pay fees | ADA (same token) | DUST (separate, shielded, generated) | Fee payments don't link to identity |
| Fee predictability | Tied to ADA market price | DUST decoupled from NIGHT market | No market speculation on gas costs |
| Native assets | UTXO-based, public | Ledger tokens — UTXO-based, shielded or unshielded | Midnight adds privacy option |
| Programmable tokens | Validator-guarded UTXOs | Contract tokens — account-based state | Different paradigm (UTXO vs account) |
| Sponsored transactions | Possible but awkward (send ADA first) | First-class via batchers | Midnight built for it |
| Identity model | One wallet = one linkable history | NIGHT address + multiple DUST addresses | Structural separation of identity and activity |
| Mempool | Public — pending txs visible | None — direct to block producers | No MEV, no front-running |

---

## The Datum Gap

This is where the comparison gets most interesting for data-rich applications.

On Cardano, a UTXO carries a datum — structured data attached to value. A credential is a native asset with a datum. The datum IS the credential. The spending validator enforces rules about how the datum can change. The evidence is right there, attached to the token, publicly verifiable.

On Midnight, ledger tokens don't carry datums. They're values in a Merkle tree — amount and ownership, nothing more. Structured data lives in contract state, not attached to individual tokens.

| | Cardano UTXO | Midnight Ledger Token | Midnight Contract Token |
|--|-------------|----------------------|------------------------|
| **Data attached to value** | Datum (arbitrary structured data) | None — just value and ownership | Balance in contract state, data in contract fields |
| **Verification** | Validator checks datum transitions | ZK proof verifies spend (no datum to check) | ZK proof verifies state transition |
| **Queryability** | By UTXO address, custom indexing | By Merkle tree membership | By contract address, GraphQL indexer |
| **Privacy** | All public | Shielded by default | Controlled by `disclose()` |

When you shield a token, the data that made it meaningful as a credential becomes hidden. That's the right move for financial privacy. It's the wrong move for proof of contribution.

---

## Sponsored Transactions

On Cardano, onboarding a new user means getting ADA into their wallet first. Someone has to send them ADA before they can do anything. This is constant friction for developer onboarding, course enrollment, and first-time interactions.

Midnight has a native solution: **batchers**. A batcher is a service that bundles transactions and pays DUST fees on behalf of users. The user interacts with the application — submits a vote, posts a message, completes an action — and the developer or organization sponsors the transaction cost.

The user never holds NIGHT. Never generates DUST. The batcher fronts the gas. This is Web2-style UX — "just use the app, someone else pays for infrastructure."

**Cardano comparison:** Sponsored transactions are possible on Cardano but require workarounds — the sponsor sends ADA to the user's wallet first, or a relay service co-signs and pays fees. On Midnight, the batcher pattern is first-class: designed into the protocol, supported by the SDK.

---

## Viewing Keys

Midnight supports viewing keys — read-only access to shielded transaction history.

Give a viewing key to an auditor, and they can see your shielded transactions without being able to spend. Give one to a regulator, and they can verify compliance. This is selective auditability — private by default, auditable when you choose.

One critical constraint: **viewing keys are non-revocable once shared.** If you give someone a viewing key, they can read your history forever. No take-backs. Design your access control with this in mind.

**Cardano comparison:** On Cardano, everything is already public — there's nothing to "give access to." Viewing keys are the mechanism by which shielded data becomes selectively visible. On Cardano, the equivalent is simply pointing someone to the chain explorer.

---

## Questions to Consider

- DUST is non-transferable and decays. This means heavy applications need proportionally more NIGHT staked. How does this change your application economics? What happens when a popular DApp burns DUST faster than its stakeholders generate it?
- The token matrix has four quadrants, but Cardano native assets with datums don't fit neatly into any of them. Where do data-carrying tokens belong? What would a fifth quadrant — "programmable, public, with structured data attached to value" — look like?
- Viewing keys are non-revocable. On Cardano, all data is always visible to everyone — also non-revocable, but by design rather than by key sharing. Which model gives the user more control? Which creates more risk?

---

## What's Next

Lesson 105.2 (Developer Documentation) will build a DApp that uses sponsored transactions — a new user interacts without holding tokens. Lesson 105.3 will evaluate a DApp against Midnight's deployment risk rubric. This lesson — the token architecture — is the economic foundation both build on.

---

## Conversation Starters

Take a Cardano application you've built or used — a DEX, a lending protocol, a credential system, an NFT marketplace. Map its token usage to Midnight's token matrix:

1. Which tokens would be ledger tokens (native, UTXO-based)? Which would be contract tokens (programmable, account-based)?
2. Which should be shielded? Which should stay unshielded?
3. Where does the datum gap create problems? What data currently lives in datums that has no equivalent home in Midnight's token model?
4. Would sponsored transactions change the onboarding experience? For which users?

The exercise isn't about moving everything to Midnight. It's about understanding which parts of the token architecture each chain handles better — and where the gaps are.
