# Lesson 6.1: Designing a Dual-Chain Credential Architecture

## The Design Question

You've built credential systems on Cardano. Credentials are on-chain, verifiable, permanent. Anyone can read them. That's the point.

But now a client asks: "Can our employees prove they hold a credential without revealing which one? Can we prove our team has 15 certified cloud architects without naming them?"

On Cardano alone, the answer is no. Everything on the public ledger is public. That's both the strength and the limitation.

Midnight gives you the missing piece: prove facts about credentials without revealing the credentials themselves. The question is how to architect a system that uses both chains.

---

## The Principle: Public Registry, Private Proofs

The cleanest architecture separates two concerns:

1. **Cardano** handles everything that should be **publicly verifiable**: credential existence, revocation status, issuer identity, program structure.
2. **Midnight** handles everything that should be **privately provable**: who holds what, attribute details, aggregate team capabilities.

This isn't a compromise — it's a stronger design than either chain alone. The public registry provides the trust anchor. The private proofs provide the utility that enterprises actually need.

---

## What Lives on Cardano

If you've built with Andamio's Aiken validators, this layer already exists:

```
Cardano Layer (Aiken):
├── Access Token minting       — identity on the network
├── Course validators          — SLT completion, enrollment, credential issuance
├── Project validators         — task commitments, XP distribution
├── Public credential registry — "credential X was issued by issuer Y on date Z"
├── XP token circulation       — quantitative proof of contribution
└── Sponsored transactions     — users never touch ADA
```

Everything here is public. Anyone can verify that a credential was issued, check its revocation status, or read the SLTs it represents. This is the **read layer** — the shared source of truth that doesn't require trusting the issuer.

The key property: **composability**. Other projects can set prerequisites based on these public credentials without negotiating API integrations. The protocol enforces it.

---

## What Lives on Midnight

Midnight adds what Cardano can't provide — proofs about credentials without revealing them:

```
Midnight Layer (Compact):
├── Private credential storage   — MerkleTree of credential commitments
├── Selective disclosure circuits:
│   ├── "I hold N credentials"   — without revealing which ones
│   ├── "I completed SLT X"     — without revealing my identity
│   └── "My team has capability Y" — without revealing who
├── Private plan sharing         — prove a document was reviewed
│                                  without exposing the document
└── Nullifier-based proofs       — prove something once,
                                   prevent replay
```

The pattern is consistent across all of these: a Compact circuit takes private data via a witness function, verifies it against some criteria, and produces a ZK proof that the criteria were met. The private data never leaves the user's machine. Only the proof goes on-chain.

---

## How They Connect (Today)

Here's the honest part: there is no production bridge between Cardano and Midnight. No atomic cross-chain transactions. No way for a Cardano validator to read Midnight state or vice versa.

The Native Token Observation Pallet lets Midnight observe cNIGHT movements on Cardano. That's a one-way economic link, not a general-purpose bridge.

So how does a dual-chain credential system work today?

### Manual Coordination Pattern

1. **Credential issuance happens on Cardano.** The Aiken validators mint the credential NFT, record the SLT hashes, update the public registry. This is the authoritative record.

2. **Credential commitment is registered on Midnight.** The user (or an automated service) takes the credential data and registers a commitment in a MerkleTree on Midnight. This commitment is a hash — it proves the credential exists without revealing its contents.

3. **Selective disclosure happens on Midnight.** When someone needs to prove an attribute (age, qualification, team capability), a Compact circuit reads the private credential via a witness, checks the claim, and generates a ZK proof.

4. **Verification can happen on either chain.** The public fact ("credential exists, not revoked") is verified on Cardano. The private fact ("holder meets criteria X") is verified on Midnight.

The user holds credential representations on both chains. The Cardano credential is the authoritative record. The Midnight commitment enables privacy-preserving proofs about that record.

---

## Three Enterprise Scenarios

### Scenario 1: Individual Credential Verification

**Need:** A job applicant proves they completed a cloud security certification without revealing their full credential history.

**Cardano:** The certification body issued the credential. The public registry confirms it exists and hasn't been revoked.

**Midnight:** The applicant's Compact circuit reads their full credential set (private), finds the relevant one, and produces a ZK proof that they hold a valid cloud security certification from a trusted issuer. The employer verifies the proof. They never see the applicant's other credentials, their wallet address, or their identity.

### Scenario 2: Team Capability Aggregation

**Need:** An enterprise proves to a client that their team includes 15 certified professionals, without revealing who they are.

**Cardano:** Individual credentials are on the public registry, but querying "show me everyone with certification X" would reveal individual identities.

**Midnight:** A Compact circuit aggregates credential commitments from team members' wallets (each provides their data privately via witnesses), counts how many meet the criteria, and produces a ZK proof: "this organization has >= 15 members holding certification X." No individual is identified.

### Scenario 3: Private Plan Review

**Need:** A contributor reviewed and improved a proprietary project plan. The review should earn a credential, but the plan contents are confidential.

**Cardano:** The credential records "contributor Y provided a verified review for project Z." The fact of contribution is public.

**Midnight:** The plan itself, the review content, and the improvement diff live in the contributor's local environment. A Compact circuit proves the review was substantive (e.g., the diff meets a minimum threshold or includes specific sections) without revealing what was reviewed. The credential earned is public. The work that earned it is private.

---

## Architecture Decision Framework

When deciding where a piece of your system lives, ask:

| Question | If Yes → Cardano | If Yes → Midnight |
|----------|-------------------|-------------------|
| Does anyone need to verify this without trusting the issuer? | Public registry | — |
| Do other projects need to set prerequisites on this? | Composable credentials | — |
| Does the holder need to prove this without revealing details? | — | Selective disclosure circuit |
| Would revealing this data expose the holder's identity? | — | Private proof |
| Is this data needed for compliance without full disclosure? | — | ZK attestation |
| Should this record survive both platforms? | Both — dual representation | Both — dual representation |

The default: **start on Cardano, add Midnight when privacy is required.** Not everything needs a ZK proof. Most credentials work fine as public records. Midnight adds value specifically when "who holds what" is sensitive information.

---

## What's Coming

The current manual coordination pattern works but adds friction. The roadmap for tighter integration includes:

- **Credential commitment bridges** — automated sync from Cardano credential mints to Midnight MerkleTree insertions
- **Cross-chain proof receipts** — Midnight proof results posted back to Cardano as transaction metadata
- **Pintent protocol** (0xAtelerix) — cross-chain intent system; Cardano support is planned but not yet available

When these materialize, the dual-chain architecture becomes seamless. Until then, the manual pattern is functional and the separation of concerns is the same either way.

---

## What's Next

Lesson 6.2 gets specific about what can and can't cross the bridge between Cardano and Midnight today.

---

## Assignment

Design a dual-chain credential architecture for one of these scenarios:

1. **A professional association** that wants members to prove their certification status to employers without the association revealing its full membership list.
2. **A university** that wants graduates to prove their degree and specific competencies to hiring platforms without exposing their transcript.
3. **A development team** that wants to prove collective capability to a client without revealing individual contributor identities.

For your chosen scenario, specify:
- What data lives on Cardano and why
- What data lives on Midnight and why
- How the user coordinates between the two chains
- What the verification flow looks like from the verifier's perspective
