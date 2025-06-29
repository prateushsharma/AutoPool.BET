// File: src/contracts/DispatchParticipation.ts
// Real contract calls for Dispatch Chain with Teleporter

import { ethers } from 'ethers';

// Dispatch Participation Contract ABI (matching the real contract)
const DISPATCH_PARTICIPATION_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_teleporterMessenger",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_avalancheBridgeContract",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "InsufficientAVAXAmount",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidBridgeContract",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidConfidence",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "MessageAlreadyProcessed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "MessageSendFailed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "OnlyOwner",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "UnauthorizedTeleporterMessage",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAddress",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "newBridge",
				"type": "address"
			}
		],
		"name": "BridgeContractUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "participant",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "competitionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "avaxAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "betmainAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "confidence",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "messageId",
				"type": "bytes32"
			}
		],
		"name": "CrossChainParticipationSent",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "messageId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "sourceAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes",
				"name": "message",
				"type": "bytes"
			}
		],
		"name": "TeleporterMessageReceived",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "AVALANCHE_FUJI_BLOCKCHAIN_ID",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "AVAX_TO_BETMAIN_RATE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "avalancheBridgeContract",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "emergencyWithdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getBridgeAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCommonTeleporterAddresses",
		"outputs": [
			{
				"internalType": "address[3]",
				"name": "",
				"type": "address[3]"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "avaxAmount",
				"type": "uint256"
			}
		],
		"name": "getParticipationCost",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalCost",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "teleporterFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "actualParticipation",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getSourceChainName",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getStats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "_totalParticipations",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_totalAvaxSent",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_contractBalance",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "competitionId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "confidence",
				"type": "uint256"
			}
		],
		"name": "joinCompetitionWithAVAX",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "minimumAvaxAmount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "processedMessages",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "sourceBlockchainID",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "originSenderAddress",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "message",
				"type": "bytes"
			}
		],
		"name": "receiveTeleporterMessage",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "teleporterGasLimit",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "teleporterMessenger",
		"outputs": [
			{
				"internalType": "contract ITeleporterMessenger",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalAvaxSent",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalParticipations",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newBridge",
				"type": "address"
			}
		],
		"name": "updateBridgeContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "userParticipations",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
] as const;

// Contract address on Dispatch Chain (UPDATE WITH REAL DEPLOYED ADDRESS)
const DISPATCH_PARTICIPATION_ADDRESS = "0xE453186Cf1cdb56D3784523655aAA95a66db35e8";

export interface DispatchParticipationCost {
  totalCost: string;
  teleporterFee: string;
  actualParticipation: string;
  totalCostAvax: string;
  teleporterFeeAvax: string;
  actualParticipationAvax: string;
}

export interface JoinDispatchCompetitionParams {
  competitionId: number;
  confidence: number;
  investmentAvax: string;
}

export interface DispatchParticipationResult {
  success: boolean;
  data?: any;
  error?: string;
  txHash?: string;
}

// Get contract instance
const getDispatchParticipationContract = (
  signerOrProvider: ethers.Signer | ethers.providers.Provider
) => {
  return new ethers.Contract(
    DISPATCH_PARTICIPATION_ADDRESS,
    DISPATCH_PARTICIPATION_ABI,
    signerOrProvider
  );
};

/**
 * Get participation cost breakdown for given AVAX amount (REAL CONTRACT CALL)
 */
export const getDispatchParticipationCost = async (
  provider: ethers.providers.Provider,
  investmentAvaxAmount: string
): Promise<DispatchParticipationResult> => {
  try {
    console.log('=== GET DISPATCH PARTICIPATION COST (REAL) ===');
    console.log('Investment AVAX:', investmentAvaxAmount);
    
    const contract = getDispatchParticipationContract(provider);
    
    // Convert AVAX to wei
    const investmentWei = ethers.utils.parseEther(investmentAvaxAmount);
    console.log('Investment Wei:', investmentWei.toString());
    
    // REAL CONTRACT CALL: Get cost breakdown from Dispatch contract
    const [totalCost, teleporterFee, actualParticipation] = await contract.getParticipationCost(investmentWei);
    
    const costData: DispatchParticipationCost = {
      totalCost: totalCost.toString(),
      teleporterFee: teleporterFee.toString(),
      actualParticipation: actualParticipation.toString(),
      totalCostAvax: ethers.utils.formatEther(totalCost),
      teleporterFeeAvax: ethers.utils.formatEther(teleporterFee),
      actualParticipationAvax: ethers.utils.formatEther(actualParticipation)
    };
    
    console.log('REAL Cost breakdown:', costData);
    
    return {
      success: true,
      data: costData
    };
    
  } catch (error: any) {
    console.error('Error getting Dispatch participation cost:', error);
    return {
      success: false,
      error: error.message || 'Failed to get participation cost'
    };
  }
};

