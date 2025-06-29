// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title BETmain Token - Simple Version
 * @dev Basic ERC20 token that can be minted by authorized contracts
 * @notice Deploy this contract FIRST, then deploy the exchange contract
 */
contract BETmainToken is ERC20, Ownable, Pausable {
    
    // Maximum supply
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 Billion tokens
    
    // Authorized minters (exchange contracts, etc.)
    mapping(address => bool) public authorizedMinters;
    
    // Treasury for initial tokens
    address public treasury;
    
    // Testnet mode
    bool public isTestnet = true;
    
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, address indexed minter);
    
    modifier onlyMinter() {
        require(
            authorizedMinters[msg.sender] || 
            msg.sender == owner() ||
            isTestnet, 
            "Not authorized to mint"
        );
        _;
    }
    
    constructor(address _treasury) ERC20("BETmain", "BETmain") Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        
        // Mint initial 1M tokens to treasury
        _mint(_treasury, 1_000_000 * 10**18);
        
        // Add treasury as authorized minter
        authorizedMinters[_treasury] = true;
        emit MinterAdded(_treasury);
    }
    
    /**
     * @dev Mint tokens - only authorized minters can call this
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in wei, 18 decimals)
     */
    function mint(address to, uint256 amount) external onlyMinter whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }
    
    /**
     * @dev Add authorized minter (only owner)
     * @param minter Address to authorize for minting
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        require(!authorizedMinters[minter], "Already authorized");
        
        authorizedMinters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove authorized minter (only owner)
     * @param minter Address to remove from minting authorization
     */
    function removeMinter(address minter) external onlyOwner {
        require(authorizedMinters[minter], "Not an authorized minter");
        
        authorizedMinters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Testnet function - anyone can mint small amounts for testing
     * @param amount Amount to mint (max 1000 tokens per call)
     */
    function testMint(uint256 amount) external whenNotPaused {
        require(isTestnet, "Only available on testnet");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= 1000 * 10**18, "Max 1000 tokens per call");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        
        _mint(msg.sender, amount);
        emit TokensMinted(msg.sender, amount, msg.sender);
    }
    
    /**
     * @dev Disable testnet mode (for production)
     */
    function disableTestnetMode() external onlyOwner {
        isTestnet = false;
    }
    
    /**
     * @dev Emergency pause/unpause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get token information
     */
    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        uint256 maxSupply_,
        bool isPaused_,
        bool isTestnet_
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            MAX_SUPPLY,
            paused(),
            isTestnet
        );
    }
    
    /**
     * @dev Check if address is authorized minter
     */
    function isMinter(address account) external view returns (bool) {
        return authorizedMinters[account];
    }
    
   
}