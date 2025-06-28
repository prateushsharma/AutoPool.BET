// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ETH to BETmain Exchange
 * @dev Users send ETH and receive BETmain tokens at a fixed rate
 * @notice Deploy this AFTER BETmain token contract
 */

interface IBETmainToken {
    function mint(address to, uint256 amount) external;
}

contract ETHToBETmainExchange is Ownable, ReentrancyGuard, Pausable {
    
    // BETmain token contract
    IBETmainToken public betmainToken;
    
    // Exchange rates (adjustable)
    uint256 public tokensPerETH = 333333; // 1 ETH = 333,333 BETmain tokens
    // This means: 0.0003 ETH = 100 BETmain tokens (as you requested!)
    
    // Minimum and maximum exchange limits
    uint256 public minimumETH = 0.0001 ether; // 0.0001 ETH minimum
    uint256 public maximumETH = 10 ether;     // 10 ETH maximum per transaction
    
    // Treasury to collect ETH
    address public treasury;
    
    // Exchange statistics
    uint256 public totalETHReceived;
    uint256 public totalTokensMinted;
    uint256 public totalTransactions;
    
    // User tracking
    mapping(address => uint256) public userETHSpent;
    mapping(address => uint256) public userTokensReceived;
    
    // Events
    event TokensExchanged(
        address indexed user,
        uint256 ethAmount,
        uint256 tokensReceived,
        uint256 rate
    );
    event RateUpdated(uint256 oldRate, uint256 newRate);
    event LimitsUpdated(uint256 minETH, uint256 maxETH);
    event TreasurySet(address indexed newTreasury);
    
    constructor(
        address _betmainToken,
        address _treasury
    ) Ownable(msg.sender){
        require(_betmainToken != address(0), "Invalid BETmain token address");
        require(_treasury != address(0), "Invalid treasury address");
        
        betmainToken = IBETmainToken(_betmainToken);
        treasury = _treasury;
    }
    
    /**
     * @dev Main exchange function - users send ETH and get BETmain tokens
     * @notice Send ETH to this function to receive BETmain tokens
     */
    function exchangeETHForTokens() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send ETH");
        require(msg.value >= minimumETH, "Below minimum ETH amount");
        require(msg.value <= maximumETH, "Above maximum ETH amount");
        
        // Calculate tokens to mint
        uint256 tokensToMint = (msg.value * tokensPerETH) / 1 ether;
        require(tokensToMint > 0, "Would receive 0 tokens");
        
        // Update statistics
        totalETHReceived += msg.value;
        totalTokensMinted += tokensToMint;
        totalTransactions += 1;
        
        // Update user statistics
        userETHSpent[msg.sender] += msg.value;
        userTokensReceived[msg.sender] += tokensToMint;
        
        // Mint tokens to user
        betmainToken.mint(msg.sender, tokensToMint);
        
        // Send ETH to treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        require(success, "ETH transfer to treasury failed");
        
        emit TokensExchanged(msg.sender, msg.value, tokensToMint, tokensPerETH);
    }
    
    /**
     * @dev Fallback function - automatically exchange ETH for tokens
     */
    receive() external payable {
        require(msg.value > 0, "Must send ETH");
        require(msg.value >= minimumETH, "Below minimum ETH amount");
        require(msg.value <= maximumETH, "Above maximum ETH amount");
        require(!paused(), "Contract is paused");
        
        // Calculate tokens to mint
        uint256 tokensToMint = (msg.value * tokensPerETH) / 1 ether;
        require(tokensToMint > 0, "Would receive 0 tokens");
        
        // Update statistics
        totalETHReceived += msg.value;
        totalTokensMinted += tokensToMint;
        totalTransactions += 1;
        
        // Update user statistics
        userETHSpent[msg.sender] += msg.value;
        userTokensReceived[msg.sender] += tokensToMint;
        
        // Mint tokens to user
        betmainToken.mint(msg.sender, tokensToMint);
        
        // Send ETH to treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        require(success, "ETH transfer to treasury failed");
        
        emit TokensExchanged(msg.sender, msg.value, tokensToMint, tokensPerETH);
    }
    
    /**
     * @dev Calculate how many tokens user will get for ETH amount
     * @param ethAmount Amount of ETH in wei
     * @return tokensReceived Amount of tokens user will receive
     */
    function calculateTokensForETH(uint256 ethAmount) external view returns (uint256 tokensReceived) {
        if (ethAmount == 0) return 0;
        return (ethAmount * tokensPerETH) / 1 ether;
    }
    
    /**
     * @dev Calculate how much ETH needed for desired tokens
     * @param tokenAmount Amount of tokens desired
     * @return ethNeeded Amount of ETH needed in wei
     */
    function calculateETHForTokens(uint256 tokenAmount) external view returns (uint256 ethNeeded) {
        if (tokenAmount == 0) return 0;
        return (tokenAmount * 1 ether) / tokensPerETH;
    }
    
    /**
     * @dev Update exchange rate (only owner)
     * @param newRate New tokens per ETH rate
     */
    function setTokensPerETH(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Rate must be greater than 0");
        require(newRate <= 10_000_000, "Rate too high"); // Max 10M tokens per ETH
        
        uint256 oldRate = tokensPerETH;
        tokensPerETH = newRate;
        
        emit RateUpdated(oldRate, newRate);
    }
    
    /**
     * @dev Update exchange limits (only owner)
     * @param minETH Minimum ETH per transaction
     * @param maxETH Maximum ETH per transaction
     */
    function setExchangeLimits(uint256 minETH, uint256 maxETH) external onlyOwner {
        require(minETH > 0, "Minimum must be greater than 0");
        require(maxETH > minETH, "Maximum must be greater than minimum");
        require(maxETH <= 100 ether, "Maximum too high");
        
        minimumETH = minETH;
        maximumETH = maxETH;
        
        emit LimitsUpdated(minETH, maxETH);
    }
    
    /**
     * @dev Set treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
        emit TreasurySet(newTreasury);
    }
    
    /**
     * @dev Pause/unpause exchange
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get exchange information
     */
    function getExchangeInfo() external view returns (
        uint256 currentRate,
        uint256 minETH,
        uint256 maxETH,
        uint256 totalETH,
        uint256 totalTokens,
        uint256 totalTxns,
        bool isPaused_
    ) {
        return (
            tokensPerETH,
            minimumETH,
            maximumETH,
            totalETHReceived,
            totalTokensMinted,
            totalTransactions,
            paused()
        );
    }
    
    /**
     * @dev Get user statistics
     * @param user User address
     */
    function getUserStats(address user) external view returns (
        uint256 ethSpent,
        uint256 tokensReceived
    ) {
        return (
            userETHSpent[user],
            userTokensReceived[user]
        );
    }
    
    /**
     * @dev Emergency withdrawal (only owner) - in case ETH gets stuck
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
}