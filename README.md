# 🛡️ ChainGuardian

### *AI-Augmented Transaction Security Engine for EVM Wallets*

	⁠Intercepts. Analyzes. Blocks. Before the network ever sees it.

![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=flat-square)
![Network](https://img.shields.io/badge/Network-Sepolia%20Testnet-blue?style=flat-square)
![Wallets](https://img.shields.io/badge/Wallets-MetaMask%20%7C%20Rabby%20%7C%20OKX%20%7C%20Coinbase-purple?style=flat-square)
![Checks](https://img.shields.io/badge/Security%20Checks-8%20Parallel-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)

---

## The Problem

DeFi users lose millions daily to rug pulls, unlimited approvals, and malicious contracts. WazirX lost ₹2,000 crore. Bybit lost $1.5B. In both cases, the signers had no idea what they were actually approving.

ChainGuardian inserts a *security middleware layer* between Step 1 (client-side request) and Step 2 (network broadcast) — the only point where a transaction can still be stopped.


Standard:  [APPROVE click] ──────────────────────▶️ [Wallet Signs] ──▶️ [Broadcast]

Secure:    [APPROVE click] ──▶️ [ChainGuardian] ──▶️ [8-Check Engine]
                                                           │
                                                  Risk < 70        Risk ≥ 70
                                                     │                  │
                                               [Allow TX]     [🚨 BLOCK popup]


It hooks ⁠ window.ethereum.request ⁠ at the MAIN world level (MV3), catching ⁠ eth_sendTransaction ⁠ and ⁠ eth_signTypedData_v4 ⁠ across all wallet providers simultaneously.

---

## The 8-Check Parallel Engine

All checks run in parallel. Total analysis time: *under 3 seconds.*

| # | Check | Source | Detects | Weight |
|---|-------|--------|---------|--------|
| 1 | Whale Concentration | Moralis | Top holder >50% of supply | +25 pts |
| 2 | TVL / Activity | Dune Analytics | Liquidity drain, ghost protocols | +20 pts |
| 3 | Slither Static Analysis | IEEE-verified subprocess | Reentrancy, DELEGATECALL abuse, tx.origin bypass | +10–30 pts |
| 4 | Unlimited Approval | Raw calldata | ⁠ uint256.max ⁠ — the 64-⁠ f ⁠ drainer pattern | +20 pts |
| 5 | Contract Verification | Etherscan API | Unverified source = hidden code | +15 pts |
| 6 | Transaction Simulation | Alchemy ⁠ simulateAssetChanges ⁠ | Actual token balance delta before broadcast | +25 pts |
| 7 | Social / Domain Heuristics | GoPlus + DexScreener | Phishing domains, pump signals, Inferno/Pink Drainer infra | +15 pts |
| 8 | Opcode Analysis | ⁠ eth_getCode ⁠ scan | Malicious DELEGATECALL chains in bytecode | +15 pts |

*GoPlus Fraud DB* (no API key required) adds honeypot detection, theft address flagging, and sanctioned address checks on top of the 8 checks.

### How the unlimited approval check works

⁠ uint256.max ⁠ is 64 consecutive ⁠ f ⁠ characters in hex. Every drainer kit uses it. ChainGuardian catches it at zero API cost:

⁠ javascript
const isUnlimitedApproval = tx.data.toLowerCase().includes('f'.repeat(64));
// ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
 ⁠

Unlimited approval + unverified contract = score floored to 50 minimum, because this combination is the drainer signature.

### How the simulation sandbox defeats blind signing

The WazirX and Bybit attacks worked because signers trusted the UI. ChainGuardian ignores the UI entirely — it reads raw transaction bytes directly from the wallet provider and simulates the exact EVM state change:

⁠ javascript
{ method: 'alchemy_simulateAssetChanges', params: [{ from, to, data, value }] }
// Returns actual token movements — regardless of what the frontend shows
 ⁠

---

## Threat Coverage

| Threat | Method | Defense |
|--------|--------|---------|
| WazirX / Bybit ($1.7B+) | Masked DELEGATECALL + blind signing | Simulation + opcode scan |
| BadgerDAO ($120M) | Frontend injection | Calldata parsed direct from wallet provider |
| Inferno / Pink Drainers ($500M+) | Phishing domains | Domain heuristics + GoPlus address DB |
| SQUID / Honeypots | Buy-only trapped tokens | GoPlus ⁠ is_honeypot ⁠ flag |
| Unlimited Approval Drainers | ⁠ approve(attacker, uint256.max) ⁠ | 64-⁠ f ⁠ calldata match |
| Rug Pulls | Whale dumps | Moralis top-holder concentration |
| EIP-2612 Permit Drains | Off-chain signature, no visible tx | ⁠ eth_signTypedData_v4 ⁠ hook |

---

## Risk Scoring


0–30    SAFE      Transaction allowed silently
31–69   MEDIUM    Popup shown, user decides
70–89   HIGH      Popup shown, BLOCK is default
90–100  CRITICAL  Block enforced + voice alert + Hindi warning


Sample outputs:

⁠ json
{ "risk": 12,  "aiExplain": "Verified contract, distributed supply, no Slither findings." }
{ "risk": 72,  "aiExplain": "🐋 Whale holds 82% of supply — classic rug pull setup." }
{ "risk": 95,  "aiExplain": "🚨 Slither: reentrancy-eth (HIGH) line 45. Unlimited approval. BLOCK करें!" }
{ "risk": 98,  "aiExplain": "💀 Known theft address. stealing_attack=true (GoPlus)." }
 ⁠

AI explanation: Grok → HuggingFace Mistral-7B → rule-based fallback. Risk ≥ 80 always appends a Hindi warning.

---

## Quick Start

*Prerequisites*

⁠ bash
node >= 18
pip install slither-analyzer
 ⁠

*API Keys* (all free tier)

| Service | Used For |
|---------|---------|
| Alchemy | Sepolia RPC + tx simulation |
| Etherscan | Contract verification + source fetch |
| Moralis | Token holder distribution |
| Dune | TVL + activity data |
| HuggingFace | AI explanation fallback |

GoPlus requires no key.

*Backend*

⁠ bash
cd backend/
cp .env.example .env
npm install && npm start
 ⁠

*Extension*

1.⁠ ⁠Set ⁠ BACKEND ⁠ URL in ⁠ extension/content.js ⁠ line 4
2.⁠ ⁠⁠ chrome://extensions ⁠ → Developer Mode → Load unpacked → select ⁠ extension/ ⁠

*Contracts* — deploy via [Remix IDE](https://remix.ethereum.org) on Sepolia, copy addresses to ⁠ .env ⁠

---

## Project Structure


chainguardian/
├── extension/          Chrome MV3 extension (content.js, panel.html, injector.js)
├── backend/            Express API — 8 checks, AI layer, IntentLog interaction
├── contracts/          IntentLog.sol, RugToken.sol, MaliciousContract.sol, CleanToken.sol
└── demo-assets/        demo-dapp.html — three test scenarios on Sepolia


---

## Research

•⁠  ⁠Feist et al., IEEE S&P 2019 — Slither: A Static Analysis Framework for Smart Contracts
•⁠  ⁠Three Sigma, Jan 2025 — 2024 Most Exploited DeFi Vulnerabilities
•⁠  ⁠Halborn, 2025 — Top 100 DeFi Hacks Report
•⁠  ⁠Sygnia — Bybit Hack Investigation
•⁠  ⁠CertiK Q3 2024 Security Report — 47 approval exploits in 3 months

---

🇮🇳 ChainGuardian v1.0 · Sepolia Testnet · MIT License
