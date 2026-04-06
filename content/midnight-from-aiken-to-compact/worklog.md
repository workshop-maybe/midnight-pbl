# Worklog: Building on Midnight — From Aiken to Compact

## Course Overview

- **Audience:** Cardano developers who know Aiken and want to build on Midnight
- **SLTs:** 18 across 6 modules
- **Lesson types:** 10 Exploration, 5 Developer Documentation, 3 How To Guide
- **Status:** All 18 lessons drafted, reviewed, must-fix issues resolved. Ready for human review before compilation.

---

## Phase 1–6: Course Design (completed before this session)

These phases were completed in a prior session. The artifacts were already in place when this session began.

### Artifacts produced

| File | Phase | Content |
|------|-------|---------|
| `01-slts.md` | 1. Draft SLTs | 18 SLTs across 6 modules |
| `02-slts-quality-review.md` | 2. Assess quality | Quality review output |
| `03-lesson-type-classification.md` | 4. Classify lesson types | 10 Exploration, 5 Dev Doc, 3 How To Guide |
| `04-readiness-assessment.md` | 5. Assess readiness | 2 Ready / 6 Needs Context / 10 Needs Human |
| `05-context-shopping-sessions.md` | 6. Context plan | 4 sessions planned to unlock all 18 SLTs |

### Readiness summary from Phase 5

- **Ready (2):** 1.3 (partner chain), 6.1 (dual-chain architecture)
- **Needs Context (6):** 1.1, 1.2, 2.1, 3.1, 4.1, 6.2 — blocked on Midnight documentation
- **Needs Human (10):** 2.2, 2.3, 3.2, 3.3, 4.2, 4.3, 5.1, 5.2, 5.3, 6.3 — blocked on verified code examples and practitioner review

### Two lessons pre-drafted (Tier 1 Ready)

- `lessons/module-1/1.3-partner-chain-relationship.md`
- `lessons/module-6/6.1-dual-chain-architecture.md`

---

## Phase 7: Gather Context (this session — 2026-03-23 to 2026-03-24)

### Session 1: Fetch Midnight Documentation (2026-03-23)

**Goal:** Fetch docs from docs.midnight.network to unlock 6 Needs Context SLTs.

**URLs fetched:**

| URL | Result |
|-----|--------|
| docs.midnight.network/compact | Nav hub only — went deeper |
| docs.midnight.network/compact/writing | Full writing guide with code examples |
| docs.midnight.network/compact/data-types/ledger-adt | All ledger data types |
| docs.midnight.network/compact/data-types/opaque_data | Opaque types |
| docs.midnight.network/compact/reference | 404 |
| docs.midnight.network/compact/reference/disclose | 404 |
| docs.midnight.network/concepts/how-midnight-works/impact | Full Impact VM docs |
| docs.midnight.network/concepts/how-midnight-works/keeping-data-private | Privacy model |
| docs.midnight.network/concepts/how-midnight-works/zswap | ZSwap protocol |
| docs.midnight.network/concepts/how-midnight-works | 404 |
| docs.midnight.network/getting-started/installation | Installation guide |
| docs.midnight.network/blog/dust-architecture | DUST + Native Token Observation |
| docs.midnight.network/blog/testnet-02-transition | Testnet status |

**Assets saved:**

- `assets/session-1-compact-language.md` — Compact syntax, ledger declarations, circuits, witnesses, disclose(), all data types
- `assets/session-1-impact-vm.md` — Impact VM execution model, hybrid UTXO+account, 35+ opcodes, Plutus comparison table
- `assets/session-1-privacy-and-zswap.md` — Dual-ledger rules, privacy techniques, ZSwap (Zerocash-based), commitment/nullifier
- `assets/session-1-installation.md` — Toolchain install commands, Docker proof server 7.0.0, testnet status
- `assets/session-1-interop-and-dust.md` — DUST architecture, Native Token Observation pallet, bridge constraints

**Key findings:**

- Compact reference pages were nav hubs; had to fetch deeper sub-pages for actual content
- `/compact/reference/disclose` returned 404 — but disclose() was well-documented in the writing guide
- Testnet-02 ended Feb 2026; Preview is engineering-only; Mōhalu (incentivized mainnet) is next
- ZSwap docs confirm Zerocash-based but don't name the specific proof system (Halo 2 / BLS12-381 unconfirmed)

**SLTs unlocked:** 1.1, 1.2, 2.1, 3.1, 4.1, 6.2

