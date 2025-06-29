// FILE: src/contexts/ContractContext.tsx  
// PLACE: Create this file in src/contexts/ directory

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { CompetitionService, CompetitionParams, TransactionReceipt, RewardCalculation } from '../utils/competitionHelpers';
import { transactionTracker, TrackedTransaction } from '../utils/transactionTracker';

interface ContractContextType {
  competitionService: CompetitionService | null;
  competitions: any[];
  isLoading: boolean;
  abis: { [key: string]: any[] };
  loadAbis: (abiData: { [key: string]: any[] }) => void;
  refreshCompetitions: () => Promise<void>;
  createCompetition: (params: CompetitionParams) => Promise<any>;
  joinCompetition: (
    competitionId: number,
    investment: string | number,
    strategy: string,
    fromChain: number
  ) => Promise<TransactionReceipt>;
  getCompetitionDetails: (competitionId: number) => Promise<any>;
  calculateRewards: (totalPool: number, userInvestment: number, userConfidence: number) => RewardCalculation | null;
  getTrackedTransactions: () => TrackedTransaction[];
  updateTransactionStatus: (txHash: string, updates: Partial<TrackedTransaction>) => void;
  isReady: boolean;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const useContract = (): ContractContextType => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
};

interface ContractProviderProps {
  children: ReactNode;
}

export const ContractProvider: React.FC<ContractProviderProps> = ({ children }) => {
  const { contractHelper, isConnected } = useWallet();
  const [competitionService, setCompetitionService] = useState<CompetitionService | null>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [abis, setAbis] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    if (contractHelper && isConnected) {
      const service = new CompetitionService(contractHelper);
      setCompetitionService(service);
      
      transactionTracker.loadFromStorage();
      transactionTracker.clearOldTransactions();
    }
  }, [contractHelper, isConnected]);

  const loadAbis = (abiData: { [key: string]: any[] }): void => {
    setAbis(abiData);
  };

  const refreshCompetitions = async (): Promise<void> => {
    if (!competitionService || !abis.ENHANCED_COMPETITION_FACTORY) return;
    
    setIsLoading(true);
    try {
      const allCompetitions = await competitionService.getAllCompetitions(
        abis.ENHANCED_COMPETITION_FACTORY
      );
      setCompetitions(allCompetitions);
    } catch (error) {
      console.error('Failed to refresh competitions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCompetition = async (params: CompetitionParams): Promise<any> => {
    if (!competitionService || !abis.ENHANCED_COMPETITION_FACTORY) {
      throw new Error('Competition service not initialized');
    }

    const receipt = await competitionService.createCompetition(
      params,
      abis.ENHANCED_COMPETITION_FACTORY
    );

    transactionTracker.trackTransaction(receipt.transactionHash, 'create', {
      topic: params.topic,
      creatorStake: params.creatorStake.toString()
    });

    await refreshCompetitions();
    return receipt;
  };

  const joinCompetition = async (
    competitionId: number,
    investment: string | number,
    strategy: string,
    fromChain: number
  ): Promise<TransactionReceipt> => {
    if (!competitionService) {
      throw new Error('Competition service not initialized');
    }

    const abi = fromChain === 43113 
      ? abis.ENHANCED_COMPETITION_FACTORY 
      : (fromChain === 11155111 ? abis.SEPOLIA_PARTICIPATION : abis.DISPATCH_PARTICIPATION);

    const receipt = await competitionService.joinCompetition(
      competitionId,
      investment,
      strategy,
      fromChain,
      abi
    );

    transactionTracker.trackTransaction(receipt.transactionHash, 'join', {
      competitionId,
      investment: investment.toString(),
      crossChain: receipt.crossChain,
      fromChain,
      estimatedArrival: receipt.estimatedArrival
    });

    await refreshCompetitions();
    return receipt;
  };

  const getCompetitionDetails = async (competitionId: number): Promise<any> => {
    if (!competitionService || !abis.ENHANCED_COMPETITION_FACTORY) return null;

    try {
      const [competition, participants] = await Promise.all([
        competitionService.getCompetition(competitionId, abis.ENHANCED_COMPETITION_FACTORY),
        competitionService.getParticipants(competitionId, abis.ENHANCED_COMPETITION_FACTORY)
      ]);

      return { competition, participants };
    } catch (error) {
      console.error('Failed to get competition details:', error);
      return null;
    }
  };

  const calculateRewards = (
    totalPool: number,
    userInvestment: number,
    userConfidence: number
  ): RewardCalculation | null => {
    if (!competitionService) return null;
    return competitionService.calculateEstimatedReward(totalPool, userInvestment, userConfidence);
  };

  const getTrackedTransactions = (): TrackedTransaction[] => {
    return transactionTracker.getAllTransactions();
  };

  const updateTransactionStatus = (txHash: string, updates: Partial<TrackedTransaction>): void => {
    transactionTracker.updateTransaction(txHash, updates);
  };

  const value: ContractContextType = {
    competitionService,
    competitions,
    isLoading,
    abis,
    loadAbis,
    refreshCompetitions,
    createCompetition,
    joinCompetition,
    getCompetitionDetails,
    calculateRewards,
    getTrackedTransactions,
    updateTransactionStatus,
    isReady: !!competitionService && Object.keys(abis).length > 0
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};