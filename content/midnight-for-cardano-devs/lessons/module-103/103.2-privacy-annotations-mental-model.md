# Lesson 103.2: Privacy Annotations and the Client/Server Mental Model

**SLT:** I can compare Compact's privacy annotations to the client-side/server-side mental model.

**Type:** Exploration

---

## You Already Make This Decision

Every time you build a web application, you decide what runs client-side and what runs server-side. Form validation in the browser vs on the server. Session tokens in memory vs in a cookie. API keys in environment variables, never in the bundle.

You don't think of this as "privacy engineering." It's just architecture. Some data stays on the user's machine. Some data goes to the server. The boundary matters, and you're already good at drawing it.

Compact makes the same architectural decision — but enforces it with mathematics instead of convention.

---

## Three Columns

| Decision | Web App | Compact (Midnight) | Cardano |
|----------|---------|--------------------|---------| 
| **Where does private data live?** | Client (browser, local storage) | Witness (user's machine, LevelDB) | Nowhere private — all data on-chain is public |
| **Where does public data live?** | Server (database, API response) | Ledger fields (on-chain, globally readable) | Datum on UTXO (on-chain, globally readable) |
| **What controls the boundary?** | Developer discipline + server-side validation | `disclose()` + ZK proofs | Nothing — there is no boundary |
| **What happens if boundary is violated?** | Data leak (private key in client bundle) | Compilation error or logic bug (but proof still valid) | N/A — everything is already exposed |
| **Who enforces it?** | Nobody automatically — you follow best practices | The compiler + ZK proof system | N/A |

The critical row is "who enforces it." In web development, nothing stops you from shipping an API key in your JavaScript bundle. In Compact, the ZK proof system guarantees that witness data never appears on-chain. It's not discipline — it's cryptographic enforcement.

---

## disclose() Is the Boundary

In a web app, the boundary between client and server is the HTTP request. Data crosses when you send it.

In Compact, the boundary is `disclose()`. Data crosses from private to public when you explicitly disclose it. Everything else stays behind the ZK proof.

### Hello World: Everything Disclosed

```
export circuit storeMessage(message: Opaque<'string'>): Opaque<'string'> {
  customMessage = disclose(message);
  return customMessage;
}
```

The message enters as a circuit parameter. `disclose(message)` puts it on the public ledger. Anyone with the contract address can read it — no wallet, no SDK, just a GraphQL query to the indexer:

```
curl -s -X POST https://indexer.preprod.midnight.network/api/v3/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ contractAction(address: \"CONTRACT_ADDR\") { state } }"}'
```

This is equivalent to a web app that logs every user input to a public database. There's nothing wrong with it — if that's what you intended. The point is that `disclose()` makes the decision explicit.

### Bulletin Board: Selective Disclosure

```
witness localSecretKey(): Bytes<32>;

export circuit post(content: Opaque<'string'>): [] {
  const sk = localSecretKey();
  const pk = publicKey(round, sk);
  messages.insert(disclose(pk), content);
  round.increment(1);
}
```

The secret key comes from a witness — it's on the user's machine, stored in LevelDB, never on-chain. The circuit derives a public key from it and discloses only the public key. The content is inserted into the map but not wrapped in `disclose()` — its visibility depends on the ledger field's declaration.

The secret key is like a password that never leaves the browser. The public key is like a username that's visible to everyone. The difference from a web app: on Midnight, the proof system mathematically guarantees the password stayed private. In a web app, you just have to trust that nobody put it in the response body.

---

## The Mental Model in Three Modes

### Mode 1: Web App (What You Know)

```
// Client-side (private)
const password = document.getElementById('password').value;
const hash = sha256(password);

// HTTP boundary — data crosses here
fetch('/api/login', { body: JSON.stringify({ hash }) });

// Server-side (public to the backend)
app.post('/api/login', (req, res) => {
  const { hash } = req.body;
  // password never reached the server — only the hash
});
```

The boundary: `fetch()`. What crosses: the hash. What stays: the password.
Enforcement: none. The developer could accidentally send the password instead of the hash.

### Mode 2: Compact (What You're Learning)

```
witness secretKey(): Bytes<32>;

export circuit register(): [] {
  const sk = secretKey();
  const pk = publicKey(round, sk);
  authority = disclose(pk);
}
```

The boundary: `disclose()`. What crosses: the public key. What stays: the secret key.
Enforcement: ZK proof. The compiler guarantees `sk` never appears in the public transcript. Mathematically impossible to extract from the proof.

### Mode 3: Cardano (What You're Comparing Against)

```
-- Aiken validator
fn validate(datum: Datum, redeemer: Redeemer, ctx: ScriptContext) -> Bool {
  // datum is public — it's on the UTXO
  // redeemer is public — it's in the transaction
  // everything the validator sees is on-chain
  ...
}
```

The boundary: there is none. Datum and redeemer are both on-chain. If you need to hide something, you hash it before putting it in the datum — but the Plutus VM doesn't enforce this. You enforce it yourself in your off-chain code.

---

## When Is the Web Model Enough?

The client/server boundary works when you trust the server. Your web app's backend sees the password hash but follows the rules — stores it safely, doesn't log it, doesn't send it to third parties. You trust the operator.

This model breaks when:
- **The server is a blockchain.** Everyone can see on-chain data. There's no trusted backend.
- **The computation needs to be verified.** A web server says "I computed the result correctly" — you trust it. A ZK proof says "this computation was correct" — you verify it, no trust needed.
- **The privacy guarantee needs to survive adversaries.** In a web app, a compromised server leaks everything. On Midnight, a compromised node learns nothing about private inputs — the proof reveals only what was disclosed.

If your application runs on a single server you control, client/server privacy is enough. If your application runs on a public blockchain where anyone can observe every transaction, you need cryptographic enforcement. That's the gap Midnight fills.

---

## The Disclose Spectrum

Most applications aren't "everything private" or "everything public." They're somewhere in between. `disclose()` lets you place each piece of data exactly where it belongs:

| Pattern | What's Disclosed | What's Private | Use Case |
|---------|-----------------|---------------|----------|
| **Full disclosure** | Everything | Nothing | Public registries, transparent governance |
| **Identity disclosure** | Public key / hash | Secret key | Pseudonymous authorship, account ownership |
| **Result disclosure** | Pass/fail, tally, aggregate | Individual inputs | Voting, testing, scoring |
| **Existence disclosure** | Merkle root / commitment | Individual entries | Membership proofs, credential sets |
| **Nothing disclosed** | Proof of valid execution only | All inputs and state | Fully private computation |

Hello world is at the top (full disclosure). Bulletin board is at "identity disclosure" — the author's public key is known, but their secret key is private. Module 104 will build applications further down this spectrum.

---

## Questions to Consider

- In a web app, you can change what the server stores without changing the client. On Midnight, changing what's disclosed means changing the Compact contract and redeploying. How does this rigidity affect your design process? Do you default to disclosing more or less?
- The hello world contract discloses everything. An observer watching the indexer sees every message stored, by whom, and when. Is this actually a problem? When would you deploy a contract that discloses everything on a privacy chain — and why would you choose Midnight over Cardano for it?
- Web developers sometimes accidentally expose private data (API keys in client bundles, secrets in error messages). Compact's `disclose()` makes the boundary explicit, but doesn't prevent logical errors — you could `disclose()` the secret key itself. How does explicit-but-not-foolproof compare to the web model of implicit-and-easily-violated?

---

## What's Next

Lesson 103.1 (Developer Documentation) will have you write a Compact contract that uses `disclose()` to control the privacy boundary. Lesson 103.3 will implement the TypeScript witness function that provides private data to a circuit. This lesson — the mental model — is the foundation both build on.

---

## Conversation Starters

Take a feature from a web app you've built or used. Identify:

1. What data is client-side (private to the user)
2. What data is server-side (visible to the backend)
3. Where the boundary is (the HTTP call, the form submission, the WebSocket message)

Now redesign it for Midnight:

1. What would you put in witness functions (private)?
2. What would you `disclose()` to the public ledger?
3. What changes about the trust model when "the server" is a public blockchain?

The goal isn't to make every web feature private. It's to develop the instinct for where the boundary should be — and to see that you already have that instinct from years of building client/server applications.
