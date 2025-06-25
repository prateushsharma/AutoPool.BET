// SPDX-License-Identifier: MIT
// File: contracts/ArbitrumDepositAndReceive.sol
// Deploy on: Arbitrum Sepolia (both sends ETH data and receives BETmain tokens back)
pragma solidity 0.8.24;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";

/**
 * @title Arbitrum Deposit & Receive Contract
 * @dev 1) Users send ETH → 2) Bridge to Sepolia for minting → 3) Receive BETmain back on Arbitrum
 * @notice Deploy this on Arbitrum Sepolia testnet
 */
contract ArbitrumDepositAndReceive is CCIPReceiver, OwnerIsCreator {
    using SafeERC20 for IERC20;

    // Chainlink CCIP Router on Arbitrum
    IRouterClient private immutable i_router;
    
    // Chain selectors
    uint64 private constant SEPOLIA_CHAIN_SELECTOR = 16015286601757825753;
    
    // Sepolia contracts
    address public sepoliaMinter; // Contract that mints BETmain on Sepolia
    
    // BETmain token on Arbitrum (will be bridged back from Sepolia)
    address public betmainTokenArbitrum;
    
    // Treasury for ETH
    address public treasury;
    
    // Exchange rate: 1 ETH = X BETmain tokens
    uint256 public ethToBETmainRate = 333333; // Same as your Sepolia exchange
    
    // Limits
    uint256 public minimumDeposit = 0.0001 ether;
    uint256 public maximumDeposit = 10 ether;
    
    // Tracking pending deposits (waiting for BETmain tokens to come back)
    mapping(address => uint256) public pendingBETmain;
    mapping(bytes32 => address) public messageToUser; // CCIP message ID → user address
    mapping(bytes32 => bool) public processedReturns;
    
    // Statistics
    uint256 public totalETHDeposited;
    uint256 public totalBETmainReceived;
    uint256 public totalUsers;
    mapping(address => uint256) public userETHDeposited;
    mapping(address => uint256) public userBETmainReceived;
    
    // Events
    event ETHDepositSent(
        address indexed user,
        uint256 ethAmount,
        uint256 expectedBETmainTokens,
        bytes32 messageId
    );
    event BETmainTokensReceived(
        address indexed user,
        uint256 tokenAmount,
        bytes32 messageId
    );
    event SepoliaMinterUpdated(address indexed newMinter);
    event BETmainTokenUpdated(address indexed newToken);
    
    // Errors
    error InsufficientDeposit();
    error ExceedsMaximumDeposit();
    error InvalidSepoliaMinter();
    error InsufficientETHForFees();
    error ETHTransferFailed();
    error UnauthorizedSender();
    error UnauthorizedChain();
    error MessageAlreadyProcessed();
    error InvalidTokenTransfer();
    
    constructor(
        address _router,
        address _treasury
    ) CCIPReceiver(_router) OwnerIsCreator() {
        i_router = IRouterClient(_router);
        treasury = _treasury;
    }
    
    /**
     * @dev Step 1: User sends ETH on Arbitrum to request BETmain tokens
     */
    function depositETHForBETmain() external payable {
        if (msg.value < minimumDeposit) revert InsufficientDeposit();
        if (msg.value > maximumDeposit) revert ExceedsMaximumDeposit();
        if (sepoliaMinter == address(0)) revert InvalidSepoliaMinter();
        
        // Calculate expected BETmain tokens
        uint256 expectedBETmainTokens = (msg.value * ethToBETmainRate) / 1 ether;
        
        // Prepare CCIP message to Sepolia
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(sepoliaMinter),
            data: abi.encode(
                msg.sender,           // user who will receive tokens
                expectedBETmainTokens, // amount to mint
                address(this)         // return address (this contract)
            ),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 400_000})),
            feeToken: address(0)
        });
        
        // Get CCIP fee
        uint256 ccipFee = i_router.getFee(SEPOLIA_CHAIN_SELECTOR, message);
        
        if (msg.value <= ccipFee) revert InsufficientETHForFees();
        
        // Calculate actual deposit (minus CCIP fees)
        uint256 actualDeposit = msg.value - ccipFee;
        uint256 actualBETmainTokens = (actualDeposit * ethToBETmainRate) / 1 ether;
        
        // Update message with actual amounts
        message.data = abi.encode(msg.sender, actualBETmainTokens, address(this));
        
        // Send message to Sepolia
        bytes32 messageId = i_router.ccipSend{value: ccipFee}(
            SEPOLIA_CHAIN_SELECTOR,
            message
        );
        
        // Track pending BETmain for this user
        pendingBETmain[msg.sender] += actualBETmainTokens;
        messageToUser[messageId] = msg.sender;
        
        // Send ETH to treasury
        (bool success, ) = treasury.call{value: actualDeposit}("");
        if (!success) revert ETHTransferFailed();
        
        // Update statistics
        totalETHDeposited += actualDeposit;
        userETHDeposited[msg.sender] += actualDeposit;
        
        emit ETHDepositSent(msg.sender, actualDeposit, actualBETmainTokens, messageId);
    }
    
    /**
     * @dev Step 3: Receive BETmain tokens back from Sepolia
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        // Verify source chain is Sepolia
        if (message.sourceChainSelector != SEPOLIA_CHAIN_SELECTOR) {
            revert UnauthorizedChain();
        }
        
        // Verify sender is our Sepolia minter
        address sender = abi.decode(message.sender, (address));
        if (sender != sepoliaMinter) {
            revert UnauthorizedSender();
        }
        
        // Prevent replay attacks
        if (processedReturns[message.messageId]) {
            revert MessageAlreadyProcessed();
        }
        processedReturns[message.messageId] = true;
        
        // Extract BETmain tokens from the message
        if (message.destTokenAmounts.length == 0) {
            revert InvalidTokenTransfer();
        }
        
        address tokenAddress = message.destTokenAmounts[0].token;
        uint256 tokenAmount = message.destTokenAmounts[0].amount;
        
        // Decode user address from message data
        (address user) = abi.decode(message.data, (address));
        
        // Validate
        require(user != address(0), "Invalid user");
        require(tokenAmount > 0, "Invalid token amount");
        require(tokenAddress == betmainTokenArbitrum, "Wrong token");
        
        // Update pending amounts
        if (pendingBETmain[user] >= tokenAmount) {
            pendingBETmain[user] -= tokenAmount;
        }
        
        // Transfer BETmain tokens to user
        IERC20(betmainTokenArbitrum).safeTransfer(user, tokenAmount);
        
        // Update statistics
        totalBETmainReceived += tokenAmount;
        userBETmainReceived[user] += tokenAmount;
        
        emit BETmainTokensReceived(user, tokenAmount, message.messageId);
    }
    
    /**
     * @dev Get fee estimate for deposit
     */
    function getFeeEstimate(uint256 ethAmount) external view returns (
        uint256 ccipFee,
        uint256 actualDeposit,
        uint256 expectedTokens
    ) {
        if (sepoliaMinter == address(0)) return (0, 0, 0);
        
        uint256 expectedBETmainTokens = (ethAmount * ethToBETmainRate) / 1 ether;
        
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(sepoliaMinter),
            data: abi.encode(msg.sender, expectedBETmainTokens, address(this)),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 400_000})),
            feeToken: address(0)
        });
        
        ccipFee = i_router.getFee(SEPOLIA_CHAIN_SELECTOR, message);
        
        if (ethAmount > ccipFee) {
            actualDeposit = ethAmount - ccipFee;
            expectedTokens = (actualDeposit * ethToBETmainRate) / 1 ether;
        }
        
        return (ccipFee, actualDeposit, expectedTokens);
    }
    
    /**
     * @dev Set Sepolia minter contract
     */
    function setSepoliaMinter(address _minter) external onlyOwner {
        if (_minter == address(0)) revert InvalidSepoliaMinter();
        sepoliaMinter = _minter;
        emit SepoliaMinterUpdated(_minter);
    }
    
    /**
     * @dev Set BETmain token address on Arbitrum
     */
    function setBETmainTokenArbitrum(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token");
        betmainTokenArbitrum = _token;
        emit BETmainTokenUpdated(_token);
    }
    
    /**
     * @dev Set treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }
    
    /**
     * @dev Get user status
     */
    function getUserStatus(address user) external view returns (
        uint256 ethDeposited,
        uint256 betmainReceived,
        uint256 pendingBetmain,
        uint256 betmainBalance
    ) {
        uint256 balance = 0;
        if (betmainTokenArbitrum != address(0)) {
            balance = IERC20(betmainTokenArbitrum).balanceOf(user);
        }
        
        return (
            userETHDeposited[user],
            userBETmainReceived[user],
            pendingBETmain[user],
            balance
        );
    }
    
    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw() external onlyOwner {
        // Withdraw ETH
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            payable(owner()).transfer(ethBalance);
        }
        
        // Withdraw any BETmain tokens
        if (betmainTokenArbitrum != address(0)) {
            uint256 tokenBalance = IERC20(betmainTokenArbitrum).balanceOf(address(this));
            if (tokenBalance > 0) {
                IERC20(betmainTokenArbitrum).safeTransfer(owner(), tokenBalance);
            }
        }
    }
    
    receive() external payable {
        if (msg.value < minimumDeposit) revert InsufficientDeposit();
        if (msg.value > maximumDeposit) revert ExceedsMaximumDeposit();
        if (sepoliaMinter == address(0)) revert InvalidSepoliaMinter();
        
        // Calculate expected BETmain tokens
        uint256 expectedBETmainTokens = (msg.value * ethToBETmainRate) / 1 ether;
        
        // Prepare CCIP message to Sepolia
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(sepoliaMinter),
            data: abi.encode(
                msg.sender,           // user who will receive tokens
                expectedBETmainTokens, // amount to mint
                address(this)         // return address (this contract)
            ),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 400_000})),
            feeToken: address(0)
        });
        
        // Get CCIP fee
        uint256 ccipFee = i_router.getFee(SEPOLIA_CHAIN_SELECTOR, message);
        
        if (msg.value <= ccipFee) revert InsufficientETHForFees();
        
        // Calculate actual deposit (minus CCIP fees)
        uint256 actualDeposit = msg.value - ccipFee;
        uint256 actualBETmainTokens = (actualDeposit * ethToBETmainRate) / 1 ether;
        
        // Update message with actual amounts
        message.data = abi.encode(msg.sender, actualBETmainTokens, address(this));
        
        // Send message to Sepolia
        bytes32 messageId = i_router.ccipSend{value: ccipFee}(
            SEPOLIA_CHAIN_SELECTOR,
            message
        );
        
        // Track pending BETmain for this user
        pendingBETmain[msg.sender] += actualBETmainTokens;
        messageToUser[messageId] = msg.sender;
        
        // Send ETH to treasury
        (bool success, ) = treasury.call{value: actualDeposit}("");
        if (!success) revert ETHTransferFailed();
        
        // Update statistics
        totalETHDeposited += actualDeposit;
        userETHDeposited[msg.sender] += actualDeposit;
        
        emit ETHDepositSent(msg.sender, actualDeposit, actualBETmainTokens, messageId);
    }
}