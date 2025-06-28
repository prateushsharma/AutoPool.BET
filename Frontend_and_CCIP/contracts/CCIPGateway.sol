// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CCIPGateway
 * @dev Real CCIP gateway for cross-chain integration between Sepolia and Avalanche Fuji
 * @notice This contract handles ETH deposits on Sepolia and sends CCIP messages to Avalanche
 * 
 * Flow:
 * 1. User deposits ETH on Sepolia
 * 2. CCIP message sent to Avalanche Fuji
 * 3. BETmain tokens minted on Avalanche
 * 4. User participates in competitions on Avalanche
 */
contract CCIPGateway is CCIPReceiver, ReentrancyGuard, Ownable {
    
    // CCIP Router for Sepolia
    IRouterClient private immutable ccipRouter;
    
    // Chain selectors
    uint64 public constant AVALANCHE_FUJI_SELECTOR = 14767482510784806043;
    uint64 public constant SEPOLIA_SELECTOR = 16015286601757825753;
    
    // Destination contract on Avalanche Fuji
    address public avalancheBridgeContract;
    
    // Bridge state
    mapping(address => uint256) public userDeposits;
    mapping(bytes32 => bool) public processedMessages;
    
    uint256 public constant MIN_DEPOSIT = 0.01 ether;
    uint256 public constant MAX_DEPOSIT = 10 ether;
    uint256 public bridgeFee = 0.001 ether; // Fixed CCIP fee
    
    // Events
    event DepositInitiated(
        address indexed user,
        uint256 amount,
        bytes32 messageId
    );
    
    event WithdrawalReceived(
        address indexed user,
        uint256 amount,
        bytes32 messageId
    );
    
    event MessageProcessed(bytes32 indexed messageId);
    
    constructor(
        address _ccipRouter,
        address _avalancheBridgeContract
    ) CCIPReceiver(_ccipRouter) Ownable(msg.sender) {
        ccipRouter = IRouterClient(_ccipRouter);
        avalancheBridgeContract = _avalancheBridgeContract;
    }
    
    /**
     * @dev Deposit ETH and send CCIP message to Avalanche to mint BETmain
     */
    function depositToAvalanche() external payable nonReentrant {
        require(msg.value >= MIN_DEPOSIT + bridgeFee, "Insufficient deposit amount");
        require(msg.value <= MAX_DEPOSIT + bridgeFee, "Deposit amount too high");
        require(avalancheBridgeContract != address(0), "Avalanche contract not set");
        
        uint256 depositAmount = msg.value - bridgeFee;
        userDeposits[msg.sender] += depositAmount;
        
        // Prepare CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(avalancheBridgeContract),
            data: abi.encode(msg.sender, depositAmount),
            tokenAmounts: new Client.EVMTokenAmount[](0), // No tokens, just ETH via data
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000}) // Gas limit for destination
            ),
            feeToken: address(0) // Pay fees in native ETH
        });
        
        // Calculate CCIP fee
        uint256 ccipFee = ccipRouter.getFee(AVALANCHE_FUJI_SELECTOR, message);
        require(bridgeFee >= ccipFee, "Insufficient CCIP fee");
        
        // Send CCIP message
        bytes32 messageId = ccipRouter.ccipSend{value: ccipFee}(
            AVALANCHE_FUJI_SELECTOR,
            message
        );
        
        emit DepositInitiated(msg.sender, depositAmount, messageId);
    }
    
    /**
     * @dev Receive CCIP message from Avalanche (for withdrawals)
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        require(message.sourceChainSelector == AVALANCHE_FUJI_SELECTOR, "Invalid source chain");
        require(!processedMessages[message.messageId], "Message already processed");
        
        processedMessages[message.messageId] = true;
        
        // Decode withdrawal data
        (address user, uint256 amount) = abi.decode(message.data, (address, uint256));
        
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Invalid amount");
        require(address(this).balance >= amount, "Insufficient contract balance");
        
        // Send ETH to user
        (bool success, ) = payable(user).call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit WithdrawalReceived(user, amount, message.messageId);
        emit MessageProcessed(message.messageId);
    }
    
    /**
     * @dev Get CCIP fee for deposit
     */
    function getDepositFee(uint256 depositAmount) external view returns (uint256) {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(avalancheBridgeContract),
            data: abi.encode(msg.sender, depositAmount),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0)
        });
        
        return ccipRouter.getFee(AVALANCHE_FUJI_SELECTOR, message);
    }
    
    /**
     * @dev Update Avalanche bridge contract address
     */
    function updateAvalancheBridgeContract(address _newContract) external onlyOwner {
        require(_newContract != address(0), "Invalid contract address");
        avalancheBridgeContract = _newContract;
    }
    
    /**
     * @dev Update bridge fee
     */
    function updateBridgeFee(uint256 _newFee) external onlyOwner {
        bridgeFee = _newFee;
    }
    
    /**
     * @dev Get user's total deposits
     */
    function getUserDeposits(address user) external view returns (uint256) {
        return userDeposits[user];
    }
    
    /**
     * @dev Check if message was processed
     */
    function isMessageProcessed(bytes32 messageId) external view returns (bool) {
        return processedMessages[messageId];
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Get gateway info
     */
    function getGatewayInfo() external view returns (
        uint64 sourceChain,
        uint64 destinationChain,
        address destinationContract,
        uint256 minDeposit,
        uint256 maxDeposit,
        uint256 currentBridgeFee
    ) {
        return (
            SEPOLIA_SELECTOR,
            AVALANCHE_FUJI_SELECTOR,
            avalancheBridgeContract,
            MIN_DEPOSIT,
            MAX_DEPOSIT,
            bridgeFee
        );
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}