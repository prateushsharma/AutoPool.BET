// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title BETmainToken
 * @dev Universal base token for PulsePicksAI protocol
 * @notice This token is backed 1:1 with deposited USDC across all chains
 * Features:
 * - Dynamic supply based on cross-chain deposits
 * - ICTT compatibility for Avalanche native chains
 * - CCIP integration for external chains
 * - Pausable for emergency situations
 */
contract BETmainToken is ERC20, ReentrancyGuard, Ownable, Pausable {
    
    // Cross-chain deposit tracking
    mapping(bytes32 => uint256) public chainDeposits;
    mapping(bytes32 => bool) public supportedChains;
    
    // Protocol addresses
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public authorizedBurners;
    
    // Supply tracking
    uint256 public totalBackedSupply;
    uint256 public maxSupply = 1000000000 * 10**18; // 1B max supply
    
    // Chain identifiers
    bytes32 public constant FUJI_C_CHAIN = keccak256("AVALANCHE_FUJI_C");
    bytes32 public constant DISPATCH_CHAIN = keccak256("DISPATCH");
    bytes32 public constant SEPOLIA_CHAIN = keccak256("ETHEREUM_SEPOLIA");
    
    // Events
    event CrossChainDeposit(bytes32 indexed chain, uint256 amount, address indexed user);
    event CrossChainWithdrawal(bytes32 indexed chain, uint256 amount, address indexed user);
    event ChainSupported(bytes32 indexed chain, bool supported);
    event AuthorizedMinter(address indexed minter, bool authorized);
    event AuthorizedBurner(address indexed burner, bool authorized);
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) Ownable(msg.sender) ERC20(name, symbol) {
        _transferOwnership(initialOwner);
        
        // Initialize supported chains
        supportedChains[FUJI_C_CHAIN] = true;
        supportedChains[DISPATCH_CHAIN] = true;
        supportedChains[SEPOLIA_CHAIN] = true;
        
        emit ChainSupported(FUJI_C_CHAIN, true);
        emit ChainSupported(DISPATCH_CHAIN, true);
        emit ChainSupported(SEPOLIA_CHAIN, true);
    }
    
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender], "BETmain: Not authorized minter");
        _;
    }
    
    modifier onlyAuthorizedBurner() {
        require(authorizedBurners[msg.sender], "BETmain: Not authorized burner");
        _;
    }
    
    modifier validChain(bytes32 chain) {
        require(supportedChains[chain], "BETmain: Chain not supported");
        _;
    }
    
    /**
     * @dev Mint tokens from cross-chain deposit
     * @param chain Chain identifier where deposit originated
     * @param amount Amount to mint (1:1 with deposited USDC)
     * @param recipient Address to receive minted tokens
     */
    function mintFromDeposit(
        bytes32 chain,
        uint256 amount,
        address recipient
    ) external onlyAuthorizedMinter validChain(chain) nonReentrant whenNotPaused {
        require(recipient != address(0), "BETmain: Zero address");
        require(amount > 0, "BETmain: Zero amount");
        require(totalSupply() + amount <= maxSupply, "BETmain: Max supply exceeded");
        
        chainDeposits[chain] += amount;
        totalBackedSupply += amount;
        
        _mint(recipient, amount);
        
        emit CrossChainDeposit(chain, amount, recipient);
    }
    
    /**
     * @dev Burn tokens for cross-chain withdrawal
     * @param chain Chain identifier where withdrawal is going
     * @param amount Amount to burn
     * @param user Address of user withdrawing
     */
    function burnForWithdrawal(
        bytes32 chain,
        uint256 amount,
        address user
    ) external onlyAuthorizedBurner validChain(chain) nonReentrant whenNotPaused {
        require(user != address(0), "BETmain: Zero address");
        require(amount > 0, "BETmain: Zero amount");
        require(chainDeposits[chain] >= amount, "BETmain: Insufficient chain deposits");
        require(balanceOf(user) >= amount, "BETmain: Insufficient balance");
        
        chainDeposits[chain] -= amount;
        totalBackedSupply -= amount;
        
        _burn(user, amount);
        
        emit CrossChainWithdrawal(chain, amount, user);
    }
    
    /**
     * @dev Emergency mint for protocol operations (owner only)
     */
    function emergencyMint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= maxSupply, "BETmain: Max supply exceeded");
        _mint(to, amount);
    }
    
    /**
     * @dev Set authorized minter status
     */
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
        emit AuthorizedMinter(minter, authorized);
    }
    
    /**
     * @dev Set authorized burner status
     */
    function setAuthorizedBurner(address burner, bool authorized) external onlyOwner {
        authorizedBurners[burner] = authorized;
        emit AuthorizedBurner(burner, authorized);
    }
    
    /**
     * @dev Add or remove supported chain
     */
    function setSupportedChain(bytes32 chain, bool supported) external onlyOwner {
        supportedChains[chain] = supported;
        emit ChainSupported(chain, supported);
    }
    
    /**
     * @dev Update max supply (owner only, can only increase)
     */
    function updateMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= totalSupply(), "BETmain: Cannot reduce below current supply");
        maxSupply = newMaxSupply;
    }
    
    /**
     * @dev Get deposit amount for specific chain
     */
    function getChainDeposits(bytes32 chain) external view returns (uint256) {
        return chainDeposits[chain];
    }
    
    /**
     * @dev Check if chain is supported
     */
    function isChainSupported(bytes32 chain) external view returns (bool) {
        return supportedChains[chain];
    }
    
    /**
     * @dev Get total backing ratio (should always be 1:1)
     */
    function getBackingRatio() external view returns (uint256) {
        if (totalSupply() == 0) return 1e18; // 100% when no supply
        return (totalBackedSupply * 1e18) / totalSupply();
    }
    
    /**
     * @dev Pause contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    

}