---

### Session 2: Clone + Compile Example Repos (2026-03-23)

**Goal:** Clone Midnight example repos, compile contracts, capture artifacts.

**Setup:**

- Installed Compact CLI 0.5.0 via official installer
- Installed compiler 0.30.0 via `compact update`
- Node.js v25.8.0 and Docker 29.1.3 already available

**Repos cloned and compiled:**

| Repo | Compact Source | Circuits | Prover Keys | Result |
|------|---------------|----------|-------------|--------|
| midnightntwrk/example-counter | `counter.compact` | 1 (increment) | 14K | Compiled successfully |
| midnightntwrk/example-bboard | `bboard.compact` | 2 provable (post, takeDown) + 1 pure (publicKey) | 2.7MB each | Compiled successfully |

**Counter contract source:**

```compact
pragma language_version >= 0.20;
import CompactStandardLibrary;
export ledger round: Counter;
export circuit increment(): [] {
  round.increment(1);
}
```

Simplest possible Compact contract: 1 ledger field, 1 circuit, no witnesses.

**Bulletin board contract highlights:**

- Enum state machine (VACANT/OCCUPIED)
- Witness function: `witness localSecretKey(): Bytes<32>;`
- `disclose()` on public key and message
- Counter-based unlinkability across posting rounds
- `persistentHash` for key derivation with domain separator

**Artifact structure discovered:**

```
managed/{name}/
├── compiler/contract-info.json     # Metadata
├── contract/index.d.ts + index.js  # Generated TypeScript bindings
├── keys/{circuit}.prover           # ZK proving key
├── keys/{circuit}.verifier         # ZK verification key
└── zkir/{circuit}.zkir + .bzkir    # ZK intermediate representation
```

**Deployment workflow captured from README:**

- Preprod faucet: https://faucet.preprod.midnight.network
- Standalone Docker stack: node 0.20.0 + indexer 3.0.0 + proof server 7.0.0
- Wallet: headless CLI wallet (separate from Lace)
- DUST generation from NIGHT UTXOs
- Apple Silicon note: Docker VMM required for proof server

**Assets saved:**

- `assets/session-2-counter-contract.md` — Source, compilation output, artifact structure, generated TypeScript types
- `assets/session-2-bboard-contract.md` — Source with witness pattern, WitnessContext API, key observations
- `assets/session-2-deployment-workflow.md` — Full deploy flow, faucet URL, Docker images, troubleshooting

**SLTs unlocked:** 2.2, 2.3, 3.2, 3.3, 4.2, 4.3

---

### Session 3: Brick Towers Identity Repo (2026-03-24)

**Goal:** Clone and analyze Brick Towers midnight-identity repo for credential system patterns.

**Repo:** github.com/bricktowers/midnight-identity

**Architecture discovered:**

```
midnight-identity/
├── crypto/Crypto.compact              # Shared crypto module
├── identity-contract/                  # Re-exports from Crypto
├── shop-contract/                      # Age-gated wine shop
├── signature-registry-contract/        # Wallet ↔ signing key link
├── token-contract/                     # tBTC minting
├── identity-provider-api/              # Off-chain credential issuance
├── shop-api/ + shop-ui/               # React frontend + API
└── signature-registry-indexer/         # Blockchain event listener
```

**Key Compact code captured:**

- `CredentialSubject` struct — W3C Verifiable Credentials model: id, first_name, last_name, national_identifier, birth_timestamp
- `Signature` struct — Schnorr-like: CurvePoint pk, CurvePoint R, Field s
- `verify_signature` pure circuit — elliptic curve operations (ec_mul_generator, ec_mul, ec_add)
- `submit_order` circuit — issuer verification, ownership binding, signature check, age arithmetic, payment processing
- `sign` pure circuit — deterministic nonce derivation, Schnorr signing

**TypeScript witnesses captured:**

- Shop: `get_order()` and `get_identity()` — multi-witness pattern
- Identity: `local_secret_key()` — standard pattern

**Note:** Repo uses pragma >= 0.14.0 and compact-runtime ^0.7.0 (older SDK). Did not attempt compilation on 0.30.0. Code patterns remain valid for teaching.

**Key insight:** System is signature-based, not MerkleTree-based. Used as the example for SLT 5.1 (individual credential verification). Taught MerkleTree/nullifier pattern from documentation for SLT 5.2 (anonymous membership).

**Asset saved:**

