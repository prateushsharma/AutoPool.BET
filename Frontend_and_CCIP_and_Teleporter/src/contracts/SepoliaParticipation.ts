// File: src/contracts/SepoliaParticipation.ts
// Cross-chain participation functions for Sepolia

import { ethers } from 'ethers';

// Sepolia Participation Contract ABI (key functions only)
const SEPOLIA_PARTICIPATION_ABI =[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_router",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_avalancheCompetitionFactory",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "InsufficientETHAmount",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientETHForFees",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidCompetitionFactory",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidConfidence",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "router",
				"type": "address"
			}
		],
		"name": "InvalidRouter",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "MessageSendFailed",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ReentrancyGuardReentrantCall",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "newFactory",
				"type": "address"
			}
		],
		"name": "AvalancheFactoryUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newGasLimit",
				"type": "uint256"
			}
		],
		"name": "CCIPGasLimitUpdated",
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
				"name": "ethAmount",
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
				"internalType": "uint64",
				"name": "sourceChainSelector",
				"type": "uint64"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "MessageReceived",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newMinimum",
				"type": "uint256"
			}
		],
		"name": "MinimumEthUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "ETH_TO_BETMAIN_RATE",
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
		"name": "avalancheCompetitionFactory",
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
		"name": "ccipGasLimit",
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
				"components": [
					{
						"internalType": "bytes32",
						"name": "messageId",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "sourceChainSelector",
						"type": "uint64"
					},
					{
						"internalType": "bytes",
						"name": "sender",
						"type": "bytes"
					},
					{
						"internalType": "bytes",
						"name": "data",
						"type": "bytes"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "token",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							}
						],
						"internalType": "struct Client.EVMTokenAmount[]",
						"name": "destTokenAmounts",
						"type": "tuple[]"
					}
				],
				"internalType": "struct Client.Any2EVMMessage",
				"name": "message",
				"type": "tuple"
			}
		],
		"name": "ccipReceive",
		"outputs": [],
		"stateMutability": "nonpayable",
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
		"inputs": [],
		"name": "getFactoryAddress",
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
				"internalType": "uint256",
				"name": "ethAmount",
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
				"name": "ccipFee",
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
		"name": "getRouter",
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
				"name": "_totalEthSent",
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
		"name": "joinCompetitionWithETH",
		"outputs": [],
		"stateMutability": "payable",
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
		"name": "messageToUser",
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
		"name": "minimumEthAmount",
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
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes4",
				"name": "interfaceId",
				"type": "bytes4"
			}
		],
		"name": "supportsInterface",
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
		"inputs": [],
		"name": "totalEthSent",
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
				"name": "newFactory",
				"type": "address"
			}
		],
		"name": "updateAvalancheFactory",
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

// Contract address on Sepolia
const SEPOLIA_PARTICIPATION_ADDRESS = "0x0c52d6EbEb3d815fcF3eccf09522028ed787f74a";

export interface ParticipationCost {
  totalCost: string;
  ccipFee: string;
  actualParticipation: string;
  totalCostEth: string;
  ccipFeeEth: string;
  actualParticipationEth: string;
}

export interface JoinCompetitionParams {
  competitionId: number;
  confidence: number;
  investmentEth: string;
}

export interface ParticipationResult {
  success: boolean;
  data?: any;
  error?: string;
  txHash?: string;
}

// Get contract instance
const getSepoliaParticipationContract = (
  signerOrProvider: ethers.Signer | ethers.providers.Provider
) => {
  return new ethers.Contract(
    SEPOLIA_PARTICIPATION_ADDRESS,
    SEPOLIA_PARTICIPATION_ABI,
    signerOrProvider
  );
};

/**
 * Get participation cost breakdown for given ETH amount
 */
