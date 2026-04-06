# Designing a Dual-Chain Credential Architecture

## The Design Question

You've built credential systems on Cardano. Credentials are on-chain, verifiable, permanent. Anyone can read them. That's the point.

But now a client asks: "Can our employees prove they hold a credential without revealing which one? Can we prove our team has 15 certified architects without naming them?"

On Cardano alone, the answer is no. Everything on the public ledger is public.

Midnight gives you the missing piece: prove facts about credentials without revealing the credentials themselves. The question is how to architect a system that uses both chains.

---

## The Principle: Public Registry, Private Proofs

The cleanest architecture separates two concerns:

1. **Cardano** handles everything that should be **publicly verifiable**: credential existence, revocation status, issuer identity, program structure.
2. **Midnight** handles everything that should be **privately provable**: who holds what, attribute details, aggregate team capabilities.

This isn't a compromise — it's a stronger design than either chain alone. The public registry provides the trust anchor. The private proofs provide the utility enterprises actually need.

---

## What Lives on Cardano

```
Cardano Layer:
├── Credential issuance      — native asset minted with datum
├── Public registry           — "credential X issued by Y on date Z"
├── Revocation status         — "credential X is active / revoked"
├── Program structure         — SLTs, course metadata, prerequisites
├── XP token circulation      — quantitative proof of contribution
└── Composability             — other projects set prerequisites without API negotiation
```

Everything here is public. Anyone can verify a credential was issued, check its revocation status, or read what it represents. This is the shared source of truth that doesn't require trusting the issuer.

The key property: **composability**. Other Cardano projects can set prerequisites based on these public credentials. A DeFi protocol can require "holds certification X" as an access gate by reading the public registry. No API integration needed — the protocol enforces it.

---

## What Lives on Midnight

```
Midnight Layer:
├── Credential commitments     — MerkleTree of hashed credentials
├── Selective disclosure:
│   ├── "I hold N credentials" — without revealing which ones
│   ├── "I completed SLT X"   — without revealing my identity
│   └── "My team has capability Y" — without revealing who
├── Private plan review        — prove document was reviewed
│                                without exposing the document
└── Nullifier proofs           — prove something once, prevent replay
```

Every entry follows the same pattern: a Compact circuit takes private data via a witness, verifies it against criteria, and produces a ZK proof. The private data never leaves the user's machine. Only the proof goes on-chain.

---

## How They Connect Today

Here's the honest part: **there is no production bridge between Cardano and Midnight** for arbitrary data. No atomic cross-chain transactions. No way for a Cardano validator to read Midnight state or vice versa.

The Native Token Observation Pallet lets Midnight observe cNIGHT movements on Cardano. That's a one-way economic link, not a general-purpose bridge.

### The Manual Coordination Pattern

This is how a dual-chain credential system works today:

**1. Credential issuance on Cardano.** Your validators mint the credential NFT, record the evidence in the datum, update the public registry. This is the authoritative record.

**2. Commitment registration on Midnight.** The user (or an automated service) takes the credential data and registers a commitment (`persistentHash` of the credential) in a MerkleTree on Midnight. The commitment proves the credential exists without revealing its contents.

**3. Selective disclosure on Midnight.** When someone needs to prove an attribute, a Compact circuit reads the private credential via a witness, checks the claim, and generates a ZK proof (Lessons 105.2 and 105.3).

**4. Verification on either chain.** The public fact ("credential exists, not revoked") is verified on Cardano. The private fact ("holder meets criteria X") is verified on Midnight.

The user holds credential representations on both chains. The Cardano credential is the authoritative record. The Midnight commitment enables privacy-preserving proofs about that record.

### The Interoperability Constraints

| Direction | Possible? | Mechanism |
|-----------|-----------|-----------|
| Cardano → Midnight (token) | Yes | Native Token Observation Pallet |
| Cardano → Midnight (data) | No | — |
| Midnight → Cardano (data) | No | — |
| Midnight → Cardano (proof result) | Manually | Off-chain relay posts metadata |

**No cross-chain contract calls.** A Compact circuit can't call an Aiken validator. An Aiken validator can't read Midnight's ledger. If your architecture requires "Cardano verifies a Midnight proof," an off-chain service must read the Midnight result and submit it to Cardano as transaction metadata. The Aiken validator trusts the metadata format — it cannot independently verify the ZK proof.

**No atomic transactions.** You can't atomically update both chains. Design for eventual consistency: update one chain, wait for confirmation, then update the other. Handle the window where the two chains are inconsistent.

**One-way observation.** Midnight reads Cardano. Cardano does not read Midnight. This means Midnight can verify that a Cardano credential exists, but Cardano can't verify that a Midnight proof succeeded.

---

## Three Enterprise Scenarios

### Scenario 1: Individual Credential Verification

**Need:** A job applicant proves they completed a cloud security certification without revealing their full credential history.