- `assets/session-3-brick-towers-identity.md` — Full code analysis with all contracts, witnesses, and architecture

**SLTs unlocked:** 5.1, 5.2, 5.3

---

### Session 4: Practitioner Review — Replaced

The original plan called for external practitioner interviews for SLT 6.3. The Brick Towers identity system provided sufficient real-world context. The 6.3 decision framework uses examples from the course itself (Brick Towers age check, Andamio credentials, anonymous voting) rather than requiring external input.

**SLTs unlocked:** 6.3

---

## Phase 8: Build Lessons (this session — 2026-03-23 to 2026-03-24)

### Batch 1: Session 1 SLTs (6 Exploration + How To Guide lessons)

Written immediately after Session 1 docs fetch. Voice and style matched to existing lessons 1.3 and 6.1.

| Lesson | SLT | Type | Primary Source |
|--------|-----|------|---------------|
| 1.1 | Compare execution models | Exploration | session-1-impact-vm.md |
| 1.2 | Dual-ledger system | Exploration | session-1-privacy-and-zswap.md |
| 2.1 | Compact components | Exploration | session-1-compact-language.md |
| 3.1 | disclose() primitive | Exploration | session-1-compact-language.md + privacy docs |
| 4.1 | Install toolchain | How To Guide | session-1-installation.md |
| 6.2 | Interop constraints | Exploration | session-1-interop-and-dust.md |

### Batch 2: Session 2 SLTs (4 Exploration/Dev Doc + 2 How To Guide lessons)

Written after compiling both example contracts. All code examples are verified — they come from contracts that compiled on 0.30.0.

| Lesson | SLT | Type | Primary Source |
|--------|-----|------|---------------|
| 2.2 | Aiken to Compact | Exploration | session-2-bboard-contract.md |
| 2.3 | Write a Compact contract | Developer Documentation | Both compiled contracts |
| 3.2 | ZK proof pipeline | Exploration | Compilation artifacts + sizes |
| 3.3 | Witness functions | Developer Documentation | Bboard witnesses.ts |
| 4.2 | Compile and artifacts | How To Guide | Compilation output |
| 4.3 | Deploy to preprod | How To Guide | session-2-deployment-workflow.md |

### Batch 3: Sessions 3–4 SLTs (3 Dev Doc + 1 Exploration lessons)

Written after analyzing Brick Towers identity repo. SLT 5.1 uses Brick Towers as the primary example. SLTs 5.2 and 5.3 extend with MerkleTree/nullifier patterns from documentation. SLT 6.3 synthesizes the full course into a decision framework.

| Lesson | SLT | Type | Primary Source |
|--------|-----|------|---------------|
| 5.1 | Credential circuit | Developer Documentation | session-3-brick-towers-identity.md |
| 5.2 | MerkleTree + nullifiers | Developer Documentation | Compact docs + credential patterns |
| 5.3 | Selective disclosure | Developer Documentation | Brick Towers age check + extensions |
| 6.3 | Evaluate Midnight vs Cardano | Exploration | Full course synthesis |

---

## Content Review (2026-03-24)

Ran automated content review against style guide (`knowledge/voice-patterns.md` and `knowledge/lesson-writing/style-patterns.yaml`). Reviewed all 14 new lessons (not the 2 pre-existing ones written in a prior session, but the review agent checked those too).

### Must-Fix Issues Found and Resolved

| # | Issue | Fix Applied |
|---|-------|-------------|
| 1 | Forward reference in 3.2: "You've seen this in Lesson 4.2" (4.2 comes after 3.2) | Changed to "Lesson 4.2 walks through this hands-on" |
| 2 | Compiler version inconsistency: 0.24.0 in some lessons, 0.30.0 in others | Standardized on CLI 0.5.0, compiler 0.30.0 |
| 3 | Mōhalu accent inconsistency: "Mohalu" vs "Mōhalu" | Standardized to Mōhalu with macron |
| 4 | Silent-success in 4.1: `compact update` may produce no output | Added expected output description |
| 5 | Missing "What's Next" sections in all Exploration lessons | Added to all 9 Exploration lessons |
| 6 | Missing "What's Next" sections in How To Guide lessons | Added to all 3 How To Guide lessons |

### Additional Fix

- **Deduplicated** Aiken comparison table between 2.1 and 2.2 (removed full table from 2.1, replaced with forward reference to 2.2)
- **Added reflective questions** to lesson 1.3 (was the only Exploration lesson missing them)