/**
 * Join competition from Dispatch with AVAX (REAL CONTRACT CALL)
 */
export const joinDispatchCompetitionWithAVAX = async (
  signer: ethers.Signer,
  params: JoinDispatchCompetitionParams
): Promise<DispatchParticipationResult> => {
  try {
    console.log('=== JOIN DISPATCH COMPETITION WITH AVAX (REAL) ===');
    console.log('Params:', params);
    
    // Validate parameters
    if (params.confidence < 1 || params.confidence > 100) {
      return { success: false, error: 'Confidence must be between 1 and 100' };
    }
    
    if (!params.investmentAvax || parseFloat(params.investmentAvax) <= 0) {
      return { success: false, error: 'Investment amount must be greater than 0' };
    }
    
    const contract = getDispatchParticipationContract(signer);
    
    // Get current cost breakdown
    const provider = signer.provider!;
    const costResult = await getDispatchParticipationCost(provider, params.investmentAvax);
    
    if (!costResult.success || !costResult.data) {
      return { success: false, error: 'Failed to calculate participation cost' };
    }
    
    const costData = costResult.data as DispatchParticipationCost;
    
    // Check user balance
    const userAddress = await signer.getAddress();
    const balance = await provider.getBalance(userAddress);
    const requiredAmount = ethers.BigNumber.from(costData.totalCost);
    
    if (balance.lt(requiredAmount)) {
      return {
        success: false,
        error: `Insufficient balance. Required: ${costData.totalCostAvax} AVAX, Available: ${ethers.utils.formatEther(balance)} AVAX`
      };
    }
    
    console.log('Sending REAL transaction with value:', costData.totalCostAvax, 'AVAX');
    
    // Check contract connection first
    try {
      const minInvestment = await contract.minimumAvaxAmount();
      console.log('Minimum investment:', ethers.utils.formatEther(minInvestment), 'AVAX');
      
      if (ethers.BigNumber.from(costData.actualParticipation).lt(minInvestment)) {
        return { 
          success: false, 
          error: `Investment ${params.investmentAvax} AVAX is below minimum ${ethers.utils.formatEther(minInvestment)} AVAX` 
        };
      }
    } catch (error) {
      console.error('Contract read error:', error);
      return { success: false, error: 'Cannot connect to Dispatch contract. Check network and contract address.' };
    }
    
    // Estimate gas
    console.log('Estimating gas...');
    const gasEstimate = await contract.estimateGas.joinCompetitionWithAVAX(
      params.competitionId,
      params.confidence,
      { value: costData.totalCost }
    );
    console.log('Gas estimate:', gasEstimate.toString());
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate.mul(120).div(100);
    console.log('Gas limit with buffer:', gasLimit.toString());
    
    // REAL CONTRACT CALL: Execute joinCompetitionWithAVAX
    console.log('Sending REAL transaction...');
    const tx = await contract.joinCompetitionWithAVAX(
      params.competitionId,
      params.confidence,
      { 
        value: costData.totalCost,
        gasLimit: gasLimit
      }
    );
    
    console.log('REAL Dispatch participation transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('REAL Dispatch participation transaction successful!');
      
      // Parse events to get participation details
      const event = receipt.events?.find(
        (e: any) => e.event === 'CrossChainParticipationSent'
      );
      
      return {
        success: true,
        data: {
          competitionId: params.competitionId,
          txHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          costBreakdown: costData,
          event: event?.args,
          teleporterMessageId: event?.args?.messageId,
          isRealTransaction: true // Flag to indicate this is real
        },
        txHash: receipt.transactionHash
      };
    } else {
      return {
        success: false,
        error: 'Transaction failed',
        txHash: receipt.transactionHash
      };
    }
    
  } catch (error: any) {
    console.error('=== FULL ERROR DETAILS ===');
    console.error('Error object:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error data:', error.data);
    console.error('Error reason:', error.reason);
    
    // Handle specific error types
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return { success: false, error: 'Insufficient funds for transaction' };
    }
    
    if (error.code === 'USER_REJECTED') {
      return { success: false, error: 'Transaction was rejected by user' };
    }
    
    if (error.message?.includes('InsufficientAVAXAmount')) {
      return { success: false, error: 'Investment amount is below minimum required' };
    }
    
    if (error.message?.includes('InvalidConfidence')) {
      return { success: false, error: 'Confidence must be between 1 and 100' };
    }
    
    if (error.message?.includes('InvalidBridgeContract')) {
      return { success: false, error: 'Bridge contract not configured' };
    }
    
    if (error.message?.includes('revert')) {
      return { success: false, error: `Contract error: ${error.reason || error.message}` };
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

/**
 * Get minimum AVAX amount required (REAL CONTRACT CALL)
 */
export const getDispatchMinimumAvaxAmount = async (
  provider: ethers.providers.Provider
): Promise<DispatchParticipationResult> => {
  try {
    const contract = getDispatchParticipationContract(provider);
    const minAmount = await contract.minimumAvaxAmount();
    
    return {
      success: true,
      data: {
        wei: minAmount.toString(),
        avax: ethers.utils.formatEther(minAmount),
        formatted: `${ethers.utils.formatEther(minAmount)} AVAX`
      }
    };
  } catch (error: any) {
    console.error('Error fetching minimum AVAX amount:', error);
    return {
      success: false,
      error: error.message || 'Failed to get minimum amount'
    };
  }
};

/**
 * Get bridge contract address (REAL CONTRACT CALL)
 */
export const getDispatchBridgeAddress = async (
  provider: ethers.providers.Provider
): Promise<DispatchParticipationResult> => {
  try {
    const contract = getDispatchParticipationContract(provider);
    const bridgeAddress = await contract.getBridgeAddress();
    
    return {
      success: true,
      data: {
        bridgeAddress: bridgeAddress,
        isReal: true
      }
    };
  } catch (error: any) {
    console.error('Error fetching bridge address:', error);
    return {
      success: false,
      error: error.message || 'Failed to get bridge address'
    };
  }
};

/**
 * Get contract statistics (REAL CONTRACT CALL)
 */
export const getDispatchContractStats = async (
  provider: ethers.providers.Provider
): Promise<DispatchParticipationResult> => {
  try {
    const contract = getDispatchParticipationContract(provider);
    const [totalParticipations, totalAvaxSent, contractBalance] = await contract.getStats();
    
    return {
      success: true,
      data: {
        totalParticipations: totalParticipations.toString(),
        totalAvaxSent: ethers.utils.formatEther(totalAvaxSent),
        contractBalance: ethers.utils.formatEther(contractBalance),
        isReal: true
      }
    };
  } catch (error: any) {
    console.error('Error fetching contract stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to get contract stats'
    };
  }
};

/**
 * Get common Teleporter addresses (REAL CONTRACT CALL)
 */
export const getDispatchTeleporterAddresses = async (
  provider: ethers.providers.Provider
): Promise<DispatchParticipationResult> => {
  try {
    const contract = getDispatchParticipationContract(provider);
    const addresses = await contract.getCommonTeleporterAddresses();
    
    return {
      success: true,
      data: {
        teleporterAddresses: addresses,
        isReal: true
      }
    };
  } catch (error: any) {
    console.error('Error fetching Teleporter addresses:', error);
    return {
      success: false,
      error: error.message || 'Failed to get Teleporter addresses'
    };
  }
};

/**
 * Check if current network is Dispatch Chain
 */
export const isDispatchChain = (chainId: string): boolean => {
  // UPDATE WITH ACTUAL DISPATCH CHAIN ID
  const DISPATCH_CHAIN_ID = '0x...'; // Replace with actual Dispatch Chain ID
  return chainId === DISPATCH_CHAIN_ID;
};