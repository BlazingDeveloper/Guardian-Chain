// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CleanToken
 * @notice DEMO CONTRACT – Safe token, should score LOW risk in ChainGuardian
 * @dev No reentrancy, no delegatecall, uses CEI pattern, verified source
 */
contract CleanToken {
    string  public name        = "SafeToken DEMO";
    string  public symbol      = "SAFE";
    uint8   public decimals    = 18;
    uint256 public totalSupply = 1_000_000 * 10**18;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        // Distribute evenly – no whale concentration
        _balances[msg.sender] = totalSupply / 10; // 10% only
        // Rest goes to zero address to simulate distributed supply
        _balances[address(0xdEaD)] = (totalSupply * 9) / 10;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");
        unchecked { _approve(from, msg.sender, currentAllowance - amount); }
        _transfer(from, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    // CEI pattern – checks, effects, interactions (no reentrancy)
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from zero");
        require(to != address(0), "ERC20: transfer to zero");
        require(_balances[from] >= amount, "ERC20: insufficient balance");
        
        // Effects first
        unchecked {
            _balances[from] -= amount;
            _balances[to] += amount;
        }
        
        emit Transfer(from, to, amount);
        // No external calls after state change
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from zero");
        require(spender != address(0), "ERC20: approve to zero");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
