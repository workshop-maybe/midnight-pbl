# Midnight Deployment Process — Gated Phase

Date: 2026-04-02
Status: Raw notes — affects both PBL content and Andamio Midnight strategy
Source: https://docs.midnight.network/blog/how-to-apply-for-deployment-auth (2026-03-30)

## Current State

Midnight mainnet deployment is **gated**. You can't just deploy. You must:

1. Self-assess your DApp against a risk rubric
2. Submit a PR to the Midnight Improvement Proposals repo
3. Get reviewed and approved by the Midnight Foundation
4. Receive deployment credentials

This is "during this phase" — implies it opens up later.

## The Risk Rubric — Three Dimensions

| Category | Question | Scoring |
|---|---|---|
| Privacy-at-risk | If a ZK fault surfaces, what does a user lose? | 1-3 |
| Value-at-risk | If there's an exploit, how much can users lose? Is it recoverable? | 1-3 |
| State-space-at-risk | How much permanent ledger state? Can growth be attacked? | 1-3 |

- Score of 3 in any category = don't deploy, rethink architecture
- Score of 1-2 across all = ready to submit
- Scores reflect what's at stake, not likelihood

## Andamio Credential Use Case — Likely Assessment

If Andamio builds credential verification on Midnight:

| Category | Likely Score | Rationale |
|---|---|---|
| Privacy-at-risk | 1-2 | Credential metadata, not financial data. If ZK faults, someone might learn who holds a credential — not ideal but not catastrophic |
| Value-at-risk | 1 | No significant funds at stake in credential issuance/verification. Not DeFi. |
| State-space-at-risk | 1-2 | Bounded by number of credentials issued. Not unbounded growth. |

**This is a deployable application under the rubric.** Credential use cases are lower risk than DeFi, which works in Andamio's favor for early Midnight deployment.

## PBL Content Opportunities

### Lesson: Score Your App Against the Rubric
Have learners take a sample DApp (or their own project) and self-assess against all three dimensions. Practical exercise that teaches:
- How to think about risk in privacy systems
- The difference between "what's at stake" vs "how likely"
- When to rethink architecture vs proceed

### Lesson: The Deployment PR Process
Walk through the actual PR submission workflow:
- Fork the MIP repo
- Write the deployment proposal
- Include self-assessment with rationale
- Submit for review

This is real-world developer workflow, not theoretical. Good PBL material.

### Conversation Prompt
"On Cardano, you deploy a validator and it's live — no gatekeeping. On Midnight, you need approval. What are the tradeoffs of each approach? When is gatekeeping appropriate?"

## Strategic Note

The gated deployment model means Andamio can't just build and ship on Midnight mainnet. There's a relationship to build with the Midnight Foundation / DevRel team. The PBL course itself could be a way to establish that relationship — building educational content for the ecosystem demonstrates good faith and technical depth.

Lauren Lee (Director of Developer Relations) is the named contact. Discord #dev-chat and the developer forum are the channels.
