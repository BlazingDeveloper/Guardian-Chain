// server.js – ChainGuardian Backend
// Node.js Express API with 8 on-chain risk checks + AI explain
// Deploy on Render (free tier): https://render.com

import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { runChecks } from './checks.js';
import { aiExplain } from './ai.js';
import { logIntentOnChain } from './contracts.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'ChainGuardian Risk API',
    version: '1.0.0',
    checks: 8,
    network: 'Sepolia'
  });
});

// ─── Main risk endpoint ───────────────────────────────────────────────────────
app.post('/risk', async (req, res) => {
  const startTime = Date.now();

  try {
    const { tx } = req.body;
    if (!tx || !tx.to) {
      return res.status(400).json({ error: 'Missing tx.to' });
    }

    console.log(`[/risk] Analyzing: ${tx.to} | data: ${(tx.data || '').slice(0, 10)}`);

    // Run all 8 checks in parallel (with individual timeouts)
    const checkResults = await runChecks(tx);

    // Compute weighted risk score
    let score = 0;
    const flags = [];

    if (checkResults.whale > 50)      { score += 25; flags.push(`Whale ${checkResults.whale}% concentration`); }
    if (checkResults.tvlDrop)          { score += 20; flags.push('TVL/volume drop >30%'); }
    if (checkResults.slither.length)   { score += Math.min(checkResults.slither.length * 10, 30); flags.push(`Slither: ${checkResults.slither[0]}`); }
    if (checkResults.unlimited)        { score += 20; flags.push('Unlimited approval (uint256.max)'); }
    if (checkResults.unverified)       { score += 15; flags.push('Contract source unverified'); }
    if (checkResults.drainDetected)    { score += 25; flags.push('Balance drain in simulation'); }
    if (checkResults.highOpcodes)      { score += 15; flags.push(`High opcode count: ${checkResults.opcodeCount} CALL/JUMPI`); }
    if (checkResults.lowActivity)      { score += 10; flags.push('Low active addresses (<50)'); }

    const riskScore = Math.min(score, 100);

    // Get AI explanation
    const explanation = await aiExplain(riskScore, flags, checkResults);

    const response = {
      risk: riskScore,
      aiExplain: explanation,
      slither: checkResults.slither,
      whale: checkResults.whale,
      checks: {
        whale: checkResults.whale > 50,
        tvlDrop: checkResults.tvlDrop,
        slitherBugs: checkResults.slither.length,
        unlimited: checkResults.unlimited,
        unverified: checkResults.unverified,
        drainDetected: checkResults.drainDetected,
        highOpcodes: checkResults.highOpcodes,
        lowActivity: checkResults.lowActivity
      },
      flags,
      responseMs: Date.now() - startTime
    };

    console.log(`[/risk] Score: ${riskScore} | Flags: ${flags.length} | ${response.responseMs}ms`);
    res.json(response);

  } catch (err) {
    console.error('[/risk] Error:', err.message);
    res.status(500).json({
      risk: 50,
      aiExplain: '⚠️ Analysis partial – some checks failed. Proceed with caution.',
      slither: [],
      whale: 0,
      checks: {},
      flags: ['Backend error – fallback score'],
      error: err.message
    });
  }
});

// ─── Intent log endpoint ──────────────────────────────────────────────────────
app.post('/log-intent', async (req, res) => {
  try {
    const { user, spender, amount, riskScore } = req.body;
    const txHash = await logIntentOnChain(user, spender, amount, riskScore);
    res.json({ success: true, txHash });
  } catch (err) {
    console.error('[/log-intent] Error:', err.message);
    res.json({ success: false, error: err.message });
  }
});

// ─── Demo contracts info ──────────────────────────────────────────────────────
app.get('/demo-contracts', (req, res) => {
  res.json({
    clean: process.env.CLEAN_CONTRACT || '0x0000000000000000000000000000000000000001',
    rug: process.env.RUG_CONTRACT || '0x0000000000000000000000000000000000000002',
    malicious: process.env.MALICIOUS_CONTRACT || '0x0000000000000000000000000000000000000003',
    intentLog: process.env.INTENT_LOG_CONTRACT || '0x0000000000000000000000000000000000000004',
    network: 'sepolia'
  });
});

app.listen(PORT, () => {
  console.log(`✅ ChainGuardian API running on port ${PORT}`);
  console.log(`   Moralis: ${process.env.MORALIS_KEY ? '✓' : '✗ MISSING'}`);
  console.log(`   Etherscan: ${process.env.ETHERSCAN_KEY ? '✓' : '✗ MISSING'}`);
  console.log(`   Alchemy: ${process.env.ALCHEMY_KEY ? '✓' : '✗ MISSING'}`);
  console.log(`   Dune: ${process.env.DUNE_KEY ? '✓' : '✗ MISSING'}`);
  console.log(`   Gemini/AI: ${process.env.GEMINI_KEY || process.env.HF_KEY ? '✓' : '✗ MISSING'}`);
});
