// FILE: src/utils/competitionHelpers.ts
// PLACE: Create this file in src/utils/ directory

import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CROSS_CHAIN_CONFIG } from '../config/contracts';
import { ContractHelper } from './contractHelpers';

export interface CompetitionParams {
  topic: string;
  minInvestment: string | number;
  duration: number;
  creatorStake: string | number;
  creatorStrategy: string;
}

export interface TransactionReceipt extends ethers.ContractReceipt {
  crossChain?: boolean;
  estimatedArrival?: number;
  fromChain?: number;
  toChain?: number;
}

export interface RewardCalculation {
  poolShare: string;
  estimatedShare: string;
  potentialReward: string;
}

export class CompetitionService {
  private contractHelper: ContractHelper;

  constructor(contractHelper: ContractHelper) {
    this.contractHelper = contractHelper;
  }

  // Create new competition
  async createCompetition(params: CompetitionParams, abi: any[]): Promise<ethers.ContractReceipt> {
    const { topic, minInvestment, duration, creatorStake, creatorStrategy } = params;
    
    const factory = this.contractHelper.getContract(
      CONTRACT_ADDRESSES.AVALANCHE_FUJI.chainId,
      'ENHANCED_COMPETITION_FACTORY',
      abi
    );

    const tx = await factory.createCompetition(
      topic,
      ContractHelper.parseTokenAmount(minInvestment),
      duration,
      ContractHelper.parseTokenAmount(creatorStake),
      creatorStrategy
    );

    return await tx.wait();
  }

  // Join competition from any chain
  async joinCompetition(
    competitionId: number,
    investment: string | number,
    strategy: string,
    fromChain: number,
    abi: any[]
  ): Promise<TransactionReceipt> {
    if (fromChain === CONTRACT_ADDRESSES.AVALANCHE_FUJI.chainId) {
      return await this.joinCompetitionDirect(competitionId, investment, strategy, abi);
    } else {
      return await this.joinCompetitionCrossChain(competitionId, investment, strategy, fromChain, abi);
    }
  }

  // Direct join on Avalanche
  async joinCompetitionDirect(
    competitionId: number,
    investment: string | number,
    strategy: string,
    abi: any[]
  ): Promise<ethers.ContractReceipt> {
    const factory = this.contractHelper.getContract(
      CONTRACT_ADDRESSES.AVALANCHE_FUJI.chainId,
      'ENHANCED_COMPETITION_FACTORY',
      abi
    );

    const tx = await factory.joinCompetition(
      competitionId,
      ContractHelper.parseTokenAmount(investment),
      strategy
    );

    return await tx.wait();
  }

  // Cross-chain join (Sepolia or Dispatch)
  async joinCompetitionCrossChain(
    competitionId: number,
    investment: string | number,
    strategy: string,
    fromChain: number,
    abi: any[]
  ): Promise<TransactionReceipt> {
    let contractName: string;
    let estimatedTime: number;

    if (fromChain === CONTRACT_ADDRESSES.ETHEREUM_SEPOLIA.chainId) {
      contractName = 'SEPOLIA_PARTICIPATION';
      estimatedTime = CROSS_CHAIN_CONFIG.CCIP_ESTIMATED_TIME;
    } else if (fromChain === CONTRACT_ADDRESSES.DISPATCH_CHAIN.chainId) {
      contractName = 'DISPATCH_PARTICIPATION';
      estimatedTime = CROSS_CHAIN_CONFIG.TELEPORTER_ESTIMATED_TIME;
    } else {
      throw new Error(`Unsupported chain: ${fromChain}`);
    }

    const participationContract = this.contractHelper.getContract(fromChain, contractName, abi);
    
    const tx = await participationContract.participateInCompetition(
      competitionId,
      strategy,
      { value: ContractHelper.parseTokenAmount(investment) }
    );

    const receipt = await tx.wait();
    
    return {
      ...receipt,
      crossChain: true,
      estimatedArrival: Date.now() + estimatedTime,
      fromChain,
      toChain: CONTRACT_ADDRESSES.AVALANCHE_FUJI.chainId
    };
  }

  // Get competition details
  async getCompetition(competitionId: number, abi: any[]): Promise<any> {
    const factory = this.contractHelper.getContract(
      CONTRACT_ADDRESSES.AVALANCHE_FUJI.chainId,
      'ENHANCED_COMPETITION_FACTORY',
      abi
    );

    return await factory.getCompetition(competitionId);
  }

  // Get all competitions
  async getAllCompetitions(abi: any[]): Promise<any[]> {
    const factory = this.contractHelper.getContract(
      CONTRACT_ADDRESSES.AVALANCHE_FUJI.chainId,
      'ENHANCED_COMPETITION_FACTORY',
      abi
    );

    const competitionIds = await factory.getAllCompetitions();
    
    const competitions = await Promise.all(
      competitionIds.map((id: number) => this.getCompetition(id, abi))
    );

    return competitions;
  }

  // Get participants for a competition
  async getParticipants(competitionId: number, abi: any[]): Promise<any[]> {
    const factory = this.contractHelper.getContract(
      CONTRACT_ADDRESSES.AVALANCHE_FUJI.chainId,
      'ENHANCED_COMPETITION_FACTORY',
      abi
    );

    return await factory.getParticipants(competitionId);
  }

  // Calculate estimated rewards
  calculateEstimatedReward(
    totalPool: number,
    userInvestment: number,
    userConfidence: number = 50
  ): RewardCalculation {
    const poolShare = (userInvestment / totalPool) * 100;
    const confidenceMultiplier = userConfidence / 100;
    const estimatedShare = poolShare * confidenceMultiplier;
    
    return {
      poolShare: poolShare.toFixed(2),
      estimatedShare: estimatedShare.toFixed(2),
      potentialReward: (totalPool * estimatedShare / 100).toFixed(4)
    };
  }
}