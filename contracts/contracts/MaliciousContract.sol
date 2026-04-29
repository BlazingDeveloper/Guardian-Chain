// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MaliciousContract  
 * @notice DEMO CONTRACT for ChainGuardian hackathon
 * @dev Contains deliberate Slither-detectable vulnerabilities:
 *      1. Reentrancy (like Euler Finance / DAO hack pattern)
 *      2. Arbitrary delegatecall
 *      3. tx.origin auth bypass
 *      DEPLOY ON SEPOLIA ONLY
 */
contract MaliciousContract {
    mapping(address => uint256) public balances;
    address public owner;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // ── VULNERABILITY 1: Reentrancy ──────────────────────────────────────────
    // Slither will flag: "reentrancy-eth" (HIGH severity)
    // Same pattern as the $60M DAO hack
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // BUG: state update AFTER external call → reentrancy
        (bool success, ) = msg.sender.call{value: amount}(""); // Slither flags this
        require(success, "Transfer failed");
        
        balances[msg.sender] -= amount; // Too late – should be BEFORE the call
    }

    // ── VULNERABILITY 2: Arbitrary DELEGATECALL ──────────────────────────────
    // Slither will flag: "controlled-delegatecall" (HIGH severity)
    function execute(address target, bytes calldata data) external {
        require(tx.origin == owner, "Not owner"); // Also vulnerable: tx.origin
        (bool ok, ) = target.delegatecall(data); // Slither: arbitrary delegatecall
        require(ok, "Delegatecall failed");
    }

    // ── VULNERABILITY 3: tx.origin authentication bypass ────────────────────
    // Slither will flag: "tx-origin" (Medium severity)
    function adminWithdrawAll() external {
require(tx.origin == owner, "tx.origin check - phishable!");        payable(owner).transfer(address(this).balance);
    }

    // ── VULNERABILITY 4: Unchecked return value ──────────────────────────────
    // Slither will flag: "unchecked-lowlevel"
    function silentCall(address target) external {
        target.call{value: 0}(""); // Slither: return value not checked
    }

    receive() external payable {}
    fallback() external payable {}
}
