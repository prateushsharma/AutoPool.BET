// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IBETmainToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
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
 * @title CompetitionFactory
 * @dev Simplified factory for creating AI strategy betting competitions
 * @notice Creator-as-competitor model where pool creators must participate with their own strategies
 */
contract CompetitionFactory is ReentrancyGuard, Ownable, Pausable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _competitionIds;
    
    // Protocol tokens and oracles
    IBETmainToken public immutable betmainToken;
    IPrizeOracle public immutable prizeOracle;
    
    // Protocol settings
    uint256 public constant MIN_COMPETITION_DURATION = 1 hours; // 1 hour for testing
    uint256 public constant MAX_COMPETITION_DURATION = 7 days;
    uint256 public constant MIN_CREATOR_INVESTMENT = 10 * 10**18; // 10 BETmain
    uint256 public constant MAX_PARTICIPANT_PERCENTAGE = 50; // 50% max per participant
    
    // Competition structure
    struct Competition {
        uint256 id;
        address creator;
        string title;
        string description;
        string category;
        uint256 startTime;
        uint256 endTime;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 totalPool;
        uint256 participantCount;
        bool settled;
        bool active;
    }
    
    // Participant data
    struct Participant {
        address player;
        uint256 investment;
        string strategy;
        uint256 confidenceScore; // 1-100
        uint256 timestamp;
        bool settled;
    }
    
    // Storage
    mapping(uint256 => Competition) public competitions;
    mapping(uint256 => mapping(address => Participant)) public participants;
    mapping(uint256 => address[]) public competitionParticipants;
    mapping(address => uint256[]) public userCompetitions;
    
    // Events
    event CompetitionCreated(
        uint256 indexed competitionId,
        address indexed creator,
        string title,
        uint256 startTime,
        uint256 endTime,
        uint256 minInvestment
    );
    
    event ParticipantJoined(
        uint256 indexed competitionId,
        address indexed participant,
        uint256 investment,
        uint256 confidenceScore
    );
    
    event CompetitionSettled(
        uint256 indexed competitionId,
        uint256 totalRewards,
        uint256 winnerCount
    );
    
    event ScoresSubmitted(
        uint256 indexed competitionId,
        uint256 participantCount
    );
    
    constructor(
        address _betmainToken,
        address _prizeOracle,
        address initialOwner
    ) Ownable(msg.sender) {
        require(_betmainToken != address(0), "Factory: Zero BETmain address");
        require(_prizeOracle != address(0), "Factory: Zero oracle address");
        
        betmainToken = IBETmainToken(_betmainToken);
        prizeOracle = IPrizeOracle(_prizeOracle);
        _transferOwnership(initialOwner);
    }
    
    /**
     * @dev Create new competition with creator strategy
     * @param title Competition title
     * @param description Detailed description
     * @param category Competition category
     * @param duration Duration in seconds
     * @param minInvestment Minimum investment per participant
     * @param maxInvestment Maximum investment per participant
     * @param creatorStrategy Creator's strategy text
     * @param creatorConfidence Creator's confidence score (1-100)
     * @param creatorInvestment Creator's investment amount
     */
    function createCompetition(
        string memory title,
        string memory description,
        string memory category,
        uint256 duration,
        uint256 minInvestment,
        uint256 maxInvestment,
        string memory creatorStrategy,
        uint256 creatorConfidence,
        uint256 creatorInvestment
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(bytes(title).length > 0, "Factory: Empty title");
        require(bytes(creatorStrategy).length > 0, "Factory: Empty creator strategy");
        require(duration >= MIN_COMPETITION_DURATION, "Factory: Duration too short");
        require(duration <= MAX_COMPETITION_DURATION, "Factory: Duration too long");
        require(minInvestment > 0, "Factory: Zero min investment");
        require(maxInvestment >= minInvestment, "Factory: Invalid max investment");
        require(creatorInvestment >= MIN_CREATOR_INVESTMENT, "Factory: Creator investment too low");
        require(creatorInvestment >= minInvestment, "Factory: Creator below min investment");
        require(creatorInvestment <= maxInvestment, "Factory: Creator above max investment");
        require(creatorConfidence >= 1 && creatorConfidence <= 100, "Factory: Invalid confidence");
        
        // Transfer creator investment
        require(
            betmainToken.transferFrom(msg.sender, address(this), creatorInvestment),
            "Factory: Transfer failed"
        );
        
        _competitionIds.increment();
        uint256 competitionId = _competitionIds.current();
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        // Create competition
        Competition storage competition = competitions[competitionId];
        competition.id = competitionId;
        competition.creator = msg.sender;
        competition.title = title;
        competition.description = description;
        competition.category = category;
        competition.startTime = startTime;
        competition.endTime = endTime;
        competition.minInvestment = minInvestment;
        competition.maxInvestment = maxInvestment;
        competition.totalPool = creatorInvestment;
        competition.participantCount = 1; // Creator is first participant
        competition.settled = false;
        competition.active = true;
        
        // Add creator as participant
        Participant storage creatorParticipant = participants[competitionId][msg.sender];
        creatorParticipant.player = msg.sender;
        creatorParticipant.investment = creatorInvestment;
        creatorParticipant.strategy = creatorStrategy;
        creatorParticipant.confidenceScore = creatorConfidence;
        creatorParticipant.timestamp = block.timestamp;
        creatorParticipant.settled = false;
        
        competitionParticipants[competitionId].push(msg.sender);
        userCompetitions[msg.sender].push(competitionId);
        
        emit CompetitionCreated(
            competitionId,
            msg.sender,
            title,
            startTime,
            endTime,
            minInvestment
        );
        
        return competitionId;
    }
    
    /**
     * @dev Join competition as participant
     * @param competitionId ID of competition to join
     * @param strategy Participant's strategy text
     * @param confidenceScore Participant's confidence (1-100)
     * @param investment Investment amount
     */
    function joinCompetition(
        uint256 competitionId,
        string memory strategy,
        uint256 confidenceScore,
        uint256 investment
    ) external nonReentrant whenNotPaused {
        Competition storage competition = competitions[competitionId];
        require(competition.active, "Factory: Competition not active");
        require(block.timestamp < competition.endTime, "Factory: Competition ended");
        require(participants[competitionId][msg.sender].player == address(0), "Factory: Already joined");
        require(bytes(strategy).length > 0, "Factory: Empty strategy");
        require(confidenceScore >= 1 && confidenceScore <= 100, "Factory: Invalid confidence");
        require(investment >= competition.minInvestment, "Factory: Below min investment");
        require(investment <= competition.maxInvestment, "Factory: Above max investment");
        
        // Check maximum percentage per participant
        uint256 newTotalPool = competition.totalPool + investment;
        require(
            (investment * 100) / newTotalPool <= MAX_PARTICIPANT_PERCENTAGE,
            "Factory: Investment too large percentage"
        );
        
        // Transfer investment
        require(
            betmainToken.transferFrom(msg.sender, address(this), investment),
            "Factory: Transfer failed"
        );
        
        // Add participant
        Participant storage participant = participants[competitionId][msg.sender];
        participant.player = msg.sender;
        participant.investment = investment;
        participant.strategy = strategy;
        participant.confidenceScore = confidenceScore;
        participant.timestamp = block.timestamp;
        participant.settled = false;
        
        competitionParticipants[competitionId].push(msg.sender);
        userCompetitions[msg.sender].push(competitionId);
        
        // Update competition stats
        competition.totalPool += investment;
        competition.participantCount += 1;
        
        emit ParticipantJoined(competitionId, msg.sender, investment, confidenceScore);
    }
    
    /**
     * @dev Submit AI scores from external AI store
     * @param competitionId Competition to settle
     * @param scores Array of AI scores from your AI store (0-100)
     */
    function submitAIScores(
        uint256 competitionId,
        uint256[] memory scores
    ) external nonReentrant {
        require(msg.sender == owner(), "Factory: Only owner can submit scores");
        
        Competition storage competition = competitions[competitionId];
        require(competition.active, "Factory: Competition not active");
        require(block.timestamp >= competition.endTime, "Factory: Competition not ended");
        require(!competition.settled, "Factory: Already settled");
        
        address[] memory players = competitionParticipants[competitionId];
        require(scores.length == players.length, "Factory: Scores length mismatch");
        
        // Collect participant data
        uint256[] memory investments = new uint256[](players.length);
        uint256[] memory confidenceScores = new uint256[](players.length);
        
        for (uint256 i = 0; i < players.length; i++) {
            Participant storage participant = participants[competitionId][players[i]];
            investments[i] = participant.investment;
            confidenceScores[i] = participant.confidenceScore;
        }
        
        // Submit scores to oracle for prize calculation
        prizeOracle.submitScores(
            competitionId,
            players,
            scores,
            investments,
            confidenceScores
        );
        
        emit ScoresSubmitted(competitionId, competition.participantCount);
    }
    
    /**
     * @dev Settle competition based on oracle prize calculation
     * @param competitionId Competition to settle
     */
    function settleCompetition(uint256 competitionId) external nonReentrant {
        Competition storage competition = competitions[competitionId];
        require(competition.active, "Factory: Competition not active");
        require(!competition.settled, "Factory: Already settled");
        require(prizeOracle.isReadyForSettlement(competitionId), "Factory: Not ready for settlement");
        
        // Get prize distribution from oracle
        (address[] memory participants_list, uint256[] memory rewards) = prizeOracle.calculatePrizeDistribution(
            competitionId,
            competition.totalPool,
            competition.creator
        );
        
        uint256 totalDistributed = 0;
        uint256 winnerCount = 0;
        
        // Distribute rewards
        for (uint256 i = 0; i < participants_list.length; i++) {
            if (rewards[i] > 0) {
                betmainToken.transfer(participants_list[i], rewards[i]);
                totalDistributed += rewards[i];
                winnerCount++;
            }
            
            // Mark participant as settled
            Participant storage participant = participants[competitionId][participants_list[i]];
            participant.settled = true;
        }
        
        // Mark competition as settled
        competition.settled = true;
        competition.active = false;
        
        // Notify oracle
        prizeOracle.markAsSettled(competitionId, totalDistributed);
        
        emit CompetitionSettled(competitionId, totalDistributed, winnerCount);
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
    function getParticipant(uint256 competitionId, address player) external view returns (Participant memory) {
        return participants[competitionId][player];
    }
    
    /**
     * @dev Get all participants in competition
     */
    function getCompetitionParticipants(uint256 competitionId) external view returns (address[] memory) {
        return competitionParticipants[competitionId];
    }
    
    /**
     * @dev Get user's competitions
     */
    function getUserCompetitions(address user) external view returns (uint256[] memory) {
        return userCompetitions[user];
    }
    
    /**
     * @dev Get current competition count
     */
    function getCurrentCompetitionId() external view returns (uint256) {
        return _competitionIds.current();
    }
    
    /**
     * @dev Get all participant strategies for a competition (for AI evaluation)
     */
    function getCompetitionStrategies(uint256 competitionId) external view returns (
        address[] memory participants_list,
        string[] memory strategies,
        uint256[] memory investments,
        uint256[] memory confidenceScores
    ) {
        participants_list = competitionParticipants[competitionId];
        strategies = new string[](participants_list.length);
        investments = new uint256[](participants_list.length);
        confidenceScores = new uint256[](participants_list.length);
        
        for (uint256 i = 0; i < participants_list.length; i++) {
            Participant storage participant = participants[competitionId][participants_list[i]];
            strategies[i] = participant.strategy;
            investments[i] = participant.investment;
            confidenceScores[i] = participant.confidenceScore;
        }
        
        return (participants_list, strategies, investments, confidenceScores);
    }
    
    /**
     * @dev Emergency pause (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(betmainToken.transfer(owner(), amount), "Factory: Transfer failed");
    }
}