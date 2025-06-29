// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PrizeOracle
 * @dev Simple oracle implementation focused on prize distribution calculation
 * @notice This oracle receives final AI scores from your external AI store and calculates
 * prize distribution using the confidence-weighted formula
 */
contract PrizeOracle is ReentrancyGuard, Ownable, Pausable {
    
    // Prize distribution result
    struct PrizeDistribution {
        uint256 competitionId;
        address participant;
        uint256 finalScore; // Final score from AI store (0-100)
        uint256 rewardAmount; // Calculated reward amount
        uint256 timestamp;
        bool distributed;
    }
    
    // Competition settlement data
    struct SettlementData {
        uint256 competitionId;
        uint256 totalPool;
        uint256 participantCount;
        uint256 protocolFee;
        uint256 creatorBonus;
        bool settled;
        uint256 settlementTimestamp;
    }
    
    // Oracle configuration
    uint256 public protocolFeeRate = 250; // 2.5% (basis points)
    uint256 public creatorBonusRate = 500; // 5% bonus for pool creation
    uint256 public minScoreThreshold = 0; // Minimum score to receive rewards (0 = all participants)
    
    // Storage
    mapping(uint256 => mapping(address => PrizeDistribution)) public prizeDistributions;
    mapping(uint256 => SettlementData) public settlements;
    mapping(uint256 => address[]) public competitionParticipants;
    mapping(uint256 => bool) public scoresSubmitted;
    mapping(address => bool) public authorizedCallers;
    
    // Events
    event ScoresSubmitted(
        uint256 indexed competitionId,
        uint256 participantCount,
        uint256 timestamp
    );
    
    event PrizesCalculated(
        uint256 indexed competitionId,
        uint256 totalPrizePool,
        uint256 winnerCount,
        uint256 timestamp
    );
    
    event CompetitionSettled(
        uint256 indexed competitionId,
        uint256 totalDistributed,
        uint256 timestamp
    );
    
    event ConfigurationUpdated(
        uint256 protocolFeeRate,
        uint256 creatorBonusRate,
        uint256 minScoreThreshold
    );
    
    constructor(address initialOwner) Ownable(msg.sender) {
        _transferOwnership(initialOwner);
        authorizedCallers[initialOwner] = true;
    }
    
    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Oracle: Not authorized");
        _;
    }
    
    /**
     * @dev Submit final scores from AI store for prize calculation
     * @param competitionId Competition identifier
     * @param participants Array of participant addresses
     * @param scores Array of final AI scores (0-100)
     * @param investments Array of participant investments
     * @param confidenceScores Array of participant confidence scores
     */
    function submitScores(
        uint256 competitionId,
        address[] memory participants,
        uint256[] memory scores,
        uint256[] memory investments,
        uint256[] memory confidenceScores
    ) external onlyAuthorized nonReentrant whenNotPaused {
        require(participants.length > 0, "Oracle: No participants");
        require(
            participants.length == scores.length &&
            scores.length == investments.length &&
            investments.length == confidenceScores.length,
            "Oracle: Array length mismatch"
        );
        require(!scoresSubmitted[competitionId], "Oracle: Scores already submitted");
        
        // Store participant data
        competitionParticipants[competitionId] = participants;
        
        // Store prize distributions with initial data
        for (uint256 i = 0; i < participants.length; i++) {
            require(scores[i] <= 100, "Oracle: Invalid score");
            require(confidenceScores[i] <= 100, "Oracle: Invalid confidence");
            
            prizeDistributions[competitionId][participants[i]] = PrizeDistribution({
                competitionId: competitionId,
                participant: participants[i],
                finalScore: scores[i],
                rewardAmount: 0, // Will be calculated later
                timestamp: block.timestamp,
                distributed: false
            });
        }
        
        scoresSubmitted[competitionId] = true;
        
        emit ScoresSubmitted(competitionId, participants.length, block.timestamp);
    }
    
    /**
     * @dev Calculate prize distribution using confidence-weighted formula
     * @param competitionId Competition identifier
     * @param totalPool Total prize pool amount
     * @param creatorAddress Competition creator address
     * @return participants Array of participant addresses
     * @return rewards Array of calculated reward amounts
     */
    function calculatePrizeDistribution(
        uint256 competitionId,
        uint256 totalPool,
        address creatorAddress
    ) external view returns (
        address[] memory participants,
        uint256[] memory rewards
    ) {
        require(scoresSubmitted[competitionId], "Oracle: Scores not submitted");
        
        participants = competitionParticipants[competitionId];
        rewards = new uint256[](participants.length);
        
        // Calculate protocol fee
        uint256 protocolFee = (totalPool * protocolFeeRate) / 10000;
        uint256 distributionPool = totalPool - protocolFee;
        
        // Calculate total confidence weight for eligible participants
        uint256 totalConfidenceWeight = 0;
        uint256[] memory confidenceWeights = new uint256[](participants.length);
        
        for (uint256 i = 0; i < participants.length; i++) {
            PrizeDistribution memory dist = prizeDistributions[competitionId][participants[i]];
            
            // Only include participants above minimum score threshold
            if (dist.finalScore >= minScoreThreshold) {
                // Simple score-based weight for hackathon
                confidenceWeights[i] = dist.finalScore;
                totalConfidenceWeight += confidenceWeights[i];
            }
        }
        
        // Distribute rewards based on confidence weights
        if (totalConfidenceWeight > 0) {
            for (uint256 i = 0; i < participants.length; i++) {
                if (confidenceWeights[i] > 0) {
                    uint256 baseReward = (distributionPool * confidenceWeights[i]) / totalConfidenceWeight;
                    
                    // Add creator bonus if applicable
                    if (participants[i] == creatorAddress && baseReward > 0) {
                        uint256 creatorBonus = (baseReward * creatorBonusRate) / 10000;
                        rewards[i] = baseReward + creatorBonus;
                    } else {
                        rewards[i] = baseReward;
                    }
                }
            }
        }
        
        return (participants, rewards);
    }
    
    /**
     * @dev Check if competition is ready for settlement
     * @param competitionId Competition identifier
     * @return ready True if scores submitted and prizes can be calculated
     */
    function isReadyForSettlement(uint256 competitionId) 
        external 
        view 
        returns (bool ready) 
    {
        return scoresSubmitted[competitionId] && !settlements[competitionId].settled;
    }
    
    /**
     * @dev Mark competition as settled (called by factory after distribution)
     * @param competitionId Competition identifier
     * @param totalDistributed Total amount distributed
     */
    function markAsSettled(
        uint256 competitionId,
        uint256 totalDistributed
    ) external onlyAuthorized nonReentrant {
        require(scoresSubmitted[competitionId], "Oracle: Scores not submitted");
        require(!settlements[competitionId].settled, "Oracle: Already settled");
        
        // Update settlement data
        settlements[competitionId] = SettlementData({
            competitionId: competitionId,
            totalPool: totalDistributed,
            participantCount: competitionParticipants[competitionId].length,
            protocolFee: (totalDistributed * protocolFeeRate) / 10000,
            creatorBonus: 0,
            settled: true,
            settlementTimestamp: block.timestamp
        });
        
        // Mark all distributions as distributed
        address[] memory participants = competitionParticipants[competitionId];
        for (uint256 i = 0; i < participants.length; i++) {
            prizeDistributions[competitionId][participants[i]].distributed = true;
        }
        
        emit CompetitionSettled(competitionId, totalDistributed, block.timestamp);
    }
    
    /**
     * @dev Get participant's final reward amount
     * @param competitionId Competition identifier
     * @param participant Participant address
     * @return reward Final reward amount
     */
    function getParticipantReward(uint256 competitionId, address participant)
        external
        view
        returns (uint256 reward)
    {
        return prizeDistributions[competitionId][participant].rewardAmount;
    }
    
    /**
     * @dev Check if oracle is operational
     * @return operational True if oracle is ready
     */
    function isOperational() external view returns (bool operational) {
        return !paused();
    }
    
    /**
     * @dev Get oracle configuration
     * @return _protocolFeeRate Current protocol fee rate (basis points)
     * @return _creatorBonusRate Creator bonus rate (basis points)
     * @return _minScoreThreshold Minimum score for rewards
     */
    function getOracleConfig() 
        external 
        view 
        returns (
            uint256 _protocolFeeRate,
            uint256 _creatorBonusRate,
            uint256 _minScoreThreshold
        )
    {
        return (protocolFeeRate, creatorBonusRate, minScoreThreshold);
    }
    
    /**
     * @dev Set authorized caller (owner only)
     * @param caller Address to authorize/deauthorize
     * @param authorized Whether to authorize or deauthorize
     */
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        require(caller != address(0), "Oracle: Zero address");
        authorizedCallers[caller] = authorized;
    }
    
    /**
     * @dev Update oracle configuration (owner only)
     * @param _protocolFeeRate New protocol fee rate (max 10%)
     * @param _creatorBonusRate New creator bonus rate (max 20%)
     * @param _minScoreThreshold New minimum score threshold
     */
    function updateConfiguration(
        uint256 _protocolFeeRate,
        uint256 _creatorBonusRate,
        uint256 _minScoreThreshold
    ) external onlyOwner {
        require(_protocolFeeRate <= 1000, "Oracle: Protocol fee too high"); // Max 10%
        require(_creatorBonusRate <= 2000, "Oracle: Creator bonus too high"); // Max 20%
        require(_minScoreThreshold <= 100, "Oracle: Invalid threshold");
        
        protocolFeeRate = _protocolFeeRate;
        creatorBonusRate = _creatorBonusRate;
        minScoreThreshold = _minScoreThreshold;
        
        emit ConfigurationUpdated(_protocolFeeRate, _creatorBonusRate, _minScoreThreshold);
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
     * @dev Get comprehensive oracle status
     * @return operational Whether oracle is operational
     * @return totalCompetitions Number of competitions processed
     * @return currentConfig Current configuration parameters
     */
    function getOracleStatus() external view returns (
        bool operational,
        uint256 totalCompetitions,
        uint256[3] memory currentConfig
    ) {
        operational = !paused();
        totalCompetitions = 0; // Placeholder for hackathon
        
        currentConfig[0] = protocolFeeRate;
        currentConfig[1] = creatorBonusRate;
        currentConfig[2] = minScoreThreshold;
        
        return (operational, totalCompetitions, currentConfig);
    }
}