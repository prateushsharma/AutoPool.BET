// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

interface IBETmainToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function mintFromDeposit(bytes32 chain, uint256 amount, address recipient) external;
}

interface IPrizeOracle {
    function submitScores(
        uint256 competitionId,
        address[] memory participants,
        uint256[] memory scores,
        uint256[] memory investments,
        uint256[] memory confidenceScores
    ) external;
    
    function calculatePrizeDistribution(
        uint256 competitionId,
        uint256 totalPool,
        address creatorAddress
    ) external view returns (
        address[] memory participants,
        uint256[] memory rewards
    );
    
    function isReadyForSettlement(uint256 competitionId) external view returns (bool);
    function markAsSettled(uint256 competitionId, uint256 totalDistributed) external;
}

/**
 * @title EnhancedCompetitionFactory
 * @dev Competition factory with cross-chain participation support
 * @notice Receives CCIP messages from other chains for automatic participation
 */
contract EnhancedCompetitionFactory is CCIPReceiver {
    
    IBETmainToken public betmainToken;
    IPrizeOracle public prizeOracle;
    address public owner;
    
    uint256 public constant MIN_INVESTMENT = 10 * 10**18; // 10 BETmain
    
    // Chain identifiers
    bytes32 public constant SEPOLIA_CHAIN = keccak256("ETHEREUM_SEPOLIA");
    bytes32 public constant DISPATCH_CHAIN = keccak256("DISPATCH");
    uint64 public constant SEPOLIA_CCIP_SELECTOR = 16015286601757825753;
    
    // Competition structure
    struct Competition {
        uint256 id;
        address creator;
        string title;
        uint256 totalPool;
        uint256 participantCount;
        bool closed;
        bool settled;
    }
    
    // Participant structure
    struct Participant {
        address player;
        uint256 investment;
        uint256 confidenceScore;
        string sourceChain; // Track which chain they came from
        bool settled;
    }
    
    // Storage
    mapping(uint256 => Competition) public competitions;
    mapping(uint256 => mapping(address => Participant)) public participants;
    mapping(uint256 => address[]) public competitionParticipants;
    mapping(bytes32 => bool) public processedMessages;
    
    // Authorized cross-chain contracts
    mapping(uint64 => address) public authorizedSenders; // chainSelector => senderAddress
    
    // Events
    event CompetitionCreated(uint256 indexed competitionId, address indexed creator, string title);
    event ParticipantJoined(uint256 indexed competitionId, address indexed participant, uint256 investment, string sourceChain);
    event CrossChainParticipantJoined(uint256 indexed competitionId, address indexed participant, string sourceChain);
    event CompetitionClosed(uint256 indexed competitionId);
    event CompetitionSettled(uint256 indexed competitionId, uint256 totalRewards);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(
        address _betmainToken,
        address _prizeOracle,
        address _ccipRouter
    ) CCIPReceiver(_ccipRouter) {
        betmainToken = IBETmainToken(_betmainToken);
        prizeOracle = IPrizeOracle(_prizeOracle);
        owner = msg.sender;
        
        // Set authorized senders (will be updated after deployment)
        // authorizedSenders[SEPOLIA_CCIP_SELECTOR] = sepoliaParticipationContract;
    }
    
    /**
     * @dev Create competition (native Avalanche users)
     */
    function createCompetition(
        uint256 competitionId,
        string memory title,
        uint256 investment,
        uint256 confidence
    ) external returns (uint256) {
        require(competitionId > 0, "Invalid competition ID");
        require(competitions[competitionId].id == 0, "Competition ID already exists");
        require(bytes(title).length > 0, "Empty title");
        require(investment >= MIN_INVESTMENT, "Below min investment");
        require(confidence >= 1 && confidence <= 100, "Invalid confidence");
        
        // Transfer tokens
        require(betmainToken.transferFrom(msg.sender, address(this), investment), "Transfer failed");
        
        // Create competition
        competitions[competitionId] = Competition({
            id: competitionId,
            creator: msg.sender,
            title: title,
            totalPool: investment,
            participantCount: 1,
            closed: false,
            settled: false
        });
        
        // Add creator as participant
        participants[competitionId][msg.sender] = Participant({
            player: msg.sender,
            investment: investment,
            confidenceScore: confidence,
            sourceChain: "AVALANCHE",
            settled: false
        });
        
        competitionParticipants[competitionId].push(msg.sender);
        
        emit CompetitionCreated(competitionId, msg.sender, title);
        return competitionId;
    }
    
    /**
     * @dev Join competition (native Avalanche users)
     */
    function joinCompetition(
        uint256 competitionId,
        uint256 investment,
        uint256 confidence
    ) external {
        require(competitions[competitionId].id != 0, "Competition not found");
        require(!competitions[competitionId].closed, "Competition closed");
        require(participants[competitionId][msg.sender].player == address(0), "Already joined");
        require(investment >= MIN_INVESTMENT, "Below min investment");
        require(confidence >= 1 && confidence <= 100, "Invalid confidence");
        
        // Transfer tokens
        require(betmainToken.transferFrom(msg.sender, address(this), investment), "Transfer failed");
        
        _addParticipant(competitionId, msg.sender, investment, confidence, "AVALANCHE");
    }
    
    /**
     * @dev Receive CCIP message from other chains
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        require(
            authorizedSenders[message.sourceChainSelector] != address(0) &&
            abi.decode(message.sender, (address)) == authorizedSenders[message.sourceChainSelector],
            "Unauthorized sender"
        );
        require(!processedMessages[message.messageId], "Message already processed");
        
        processedMessages[message.messageId] = true;
        
        // Decode cross-chain participation data
        (
            address participant,
            uint256 competitionId,
            uint256 betmainAmount,
            uint256 confidence,
            string memory sourceChain
        ) = abi.decode(message.data, (address, uint256, uint256, uint256, string));
        
        require(competitions[competitionId].id != 0, "Competition not found");
        require(!competitions[competitionId].closed, "Competition closed");
        require(participants[competitionId][participant].player == address(0), "Already joined");
        require(betmainAmount >= MIN_INVESTMENT, "Below min investment");
        require(confidence >= 1 && confidence <= 100, "Invalid confidence");
        
        // Mint BETmain tokens for cross-chain participant
        bytes32 chainId = keccak256(abi.encodePacked(sourceChain));
        betmainToken.mintFromDeposit(chainId, betmainAmount, address(this));
        
        // Add participant to competition
        _addParticipant(competitionId, participant, betmainAmount, confidence, sourceChain);
        
        emit CrossChainParticipantJoined(competitionId, participant, sourceChain);
    }
    
    /**
     * @dev Internal function to add participant
     */
    function _addParticipant(
        uint256 competitionId,
        address participant,
        uint256 investment,
        uint256 confidence,
        string memory sourceChain
    ) internal {
        // Add participant
        participants[competitionId][participant] = Participant({
            player: participant,
            investment: investment,
            confidenceScore: confidence,
            sourceChain: sourceChain,
            settled: false
        });
        
        competitionParticipants[competitionId].push(participant);
        
        // Update competition stats
        competitions[competitionId].totalPool += investment;
        competitions[competitionId].participantCount += 1;
        
        emit ParticipantJoined(competitionId, participant, investment, sourceChain);
    }
    
    /**
     * @dev Close competition manually (owner only)
     */
    function closeCompetition(uint256 competitionId) external onlyOwner {
        Competition storage comp = competitions[competitionId];
        require(comp.id != 0, "Competition not found");
        require(!comp.closed, "Already closed");
        require(!comp.settled, "Already settled");
        
        comp.closed = true;
        emit CompetitionClosed(competitionId);
    }
    
    /**
     * @dev Submit AI scores (owner only)
     */
    function submitScores(uint256 competitionId, uint256[] memory scores) external onlyOwner {
        Competition storage comp = competitions[competitionId];
        require(comp.id != 0, "Competition not found");
        require(comp.closed, "Competition not closed");
        require(!comp.settled, "Already settled");
        
        address[] memory participantList = competitionParticipants[competitionId];
        require(scores.length == participantList.length, "Length mismatch");
        
        // Prepare data for oracle
        uint256[] memory investments = new uint256[](participantList.length);
        uint256[] memory confidenceScores = new uint256[](participantList.length);
        
        for (uint256 i = 0; i < participantList.length; i++) {
            Participant memory p = participants[competitionId][participantList[i]];
            investments[i] = p.investment;
            confidenceScores[i] = p.confidenceScore;
        }
        
        // Submit to oracle
        prizeOracle.submitScores(competitionId, participantList, scores, investments, confidenceScores);
    }
    
    /**
     * @dev Settle competition
     */
    function settleCompetition(uint256 competitionId) external {
        Competition storage comp = competitions[competitionId];
        require(comp.id != 0, "Competition not found");
        require(!comp.settled, "Already settled");
        require(prizeOracle.isReadyForSettlement(competitionId), "Not ready");
        
        // Get rewards from oracle
        (address[] memory participantList, uint256[] memory rewards) = prizeOracle.calculatePrizeDistribution(
            competitionId,
            comp.totalPool,
            comp.creator
        );
        
        uint256 totalDistributed = 0;
        
        // Distribute rewards
        for (uint256 i = 0; i < participantList.length; i++) {
            if (rewards[i] > 0) {
                betmainToken.transfer(participantList[i], rewards[i]);
                totalDistributed += rewards[i];
            }
            participants[competitionId][participantList[i]].settled = true;
        }
        
        comp.settled = true;
        prizeOracle.markAsSettled(competitionId, totalDistributed);
        
        emit CompetitionSettled(competitionId, totalDistributed);
    }
    
    /**
     * @dev Set authorized sender for cross-chain messages
     */
    function setAuthorizedSender(uint64 chainSelector, address senderContract) external onlyOwner {
        authorizedSenders[chainSelector] = senderContract;
    }
    
    /**
     * @dev Get competition details
     */
    function getCompetition(uint256 competitionId) external view returns (Competition memory) {
        return competitions[competitionId];
    }
    
    /**
     * @dev Get participant details
     */
    function getParticipant(uint256 competitionId, address participant) external view returns (Participant memory) {
        return participants[competitionId][participant];
    }
    
    /**
     * @dev Get all participants
     */
    function getParticipants(uint256 competitionId) external view returns (address[] memory) {
        return competitionParticipants[competitionId];
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        betmainToken.transfer(owner, amount);
    }
}