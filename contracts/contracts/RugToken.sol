// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RugToken
 * @notice DEMO CONTRACT for ChainGuardian hackathon
 * @dev Simulates a rug pull token: deployer holds 82% of supply
 *      Used to trigger whale concentration check in ChainGuardian
 *      DEPLOY ON SEPOLIA ONLY - for demonstration purposes
 */
contract RugToken {
    string public name     = "RugToken DEMO";
    string public symbol   = "RUG";
    uint8  public decimals = 18;

    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnerWithdrew(address indexed owner, uint256 amount); // "rug" event

    constructor() {
        owner = msg.sender;
        totalSupply = 1_000_000 * 10**18;

        // Owner gets 82% – this triggers whale check in ChainGuardian
        balanceOf[msg.sender] = 820_000 * 10**18;

        // Distribute 18% to fake liquidity pool address
        address fakePool = address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp)))));
        balanceOf[fakePool] = 180_000 * 10**18;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    // The "rug pull" function – owner can drain all tokens
    function rugPull() external {
        require(msg.sender == owner, "Not owner");
        uint256 balance = balanceOf[address(this)];
        balanceOf[address(this)] = 0;
        balanceOf[owner] += balance;
        emit OwnerWithdrew(owner, balance);
    }
}
