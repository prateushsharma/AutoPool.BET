// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ITeleporterMessenger, TeleporterMessageInput, TeleporterFeeInfo} from "@avalabs/teleporter/contracts/interfaces/ITeleporterMessenger.sol";
import {ITeleporterReceiver} from "@avalabs/teleporter/contracts/interfaces/ITeleporterReceiver.sol";

contract DispatchParticipation is ITeleporterReceiver {
    
    // ============ CHAIN CONSTANTS ============
    string private constant SOURCE_CHAIN_NAME = "DISPATCH";
    
    // Teleporter Configuration
    ITeleporterMessenger public immutable teleporterMessenger;
    
    // Avalanche C-Chain Fuji Blockchain ID
    bytes32 public constant AVALANCHE_FUJI_BLOCKCHAIN_ID = 0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5;
    
    address public avalancheCompetitionFactory;
    address public owner;
    
    // Conversion rate: 1 AVAX = 1000 BETmain
    uint256 public constant AVAX_TO_BETMAIN_RATE = 1000;
    
    // Gas limit for Teleporter execution (much lower than CCIP)
    uint256 public teleporterGasLimit = 500000;
    
    // Minimum participation amount
    uint256 public minimumAvaxAmount = 0.01 ether;
    
    // Tracking cross-chain messages
    mapping(bytes32 => bool) public processedMessages;
    mapping(address => uint256) public userParticipations;
    
    // Statistics
    uint256 public totalParticipations;
    uint256 public totalAvaxSent;
    
    // Events
    event CrossChainParticipationSent(
        address indexed participant,
        uint256 indexed competitionId,
        uint256 avaxAmount,
        uint256 betmainAmount,
        uint256 confidence,
        bytes32 messageId
    );
    
    event TeleporterMessageReceived(
        bytes32 indexed messageId,
        address indexed sourceAddress,
        bytes message
    );
    
    event AvalancheFactoryUpdated(address newFactory);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Errors
    error InsufficientAVAXAmount();
    error InvalidConfidence();
    error InvalidCompetitionFactory();
    error MessageSendFailed();
    error UnauthorizedTeleporterMessage();
    error MessageAlreadyProcessed();
    error OnlyOwner();
    error ZeroAddress();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    constructor(
        address _teleporterMessenger,
        address _avalancheCompetitionFactory
    ) {
        if (_teleporterMessenger == address(0)) revert ZeroAddress();
        
        teleporterMessenger = ITeleporterMessenger(_teleporterMessenger);
        avalancheCompetitionFactory = _avalancheCompetitionFactory;
        owner = msg.sender;
        
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    /**
     * @dev Join competition from Dispatch with AVAX
     * Ultra-fast native Avalanche interchain messaging (~2-5 seconds)
     */
    function joinCompetitionWithAVAX(
        uint256 competitionId,
        uint256 confidence
    ) external payable {
        // Validate inputs
        if (msg.value < minimumAvaxAmount) revert InsufficientAVAXAmount();
        if (confidence == 0 || confidence > 100) revert InvalidConfidence();
        if (avalancheCompetitionFactory == address(0)) revert InvalidCompetitionFactory();
        
        // Calculate BETmain equivalent
        uint256 betmainAmount = (msg.value * AVAX_TO_BETMAIN_RATE * 10**18) / 1 ether;
        
        // Prepare cross-chain message with consistent chain naming
        bytes memory messageData = abi.encode(
            msg.sender,           // participant address
            competitionId,        // competition to join
            betmainAmount,        // BETmain tokens to mint
            confidence,           // participant confidence (1-100)
            SOURCE_CHAIN_NAME     // "DISPATCH" - matches EnhancedCompetitionFactory mapping
        );
        
        // Prepare Teleporter message using official structs
        TeleporterMessageInput memory teleporterMessage = TeleporterMessageInput({
            destinationBlockchainID: AVALANCHE_FUJI_BLOCKCHAIN_ID,
            destinationAddress: avalancheCompetitionFactory,
            feeInfo: TeleporterFeeInfo({
                feeTokenAddress: address(0), // Use native AVAX for fees
                amount: 0 // Minimal fee, auto-calculated by Teleporter
            }),
            requiredGasLimit: teleporterGasLimit,
            allowedRelayerAddresses: new address[](0), // Allow any relayer
            message: messageData
        });
        
        // Send Teleporter message (typically costs ~$0.01-0.05 and takes 2-5 seconds)
        bytes32 messageId;
        try teleporterMessenger.sendCrossChainMessage(teleporterMessage) returns (bytes32 _messageId) {
            messageId = _messageId;
        } catch {
            revert MessageSendFailed();
        }
        
        // Update statistics
        userParticipations[msg.sender] += betmainAmount;
        totalParticipations++;
        totalAvaxSent += msg.value;
        
        emit CrossChainParticipationSent(
            msg.sender,
            competitionId,
            msg.value,
            betmainAmount,
            confidence,
            messageId
        );
        
        // Note: AVAX stays in this contract as backing for BETmain tokens
    }
    
    /**
     * @dev Receive Teleporter messages (required by ITeleporterReceiver)
     */
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external override {
        // Only accept messages from registered Teleporter messenger
        if (msg.sender != address(teleporterMessenger)) {
            revert UnauthorizedTeleporterMessage();
        }
        
        // Generate message ID for tracking
        bytes32 messageId = keccak256(abi.encodePacked(sourceBlockchainID, originSenderAddress, message));
        
        // Prevent replay attacks
        if (processedMessages[messageId]) {
            revert MessageAlreadyProcessed();
        }
        processedMessages[messageId] = true;
        
        emit TeleporterMessageReceived(messageId, originSenderAddress, message);
    }
    
    /**
     * @dev Get participation cost estimate (Teleporter fees are much lower than CCIP)
     */
    function getParticipationCost(uint256 avaxAmount) external view returns (uint256 totalCost, uint256 teleporterFee, uint256 actualParticipation) {
        if (avalancheCompetitionFactory == address(0)) {
            return (0, 0, 0);
        }
        
        // Calculate BETmain amount
        uint256 betmainAmount = (avaxAmount * AVAX_TO_BETMAIN_RATE * 10**18) / 1 ether;
        
        // Prepare dummy message for fee estimation
        bytes memory messageData = abi.encode(
            address(0),
            0,
            betmainAmount,
            50,
            SOURCE_CHAIN_NAME
        );
        
        TeleporterMessageInput memory teleporterMessage = TeleporterMessageInput({
            destinationBlockchainID: AVALANCHE_FUJI_BLOCKCHAIN_ID,
            destinationAddress: avalancheCompetitionFactory,
            feeInfo: TeleporterFeeInfo({
                feeTokenAddress: address(0),
                amount: 0
            }),
            requiredGasLimit: teleporterGasLimit,
            allowedRelayerAddresses: new address[](0),
            message: messageData
        });
        
        // Get fee from Teleporter (typically very low)
        teleporterFee = teleporterMessenger.getFeeAmount(teleporterMessage);
        totalCost = avaxAmount + teleporterFee;
        actualParticipation = avaxAmount;
    }
    
    /**
     * @dev Update Avalanche competition factory address (owner only)
     */
    function updateAvalancheFactory(address newFactory) external onlyOwner {
        avalancheCompetitionFactory = newFactory;
        emit AvalancheFactoryUpdated(newFactory);
    }
    
    /**
     * @dev Update Teleporter gas limit (owner only)
     */
    function updateTeleporterGasLimit(uint256 newGasLimit) external onlyOwner {
        teleporterGasLimit = newGasLimit;
    }
    
    /**
     * @dev Get current chain name (for verification)
     */
    function getSourceChainName() external pure returns (string memory) {
        return SOURCE_CHAIN_NAME;
    }
    
    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalParticipations,
        uint256 _totalAvaxSent,
        uint256 _contractBalance
    ) {
        return (totalParticipations, totalAvaxSent, address(this).balance);
    }
    
    /**
     * @dev Get factory address (debug function)
     */
    function getFactoryAddress() external view returns (address) {
        return avalancheCompetitionFactory;
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @dev Emergency function to receive AVAX
     */
    receive() external payable {}
    
    /**
     * @dev Emergency withdrawal function (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    /**
     * @dev Get contract AVAX balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}