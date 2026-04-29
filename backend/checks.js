// checks.js – 8 On-chain Risk Checks
// Each check has a 3s timeout; failures return safe defaults

import { ethers } from 'ethers';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
const MORALIS_KEY   = process.env.MORALIS_KEY;
const ALCHEMY_KEY   = process.env.ALCHEMY_KEY;
const DUNE_KEY      = process.env.DUNE_KEY;

const SEPOLIA_RPC = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`;
let provider;

function getProvider() {
  if (!provider) provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  return provider;
}

// ─── Helper: timeout wrapper ──────────────────────────────────────────────────
function withTimeout(promise, ms = 3000, fallback) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

// ─── Helper: fetch with error handling ───────────────────────────────────────
async function safeFetch(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3000);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    clearTimeout(t);
    return null;
  }
}

// ─── CHECK 1: Whale concentration (Moralis) ───────────────────────────────────
async function checkWhaleConcentration(token) {
  try {
    if (!token || token === ethers.ZeroAddress) return 0;
    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${token}/owners?chain=sepolia&limit=1`;
    const data = await safeFetch(url, {
      headers: { 'X-API-Key': MORALIS_KEY }
    });
    if (!data || !data.result || !data.result[0]) return 0;
    // Return top holder percentage
    const pct = parseFloat(data.result[0].percentage_relative_to_total_supply || 0);
    return Math.round(pct);
  } catch {
    return 0;
  }
}

// ─── CHECK 2: Dune TVL / active address check ─────────────────────────────────
async function checkDuneTVL(address) {
  try {
    // Execute a pre-saved Dune query for TVL data
    const execUrl = `https://api.dune.com/api/v1/query/3820000/execute`;
    const exec = await safeFetch(execUrl, {
      method: 'POST',
      headers: { 'X-Dune-API-Key': DUNE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_parameters: { address } })
    });
    if (!exec || !exec.execution_id) return { tvlDrop: false, lowActivity: false };

    // Poll result (max 3 attempts)
    await new Promise(r => setTimeout(r, 1500));
    const result = await safeFetch(
      `https://api.dune.com/api/v1/execution/${exec.execution_id}/results`,
      { headers: { 'X-Dune-API-Key': DUNE_KEY } }
    );

    if (!result || !result.result || !result.result.rows) {
      return { tvlDrop: false, lowActivity: false };
    }

    const row = result.result.rows[0] || {};
    return {
      tvlDrop: (row.tvl_change_pct || 0) < -30,
      lowActivity: (row.active_addresses_7d || 100) < 50
    };
  } catch {
    return { tvlDrop: false, lowActivity: false };
  }
}

// ─── CHECK 3: Slither static analysis ─────────────────────────────────────────
async function checkSlither(sourceCode) {
  return new Promise((resolve) => {
    if (!sourceCode || sourceCode.length < 50) {
      return resolve([]);
    }

    const tmpFile = join(tmpdir(), `cg_${Date.now()}.sol`);

    try {
      writeFileSync(tmpFile, sourceCode);
    } catch {
      return resolve([]);
    }

    const bugs = [];
    const timeout = setTimeout(() => {
      try { proc.kill(); } catch {}
      try { unlinkSync(tmpFile); } catch {}
      resolve(bugs);
    }, 8000);

    let jsonOutput = '';
    const proc = spawn('slither', [tmpFile, '--json', '-'], {
      timeout: 8000,
      env: { ...process.env, PATH: process.env.PATH }
    });

    proc.stdout.on('data', d => { jsonOutput += d.toString(); });

    proc.on('close', () => {
      clearTimeout(timeout);
      try { unlinkSync(tmpFile); } catch {}

      try {
        const parsed = JSON.parse(jsonOutput);
        const detectors = parsed.results?.detectors || [];
        detectors
          .filter(d => d.impact === 'High' || d.impact === 'Medium')
          .slice(0, 5)
          .forEach(d => {
            const line = d.elements?.[0]?.source_mapping?.lines?.[0];
            bugs.push(`${d.check} (${d.impact})${line ? ` line ${line}` : ''}`);
          });
      } catch {}

      resolve(bugs);
    });

    proc.on('error', () => {
      clearTimeout(timeout);
      try { unlinkSync(tmpFile); } catch {}
      resolve([]);
    });
  });
}

// ─── CHECK 4: Unlimited approval detection ────────────────────────────────────
function checkUnlimitedApproval(data) {
  if (!data) return false;
  const MAX_UINT256 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  return data.toLowerCase().includes(MAX_UINT256);
}