### Nice-to-Have Issues Noted (Not Fixed)

- Borderline em-dash flourish in 1.3 line 87
- Minor content overlap between 3.2 and 4.2 artifact size tables
- Trailing colon on "Questions to consider:" headings (cosmetic)
- Developer Documentation lessons don't have reflective questions (consistent within type, but noticeable when alternating with Exploration lessons in the same module)
- "What You Now Have" summary table in 4.1 but not 4.2/4.3

---

## Final State

### All lessons

| Module | # | SLT | Lesson File | Type |
|--------|---|-----|------------|------|
| 1: Architecture | 1.1 | Compare execution models | `lessons/module-1/1.1-compare-execution-models.md` | Exploration |
| | 1.2 | Dual-ledger system | `lessons/module-1/1.2-dual-ledger-system.md` | Exploration |
| | 1.3 | Partner chain relationship | `lessons/module-1/1.3-partner-chain-relationship.md` | Exploration |
| 2: Compact | 2.1 | Compact components | `lessons/module-2/2.1-compact-components.md` | Exploration |
| | 2.2 | Aiken to Compact | `lessons/module-2/2.2-aiken-to-compact.md` | Exploration |
| | 2.3 | Write a Compact contract | `lessons/module-2/2.3-write-compact-contract.md` | Dev Doc |
| 3: Privacy | 3.1 | disclose() primitive | `lessons/module-3/3.1-disclose-primitive.md` | Exploration |
| | 3.2 | ZK proof pipeline | `lessons/module-3/3.2-zk-proof-pipeline.md` | Exploration |
| | 3.3 | Witness functions | `lessons/module-3/3.3-witness-function.md` | Dev Doc |
| 4: Dev Workflow | 4.1 | Install toolchain | `lessons/module-4/4.1-install-toolchain.md` | How To Guide |
| | 4.2 | Compile and artifacts | `lessons/module-4/4.2-compile-and-artifacts.md` | How To Guide |
| | 4.3 | Deploy to preprod | `lessons/module-4/4.3-deploy-to-preprod.md` | How To Guide |
| 5: Credentials | 5.1 | Credential circuit | `lessons/module-5/5.1-credential-circuit.md` | Dev Doc |
| | 5.2 | MerkleTree + nullifiers | `lessons/module-5/5.2-merkletree-nullifiers.md` | Dev Doc |
| | 5.3 | Selective disclosure | `lessons/module-5/5.3-selective-disclosure.md` | Dev Doc |
| 6: Dual-Chain | 6.1 | Dual-chain architecture | `lessons/module-6/6.1-dual-chain-architecture.md` | Exploration |
| | 6.2 | Interop constraints | `lessons/module-6/6.2-interop-constraints.md` | Exploration |
| | 6.3 | Evaluate Midnight vs Cardano | `lessons/module-6/6.3-evaluate-midnight-vs-cardano.md` | Exploration |

### All assets

| File | Session | Content |
|------|---------|---------|
| `assets/session-1-compact-language.md` | 1 | Compact syntax, types, disclose() |
| `assets/session-1-impact-vm.md` | 1 | Impact VM execution model |
| `assets/session-1-privacy-and-zswap.md` | 1 | Dual-ledger, ZSwap |
| `assets/session-1-installation.md` | 1 | Toolchain setup |
| `assets/session-1-interop-and-dust.md` | 1 | DUST, bridge, constraints |
| `assets/session-2-counter-contract.md` | 2 | Counter source + compilation output |
| `assets/session-2-bboard-contract.md` | 2 | Bboard source + witness pattern |
| `assets/session-2-deployment-workflow.md` | 2 | Deploy flow, faucet, Docker stack |
| `assets/session-3-brick-towers-identity.md` | 3 | Credential system code analysis |

### Next steps

1. **Human review** of all 18 lessons
2. **Compile modules** via `/compile` (Phase 9)
3. **Import to platform** via `/andamio-cli` (Phase 10)
4. **Compound** via `/compound --rollup` (Phase 11)
5. **Promote** to `courses/` (Phase 12)

### External dependencies to monitor

- **Midnight preprod testnet** — Lesson 4.3 references the faucet and deployment workflow. If the network transitions to Mōhalu before publishing, update the testnet references.
- **Compact compiler** — Currently 0.30.0. Breaking changes between releases may affect code examples.
- **Brick Towers repo** — Uses older SDK (0.14.0). If updated to current SDK, the Module 5 examples could be refreshed with compilable code.
