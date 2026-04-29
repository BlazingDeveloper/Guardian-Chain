// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IntentLog
 * @notice ChainGuardian on-chain audit log
 * @dev Emits UserIntent events when user force-approves after risk warning
 *      Deploy on Sepolia via Remix IDE
 */
contract IntentLog {
    
    // ── Events ──────────────────────────────────────────────────────────────
    event UserIntent(
        address indexed user,
        address indexed spender,
        uint256 amount,
        uint256 riskScore,
        uint256 timestamp
    );

    event RiskBlocked(
        address indexed user,
        address indexed spender,
        uint256 riskScore,
        uint256 timestamp
    );

    // ── State ────────────────────────────────────────────────────────────────
    address public owner;
    address public guardian;        // ChainGuardian backend signer
    uint256 public totalIntents;
    uint256 public totalBlocked;

    mapping(address => uint256) public userIntentCount;
    mapping(address => uint256) public userBlockedCount;
    mapping(address => bool) public flaggedContracts;

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(address _guardian) {
        owner = msg.sender;
        guardian = _guardian;
    }

    // ── Modifiers ─────────────────────────────────────────────────────────────
    modifier onlyGuardian() {
        require(msg.sender == guardian || msg.sender == owner, "Not authorized");
        _;
    }

    // ── Functions ─────────────────────────────────────────────────────────────

    /**
     * @notice Log when user force-approves despite high risk warning
     * @param spender The contract being approved
     * @param amount Token amount approved
     * @param riskScore Risk score from ChainGuardian (0-100)
     */
    function logIntent(
        address spender,
        uint256 amount,
        uint256 riskScore
    ) external {
        emit UserIntent(msg.sender, spender, amount, riskScore, block.timestamp);
        totalIntents++;
        userIntentCount[msg.sender]++;

        // Auto-flag very high risk contracts
        if (riskScore >= 80) {
            flaggedContracts[spender] = true;
        }
    }

    /**
     * @notice Log when guardian blocks a transaction on behalf of user
     * @param user The user whose tx was blocked
     * @param spender The blocked spender contract
     * @param riskScore Risk score that triggered the block
     */
    function logBlock(
        address user,
        address spender,
        uint256 riskScore
    ) external onlyGuardian {
        emit RiskBlocked(user, spender, riskScore, block.timestamp);
        totalBlocked++;
        userBlockedCount[user]++;
        flaggedContracts[spender] = true;
    }

    /**
     * @notice Check if a contract has been flagged as risky
     */
    function isFlagged(address contractAddr) external view returns (bool) {
        return flaggedContracts[contractAddr];
    }

    /**
     * @notice Get user stats
     */
    function getUserStats(address user) external view returns (
        uint256 intents,
        uint256 blocked
    ) {
        return (userIntentCount[user], userBlockedCount[user]);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    function setGuardian(address _guardian) external {
        require(msg.sender == owner, "Not owner");
        guardian = _guardian;
    }

    function flagContract(address contractAddr) external onlyGuardian {
        flaggedContracts[contractAddr] = true;
    }
}
