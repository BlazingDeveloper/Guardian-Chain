// ai.js – AI Explanation Layer
// Uses Gemini primary, HuggingFace Inference API as fallback

const HF_KEY   = process.env.HF_KEY;

// ─── Build system prompt ──────────────────────────────────────────────────────
function buildPrompt(riskScore, flags, checks) {
  const flagList = flags.join(', ') || 'No major flags';

  return `You are ChainGuardian, a DeFi security AI protecting Indian crypto beginners.

A wallet transaction was analyzed with a RISK SCORE of ${riskScore}/100.

Risk flags detected: ${flagList}

Technical details:
- Whale concentration: ${checks.whale || 0}% (top holder)
- Slither bugs found: ${checks.slither?.length || 0} (${checks.slither?.join(', ') || 'none'})
- Unlimited approval: ${checks.unlimited ? 'YES - DANGEROUS' : 'No'}
- Contract verified: ${checks.unverified ? 'NO - SUSPICIOUS' : 'Yes'}
- Balance drain in simulation: ${checks.drainDetected ? 'YES - CRITICAL' : 'No'}
- Dangerous opcode count: ${checks.opcodeCount || 0}

Write ONE sentence explaining the danger in simple English. Start with the most critical risk.
End with a Hindi warning if risk > 70.
Format: "[Risk level emoji] [English explanation]. [Hindi if high risk]"
Max 60 words total. Be specific about WHICH vulnerability.`;
}
/*
// ─── Grok AI (xAI) ───────────────────────────────────────────────────────────
async function grokExplain(prompt) {
  if (!GROK_KEY) return null;

  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 5000);

    const resp = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
        temperature: 0.3
      }),
      signal: ctrl.signal
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
  */

// ─── HuggingFace fallback ─────────────────────────────────────────────────────
async function hfExplain(prompt) {
  if (!HF_KEY) return null;

  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 6000);

    const resp = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${prompt} [/INST]`,
          parameters: { max_new_tokens: 120, temperature: 0.3, return_full_text: false }
        }),
        signal: ctrl.signal
      }
    );

    if (!resp.ok) return null;
    const data = await resp.json();
    const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    return text?.trim() || null;
  } catch {
    return null;
  }
}

// ─── Rule-based fallback (no API needed) ─────────────────────────────────────
function ruleBasedExplain(riskScore, flags, checks) {
  const parts = [];

  if (checks.drainDetected) {
    parts.push('🚨 Simulation shows your tokens WILL be drained from this approval');
  } else if (checks.slither?.length > 0) {
    parts.push(`🔴 Slither found ${checks.slither[0]} – a proven smart contract vulnerability`);
  } else if (checks.whale > 70) {
    parts.push(`🐋 One wallet holds ${checks.whale}% of supply – classic rug pull setup`);
  } else if (checks.unlimited) {
    parts.push('⚠️ Unlimited approval gives this contract access to ALL your tokens forever');
  } else if (checks.unverified) {
    parts.push('❌ Contract source code is hidden – cannot verify what this contract does');
  } else if (checks.highOpcodes) {
    parts.push(`⚡ ${checks.opcodeCount} CALL opcodes detected – potential reentrancy attack pattern`);
  } else {
    parts.push(`⚠️ Risk score ${riskScore}% – multiple suspicious signals detected`);
  }

  if (riskScore >= 80) {
    parts.push('🇮🇳 अपना पैसा बचाएं! यह लेनदेन खतरनाक है – BLOCK करें!');
  } else if (riskScore >= 60) {
    parts.push('🇮🇳 सावधान! यह contract संदिग्ध है।');
  }

  return parts.join(' ');
}
async function geminiExplain(prompt) {
  const GEMINI_KEY = process.env.GEMINI_KEY;
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  if (!GEMINI_KEY) return null;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!resp.ok) return null;

    const data = await resp.json();

    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;

  } catch (e) {
    return null;
  }
}
// ─── Main export ──────────────────────────────────────────────────────────────
export async function aiExplain(riskScore, flags, checks) {
  const prompt = buildPrompt(riskScore, flags, checks);

  // Try Gemini first
  let aiResult = await geminiExplain(prompt);

  // Fallback to HuggingFace if Gemini fails
  if (!aiResult) {
    aiResult = await hfExplain(prompt);
  }

  if (aiResult) {
    if (riskScore >= 80 && !aiResult.includes('बचाएं')) {
      return aiResult + ' 🇮🇳 अपना पैसा बचाएं! BLOCK करें!';
    }
    return aiResult;
  }

  // Final fallback: rule-based (no API needed)
  return ruleBasedExplain(riskScore, flags, checks);
}
