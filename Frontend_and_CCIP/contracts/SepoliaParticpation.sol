// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SepoliaParticipation
 * @dev Allows Sepolia users to join Avalanche competitions by depositing ETH
 * @notice User deposits ETH → CCIP message → Avalanche mints BETmain → Auto-joins competition
 */
contract SepoliaParticipation is ReentrancyGuard, Ownable {
    
    IRouterClient private immutable ccipRouter;
    
    // Chain selectors
    uint64 public constant AVALANCHE_FUJI_SELECTOR = 14767482510784806043;
    
    // Avalanche competition factory address
    address public avalancheCompetitionFactory;
    
    // ETH to BETmain conversion rate (1 ETH = 1000 BETmain for demo)
    uint256 public constant ETH_TO_BETMAIN_RATE = 1000;
    
    // Participation tracking
    mapping(address => mapping(uint256 => uint256)) public userParticipations; // user => competitionId => ethAmount
    mapping(bytes32 => bool) public processedMessages;
    
    uint256 public constant MIN_ETH_DEPOSIT = 0.01 ether;
    uint256 public constant MAX_ETH_DEPOSIT = 10 ether;
    uint256 public ccipGasLimit = 500000; // Gas limit for destination execution
    
    // Events
    event ParticipationRequested(
        address indexed user,
        uint256 indexed competitionId,
        uint256 ethAmount,
        uint256 betmainEquivalent,
        uint256 confidence,
        bytes32 messageId
    );
    
    event CCIPFeePaid(uint256 fee, bytes32 messageId);
    
    constructor(
        address _ccipRouter,
        address _avalancheCompetitionFactory
    ) Ownable(msg.sender) {
        ccipRouter = IRouterClient(_ccipRouter);
        avalancheCompetitionFactory = _avalancheCompetitionFactory;
    }
    
    /**
     * @dev Join Avalanche competition by depositing ETH
     * @param competitionId Competition ID on Avalanche
     * @param confidence User's confidence score (1-100)
     */
    function joinCompetitionWithETH(
        uint256 competitionId,
        uint256 confidence
    ) external payable nonReentrant {
        require(msg.value >= MIN_ETH_DEPOSIT, "Below minimum ETH deposit");
        require(msg.value <= MAX_ETH_DEPOSIT, "Above maximum ETH deposit");
        require(confidence >= 1 && confidence <= 100, "Invalid confidence score");
        require(avalancheCompetitionFactory != address(0), "Avalanche factory not set");
        require(userParticipations[msg.sender][competitionId] == 0, "Already participated");
        
        // Calculate BETmain equivalent
        uint256 betmainAmount = msg.value * ETH_TO_BETMAIN_RATE;
        
        // Store participation
        userParticipations[msg.sender][competitionId] = msg.value;
        
        // Prepare cross-chain message data
        bytes memory messageData = abi.encode(
            msg.sender,           // participant address
            competitionId,        // competition ID
            betmainAmount,        // BETmain amount to mint
            confidence,           // confidence score
            "SEPOLIA"            // source chain identifier
        );
        
        // Prepare CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(avalancheCompetitionFactory),
            data: messageData,
            tokenAmounts: new Client.EVMTokenAmount[](0), // No token transfers, just data
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: ccipGasLimit})
            ),
            feeToken: address(0) // Pay fees in native ETH
        });
        
        // Calculate and pay CCIP fee
        uint256 ccipFee = ccipRouter.getFee(AVALANCHE_FUJI_SELECTOR, message);
        require(address(this).balance >= ccipFee, "Insufficient balance for CCIP fee");
        
        // Send CCIP message
        bytes32 messageId = ccipRouter.ccipSend{value: ccipFee}(
            AVALANCHE_FUJI_SELECTOR,
            message
        );
        
        emit ParticipationRequested(
            msg.sender,
            competitionId,
            msg.value,
            betmainAmount,
            confidence,
            messageId
        );
        
        emit CCIPFeePaid(ccipFee, messageId);
    }
    
    /**
     * @dev Get participation cost including CCIP fee
     * @param ethAmount ETH amount to deposit
     */
    function getParticipationCost(uint256 ethAmount) external view returns (
        uint256 totalCost,
        uint256 ccipFee,
        uint256 betmainEquivalent
    ) {
        require(ethAmount >= MIN_ETH_DEPOSIT, "Below minimum");
        require(ethAmount <= MAX_ETH_DEPOSIT, "Above maximum");
        
        // Calculate BETmain equivalent
        betmainEquivalent = ethAmount * ETH_TO_BETMAIN_RATE;
        
        // Calculate CCIP fee
        bytes memory messageData = abi.encode(
            msg.sender,
            1, // dummy competition ID
            betmainEquivalent,
            50, // dummy confidence
            "SEPOLIA"
        );
        
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(avalancheCompetitionFactory),
            data: messageData,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: ccipGasLimit})
            ),
            feeToken: address(0)
        });
        
        ccipFee = ccipRouter.getFee(AVALANCHE_FUJI_SELECTOR, message);
        totalCost = ethAmount + ccipFee;
        
        return (totalCost, ccipFee, betmainEquivalent);
    }
    
    /**
     * @dev Get user's participation for a competition
     */
    function getUserParticipation(address user, uint256 competitionId) external view returns (uint256) {
        return userParticipations[user][competitionId];
    }
    
    /**
     * @dev Convert ETH amount to BETmain equivalent
     */
    function ethToBetmain(uint256 ethAmount) external pure returns (uint256) {
        return ethAmount * ETH_TO_BETMAIN_RATE;
    }
    
    /**
     * @dev Update Avalanche competition factory address
     */
    function updateAvalancheFactory(address _newFactory) external onlyOwner {
        require(_newFactory != address(0), "Zero address");
        avalancheCompetitionFactory = _newFactory;
    }
    
    /**
     * @dev Update CCIP gas limit
     */
    function updateCCIPGasLimit(uint256 _newGasLimit) external onlyOwner {
        require(_newGasLimit >= 200000, "Gas limit too low");
        require(_newGasLimit <= 1000000, "Gas limit too high");
        ccipGasLimit = _newGasLimit;
    }
    
    /**
     * @dev Fund contract with ETH for CCIP fees
     */
    function fundForCCIPFees() external payable {
        // Allow anyone to fund the contract for CCIP fees
    }
    
    /**
     * @dev Get contract info
     */
    function getContractInfo() external view returns (
        address ccipRouterAddress,
        address avalancheFactory,
        uint256 ethToBetmainRate,
        uint256 minDeposit,
        uint256 maxDeposit,
        uint256 gasLimit,
        uint256 contractBalance
    ) {
        return (
            address(ccipRouter),
            avalancheCompetitionFactory,
            ETH_TO_BETMAIN_RATE,
            MIN_ETH_DEPOSIT,
            MAX_ETH_DEPOSIT,
            ccipGasLimit,
            address(this).balance
        );
    }
    
    /**
     * @dev Emergency withdraw ETH (owner only)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}