// SPDX-License-Identifier: MIT
// FILE PLACEMENT: Deploy this on AVALANCHE FUJI
// PURPOSE: CCIP receiver that mints BETmain tokens when receiving deposits from Sepolia

pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBETmainToken {
    function mintFromDeposit(bytes32 chain, uint256 amount, address recipient) external;
    function burnForWithdrawal(bytes32 chain, uint256 amount, address user) external;
}

/**
 * @title AvalancheCCIPBridge
 * @dev CCIP receiver on Avalanche Fuji that mints BETmain tokens
 * @notice Receives CCIP messages from Sepolia and mints BETmain tokens 1:1
 */
contract AvalancheCCIPBridge is CCIPReceiver, ReentrancyGuard, Ownable {
    
    IBETmainToken public immutable betmainToken;
    IRouterClient private immutable ccipRouter;
    
    // Chain selectors
    uint64 public constant AVALANCHE_FUJI_SELECTOR = 14767482510784806043;
    uint64 public constant SEPOLIA_SELECTOR = 16015286601757825753;
    
    // Chain identifier for BETmain token
    bytes32 public constant SEPOLIA_CHAIN = keccak256("ETHEREUM_SEPOLIA");
    
    // Sepolia gateway contract
    address public sepoliaGatewayContract;
    
    // State tracking
    mapping(bytes32 => bool) public processedMessages;
    mapping(address => uint256) public userDepositsFromSepolia;
    uint256 public totalDepositsFromSepolia;
    
    // Events
    event DepositProcessed(
        address indexed user,
        uint256 amount,
        bytes32 messageId
    );
    
    event WithdrawalInitiated(
        address indexed user,
        uint256 amount,
        bytes32 messageId
    );
    
    event MessageProcessed(bytes32 indexed messageId);
    
    constructor(
        address _ccipRouter,
        address _betmainToken,
        address _sepoliaGatewayContract
    ) CCIPReceiver(_ccipRouter) Ownable(msg.sender) {
        ccipRouter = IRouterClient(_ccipRouter);
        betmainToken = IBETmainToken(_betmainToken);
        sepoliaGatewayContract = _sepoliaGatewayContract;
    }
    
    /**
     * @dev Receive CCIP message from Sepolia (deposits)
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        require(message.sourceChainSelector == SEPOLIA_SELECTOR, "Invalid source chain");
        require(
            abi.decode(message.sender, (address)) == sepoliaGatewayContract,
            "Invalid sender contract"
        );
        require(!processedMessages[message.messageId], "Message already processed");
        
        processedMessages[message.messageId] = true;
        
        // Decode deposit data
        (address user, uint256 amount) = abi.decode(message.data, (address, uint256));
        
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Invalid amount");
        
        // Track deposits
        userDepositsFromSepolia[user] += amount;
        totalDepositsFromSepolia += amount;
        
        // Mint BETmain tokens 1:1 with deposited ETH
        betmainToken.mintFromDeposit(SEPOLIA_CHAIN, amount, user);
        
        emit DepositProcessed(user, amount, message.messageId);
        emit MessageProcessed(message.messageId);
    }
    
    /**
     * @dev Initiate withdrawal back to Sepolia
     * @param amount Amount of BETmain tokens to burn (user gets equivalent ETH on Sepolia)
     */
    function withdrawToSepolia(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");
        require(
            userDepositsFromSepolia[msg.sender] >= amount,
            "Insufficient deposits from Sepolia"
        );
        require(sepoliaGatewayContract != address(0), "Sepolia contract not set");
        
        // Burn BETmain tokens
        betmainToken.burnForWithdrawal(SEPOLIA_CHAIN, amount, msg.sender);
        
        // Update tracking
        userDepositsFromSepolia[msg.sender] -= amount;
        totalDepositsFromSepolia -= amount;
        
        // Prepare CCIP message to send back to Sepolia
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(sepoliaGatewayContract),
            data: abi.encode(msg.sender, amount),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0) // Pay fees in native AVAX
        });
        
        // Calculate CCIP fee
        uint256 ccipFee = ccipRouter.getFee(SEPOLIA_SELECTOR, message);
        require(address(this).balance >= ccipFee, "Insufficient AVAX for CCIP fee");
        
        // Send CCIP message
        bytes32 messageId = ccipRouter.ccipSend{value: ccipFee}(
            SEPOLIA_SELECTOR,
            message
        );
        
        emit WithdrawalInitiated(msg.sender, amount, messageId);
    }
    
    /**
     * @dev Get withdrawal fee (CCIP fee in AVAX)
     */
    function getWithdrawalFee(uint256 amount) external view returns (uint256) {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(sepoliaGatewayContract),
            data: abi.encode(msg.sender, amount),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0)
        });
        
        return ccipRouter.getFee(SEPOLIA_SELECTOR, message);
    }
    
    /**
     * @dev Get user's deposits from Sepolia
     */
    function getUserDepositsFromSepolia(address user) external view returns (uint256) {
        return userDepositsFromSepolia[user];
    }
    
    /**
     * @dev Update Sepolia gateway contract address
     */
    function updateSepoliaGatewayContract(address _newContract) external onlyOwner {
        require(_newContract != address(0), "Invalid contract address");
        sepoliaGatewayContract = _newContract;
    }
    
    /**
     * @dev Check if message was processed
     */
    function isMessageProcessed(bytes32 messageId) external view returns (bool) {
        return processedMessages[messageId];
    }
    
    /**
     * @dev Get bridge statistics
     */
    function getBridgeStats() external view returns (
        uint256 totalDeposits,
        uint256 totalUniqueUsers,
        address betmainTokenAddress,
        address sepoliaGateway
    ) {
        // Note: totalUniqueUsers would need a counter in production
        return (
            totalDepositsFromSepolia,
            0, // Placeholder
            address(betmainToken),
            sepoliaGatewayContract
        );
    }
    
    /**
     * @dev Fund contract with AVAX for CCIP fees
     */
    function fundForCCIPFees() external payable {
        // Allow anyone to fund the contract for CCIP withdrawal fees
    }
    
    /**
     * @dev Emergency withdraw AVAX (owner only)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Get contract AVAX balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Allow contract to receive AVAX
    receive() external payable {}
}