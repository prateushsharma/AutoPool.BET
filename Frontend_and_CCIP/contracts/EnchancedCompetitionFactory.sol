
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBETmainToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function mintFromDeposit(bytes32 chain, uint256 amount, address recipient) external;
    function burnForWithdrawal(bytes32 chain, uint256 amount, address user) external;
}

interface IPrizeOracle {
    function submitScores(uint256 competitionId, address[] memory participants, uint256[] memory scores, uint256[] memory investments, uint256[] memory confidences) external;
    function calculatePrizeDistribution(uint256 competitionId, uint256 totalPool, address creatorAddress) external view returns (uint256[] memory);
    function isReadyForSettlement(uint256 competitionId) external view returns (bool);
    function markAsSettled(uint256 competitionId, uint256 totalDistributed) external;
}

contract EnhancedCompetitionFactory is CCIPReceiver, Ownable, ReentrancyGuard {
    
    // ============ FIXED: PROPER BYTES32 CONSTANTS ============
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
    
    // ============ CHAIN NAME TO ID MAPPING ============
    mapping(string => bytes32) private chainNameToId;
    
    // ============ CONTRACT STATE ============
    IBETmainToken public betmainToken;
    IPrizeOracle public prizeOracle;
    
    uint256 public competitionCounter;
    uint256 public minimumInvestment = 10 * 10**18; // 10 BETmain
    
    // CCIP Configuration
    mapping(uint64 => bool) public authorizedSenders;
    mapping(uint64 => address) public chainSenders;
    
    struct Competition {
        uint256 id;
        address creator;
        string title;
        uint256 createdAt;
        uint256 totalPool;
        uint256 participantCount;
        bool isClosed;
        bool isSettled;
    }
    
    struct Participant {
        address participant;
        uint256 investment;
        uint256 confidence;
        uint256 aiScore;
        bool hasPaidOut;
    }
    
    mapping(uint256 => Competition) public competitions;
    mapping(uint256 => mapping(address => Participant)) public participants;
    mapping(uint256 => address[]) public competitionParticipants;
    
    // FIXED: Events first, then errors (no naming conflicts)
    event CompetitionCreated(uint256 indexed competitionId, address indexed creator, string title, uint256 investment, uint256 confidence);
    event ParticipantJoined(uint256 indexed competitionId, address indexed participant, uint256 investment, uint256 confidence);
    event CompetitionClosedEvent(uint256 indexed competitionId);
    event ScoresSubmitted(uint256 indexed competitionId, uint256 participantCount);
    event PrizesDistributed(uint256 indexed competitionId, uint256 totalDistributed);
    event CrossChainParticipantJoined(uint256 indexed competitionId, address indexed participant, uint256 investment, uint256 confidence, string sourceChain);
    
    // FIXED: Custom errors with proper naming
    error CompetitionNotFound();
    error CompetitionClosed();
    error AlreadyJoined();
    error InsufficientInvestment();
    error InvalidConfidence();
    error NotCompetitionCreator();
    error CompetitionNotClosed();
    error NotReadyForSettlement();
    error UnauthorizedSender();
    error InvalidChainName();
    error CompetitionAlreadyExists();
    error AlreadySettled();
    
    constructor(
        address _router,
        address _betmainToken,
        address _prizeOracle
    ) CCIPReceiver(_router) Ownable(msg.sender) {
        betmainToken = IBETmainToken(_betmainToken);
        prizeOracle = IPrizeOracle(_prizeOracle);
        
        // Initialize chain mappings
        _initializeAllChainMappings();
    }
    
    /**
     * @dev Initialize ALL chain name to ID mappings
     */
    function _initializeAllChainMappings() private {
        chainNameToId["SEPOLIA"] = SEPOLIA_CHAIN_ID;
        chainNameToId["DISPATCH"] = DISPATCH_CHAIN_ID;
        chainNameToId["ARBITRUM"] = ARBITRUM_CHAIN_ID;
        chainNameToId["POLYGON"] = POLYGON_CHAIN_ID;
        chainNameToId["BASE"] = BASE_CHAIN_ID;
        chainNameToId["OPTIMISM"] = OPTIMISM_CHAIN_ID;
        chainNameToId["ETHEREUM"] = ETHEREUM_CHAIN_ID;
        chainNameToId["AVALANCHE"] = AVALANCHE_CHAIN_ID;
        chainNameToId["BSC"] = BSC_CHAIN_ID;
        chainNameToId["FANTOM"] = FANTOM_CHAIN_ID;
    }
    
    /**
     * @dev Get chain ID by name (view function for debugging)
     */
    function getChainId(string memory chainName) external view returns (bytes32) {
        return chainNameToId[chainName];
    }
    
    /**
     * @dev Add new supported chain (owner only)
     */
    function addSupportedChain(string memory chainName, bytes32 chainId) external onlyOwner {
        chainNameToId[chainName] = chainId;
    }
    
    /**
     * @dev Create competition
     */
    function createCompetition(
        uint256 competitionId,
        string memory title,
        uint256 investment,
        uint256 confidence
    ) external nonReentrant {
        if (investment < minimumInvestment) revert InsufficientInvestment();
        if (confidence == 0 || confidence > 100) revert InvalidConfidence();
        if (competitions[competitionId].id != 0) revert CompetitionAlreadyExists();
        
        betmainToken.transferFrom(msg.sender, address(this), investment);
        
        competitions[competitionId] = Competition({
            id: competitionId,
            creator: msg.sender,
            title: title,
            createdAt: block.timestamp,
            totalPool: investment,
            participantCount: 1,
            isClosed: false,
            isSettled: false
        });
        
        participants[competitionId][msg.sender] = Participant({
            participant: msg.sender,
            investment: investment,
            confidence: confidence,
            aiScore: 0,
            hasPaidOut: false
        });
        
        competitionParticipants[competitionId].push(msg.sender);
        competitionCounter++;
        
        emit CompetitionCreated(competitionId, msg.sender, title, investment, confidence);
    }
    
    /**
     * @dev Join competition
     */
    function joinCompetition(
        uint256 competitionId,
        uint256 investment,
        uint256 confidence
    ) external nonReentrant {
        if (investment < minimumInvestment) revert InsufficientInvestment();
        if (confidence == 0 || confidence > 100) revert InvalidConfidence();
        
        Competition storage comp = competitions[competitionId];
        if (comp.id == 0) revert CompetitionNotFound();
        if (comp.isClosed) revert CompetitionClosed();
        if (participants[competitionId][msg.sender].participant != address(0)) revert AlreadyJoined();
        
        betmainToken.transferFrom(msg.sender, address(this), investment);
        
        participants[competitionId][msg.sender] = Participant({
            participant: msg.sender,
            investment: investment,
            confidence: confidence,
            aiScore: 0,
            hasPaidOut: false
        });
        
        competitionParticipants[competitionId].push(msg.sender);
        comp.totalPool += investment;
        comp.participantCount++;
        
        emit ParticipantJoined(competitionId, msg.sender, investment, confidence);
    }
    
    /**
     * @dev CRITICAL FIX: CCIP message receiver with proper chain handling
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        // Verify authorized sender
        if (!authorizedSenders[message.sourceChainSelector]) {
            revert UnauthorizedSender();
        }
        
        // Decode the message data
        (
            address participant,
            uint256 competitionId,
            uint256 betmainAmount,
            uint256 confidence,
            string memory sourceChainName
        ) = abi.decode(message.data, (address, uint256, uint256, uint256, string));
        
        // Get chain ID from mapping
        bytes32 chainId = chainNameToId[sourceChainName];
        if (chainId == bytes32(0)) {
            revert InvalidChainName();
        }
        
        // Verify competition exists and is open
        Competition storage comp = competitions[competitionId];
        if (comp.id == 0) revert CompetitionNotFound();
        if (comp.isClosed) revert CompetitionClosed();
        
        // Check if participant already joined
        if (participants[competitionId][participant].participant != address(0)) {
            revert AlreadyJoined();
        }
        
        // Validate investment and confidence
        if (betmainAmount < minimumInvestment) revert InsufficientInvestment();
        if (confidence == 0 || confidence > 100) revert InvalidConfidence();
        
        // Mint BETmain tokens with correct chain ID
        try betmainToken.mintFromDeposit(chainId, betmainAmount, address(this)) {
            // Add participant to competition
            participants[competitionId][participant] = Participant({
                participant: participant,
                investment: betmainAmount,
                confidence: confidence,
                aiScore: 0,
                hasPaidOut: false
            });
            
            // Update competition stats
            competitionParticipants[competitionId].push(participant);
            comp.totalPool += betmainAmount;
            comp.participantCount++;
            
            emit CrossChainParticipantJoined(competitionId, participant, betmainAmount, confidence, sourceChainName);
            
        } catch {
            revert("BETmain minting failed");
        }
    }
    
    /**
     * @dev Configure authorized CCIP senders
     */
    function setAuthorizedSender(uint64 chainSelector, address sender, bool authorized) external onlyOwner {
        authorizedSenders[chainSelector] = authorized;
        if (authorized) {
            chainSenders[chainSelector] = sender;
        }
    }
    
    /**
     * @dev Close competition
     */
    function closeCompetition(uint256 competitionId) external {
        Competition storage comp = competitions[competitionId];
        if (comp.id == 0) revert CompetitionNotFound();
        if (comp.creator != msg.sender) revert NotCompetitionCreator();
        if (comp.isClosed) revert CompetitionClosed();
        
        comp.isClosed = true;
        emit CompetitionClosedEvent(competitionId);
    }
    
    /**
     * @dev Submit AI scores
     */
    function submitScores(uint256 competitionId, uint256[] memory scores) external onlyOwner {
        Competition storage comp = competitions[competitionId];
        if (comp.id == 0) revert CompetitionNotFound();
        if (!comp.isClosed) revert CompetitionNotClosed();
        
        address[] memory participantList = competitionParticipants[competitionId];
        uint256[] memory investments = new uint256[](participantList.length);
        uint256[] memory confidences = new uint256[](participantList.length);
        
        for (uint i = 0; i < participantList.length; i++) {
            participants[competitionId][participantList[i]].aiScore = scores[i];
            investments[i] = participants[competitionId][participantList[i]].investment;
            confidences[i] = participants[competitionId][participantList[i]].confidence;
        }
        
        prizeOracle.submitScores(competitionId, participantList, scores, investments, confidences);
        emit ScoresSubmitted(competitionId, participantList.length);
    }
    
    /**
     * @dev Settle competition
     */
    function settleCompetition(uint256 competitionId) external nonReentrant {
        Competition storage comp = competitions[competitionId];
        if (comp.id == 0) revert CompetitionNotFound();
        if (!comp.isClosed) revert CompetitionNotClosed();
        if (comp.isSettled) revert AlreadySettled();
        if (!prizeOracle.isReadyForSettlement(competitionId)) revert NotReadyForSettlement();
        
        uint256[] memory prizes = prizeOracle.calculatePrizeDistribution(competitionId, comp.totalPool, comp.creator);
        address[] memory participantList = competitionParticipants[competitionId];
        
        uint256 totalDistributed = 0;
        for (uint i = 0; i < participantList.length; i++) {
            if (prizes[i] > 0) {
                betmainToken.transfer(participantList[i], prizes[i]);
                participants[competitionId][participantList[i]].hasPaidOut = true;
                totalDistributed += prizes[i];
            }
        }
        
        comp.isSettled = true;
        prizeOracle.markAsSettled(competitionId, totalDistributed);
        emit PrizesDistributed(competitionId, totalDistributed);
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
     * @dev Get all participants in a competition
     */
    function getCompetitionParticipants(uint256 competitionId) external view returns (address[] memory) {
        return competitionParticipants[competitionId];
    }
    
    /**
     * @dev Emergency function to receive AVAX for gas funding
     */
    receive() external payable {}
    
    /**
     * @dev Fund contract for CCIP execution gas
     */
    function fundForCCIPExecution() external payable onlyOwner {}
    
    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}