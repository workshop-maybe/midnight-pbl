# Lesson 6.3: When to Use Midnight, When to Use Cardano

## The Decision

You now know both platforms. You can write Aiken validators for Cardano's eUTxO model. You can write Compact circuits for Midnight's privacy model. The question for any new project is: which one?

The answer is rarely "always Midnight" or "always Cardano." It depends on what your application needs to prove and who should see the proof.

---

## The Decision Framework

Three questions determine where a feature belongs:

### 1. Does the verifier need to see the data, or just the result?

**If the data itself is the value** → Cardano.

A public credential registry. A token balance that other contracts read. An NFT whose metadata is the point. The data is public because public visibility is the feature.

**If only the result matters** → Midnight.

An age check. A team capability proof. A credential verification. The verifier needs "yes, this person qualifies" — not the person's date of birth, team roster, or credential details.

### 2. Do other contracts need to compose with this state?

**If yes** → Cardano.

Cardano's eUTxO model enables composability. Other projects can set prerequisites based on your on-chain state without negotiating API integrations. Andamio's Access Tokens, XP tokens, and credential NFTs work because any contract can read them.

**If no** → Either chain works.

Midnight contracts are more isolated. There's no cross-contract state reading. If your feature doesn't need composability, the composability advantage of Cardano doesn't apply.

### 3. Would revealing this data harm the user?

**If no harm** → Cardano (simpler, more composable).

Most credential issuance. Course completion records. Token transfers between public addresses. There's nothing sensitive about proving you completed a course.

**If potential harm** → Midnight.

Personal identity attributes. Salary data. Medical qualifications. Team composition. Any case where knowing "who holds what" could be used against the holder — for profiling, discrimination, or competitive intelligence.

---

## Use Case Evaluation

### Use Case 1: Course Completion Credentials

**Scenario:** A learning platform issues credentials when students complete courses.

| Question | Answer | Chain |
|----------|--------|-------|
| Does the verifier need the data or just the result? | The data — employers want to see which courses were completed | Cardano |
| Do other contracts compose with this? | Yes — prerequisites, XP calculations, enrollment logic | Cardano |
| Would revealing harm the user? | No — course completion is usually a positive signal | Cardano |

**Verdict: Cardano.** This is Andamio's current model and it works well. Public credentials on Cardano are the right choice when the credential itself is the value.

### Use Case 2: Age-Gated Access

**Scenario:** A wine shop verifies customers are over 21.

| Question | Answer | Chain |
|----------|--------|-------|
| Does the verifier need the data or just the result? | Just the result — "over 21" is enough | Midnight |
| Do other contracts compose with this? | No — age check is per-transaction | Midnight |
| Would revealing harm the user? | Yes — date of birth is PII | Midnight |

**Verdict: Midnight.** This is the Brick Towers pattern. The credential stays private. The proof is sufficient.

### Use Case 3: Team Capability Proof for Enterprise Sales

**Scenario:** A consulting firm proves to a client that their team has 15 certified cloud architects.

| Question | Answer | Chain |
|----------|--------|-------|
| Does the verifier need the data or just the result? | Just the result — count is enough | Midnight |
| Do other contracts compose with this? | No — this is a point-in-time attestation | Midnight |
| Would revealing harm the user? | Yes — individual identities and exact capabilities are competitive intelligence | Midnight |

**Verdict: Midnight.** Individual certifications could be on Cardano (public registry), but the team aggregation must be on Midnight.

### Use Case 4: Token Transfer

**Scenario:** Sending ADA or a custom token to another address.

| Question | Answer | Chain |
|----------|--------|-------|
| Does the verifier need the data or just the result? | The data — the transfer itself is the point | Cardano |
| Do other contracts compose with this? | Yes — token balances are read by every DeFi contract | Cardano |
| Would revealing harm the user? | Sometimes — balance visibility is a concern for some users | Depends |

**Verdict: Usually Cardano.** Token transfers are the native use case. If balance privacy matters (large holdings, corporate treasury), Midnight's ZSwap provides shielded transfers. Most users don't need this.

