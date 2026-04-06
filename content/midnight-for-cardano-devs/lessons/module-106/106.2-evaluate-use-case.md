# Lesson 106.2: When Cardano, When Midnight, When Both

**SLT:** I can evaluate a use case and recommend when to use Cardano, Midnight, or both.

**Type:** Exploration

---

## The Question the Course Built

You've scaffolded a Midnight DApp. Compared the dual-state model to EUTXO. Learned how Kachina transcripts handle concurrency. Understood the partner chain relationship. Written Compact contracts with `disclose()`. Built privacy-preserving applications. Compared transaction lifecycles. Mapped the token architecture.

Now the question: for a given use case, which chain do you use?

This isn't a philosophical question. It's an engineering decision with concrete criteria.

---

## The Decision Starts with One Question

**Does the evidence need to be inspectable?**

If the value of your application comes from people being able to verify what happened — see the work, check the data, audit the history — then you need public, inspectable state. That's Cardano.

If the value comes from proving something is true without revealing the details — qualified without showing scores, voted without showing choices, compliant without exposing records — then you need private, provable computation. That's Midnight.

Most real applications need both.

---

## Three Architectural Patterns

### Pattern 1: Pure Cardano

**Use when:** Transparency is the feature. The entire value proposition depends on data being publicly verifiable.

**Examples:**
- Public credential registries (the credential IS the on-chain evidence)
- Transparent governance (votes are public commitments)
- Supply chain tracking (the audit trail is the product)
- Open-source contribution tracking

**What you get:** Full EUTXO determinism. Datum-carrying tokens. Public verifiability. Mature tooling.

**What you give up:** No privacy. Every transaction is linkable. User behavior is observable.

### Pattern 2: Pure Midnight

**Use when:** Privacy is the feature. The application would be impossible or unethical on a public chain.

**Examples:**
- Anonymous voting (vote choices must be secret)
- Private financial transactions (balances and transfers confidential)
- Sealed-bid auctions (bids hidden until reveal)
- Medical or legal credential proofs (prove qualification without exposing details)

**What you get:** ZK-proven computation. Shielded transactions. Selective disclosure via `disclose()`.

**What you give up:** The datum gap — no structured data attached to tokens. Longer transaction preparation (proof generation). Partial failure model. Pre-mainnet ecosystem maturity.

### Pattern 3: Dual-Chain

**Use when:** Different parts of your application have different privacy requirements. Some data should be public (to be valuable), some should be private (to be safe).

**Examples:**
- Credential systems: public registry on Cardano (proves the credential exists and what earned it), private attribute proofs on Midnight (proves you meet a threshold without revealing your score)
- DeFi with compliance: transparent protocol on Cardano (auditable by regulators), private user positions on Midnight (balances not visible to competitors)
- Identity: public DID anchored on Cardano, private attribute attestations on Midnight
- Voting with accountability: public tally on Cardano, private ballot on Midnight

**What you get:** The best of both — public verifiability where it matters, privacy where it matters.

**What you give up:** Complexity. Two chains, two languages, two deployment targets. Cross-chain communication is one-way (Midnight reads Cardano, not the reverse). An intermediary is needed for Midnight-to-Cardano attestation.

---

## The Evaluation Framework

For any use case, work through these five questions:

### 1. What's the trust model?

| Trust Requirement | Recommendation |
|-------------------|---------------|
| "Trust the math" — verify computation without seeing inputs | Midnight |
| "Trust the evidence" — verify by inspecting public data | Cardano |
| "Trust the math AND the evidence" — prove privately, verify publicly | Both |

### 2. What does an observer learn?

Map every piece of data in your application:

| Data | Should Observer See It? | Chain |
|------|------------------------|-------|
| That a credential exists | Yes | Cardano |
| What earned the credential | Yes (it's the value) | Cardano |
| That someone meets a threshold | Yes | Either |
| What their exact score is | No | Midnight |
| That a vote was cast | Yes (tally integrity) | Either |
| How they voted | No | Midnight |
| That a transaction occurred | Yes (auditability) | Either |
| Who sent it and how much | No | Midnight |

### 3. What's the latency budget?

- **Sub-second interactions:** Cardano (transaction building is fast; block time is the bottleneck)
- **Tolerates tens-of-seconds delay:** Midnight (proof generation adds 10-60s per interaction)
- **Batch or async operations:** Either (latency amortized)

If your users expect instant feedback, Midnight's proof generation time is a UX constraint. Design accordingly — background proof generation, optimistic UI updates, progress indicators.

### 4. What's the token model?

| Need | Recommendation |
|------|---------------|
| Tokens that carry structured data (datums) | Cardano |
| Tokens with private balances | Midnight |
| Programmable tokens with custom logic | Either (but different models — UTXO on Cardano, account on Midnight) |
| Fee-free user onboarding | Midnight (sponsored tx via batchers) |
| Established liquidity and exchange access | Cardano |

### 5. What's the maturity requirement?

| Requirement | Recommendation |
|-------------|---------------|
| Production-ready, battle-tested | Cardano |
| Cutting-edge privacy features, accept SDK churn | Midnight |
| Need both, phased rollout | Start with Cardano, add Midnight when it matures |

Midnight is pre-mainnet. The SDK is at version 3.0.0 with breaking changes between releases. If you're deploying to production this quarter, build on Cardano. If you're building for next year, prototype on Midnight now and ship when the ecosystem stabilizes.

---

## Worked Example: A Professional Credential System

**Use case:** Developers complete a course. They earn a credential. Employers want to verify credentials when hiring.

### What matters:
- **The credential itself:** Should be public. An employer needs to see it exists.
- **What earned it:** Should be public. The work product (contributions, code, course completions) is the evidence that makes the credential valuable.
- **The holder's other credentials:** Private. Showing one credential shouldn't reveal your entire credential history.
- **Whether someone meets a threshold:** Provable. "This person has 3+ credentials in smart contract development" — yes/no, without listing which ones.

### Recommendation: Dual-Chain (Staged)

**Phase 1 (Now — Cardano):** Issue credentials as native assets with datums on Cardano. The datum carries the evidence — what the person did, when, verified on-chain. Public, inspectable, valuable precisely because it's transparent. This is the foundation.

**Phase 2 (When Midnight matures):** Add a selective disclosure layer on Midnight. The holder can prove "I have 3+ credentials above threshold X" without revealing which specific credentials. Midnight reads Cardano state to verify the credentials exist. The privacy layer adds value on top of the public foundation — not instead of it.

**Phase 3 (When cross-chain matures):** Full interop. Midnight proofs attested back to Cardano. Employers verify on either chain. The two layers work together seamlessly.

**Why staged:** The public credential has value today. The privacy layer requires SDK maturity, and its value depends on having a robust public foundation first. You can't selectively disclose badges that don't exist yet.

---

## When NOT to Use Midnight

The evaluation framework is balanced. This list isn't. These are cases where Midnight is the wrong choice:

**Everything is public anyway.** A transparent governance record, an open-source contribution log, a public credential registry. If your application's value comes from visibility, the proof server, DUST management, and multi-wallet architecture are overhead with zero privacy return. Use Cardano.

**Composability is critical.** Other contracts need to read your state and set prerequisites. Cardano's EUTXO model enables this — other projects compose on your public credentials without API negotiation. Midnight's contract state is isolated. Cross-contract reads don't exist. If composability matters more than privacy, use Cardano.

**Your anonymity set is too small.** If only 3 people hold a specific credential, a "one of N" proof doesn't hide much. The observer knows it's one of three. MerkleTree anonymity scales with set size. Below ~50 members, the privacy gain may not justify the complexity.

**There's no threat model.** "Privacy because privacy" isn't a design reason. If nobody is harmed by the data being public — if there's no regulatory requirement, no competitive risk, no identity exposure — then Midnight adds complexity without value. Ask who specifically would be harmed by public data.

**Performance matters more.** Real-time interactions — live auctions, gaming, high-frequency trading — can't tolerate 30-60 second proof generation. Cardano's transaction preparation is seconds, not tens of seconds.

**You need production reliability today.** Midnight is pre-mainnet. SDK versions break between releases. If your launch timeline is this quarter, build on Cardano's mature ecosystem. Prototype on Midnight for next year.

## When You MUST Use Midnight

Equally clear:

- **Regulatory compliance (GDPR, HIPAA)** — proving compliance without exposing protected data
- **Identity verification without disclosure** — age gates, qualification checks, KYC without KYC data on-chain
- **Competitive intelligence protection** — team capabilities, financial positions, strategic holdings
- **Anti-coercion systems** — voting, whistleblowing, any case where the person's safety depends on their action being unlinkable

---

## The Complementarity Principle

The most important insight from this course is not "Midnight is better" or "Cardano is better." It's that they're complementary.

Midnight's narrative: "For blockchain to work at scale, some data must be private." True.

The other side: **some data is more valuable when it's public.** A credential backed by publicly verifiable evidence is worth more than a ZK proof of an unverifiable assertion. A transparent governance record builds more trust than a private one.

Privacy where it protects. Publicity where it proves. The engineering challenge is drawing the line correctly for each application.

---

## Questions to Consider

- Take the last application you built or designed on Cardano. Which parts would benefit from Midnight's privacy, and which would lose value if made private?
- The dual-chain pattern requires cross-chain communication, which is currently one-way (Midnight reads Cardano). How does this constraint shape which chain is the "primary" for a given application? Would the architecture change if bidirectional communication existed?
- Midnight's sponsored transactions solve onboarding friction that's real on Cardano. But they introduce a new dependency — the batcher. What happens if the batcher goes down? How does this compare to Cardano's model where users are self-sovereign (they pay their own fees)?

---

## What's Next

Lesson 106.1 (before this one in the module) designs a specific dual-chain architecture. Lesson 106.3 (after this one) honestly maps what works today, what's on the roadmap, and what's unsolved. This lesson — the evaluation framework — is the tool you'll use for every architecture decision going forward.

---

## Conversation Starters

Pick a use case from your experience — something you've built, want to build, or have seen others struggle with. Apply the five-question framework:

1. **Trust model:** Does the user need to trust the math, the evidence, or both?
2. **Observer knowledge:** For each piece of data, should observers see it?
3. **Latency budget:** Can the interaction tolerate proof generation time?
4. **Token model:** Do you need datum-carrying tokens, shielded balances, or both?
5. **Maturity requirement:** Does this need to be production-ready now?

Write your recommendation: Cardano, Midnight, or Both (and if both, what goes where and in what order). Be specific about what you'd deploy on each chain and why.

The goal isn't to get the "right" answer. It's to develop the instinct for asking the right questions — and to recognize that the answer is almost always "it depends on what you're optimizing for."
