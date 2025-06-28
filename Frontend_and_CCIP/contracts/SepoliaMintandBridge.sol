// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";

/**
 * @title Sepolia Mint & Bridge Back Contract
 * @dev Step 2: Receives ETH requests, mints BETmain, bridges tokens back to Arbitrum
 * @notice Deploy this on Ethereum Sepolia
 */

interface IBETmainToken {
    function mint(address to, uint256 amount) external;
}

contract SepoliaMintAndBridge is CCIPReceiver, OwnerIsCreator {
    using SafeERC20 for IERC20;

    // CCIP Router on Sepolia
    IRouterClient private immutable i_router;
    
    // Chain selectors
    uint64 private constant ARBITRUM_CHAIN_SELECTOR = 3478487238524512106;
    
    // Contracts
    IBETmainToken public betmainToken; // Your existing BETmain token on Sepolia
    address public authorizedArbitrumSender; // Arbitrum contract that sends requests
    
    // BETmain token that can be bridged (might need to be different from main token)
    address public bridgeableBETmain;
    
    // Treasury for any fees
    address public treasury;
    
    // Statistics
    uint256 public totalMintRequests;
    uint256 public totalBETmainMinted;
    uint256 public totalBETmainBridged;
    mapping(bytes32 => bool) public processedMessages;
    
    // Events
    event MintRequestReceived(
        address indexed user,
        uint256 tokenAmount,
        address returnAddress,
        bytes32 messageId
    );
    event BETmainBridgedBack(
        address indexed user,
        uint256 tokenAmount,
        address returnAddress,
        bytes32 messageId
    );
    event AuthorizedSenderUpdated(address indexed newSender);
    event BETmainTokenUpdated(address indexed newToken);
    event BridgeableBETmainUpdated(address indexed newToken);
    
    // Errors
    error UnauthorizedSender();
    error UnauthorizedChain();
    error MessageAlreadyProcessed();
    error InvalidMessageData();
    error MintFailed();
    error BridgeFailed();
    error InsufficientBridgeableTokens();
    
    constructor(
        address _router,
        address _betmainToken,
        address _treasury
    ) CCIPReceiver(_router) OwnerIsCreator() {
        i_router = IRouterClient(_router);
        betmainToken = IBETmainToken(_betmainToken);
        treasury = _treasury;
    }
    
    /**
     * @dev Step 2a: Receive mint request from Arbitrum
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        // Verify source chain
        if (message.sourceChainSelector != ARBITRUM_CHAIN_SELECTOR) {
            revert UnauthorizedChain();
        }
        
        // Verify sender
        address sender = abi.decode(message.sender, (address));
        if (sender != authorizedArbitrumSender) {
            revert UnauthorizedSender();
        }
        
        // Prevent replay attacks
        if (processedMessages[message.messageId]) {
            revert MessageAlreadyProcessed();
        }
        processedMessages[message.messageId] = true;
        
        // Decode message data
        (address user, uint256 tokenAmount, address returnAddress) = abi.decode(
            message.data,
            (address, uint256, address)
        );
        
        // Validate data
        if (user == address(0) || tokenAmount == 0 || returnAddress == address(0)) {
            revert InvalidMessageData();
        }
        
        emit MintRequestReceived(user, tokenAmount, returnAddress, message.messageId);
        
        // Step 2b: Mint BETmain tokens to this contract
        try betmainToken.mint(address(this), tokenAmount) {
            totalBETmainMinted += tokenAmount;
            totalMintRequests++;
            
            // Step 2c: Bridge tokens back to Arbitrum
            _bridgeTokensBack(user, tokenAmount, returnAddress);
            
        } catch {
            revert MintFailed();
        }
    }
    
    /**
     * @dev Step 2c: Bridge BETmain tokens back to Arbitrum
     */
    function _bridgeTokensBack(
        address user,
        uint256 tokenAmount,
        address returnAddress
    ) private {
        // Use bridgeable BETmain tokens (could be same as main token if it supports CCIP)
        address tokenToBridge = bridgeableBETmain != address(0) ? bridgeableBETmain : address(betmainToken);
        
        // Check we have enough tokens to bridge
        uint256 balance = IERC20(tokenToBridge).balanceOf(address(this));
        if (balance < tokenAmount) {
            revert InsufficientBridgeableTokens();
        }
        
        // Approve tokens for CCIP router
        IERC20(tokenToBridge).approve(address(i_router), tokenAmount);
        
        // Prepare token amounts for CCIP
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: tokenToBridge,
            amount: tokenAmount
        });
        
        // Prepare CCIP message back to Arbitrum
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(returnAddress),
            data: abi.encode(user), // Just the user address
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 300_000})),
            feeToken: address(0) // Pay in ETH
        });
        
        // Get fee estimate
        uint256 fee = i_router.getFee(ARBITRUM_CHAIN_SELECTOR, message);
        
        // Check if contract has enough ETH for fees (owner should fund this)
        require(address(this).balance >= fee, "Insufficient ETH for bridge fees");
        
        try i_router.ccipSend{value: fee}(ARBITRUM_CHAIN_SELECTOR, message) returns (bytes32 messageId) {
            totalBETmainBridged += tokenAmount;
            
            emit BETmainBridgedBack(user, tokenAmount, returnAddress, messageId);
            
        } catch {
            revert BridgeFailed();
        }
    }
    
    /**
     * @dev Manual bridge function (in case automated bridging fails)
     */
    function manualBridgeTokens(
        address user,
        uint256 tokenAmount,
        address returnAddress
    ) external onlyOwner {
        _bridgeTokensBack(user, tokenAmount, returnAddress);
    }
    
    /**
     * @dev Set authorized Arbitrum sender
     */
    function setAuthorizedArbitrumSender(address _sender) external onlyOwner {
        require(_sender != address(0), "Invalid sender");
        authorizedArbitrumSender = _sender;
        emit AuthorizedSenderUpdated(_sender);
    }
    
    /**
     * @dev Set BETmain token contract
     */
    function setBETmainToken(address _betmainToken) external onlyOwner {
        require(_betmainToken != address(0), "Invalid token");
        betmainToken = IBETmainToken(_betmainToken);
        emit BETmainTokenUpdated(_betmainToken);
    }
    
    /**
     * @dev Set bridgeable BETmain token (if different from main token)
     */
    function setBridgeableBETmain(address _bridgeableToken) external onlyOwner {
        bridgeableBETmain = _bridgeableToken;
        emit BridgeableBETmainUpdated(_bridgeableToken);
    }
    
    /**
     * @dev Set treasury
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }
    
    /**
     * @dev Get bridge statistics
     */
    function getBridgeStats() external view returns (
        uint256 totalRequests,
        uint256 totalMinted,
        uint256 totalBridged,
        address authorizedSender,
        address bridgeToken
    ) {
        return (
            totalMintRequests,
            totalBETmainMinted,
            totalBETmainBridged,
            authorizedArbitrumSender,
            bridgeableBETmain != address(0) ? bridgeableBETmain : address(betmainToken)
        );
    }
    
    /**
     * @dev Fund contract with ETH for bridge fees
     */
    function fundBridgeFees() external payable onlyOwner {
        // Allows owner to send ETH to cover bridge fees
    }
    
    /**
     * @dev Get bridge fee estimate
     */
    function getBridgeFeeEstimate(uint256 tokenAmount) external view returns (uint256) {
        address tokenToBridge = bridgeableBETmain != address(0) ? bridgeableBETmain : address(betmainToken);
        
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: tokenToBridge,
            amount: tokenAmount
        });
        
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(authorizedArbitrumSender),
            data: abi.encode(msg.sender),
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 300_000})),
            feeToken: address(0)
        });
        
        return i_router.getFee(ARBITRUM_CHAIN_SELECTOR, message);
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
        
        // Withdraw BETmain tokens
        if (address(betmainToken) != address(0)) {
            uint256 tokenBalance = IERC20(address(betmainToken)).balanceOf(address(this));
            if (tokenBalance > 0) {
                IERC20(address(betmainToken)).safeTransfer(owner(), tokenBalance);
            }
        }
        
        // Withdraw bridgeable tokens if different
        if (bridgeableBETmain != address(0) && bridgeableBETmain != address(betmainToken)) {
            uint256 bridgeBalance = IERC20(bridgeableBETmain).balanceOf(address(this));
            if (bridgeBalance > 0) {
                IERC20(bridgeableBETmain).safeTransfer(owner(), bridgeBalance);
            }
        }
    }
    
    receive() external payable {
        // Accept ETH for bridge fees
    }
}