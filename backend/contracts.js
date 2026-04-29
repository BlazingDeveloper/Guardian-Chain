// contracts.js – IntentLog.sol interaction
// Logs user intents on-chain for audit trail

import { ethers } from 'ethers';

const INTENT_LOG_ABI = [
  'function logIntent(address spender, uint256 amount, uint256 riskScore) external',
  'event UserIntent(address indexed user, address indexed spender, uint256 amount, uint256 riskScore, uint256 timestamp)'
];

export async function logIntentOnChain(user, spender, amount, riskScore) {
  try {
    const RPC = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    const PRIVATE_KEY = process.env.LOG_WALLET_PRIVATE_KEY;
    const CONTRACT_ADDRESS = process.env.INTENT_LOG_CONTRACT;

    if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
      console.log('[contracts] Skipping on-chain log – missing env vars');
      return null;
    }

    const provider = new ethers.JsonRpcProvider(RPC);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, INTENT_LOG_ABI, signer);

    const tx = await contract.logIntent(
      spender || ethers.ZeroAddress,
      BigInt(amount || 0),
      BigInt(riskScore || 0),
      { gasLimit: 100000 }
    );

    await tx.wait();
    console.log(`[contracts] Intent logged: ${tx.hash}`);
    return tx.hash;
  } catch (err) {
    console.error('[contracts] Log failed:', err.message);
    return null;
  }
}