### Use Case 5: Anonymous Voting

**Scenario:** A DAO conducts a governance vote where members should not be identifiable from their votes.

| Question | Answer | Chain |
|----------|--------|-------|
| Does the verifier need the data or just the result? | Just the result — vote counts | Midnight |
| Do other contracts compose with this? | No — votes are consumed once | Midnight |
| Would revealing harm the user? | Yes — vote buying, coercion, social pressure | Midnight |

**Verdict: Midnight.** MerkleTree membership + nullifiers (Lesson 5.2) is the exact pattern. Each member proves they're in the voter set without revealing which member they are. The nullifier prevents double-voting.

### Use Case 6: Public Audit Trail

**Scenario:** A supply chain platform records who handled goods at each stage.

| Question | Answer | Chain |
|----------|--------|-------|
| Does the verifier need the data or just the result? | The data — the whole point is traceability | Cardano |
| Do other contracts compose with this? | Yes — downstream handlers need to verify upstream records | Cardano |
| Would revealing harm the user? | No — transparency is the value proposition | Cardano |

**Verdict: Cardano.** Public accountability requires public data.

---

## The Dual-Chain Pattern

Some applications need both. The dual-chain architecture from Lesson 6.1 applies when:

- **The trust anchor should be public** (Cardano) — credential existence, issuer identity, revocation status
- **The usage should be private** (Midnight) — who holds what, selective disclosure, team aggregation

This isn't doubling your work. The two chains serve different functions:

```
Cardano: "Credential X exists and is valid"     → public trust
Midnight: "I hold credential X and meet claim Y" → private proof
```

The current constraints (Lesson 6.2) mean coordination is manual. But the separation of concerns is clean, and it works today.

---

## When NOT to Use Midnight

Midnight adds complexity: a second language (Compact), proof generation latency, a different deployment model. Don't use it when:

- **Everything is public anyway.** If your users want their credentials displayed, Cardano is simpler.
- **Composability is critical.** If other contracts need to read your state, Cardano's eUTxO model is better suited.
- **Performance matters more than privacy.** Proof generation takes time. Cardano transactions are faster for simple operations.
- **The anonymity set is too small.** If there are only 3 people who could hold a credential, a MerkleTree proof doesn't provide meaningful anonymity.
- **You don't have a threat model.** Privacy for its own sake adds cost without benefit. Know what you're protecting and from whom.

---

## When You MUST Use Midnight

Some applications can't work without privacy:

- **Regulatory compliance with data minimization.** GDPR, HIPAA, and similar regulations require proving facts without collecting the underlying data.
- **Identity verification without identity disclosure.** Age checks, certification verification, employment verification — anywhere PII is involved.
- **Competitive intelligence protection.** Team composition, capability proofs, internal credentialing — data that competitors could exploit.
- **Anti-coercion systems.** Voting, whistleblower protection, anonymous reporting — where revealing participation would create pressure.

For these, Cardano alone isn't sufficient. You need the ZK proof layer.

---

## Questions to consider:

- A DAO wants governance voting where vote counts are public but individual votes are private. They also want delegation — members can delegate their voting power. Can delegation work with anonymous voting? What's the tradeoff?
- An employer verifies a job applicant's credentials. The applicant uses Midnight to prove "I have 5+ years experience at companies in the Fortune 500." The employer doesn't see which companies. Is this useful? What does the employer actually need to make a hiring decision?
- If Midnight adds latency (proof generation) and complexity (second language), what's the threshold where the privacy benefit justifies the cost? Is there a heuristic?

---

## Assignment

Evaluate three use cases from your own domain. For each one:

1. Apply the three-question framework (data vs. result, composability, harm)
2. Decide: Cardano only, Midnight only, or dual-chain
3. If dual-chain, specify what lives on each chain and how they coordinate
4. Identify the specific privacy property that Midnight provides (or explain why Cardano is sufficient)
5. Name one risk of choosing the wrong chain for this use case
