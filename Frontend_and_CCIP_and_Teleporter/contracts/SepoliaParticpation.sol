
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SepoliaParticipation is CCIPReceiver, Ownable, ReentrancyGuard {
    
    // Chain name constant
    string private constant SOURCE_CHAIN_NAME = "SEPOLIA";
    
    // CCIP Configuration
    IRouterClient private immutable i_router;
    uint64 private constant AVALANCHE_CHAIN_SELECTOR = 14767482510784806043;
    address public avalancheCompetitionFactory;
    
    // Conversion rate: 1 ETH = 1000 BETmain
    uint256 public constant ETH_TO_BETMAIN_RATE = 1000;
    
    // Gas limit for cross-chain execution
    uint256 public ccipGasLimit = 800000;
    
    // Minimum participation amount
    uint256 public minimumEthAmount = 0.01 ether;
    
    // Statistics tracking
    uint256 public totalParticipations;
    uint256 public totalEthSent;
    mapping(address => uint256) public userParticipations;
    mapping(bytes32 => address) public messageToUser;
    
    // Events
    event CrossChainParticipationSent(
        address indexed participant,
        uint256 indexed competitionId,
        uint256 ethAmount,
        uint256 betmainAmount,
        uint256 confidence,
        bytes32 messageId
    );
    
    event CCIPGasLimitUpdated(uint256 newGasLimit);
    event AvalancheFactoryUpdated(address newFactory);
    event MinimumEthUpdated(uint256 newMinimum);
    event MessageReceived(
        uint64 indexed sourceChainSelector,
        address indexed sender,
        bytes data
    );
    
    // Errors
    error InsufficientETHAmount();
    error InsufficientETHForFees();
    error InvalidConfidence();
    error InvalidCompetitionFactory();
    error MessageSendFailed();
    
    // FIXED CONSTRUCTOR
    constructor(
        address _router,
        address _avalancheCompetitionFactory
    ) CCIPReceiver(_router) Ownable(msg.sender) {
        i_router = IRouterClient(_router);
        avalancheCompetitionFactory = _avalancheCompetitionFactory;
    }
    
    /**
     * @dev Join competition from Sepolia with ETH
     */
    function joinCompetitionWithETH(
        uint256 competitionId,
        uint256 confidence
    ) external payable nonReentrant {
        // Validate inputs
        if (msg.value < minimumEthAmount) revert InsufficientETHAmount();
        if (confidence == 0 || confidence > 100) revert InvalidConfidence();
        if (avalancheCompetitionFactory == address(0)) revert InvalidCompetitionFactory();
        
        // Calculate BETmain equivalent
        uint256 betmainAmount = (msg.value * ETH_TO_BETMAIN_RATE * 10**18) / 1 ether;
        
        // Prepare cross-chain message
        bytes memory messageData = abi.encode(
            msg.sender,           // address participant
            competitionId,        // uint256 competitionId
            betmainAmount,        // uint256 betmainAmount
            confidence,           // uint256 confidence
            SOURCE_CHAIN_NAME     // string memory sourceChainName = "SEPOLIA"
        );
        
        // Prepare CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(avalancheCompetitionFactory),
            data: messageData,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: ccipGasLimit})),
            feeToken: address(0)
        });
        
        // Calculate CCIP fees
        uint256 ccipFee = i_router.getFee(AVALANCHE_CHAIN_SELECTOR, message);
        
        // Ensure we have enough ETH to cover CCIP fees
        if (msg.value <= ccipFee) revert InsufficientETHForFees();
        
        // Send CCIP message
        bytes32 messageId;
        try i_router.ccipSend{value: ccipFee}(AVALANCHE_CHAIN_SELECTOR, message) returns (bytes32 _messageId) {
            messageId = _messageId;
        } catch {
            revert MessageSendFailed();
        }
        
        // Calculate actual ETH amount after fees
        uint256 actualEthAmount = msg.value - ccipFee;
        uint256 actualBetmainAmount = (actualEthAmount * ETH_TO_BETMAIN_RATE * 10**18) / 1 ether;
        
        // Update statistics
        userParticipations[msg.sender] += actualBetmainAmount;
        messageToUser[messageId] = msg.sender;
        totalParticipations++;
        totalEthSent += actualEthAmount;
        
        emit CrossChainParticipationSent(
            msg.sender,
            competitionId,
            actualEthAmount,
            actualBetmainAmount,
            confidence,
            messageId
        );
    }
    
    /**
     * @dev Get participation cost estimate
     */
    function getParticipationCost(uint256 ethAmount) external view returns (uint256 totalCost, uint256 ccipFee, uint256 actualParticipation) {
        if (avalancheCompetitionFactory == address(0)) {
            return (0, 0, 0); // Return zeros if not configured
        }
        
        // Calculate BETmain amount
        uint256 betmainAmount = (ethAmount * ETH_TO_BETMAIN_RATE * 10**18) / 1 ether;
        
        // Prepare dummy message
        bytes memory messageData = abi.encode(
            address(0),
            0,
            betmainAmount,
            50,
            SOURCE_CHAIN_NAME
        );
        
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(avalancheCompetitionFactory),
            data: messageData,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: ccipGasLimit})),
            feeToken: address(0)
        });
        
        ccipFee = i_router.getFee(AVALANCHE_CHAIN_SELECTOR, message);
        totalCost = ethAmount + ccipFee;
        actualParticipation = ethAmount;
    }
    
    /**
     * @dev CCIP message receiver (required by CCIPReceiver)
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        emit MessageReceived(
            message.sourceChainSelector,
            abi.decode(message.sender, (address)),
            message.data
        );
    }
    
    /**
     * @dev Update Avalanche factory address (owner only)
     */
    function updateAvalancheFactory(address newFactory) external onlyOwner {
        avalancheCompetitionFactory = newFactory;
        emit AvalancheFactoryUpdated(newFactory);
    }
    
    /**
     * @dev Get current chain name
     */
    function getSourceChainName() external pure returns (string memory) {
        return SOURCE_CHAIN_NAME;
    }
    
    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalParticipations,
        uint256 _totalEthSent,
        uint256 _contractBalance
    ) {
        return (totalParticipations, totalEthSent, address(this).balance);
    }
    
    /**
     * @dev Get avalanche factory address (debug function)
     */
    function getFactoryAddress() external view returns (address) {
        return avalancheCompetitionFactory;
    }
    
    /**
     * @dev Emergency function to receive ETH
     */
    receive() external payable {}
    
    /**
     * @dev Get contract ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}