export const getParticipationCost = async (
  provider: ethers.providers.Provider,
  investmentEthAmount: string
): Promise<ParticipationResult> => {
  try {
    console.log('=== GET PARTICIPATION COST ===');
    console.log('Investment ETH:', investmentEthAmount);
    
    const contract = getSepoliaParticipationContract(provider);
    
    // Convert ETH to wei
    const investmentWei = ethers.utils.parseEther(investmentEthAmount);
    console.log('Investment Wei:', investmentWei.toString());
    
    // Get cost breakdown
    const [totalCost, ccipFee, actualParticipation] = await contract.getParticipationCost(investmentWei);
    
    const costData: ParticipationCost = {
      totalCost: totalCost.toString(),
      ccipFee: ccipFee.toString(),
      actualParticipation: actualParticipation.toString(),
      totalCostEth: ethers.utils.formatEther(totalCost),
      ccipFeeEth: ethers.utils.formatEther(ccipFee),
      actualParticipationEth: ethers.utils.formatEther(actualParticipation)
    };
    
    console.log('Cost breakdown:', costData);
    
    return {
      success: true,
      data: costData
    };
    
  } catch (error: any) {
    console.error('Error getting participation cost:', error);
    return {
      success: false,
      error: error.message || 'Failed to get participation cost'
    };
  }
};

/**
 * Join competition from Sepolia with ETH
 */
export const joinCompetitionWithETH = async (
  signer: ethers.Signer,
  params: JoinCompetitionParams
): Promise<ParticipationResult> => {
  try {
    console.log('=== JOIN COMPETITION WITH ETH ===');
    console.log('Params:', params);
    
    // Validate parameters
    if (params.confidence < 1 || params.confidence > 100) {
      return { success: false, error: 'Confidence must be between 1 and 100' };
    }
    
    if (!params.investmentEth || parseFloat(params.investmentEth) <= 0) {
      return { success: false, error: 'Investment amount must be greater than 0' };
    }
    
    const contract = getSepoliaParticipationContract(signer);
    
    // Get current cost breakdown
    const provider = signer.provider!;
    const costResult = await getParticipationCost(provider, params.investmentEth);
    
    if (!costResult.success || !costResult.data) {
      return { success: false, error: 'Failed to calculate participation cost' };
    }
    
    const costData = costResult.data as ParticipationCost;
    
    // Check user balance
    const userAddress = await signer.getAddress();
    const balance = await provider.getBalance(userAddress);
    const requiredAmount = ethers.BigNumber.from(costData.totalCost);
    
    if (balance.lt(requiredAmount)) {
      return {
        success: false,
        error: `Insufficient balance. Required: ${costData.totalCostEth} ETH, Available: ${ethers.utils.formatEther(balance)} ETH`
      };
    }
    
    console.log('Sending transaction with value:', costData.totalCostEth, 'ETH');
    
    // Estimate gas
    const gasEstimate = await contract.estimateGas.joinCompetitionWithETH(
      params.competitionId,
      params.confidence,
      { value: costData.totalCost }
    );
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate.mul(120).div(100);
    
    // Execute transaction
    const tx = await contract.joinCompetitionWithETH(
      params.competitionId,
      params.confidence,
      { 
        value: costData.totalCost,
        gasLimit: gasLimit
      }
    );
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('Join competition transaction successful!');
      
      // Parse events
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
          event: event?.args
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
    console.error('Error joining competition:', error);
    
    // Handle specific errors
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return { success: false, error: 'Insufficient funds for transaction' };
    }
    
    if (error.code === 'USER_REJECTED') {
      return { success: false, error: 'Transaction was rejected by user' };
    }
    
    if (error.message?.includes('InsufficientETHAmount')) {
      return { success: false, error: 'Investment amount is below minimum required' };
    }
    
    if (error.message?.includes('InvalidConfidence')) {
      return { success: false, error: 'Confidence must be between 1 and 100' };
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

/**
 * Get minimum ETH amount required
 */
export const getMinimumEthAmount = async (
  provider: ethers.providers.Provider
): Promise<ParticipationResult> => {
  try {
    const contract = getSepoliaParticipationContract(provider);
    const minAmount = await contract.minimumEthAmount();
    
    return {
      success: true,
      data: {
        wei: minAmount.toString(),
        eth: ethers.utils.formatEther(minAmount)
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get minimum amount'
    };
  }
};