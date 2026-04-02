# Certificate Comparison — The Irony

Date: 2026-04-02
Status: Raw notes — this is a core positioning example

## What the Midnight Academy Certificate Actually Is

URL: `academy.midnight.network/api/certificate/James-5705993.png`

- A PNG image served from an API endpoint
- Name + sequential user ID in the URL
- Co-issued by HackQuest and Midnight
- NOT on any blockchain — not Midnight, not Cardano, nothing
- "Mint (Coming Soon)" button — on-chain part doesn't exist yet
- "Submit the Quests to Zealy" — third-party gamification platform
- Assessment: multiple choice questions
- Anyone could guess other certificate URLs by changing the number

**A blockchain education platform that doesn't use blockchain for its own credentials.**

## The Contrast

| | Midnight Academy certificate | Andamio PBL credential |
|---|---|---|
| What it is | PNG image from an API | On-chain token with datum |
| Verification | Trust the URL exists | Inspect the on-chain evidence |
| What it proves | You answered quiz questions | You built something |
| Where it lives | HackQuest's database | Cardano blockchain |
| Can it be faked? | Change the name in the URL | Would require forging on-chain transactions |
| Minting | "Coming Soon" | Already working |
| Assessment method | Multiple choice | Evidence of real work |
| Certificate ID | Sequential database number | Policy ID + on-chain hash |

## Why This Matters for the PBL

The Midnight PBL should issue actual on-chain credentials for course completion. The learner finishes a course about blockchain and receives a credential that IS on blockchain. The contrast with the Academy's PNG certificate is self-evident — we don't need to argue it.

**Don't mock the Academy.** Just let the difference be visible. The learner who completes both courses will notice on their own:
- Academy gave them an image URL
- PBL gave them a verifiable on-chain credential backed by evidence of what they built

## Conversation Prompt (Late in the Course)

"You now hold two credentials for learning about Midnight. One is a PNG served from an API. One is an on-chain token with a datum recording what you built. Which one would you show to an employer? Why?"

## The Deeper Point

This isn't about dunking on the Academy. It's about demonstrating that the credential model matters. If even Midnight's own education platform defaults to Web2 certificates, it shows how hard this problem is — and why Andamio's approach of building credentials on-chain from the start is a genuine differentiator.

The "Mint (Coming Soon)" button is telling. They know it should be on-chain. They just haven't built it. Andamio has.