**Cardano:** The certification body issued the credential. The public registry confirms it exists and hasn't been revoked.

**Midnight:** The applicant's circuit reads their full credential set (private), finds the relevant one, verifies the signature (Lesson 105.2), and produces a ZK proof. The employer verifies the proof. They never see the applicant's other credentials, wallet address, or identity.

### Scenario 2: Team Capability Aggregation

**Need:** An enterprise proves to a client that their team includes 15 certified professionals without revealing who they are.

**Cardano:** Individual credentials exist on the public registry. But querying "show me everyone with certification X" would reveal individual identities.

**Midnight:** A circuit aggregates credential commitments from team members' wallets (each provides data privately via witnesses), counts how many meet the criteria, and produces a ZK proof: "this organization has >= 15 members holding certification X." No individual is identified.

### Scenario 3: Private Contribution Review

**Need:** A contributor reviewed and improved a proprietary project plan. The review should earn a credential, but the plan contents are confidential.

**Cardano:** The credential records "contributor Y provided a verified review for project Z." The fact of contribution is public.

**Midnight:** The plan itself, the review content, and the improvement diff live in the contributor's local environment. A circuit proves the review was substantive (the diff meets a minimum threshold or includes specific sections) without revealing what was reviewed. The credential earned is public. The work that earned it is private.

---

## Architecture Decision Framework

When deciding where a piece of your system lives:

| Question | Yes → Cardano | Yes → Midnight |
|----------|--------------|----------------|
| Does anyone need to verify this without trusting the issuer? | Public registry | — |
| Do other projects need to compose on this? | Composable credentials | — |
| Does the holder need to prove this without revealing details? | — | Selective disclosure circuit |
| Would revealing this expose the holder's identity? | — | Private proof |
| Is this needed for compliance without full disclosure? | — | ZK attestation |
| Should this record exist on both platforms? | Dual representation | Dual representation |

The default: **start on Cardano, add Midnight when privacy is required.** Not everything needs a ZK proof. Most credentials work fine as public records. Midnight adds value specifically when "who holds what" is sensitive information.

---

## Failure Modes to Design For

The manual coordination pattern introduces failure scenarios that don't exist on a single chain:

**Credential mints on Cardano, commitment registration fails on Midnight.** The credential exists publicly but can't be used for private proofs. Recovery: retry the commitment registration. The Cardano credential is the authoritative record — the Midnight commitment is derived from it.

**Credential revoked on Cardano, MerkleTree still contains the commitment.** The user could still generate proofs on Midnight against a revoked credential. Defense: the Midnight circuit should check revocation status, which requires either a trusted oracle or a time-bounded proof validity window.

**Off-chain relay goes down.** Midnight proof results can't be posted back to Cardano. Impact depends on whether the Cardano side needs the proof result or just the public credential. Design so the Cardano layer functions independently.

**Inconsistency window.** Between updating one chain and the other, state is inconsistent. The window is bounded by block times (6s on Midnight, 20s on Cardano) plus relay latency. Design for eventual consistency, not atomic operations.

---

## What's Coming

The manual coordination pattern works but adds friction. Planned improvements:

| Initiative | What It Does |
|-----------|-------------|
| Credential commitment bridges | Auto-sync Cardano credential mints to Midnight MerkleTree insertions |
| Cross-chain proof receipts | Post Midnight proof results back to Cardano as transaction metadata |
| Pintent protocol (0xAtelerix) | Cross-chain intent system with planned Cardano support |

None of these are available today. Design for current constraints. The separation of concerns is the same either way — what changes is the automation level.

---

## Questions to Consider

- The manual coordination pattern requires someone to register the Midnight commitment after Cardano issuance. Who should do this — the credential holder, the issuer, or an automated service? What trust model does each choice create?
- If Midnight can read Cardano state (via the observation pallet pattern), could you verify credential existence on Cardano from within a Compact circuit? What would need to change in the pallet architecture?
- The three scenarios show individual, team, and contribution proofs. What other proof types would enterprises need? What about: "prove our organization holds at least $X in verified revenue" or "prove no employee has a compliance violation"?

---

## What's Next

Lesson 106.2 (already covered) provides the evaluation framework for deciding when to use Cardano, Midnight, or both. Lesson 106.3 maps what works today, what's on the roadmap, and what's genuinely unsolved — the honest inventory of the frontier.

---

## Conversation Starters

Design a dual-chain credential architecture for one of these scenarios:

1. **A professional association** that wants members to prove certification status to employers without revealing the full membership list.
2. **A university** that wants graduates to prove degrees and specific competencies to hiring platforms without exposing their transcript.
3. **A development team** that wants to prove collective capability to a client without revealing individual contributor identities.

For your chosen scenario, specify:
- What data lives on Cardano and why
- What data lives on Midnight and why
- How the user coordinates between the two chains (the manual pattern)
- What the verification flow looks like from the verifier's perspective
- What failure modes exist and how you handle them
