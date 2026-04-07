# Module 103 Assignment — Compact for Cardano Developers

## Part 1: Evidence

### SLT 103.1 — Write a Compact contract using disclose()

**Evidence required:**
- A Compact code snippet (or full contract) that uses `disclose()` to selectively reveal data
- An explanation of what crosses the public/private boundary and why you chose that boundary

**Strong answer:** Shows a working Compact contract where private inputs are processed inside the circuit and only specific results are disclosed via `disclose()`. The explanation demonstrates intentional boundary design — not "I disclosed everything" but "I disclosed X because the verifier needs it, and kept Y private because it's the user's sensitive data."

### SLT 103.2 — Privacy annotations vs client-side/server-side

**Evidence required:**
- A written comparison (3-5 sentences) mapping Compact's privacy annotations to the web development mental model of client-side vs server-side
- Identification of where the analogy breaks down

**Strong answer:** Maps private state to server-side data (never sent to the client/public), public state to client-side data (visible to everyone), and `disclose()` to an API response (controlled exposure). The breakdown point is important: in web dev, the server is trusted; in Compact, there's no trusted server — the ZK proof replaces trust with math.

### SLT 103.3 — Implement a TypeScript witness function

**Evidence required:**
- A TypeScript witness function implementation that provides private data to a Compact circuit
- An explanation of the witness function's role in the proof generation flow

**Strong answer:** Shows a witness function that supplies private inputs (credentials, balances, votes, etc.) to the Compact circuit at proof-generation time. The explanation connects the dots: the witness runs locally, feeds private data into the circuit, the circuit produces a proof, and the proof goes on-chain — the private data never leaves the user's machine.

## Part 2: Feedback

How was Module 103? What was clear, what was confusing, what would you change?
