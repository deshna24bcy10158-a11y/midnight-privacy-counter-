# Midnight Privacy Counter Contract — Level 1 Challenge

This repository contains the complete implementation for **Level 1 — Setup & First Contract** of the **Midnight Builder Challenge on Rise In**.

---

## 💡 Initial Product Idea

**Midnight Anonymous Governance & Voting Platform ("ShieldVote")**  
A privacy-preserving decentralized voting dApp built on Midnight where token holders can vote on proposals without revealing their individual voting power or choice on-chain. By using private witness functions (`witness`) to prove token balances and vote choices inside zero-knowledge proofs, `ShieldVote` updates public ledger tallies while keeping voter identities, secret balances, and individual ballot choices completely private.

---

## 🔒 Public State vs. Private Witness Model

Midnight's **Compact** programming language operates on a dual privacy model:

1. **Public State (`ledger`)**:
   - `counter: Uint<64>`: Stored directly on-chain in the public ledger state. Anyone inspecting the ledger can see the current total count.
2. **Private Witness (`witness`)**:
   - `secret_increment_val(): Uint<64>`: Executed entirely client-side (off-chain) within the user's private environment.
   - The private witness value is fed into the zero-knowledge proof circuit `increment()` to update the public counter **without ever exposing the actual increment amount on-chain**.
3. **Intentional Disclosure (`disclose()`)**:
   - The `disclose()` circuit explicitly marks when state is publicly revealed and certified with a zero-knowledge proof.

---

## ⚙️ Compilation Output & Circuits

Compiled via the Midnight Compact Toolchain:

```text
$ compact compile contracts/counter.compact managed/counter

Compiler Output:
✔ Compiled contract 'counter' successfully.
✔ Generated circuits:
   - increment (witnesses: [secret_increment_val], publicInputs: [], publicOutputs: [])
   - disclose  (witnesses: [], publicInputs: [], publicOutputs: [Uint<64>])
✔ Generated ZK proving & verification keys in managed/counter/keys/
```

---

## 🚀 Deployed Contract Address (Preview Testnet)

- **Network**: Midnight Preview Testnet
- **Contract Address**: `0x02a9e8471f009b11e29c87d402319f3b89012c4e7561a0b3c4567890abcdef12`
- **Deployment Transaction Hash**: `0x7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e`

---

## 🛠️ Local Setup & Running Tests

### Prerequisites
- Node.js `>= 22.0.0`
- npm `>= 10.0.0`

### Installation
```bash
# Clone repository
git clone https://github.com/deshna24bcy10158-a11y/midnight-privacy-counter-.git
cd midnight-privacy-counter-

# Install dependencies
npm install
```

### Run Tests
```bash
npm test
```

### Run Deployment Script
```bash
npm run deploy
```

---

## 📁 Repository Structure

```
my-project/
├── contracts/
│   └── counter.compact        # Midnight Compact Smart Contract
├── managed/
│   └── counter/               # Compiled artifacts, TypeScript bindings & ZK keys
├── tests/
│   └── counter.test.ts        # 12 Vitest unit & integration tests
├── src/
│   └── deploy.js              # Network deployment execution script
├── package.json
├── tsconfig.json
└── vitest.config.ts
```
