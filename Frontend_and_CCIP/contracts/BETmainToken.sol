// File: contracts/tokens/BETmainToken.sol
// Deploy on: Avalanche Fuji via Remix
// NEW VERSION: Compatible with EnhancedCompetitionFactory

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BETmainToken is ERC20, Ownable, ReentrancyGuard {
    
    // ============ CHAIN CONSTANTS (MATCH FACTORY) ============
    bytes32 private constant SEPOLIA_CHAIN_ID = bytes32(uint256(0x5345504f4c4941000000000000000000000000000000000000000000000000));
    bytes32 private constant DISPATCH_CHAIN_ID = bytes32(uint256(0x4449535041544348000000000000000000000000000000000000000000000000));
    bytes32 private constant ARBITRUM_CHAIN_ID = bytes32(uint256(0x4152424954525553000000000000000000000000000000000000000000000000));
    bytes32 private constant POLYGON_CHAIN_ID = bytes32(uint256(0x504f4c59474f4e00000000000000000000000000000000000000000000000000));
    bytes32 private constant BASE_CHAIN_ID = bytes32(uint256(0x4241534500000000000000000000000000000000000000000000000000000000));
    bytes32 private constant OPTIMISM_CHAIN_ID = bytes32(uint256(0x4f5054494d49534d000000000000000000000000000000000000000000000000));
    bytes32 private constant ETHEREUM_CHAIN_ID = bytes32(uint256(0x455448455245554d000000000000000000000000000000000000000000000000));
    bytes32 private constant AVALANCHE_CHAIN_ID = bytes32(uint256(0x4156414c414e434845000000000000000000000000000000000000000000000));
    bytes32 private constant BSC_CHAIN_ID = bytes32(uint256(0x4253430000000000000000000000000000000000000000000000000000000000));
    bytes32 private constant FANTOM_CHAIN_ID = bytes32(uint256(0x46414e544f4d000000000000000000000000000000000000000000000000000));
    
    // Authorization and limits
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public authorizedBurners;
    mapping(bytes32 => uint256) public chainDeposits; // Track deposits per chain
    
    // Token limits
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    uint256 public totalBacked; // Total tokens backed by cross-chain deposits
    
    // Events
    event MintedFromDeposit(bytes32 indexed chain, uint256 amount, address indexed recipient);
    event BurnedForWithdrawal(bytes32 indexed chain, uint256 amount, address indexed user);
    event AuthorizedMinterUpdated(address indexed minter, bool authorized);
    event AuthorizedBurnerUpdated(address indexed burner, bool authorized);
    event EmergencyMint(address indexed to, uint256 amount, string reason);
    
    // Errors
    error UnauthorizedMinter();
    error UnauthorizedBurner();
    error ExceedsMaxSupply();
    error InsufficientBalance();
    error InvalidChainId();
    error ZeroAmount();
    error ZeroAddress();
    
    constructor() ERC20("BETmain", "BET") Ownable(msg.sender) {
        // Initialize with some tokens for testing
        _mint(msg.sender, 1_000_000 * 10**18); // 1M tokens for owner
        totalBacked = 1_000_000 * 10**18;
        
        // Set deployer as authorized minter and burner
        authorizedMinters[msg.sender] = true;
        authorizedBurners[msg.sender] = true;
    }
    
    /**
     * @dev CRITICAL FUNCTION: Mint tokens from cross-chain deposits
     * This is called by EnhancedCompetitionFactory when users deposit from other chains
     */
    function mintFromDeposit(
        bytes32 chain, 
        uint256 amount, 
        address recipient
    ) external nonReentrant {
        if (!authorizedMinters[msg.sender]) revert UnauthorizedMinter();
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroAddress();
        if (!_isValidChain(chain)) revert InvalidChainId();
        
        // Check max supply
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        
        // Update chain deposit tracking
        chainDeposits[chain] += amount;
        totalBacked += amount;
        
        // Mint tokens
        _mint(recipient, amount);
        
        emit MintedFromDeposit(chain, amount, recipient);
    }
    
    /**
     * @dev Burn tokens for cross-chain withdrawals
     */
    function burnForWithdrawal(
        bytes32 chain,
        uint256 amount,
        address user
    ) external nonReentrant {
        if (!authorizedBurners[msg.sender]) revert UnauthorizedBurner();
        if (amount == 0) revert ZeroAmount();
        if (user == address(0)) revert ZeroAddress();
        if (!_isValidChain(chain)) revert InvalidChainId();
        
        // Check user balance
        if (balanceOf(user) < amount) revert InsufficientBalance();
        
        // Update tracking
        if (chainDeposits[chain] >= amount) {
            chainDeposits[chain] -= amount;
            totalBacked -= amount;
        }
        
        // Burn tokens
        _burn(user, amount);
        
        emit BurnedForWithdrawal(chain, amount, user);
    }
    
    /**
     * @dev Emergency mint function (owner only)
     */
    function emergencyMint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        
        _mint(to, amount);
        emit EmergencyMint(to, amount, "Emergency mint by owner");
    }
    
    /**
     * @dev Standard mint function (for authorized minters)
     */
    function mint(address to, uint256 amount) external {
        if (!authorizedMinters[msg.sender]) revert UnauthorizedMinter();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        
        _mint(to, amount);
    }
    
    /**
     * @dev Set authorized minter
     */
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        authorizedMinters[minter] = authorized;
        emit AuthorizedMinterUpdated(minter, authorized);
    }
    
    /**
     * @dev Set authorized burner
     */
    function setAuthorizedBurner(address burner, bool authorized) external onlyOwner {
        if (burner == address(0)) revert ZeroAddress();
        authorizedBurners[burner] = authorized;
        emit AuthorizedBurnerUpdated(burner, authorized);
    }
    
    /**
     * @dev Check if chain ID is valid
     */
    function _isValidChain(bytes32 chainId) private pure returns (bool) {
        return chainId == SEPOLIA_CHAIN_ID ||
               chainId == DISPATCH_CHAIN_ID ||
               chainId == ARBITRUM_CHAIN_ID ||
               chainId == POLYGON_CHAIN_ID ||
               chainId == BASE_CHAIN_ID ||
               chainId == OPTIMISM_CHAIN_ID ||
               chainId == ETHEREUM_CHAIN_ID ||
               chainId == AVALANCHE_CHAIN_ID ||
               chainId == BSC_CHAIN_ID ||
               chainId == FANTOM_CHAIN_ID;
    }
    
    /**
     * @dev Get chain deposit amount
     */
    function getChainDeposits(bytes32 chainId) external view returns (uint256) {
        return chainDeposits[chainId];
    }
    
    /**
     * @dev Get total backed supply
     */
    function getTotalBacked() external view returns (uint256) {
        return totalBacked;
    }
    
    /**
     * @dev Check if address is authorized minter
     */
    function isAuthorizedMinter(address account) external view returns (bool) {
        return authorizedMinters[account];
    }
    
    /**
     * @dev Check if address is authorized burner
     */
    function isAuthorizedBurner(address account) external view returns (bool) {
        return authorizedBurners[account];
    }
    
    /**
     * @dev Get Sepolia chain ID (for verification)
     */
    function getSepoliaChainId() external pure returns (bytes32) {
        return SEPOLIA_CHAIN_ID;
    }
    
    /**
     * @dev Get all supported chain IDs
     */
    function getAllChainIds() external pure returns (bytes32[10] memory) {
        return [
            SEPOLIA_CHAIN_ID,
            DISPATCH_CHAIN_ID,
            ARBITRUM_CHAIN_ID,
            POLYGON_CHAIN_ID,
            BASE_CHAIN_ID,
            OPTIMISM_CHAIN_ID,
            ETHEREUM_CHAIN_ID,
            AVALANCHE_CHAIN_ID,
            BSC_CHAIN_ID,
            FANTOM_CHAIN_ID
        ];
    }
}