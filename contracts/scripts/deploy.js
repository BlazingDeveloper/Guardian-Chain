/*import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
  const provider = new ethers.JsonRpcProvider(
    "https://eth-sepolia.g.alchemy.com/v2/cpvhJajUELmEsO-WJc6K2"
  );

  const wallet = new ethers.Wallet("29065e9252490022ba1e7a61a4da738fa444d11fd3b85cfb0e8514b98a6bc51c", provider);

  console.log("Deploying with account:", wallet.address);

  // Load compiled contracts
  const cleanArtifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/CleanToken.sol/CleanToken.json")
  );

  const rugArtifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/RugToken.sol/RugToken.json")
  );

  const malArtifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/MaliciousContract.sol/MaliciousContract.json")
  );

  const CleanFactory = new ethers.ContractFactory(
    cleanArtifact.abi,
    cleanArtifact.bytecode,
    wallet
  );

  const clean = await CleanFactory.deploy();
  await clean.waitForDeployment();

  const RugFactory = new ethers.ContractFactory(
    rugArtifact.abi,
    rugArtifact.bytecode,
    wallet
  );

  const rug = await RugFactory.deploy();
  await rug.waitForDeployment();

  const MalFactory = new ethers.ContractFactory(
    malArtifact.abi,
    malArtifact.bytecode,
    wallet
  );

  const mal = await MalFactory.deploy();
  await mal.waitForDeployment();

  console.log("Clean:", await clean.getAddress());
  console.log("Rug:", await rug.getAddress());
  console.log("Malicious:", await mal.getAddress());
}

main().catch(console.error); */
import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider(
    "https://eth-sepolia.g.alchemy.com/v2/cpvhJajUELmEsO-WJc6K2"
  );

  // Using your testnet wallet
  const wallet = new ethers.Wallet("29065e9252490022ba1e7a61a4da738fa444d11fd3b85cfb0e8514b98a6bc51c", provider);

  console.log("Deploying IntentLog with account:", wallet.address);

  // Load compiled IntentLog contract
  const intentLogArtifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/IntentLog.sol/IntentLog.json")
  );

  const IntentLogFactory = new ethers.ContractFactory(
    intentLogArtifact.abi,
    intentLogArtifact.bytecode,
    wallet
  );

  // Deploy it, setting your deployer wallet as the 'Guardian'
  const intentLog = await IntentLogFactory.deploy(wallet.address);
  
  console.log("Waiting for the blockchain to mine the transaction...");
  await intentLog.waitForDeployment();

  console.log("🚀 IntentLog deployed to:", await intentLog.getAddress());
}

main().catch(console.error);