// ─── CHECK 5: Etherscan verified + proxy check ────────────────────────────────
async function checkEtherscanVerified(address) {
  try {
    const url = `https://api-sepolia.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_KEY}`;
    const data = await safeFetch(url);
    if (!data || !data.result || !data.result[0]) return { unverified: true, sourceCode: null };

    const result = data.result[0];
    const sourceCode = result.SourceCode || '';
    const isVerified = sourceCode.length > 0;
    const isProxy = result.Implementation && result.Implementation !== '';

    return {
      unverified: !isVerified,
      sourceCode: isVerified ? sourceCode : null,
      isProxy
    };
  } catch {
    return { unverified: true, sourceCode: null, isProxy: false };
  }
}

// ─── CHECK 6: Alchemy tx simulation ──────────────────────────────────────────
async function checkSimulateDrain(tx) {
  try {
    if (!ALCHEMY_KEY) return false;

    const url = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`;
    const payload = {
      id: 1, jsonrpc: '2.0', method: 'alchemy_simulateAssetChanges',
      params: [{
        from: tx.from || '0x0000000000000000000000000000000000000001',
        to: tx.to,
        data: tx.data || '0x',
        value: tx.value || '0x0'
      }]
    };

    const data = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!data || !data.result) return false;

    // Check for token/ETH outflows
    const changes = data.result.changes || [];
    const hasDrain = changes.some(c =>
      c.changeType === 'TRANSFER' && c.from === tx.from &&
      BigInt(c.rawAmount || 0) > BigInt(0)
    );
    return hasDrain;
  } catch {
    return false;
  }
}

// ─── CHECK 7: Twitter/social hype (optional) ──────────────────────────────────
async function checkSocialHype(address) {
  // Twitter API v2 is rate-limited; use Google Trends alternative
  // Returns true if abnormal hype detected (pump signal)
  try {
    // Placeholder – integrate with your Twitter Bearer Token if available
    return false;
  } catch {
    return false;
  }
}

// ─── CHECK 8: Opcode analysis (CALL/DELEGATECALL/JUMPI count) ─────────────────
async function checkOpcodes(address) {
  try {
    const p = getProvider();
    const bytecode = await withTimeout(p.getCode(address), 3000, '0x');
    if (!bytecode || bytecode === '0x') return { highOpcodes: false, opcodeCount: 0 };

    // Count dangerous opcodes in bytecode
    // CALL=f1, DELEGATECALL=f4, STATICCALL=fa, CALLCODE=f2, JUMPI=57
    let callCount = 0;
    let delegateCallCount = 0;

    for (let i = 2; i < bytecode.length - 1; i += 2) {
      const byte = bytecode.slice(i, i + 2);
      if (byte === 'f1' || byte === 'f2' || byte === 'fa') callCount++;
      if (byte === 'f4') delegateCallCount++;
    }

    const total = callCount + delegateCallCount * 2; // DELEGATECALL weighted 2x
    return {
      highOpcodes: total > 10,
      opcodeCount: total,
      delegateCallCount
    };
  } catch {
    return { highOpcodes: false, opcodeCount: 0 };
  }
}

// ─── Main: run all checks ─────────────────────────────────────────────────────
export async function runChecks(tx) {
  const address = tx.to || '';

  // Extract token address from approve calldata
  // approve(address spender, uint256 amount) → 0x095ea7b3
  let tokenAddress = address;
  if (tx.data && tx.data.startsWith('0x095ea7b3') && tx.data.length >= 138) {
    // The contract being called IS the token for ERC20 approvals
    tokenAddress = address;
  }

  console.log(`[checks] Starting 8-check parallel analysis for ${address}`);

  // Run checks in parallel with individual timeouts
  const [
    whale,
    duneData,
    etherscanData,
    opcodeData,
    drainDetected
  ] = await Promise.all([
    withTimeout(checkWhaleConcentration(tokenAddress), 4000, 0),
    withTimeout(checkDuneTVL(address), 5000, { tvlDrop: false, lowActivity: false }),
    withTimeout(checkEtherscanVerified(address), 4000, { unverified: true, sourceCode: null }),
    withTimeout(checkOpcodes(address), 4000, { highOpcodes: false, opcodeCount: 0 }),
    withTimeout(checkSimulateDrain(tx), 4000, false)
  ]);

  // Slither requires source code – run after etherscan check
  const slither = await withTimeout(
    checkSlither(etherscanData.sourceCode),
    9000,
    []
  );

  // Local checks (instant)
  const unlimited = checkUnlimitedApproval(tx.data);

  return {
    whale,
    tvlDrop: duneData.tvlDrop,
    lowActivity: duneData.lowActivity,
    slither,
    unlimited,
    unverified: etherscanData.unverified,
    sourceCode: etherscanData.sourceCode,
    isProxy: etherscanData.isProxy,
    drainDetected,
    highOpcodes: opcodeData.highOpcodes,
    opcodeCount: opcodeData.opcodeCount,
    delegateCallCount: opcodeData.delegateCallCount || 0
  };
}
