// File: src/contracts/CompetitionFactory.ts
// EnhancedCompetitionFactory Contract Functions

import { ethers } from 'ethers';
import { getContractAddress } from './config/contractConfig';
import { ENHANCED_COMPETITION_FACTORY_ABI } from './abis/EnchancedCompetitionFactoryABI';
// Types
export interface Competition {
  id: string;
  creator: string;
  title: string;
  createdAt: string;
  totalPool: string;
  participantCount: string;
  isClosed: boolean;
  isSettled: boolean;
}

export interface CreateCompetitionParams {
  competitionId: number;
  title: string;
  investment: string; // In BETmain tokens (wei format)
  confidence: number; // 1-100
}

export interface CompetitionFactoryResult {
  success: boolean;
  data?: any;
  error?: string;
  txHash?: string;
}

// Get contract instance
const getCompetitionFactoryContract = (
  signerOrProvider: ethers.Signer | ethers.providers.Provider,
  chainId: string
) => {
  const contractAddress = getContractAddress(chainId, 'enhancedCompetitionFactory');
  return new ethers.Contract(
    contractAddress,
    ENHANCED_COMPETITION_FACTORY_ABI,
    signerOrProvider
  );
};

/**
 * Create a new competition
 * @param signer - Wallet signer
 * @param chainId - Current network chain ID
 * @param params - Competition creation parameters
 * @returns Promise with transaction result
 */
export const createCompetition = async (
  signer: ethers.Signer,
  chainId: string,
  params: CreateCompetitionParams
): Promise<CompetitionFactoryResult> => {
  try {
    console.log('=== CREATE COMPETITION DEBUG ===');
    console.log('Chain ID:', chainId);
    console.log('Params:', params);
    
    // Validate parameters
    if (!params.title.trim()) {
      return { success: false, error: 'Competition title is required' };
    }
    
    if (params.confidence < 1 || params.confidence > 100) {
      return { success: false, error: 'Confidence must be between 1 and 100' };
    }

    // Get contract address
    let contractAddress;
    try {
      contractAddress = getContractAddress(chainId, 'enhancedCompetitionFactory');
      console.log('Contract address:', contractAddress);
    } catch (error) {
      console.error('Contract address error:', error);
      return { success: false, error: `Contract not found for network ${chainId}` };
    }

    const contract = getCompetitionFactoryContract(signer, chainId);
    console.log('Contract instance created');
    
    // Convert investment to wei if it's not already
    const investmentWei = ethers.utils.parseEther(params.investment);
    console.log('Investment in wei:', investmentWei.toString());
    
    // Check signer address
    const signerAddress = await signer.getAddress();
    console.log('Signer address:', signerAddress);
    
    // Test contract connection first
    try {
      const minInvestment = await contract.minimumInvestment();
      console.log('Minimum investment:', ethers.utils.formatEther(minInvestment), 'BET');
      
      if (investmentWei.lt(minInvestment)) {
        return { 
          success: false, 
          error: `Investment ${params.investment} BET is below minimum ${ethers.utils.formatEther(minInvestment)} BET` 
        };
      }
    } catch (error) {
      console.error('Contract read error:', error);
      return { success: false, error: 'Cannot connect to contract. Check network and contract address.' };
    }
    
    // Estimate gas
    console.log('Estimating gas...');
    const gasEstimate = await contract.estimateGas.createCompetition(
      params.competitionId,
      params.title,
      investmentWei,
      params.confidence
    );
    console.log('Gas estimate:', gasEstimate.toString());
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate.mul(120).div(100);
    console.log('Gas limit with buffer:', gasLimit.toString());
    
    // Execute transaction
    console.log('Sending transaction...');
    const tx = await contract.createCompetition(
      params.competitionId,
      params.title,
      investmentWei,
      params.confidence,
      { gasLimit }
    );
    
    console.log('Competition creation transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('Competition created successfully!');
      
      // Parse events to get competition details
      const event = receipt.events?.find(
        (e: any) => e.event === 'CompetitionCreated'
      );
      
      return {
        success: true,
        data: {
          competitionId: params.competitionId,
          txHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
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
    
    if (error.message?.includes('InsufficientInvestment')) {
      return { success: false, error: 'Investment amount is below minimum required' };
    }
    
    if (error.message?.includes('CompetitionAlreadyExists')) {
      return { success: false, error: 'Competition with this ID already exists' };
    }
    
    if (error.message?.includes('InvalidConfidence')) {
      return { success: false, error: 'Confidence must be between 1 and 100' };
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
 * Get competition details
 * @param provider - Ethereum provider
 * @param chainId - Current network chain ID
 * @param competitionId - Competition ID to fetch
 * @returns Promise with competition data
 */
export const getCompetition = async (
  provider: ethers.providers.Provider,
  chainId: string,
  competitionId: number
): Promise<CompetitionFactoryResult> => {
  try {
    const contract = getCompetitionFactoryContract(provider, chainId);
    
    const competition = await contract.getCompetition(competitionId);
    
    // Format the response
    const formattedCompetition: Competition = {
      id: competition.id.toString(),
      creator: competition.creator,
      title: competition.title,
      createdAt: competition.createdAt.toString(),
      totalPool: ethers.utils.formatEther(competition.totalPool),
      participantCount: competition.participantCount.toString(),
      isClosed: competition.isClosed,
      isSettled: competition.isSettled
    };
    
    return {
      success: true,
      data: formattedCompetition
    };
    
  } catch (error: any) {
    console.error('Error fetching competition:', error);
    
    if (error.message?.includes('CompetitionNotFound')) {
      return { success: false, error: 'Competition not found' };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to fetch competition'
    };
  }
};

/**
 * Get minimum investment required
 * @param provider - Ethereum provider
 * @param chainId - Current network chain ID
 * @returns Promise with minimum investment amount
 */
export const getMinimumInvestment = async (
  provider: ethers.providers.Provider,
  chainId: string
): Promise<CompetitionFactoryResult> => {
  try {
    const contract = getCompetitionFactoryContract(provider, chainId);
    
    const minInvestment = await contract.minimumInvestment();
    
    return {
      success: true,
      data: {
        wei: minInvestment.toString(),
        ether: ethers.utils.formatEther(minInvestment),
        formatted: `${ethers.utils.formatEther(minInvestment)} BET`
      }
    };
    
  } catch (error: any) {
    console.error('Error fetching minimum investment:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch minimum investment'
    };
  }
};

/**
 * Get competition counter (total competitions created)
 * @param provider - Ethereum provider
 * @param chainId - Current network chain ID
 * @returns Promise with competition counter
 */
export const getCompetitionCounter = async (
  provider: ethers.providers.Provider,
  chainId: string
): Promise<CompetitionFactoryResult> => {
  try {
    const contract = getCompetitionFactoryContract(provider, chainId);
    
    const counter = await contract.competitionCounter();
    
    return {
      success: true,
      data: {
        count: counter.toString(),
        nextId: counter.add(1).toString()
      }
    };
    
  } catch (error: any) {
    console.error('Error fetching competition counter:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch competition counter'
    };
  }
};