export default {
    solidity: "0.8.20",
    networks: {
      sepolia: {
        type: "http",   // ✅ REQUIRED in Hardhat v3
        url: "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
        accounts: ["29065e9252490022ba1e7a61a4da738fa444d11fd3b85cfb0e8514b98a6bc51c"]
      }
    }
  };