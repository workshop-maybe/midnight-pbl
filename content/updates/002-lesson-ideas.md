# Lesson Ideas & Course Updates

Date: 2026-04-02
Status: Raw ideas — to be refined into module outlines

## Lesson Idea: "If You've Used Terraform, You Already Understand Transcripts"

Bridge lesson for learners who know infrastructure tooling but are new to blockchain state models.

**Core analogy:**
| | Terraform plan | Kachina transcript |
|---|---|---|
| Records | "Here's what I want to change, given current state" | "Here's what I queried and what I expected back" |
| Gap between plan and apply | Infrastructure might drift | Public state might change |
| Conflict detection | Plan fails if state changed underneath | Transcript invalidated if expected state doesn't match |
| Non-conflicting changes | Can apply if your resources weren't touched | Can reorder if transactions touch different state |
| Expensive to redo | Not really | Yes — proof generation is the costly step |

**The shared pattern:** Capture intent + expected state as an artifact, then apply it later with conflict detection.

- Terraform solved "infrastructure changes are slow and stateful, you need a plan you can inspect and retry"
- Kachina solved "proof generation is slow and expensive, you need a transcript you can validate and reorder"
- Cardano UTXO transactions follow the same pattern: build against known UTXO state, sign, submit, fail-and-rebuild if UTXOs were spent

**Hands-on:** Have learners experience a transcript conflict — two concurrent transactions touching the same contract state — and see how Kachina resolves vs. rejects. Compare to running `terraform apply` after someone else changed the infrastructure.

---

## Lesson Idea: Two Meanings of "Commitment"

Conversation-driven module at the intersection of Midnight and Andamio.

**Build both:**
1. A Kachina-style cryptographic commitment — hash that locks in a value without revealing it
2. An Andamio-style contribution commitment — public declaration of intent, tracked on-chain

**Conversation prompt:** "What does 'commitment' mean in your context? When do you want to hide the contents? When do you want to show them?"

Learner arrives at: same word, opposite trust models. The design choice depends on whether trust comes from hiding or showing.

---

## Lesson Idea: The Cost of Privacy (Sequence Diagram Comparison)

Visual, hands-on module where learners implement the same action two ways.

**Side-by-side flows:**
- Midnight: User → update local state → ZK prover → generate proof → proof ready → submit proof + public data → verify → apply state changes → confirm → finalize private state (6 steps)
- Andamio/Cardano: User → do work → submit evidence + public data → validate against rules → apply state changes → done (3 steps)

**Hands-on:** Time both flows. Measure proof generation. Feel the latency. Then ask: "When is this cost justified?"

Learner arrives at: ZKPs are powerful but expensive. Use them when privacy matters. When the action is documentation, education, open-source contribution — public evidence is simpler and the visibility is the point.

---

## Lesson Idea: What Can a Datum Do That an Account Balance Can't?

EUTXO deep dive that goes beyond the Academy's "different thinking" framing.

**The Academy says:** Cardano's EUTXO adds data fields to outputs for smart contract interaction. Developers from Ethereum find it unfamiliar.

**What to actually teach:** A UTXO with a datum is value + structured data + spending rules in one object. This is what makes verifiable credentials possible — the datum IS the credential. It travels with the value. The spending conditions are deterministic.

**Hands-on:** Build a datum-rich UTXO that carries credential data. Inspect it. Compare to an ERC-20 balance (just a number in a mapping). Ask: "Which one tells you what the holder actually did?"

---

## Lesson Idea: Where Should Data Live?

The architectural question that runs through the whole course.

**Framework:**
| Data type | Where it lives | Why |
|---|---|---|
| Private drafts, notes, local knowledge | Your machine | Never needs to leave |
| Task and commitment references | On-chain as hashes | Verifiable without exposing content |
| Contribution evidence | On-chain, public | Visibility is the value |
| Facts about credentials | Midnight (when needed) | Prove without revealing |
| Aggregate stats over private records | Midnight (when needed) | Compute without exposing individuals |

**Key insight:** Both Andamio and Midnight have private local state and public on-chain state. The difference is how they bridge the two — human judgment (choose what to share) vs. cryptographic proof (prove without sharing).

**Conversation prompt:** "You just built something where private data never left your machine. When would you *want* it to leave?"

---

## Lesson Idea: Andamio Already Has a Private Layer

Counter-intuition module. Learners assume Andamio = fully public.

**The reality:**
- Task hashes — content lives anywhere (private repo, local machine). Only the hash goes on-chain.
- Commitment hashes — same pattern. On-chain reference, not full data.
- Evidence — contributor chooses what to submit publicly.
- Local markdown, drafts, notes — never leave your machine.

Andamio is already doing selective disclosure at the data layer. What Midnight adds is the ability to compute on private data and prove results without revealing it.

**Conversation prompt:** "What's the difference between choosing not to share data and proving you have data without sharing it?"

---

## Lesson Idea: Client-Side / Server-Side as a Mental Model for Private / Public State

Bridge lesson for web developers. The privacy model isn't new — they already make this decision every day.

**The analogy:**
| | Web app | Compact (Midnight) | Andamio on Cardano |
|---|---|---|---|
| Private state | Client-side JS variables | `private` annotation → local machine | Local files, app state, hashed references |
| Public state | Server/database | `public` annotation → blockchain | Datum on UTXO |
| Bridge | HTTP request (dev chooses what to send) | ZK proof (compiler generates automatically) | Transaction (dev chooses what to include) |
| Who decides what's public | The developer | The developer | The developer |

**Key insight:** In all three models, the developer decides what crosses the boundary. Compact automates cryptographic enforcement. Andamio lets you make the same choice with simpler tooling when you don't need the cryptographic guarantee.

**Compact's approach:** Write TypeScript with privacy annotations. Compiler generates ZK circuits. Developer doesn't think in terms of circuits and constraints — just "this is private, this is public." Significant DX improvement over raw ZK development.

**Hands-on:** Build the same feature three ways:
1. Web app with client-side state that gets selectively POSTed to a server
2. Compact contract with private/public annotations
3. Andamio transaction that puts chosen evidence in a datum

Same developer decision, three levels of enforcement. When do you need each?

**Conversation prompt:** "You already decide what to send to the server in every web app you build. When is that decision enough, and when do you need cryptographic proof that you made it correctly?"

---

## Module Sequence Thinking (not finalized)

The lessons above could thread through the course as conversations that build on each other:

1. Learn Midnight concepts (the Academy covers this well — don't replicate, build on)
2. Build with Midnight (hands-on: Compact contracts, dual state, proofs)
3. Experience the tradeoffs (cost of privacy, transcript conflicts, proof generation time)
4. Surface the questions (when is privacy the wrong default? what should be public?)
5. Build the complementary case (datum-rich credentials, public evidence, hashed references)
6. Arrive at the synthesis (when Midnight, when Cardano, when both together)

The course doesn't argue. It builds. The learner arrives at the question.
