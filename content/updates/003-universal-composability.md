# Universal Composability — Developer Framing

Date: 2026-04-02
Status: Raw notes — source material for course content
Source: Ran Canetti, "Universally Composable Security: A New Paradigm for Cryptographic Protocols" (2000/2020)

## Key Lesson Idea: Ideal Functionalities Are Types

**This is the hook for developers.** If UC is to protocol security what type systems are to program correctness, then ideal functionalities are the type signatures.

- You write a type → the compiler guarantees properties hold through composition
- You write an ideal functionality → UC guarantees security holds through composition
- You don't re-verify the whole system every time you add a module — the composition theorem does it for you

Developers already think this way. They write interfaces before implementations. They trust that if each module satisfies its interface, the system works. UC is the same pattern applied to cryptographic security. The ideal functionality IS the interface. The real protocol IS the implementation. UC-emulation IS the proof that the implementation satisfies the interface.

**Hands-on bridge:** Have learners write an ideal functionality as a spec (in pseudocode or TypeScript interface), then show them the Compact contract that realizes it. The parallel to interface/implementation should click immediately.

## The Andamio Connection

Cardano's Plutus validators are informal ideal functionalities. Same architectural pattern:

| | UC ideal functionality | Plutus validator | Compact contract |
|---|---|---|---|
| What it defines | "What should happen with a perfect trusted party" | "What must be true for this transaction to be valid" | "What should happen with privacy preserved" |
| State | Maintained by the ideal functionality | Carried in the datum | Split between public (on-chain) and private (local) |
| Enforcement | Mathematical proof of indistinguishability | Deterministic on-chain execution | ZK proof verified on-chain |
| Composition guarantee | UC theorem (formal) | EUTXO determinism (architectural) | UC theorem (formal) |
| What it guarantees | Security survives composition | Correctness survives composition | Privacy survives composition |

The key distinction: **Cardano validators enforce correctness** (did you follow the rules?). **Midnight's UC-secure protocols enforce privacy** (did you follow the rules *without revealing your inputs*?).

Both are "define the ideal, enforce it deterministically." The difference is what you're protecting — rule compliance vs. data exposure.

**PBL conversation prompt:** "You've already written validators that specify what must be true. An ideal functionality does the same thing for security. What would your validator look like if it also had to guarantee that the inputs stay hidden?"

## Source Material: 10 Things Devs Should Know About UC

### 1. UC is "security by specification"
Write an ideal functionality — what would happen if a perfect, incorruptible trusted party ran everything. Then prove your real protocol is indistinguishable from that ideal. Developers already do a version of this: write the interface, then implement it. UC is that pattern applied to security guarantees.

### 2. The composition theorem is the whole point
A protocol proven secure in isolation can break when combined with other protocols running concurrently. UC guarantees it won't. This is why Midnight chose this framework — smart contracts must compose, and UC is the only framework that guarantees security survives composition.

### 3. Think of ideal functionalities as types
(See key lesson idea above — this is the strongest developer hook.)

### 4. The "environment" is the real world
UC doesn't just model a single attacker. It models an environment — everything outside your protocol, including other protocols, other adversaries, other users — all actively trying to break you. This is realistic for blockchain where your contract lives alongside thousands of others.

### 5. Subroutine substitution = modular security
If protocol A uses ideal functionality F as a subroutine, and protocol B UC-realizes F, you can swap B in for F and the whole system stays secure. Like dependency injection but for cryptographic guarantees. Build each piece, prove each piece, compose with confidence.

### 6. "Reactive functionalities" are smart contracts
Canetti's original work was about one-shot secure computation. The extension to reactive ideal functionalities — ongoing stateful interaction where new inputs depend on previous outputs — is exactly what smart contracts are. UC was ready for blockchain before blockchain existed.

### 7. The trusted party is what blockchain replaces
In UC, you imagine a perfect trusted party that does everything correctly. Blockchain's insight: replace that trusted party with a decentralized protocol and prove they're equivalent. UC gives you the formal framework to make that claim rigorous.

### 8. This is why Midnight's privacy claims are "real"
Anyone can say "our protocol is private." UC-security means: we defined exactly what privacy means (the ideal functionality), and we proved that no environment — no matter how powerful — can distinguish our real protocol from the ideal one. That's a falsifiable, mathematical claim, not marketing.

### 9. Concurrency is where other security models break
Canetti shows that protocols secure under older definitions can fail when just two sessions run concurrently. Blockchain is thousands of concurrent sessions. Without UC, you're hoping your protocol doesn't interact badly with others. With UC, you've proven it can't.

### 10. Kachina is the bridge from UC theory to Midnight practice
Kachina takes UC's composition guarantees and applies them to privacy-preserving smart contracts with dual state (public/private). The transcripts, the concurrent execution model, the proof generation — all designed to be UC-secure. When Compact compiles your contract into ZK circuits, the UC framework guarantees those circuits actually enforce your privacy annotations.
