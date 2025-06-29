// FILE: src/contexts/WalletContext.tsx
// PLACE: Create this file in src/contexts/ directory

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN, ChainConfig } from '../config/contracts';
import { ContractHelper } from '../utils/contractHelpers';

interface WalletContextType {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  balance: string;
  isConnecting: boolean;
  contractHelper: ContractHelper | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (targetChainId: number) => Promise<void>;
  getCurrentChain: () => ChainConfig | undefined;
  isOnSupportedNetwork: () => boolean;
  updateBalance: (address: string) => Promise<void>;
  isConnected: boolean;
  formatAddress: (address: string) => string;
  formatTokenAmount: (amount: string | number, decimals?: number, displayDecimals?: number) => string;
  parseTokenAmount: (amount: string | number, decimals?: number) => ethers.BigNumber;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [balance, setBalance] = useState<string>('0');
  const [contractHelper, setContractHelper] = useState<ContractHelper | null>(null);

  useEffect(() => {
    const initializeWallet = async (): Promise<void> => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          await connectWallet();
        }

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      }
    };

    initializeWallet();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]): void => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
      updateBalance(accounts[0]);
    }
  };

  const handleChainChanged = (chainId: string): void => {
    const numericChainId = parseInt(chainId, 16);
    setChainId(numericChainId);
  };

  const connectWallet = async (): Promise<void> => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(network.chainId);

      const helper = new ContractHelper(provider, signer);
      setContractHelper(helper);

      await updateBalance(accounts[0]);

      const supportedChains = Object.values(CONTRACT_ADDRESSES).map(c => c.chainId);
      if (!supportedChains.includes(network.chainId)) {
        await helper.switchToChain(DEFAULT_CHAIN.chainId);
      }

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = (): void => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance('0');
    setContractHelper(null);
  };

  const updateBalance = async (address: string): Promise<void> => {
    if (provider && address) {
      try {
        const balance = await provider.getBalance(address);
        setBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error('Failed to update balance:', error);
      }
    }
  };

  const switchNetwork = async (targetChainId: number): Promise<void> => {
    if (contractHelper) {
      await contractHelper.switchToChain(targetChainId);
    }
  };

  const getCurrentChain = (): ChainConfig | undefined => {
    return Object.values(CONTRACT_ADDRESSES).find(c => c.chainId === chainId);
  };

  const isOnSupportedNetwork = (): boolean => {
    const supportedChains = Object.values(CONTRACT_ADDRESSES).map(c => c.chainId);
    return chainId !== null && supportedChains.includes(chainId);
  };

  const value: WalletContextType = {
    account,
    provider,
    signer,
    chainId,
    balance,
    isConnecting,
    contractHelper,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getCurrentChain,
    isOnSupportedNetwork,
    updateBalance,
    isConnected: !!account,
    formatAddress: ContractHelper.formatAddress,
    formatTokenAmount: ContractHelper.formatTokenAmount,
    parseTokenAmount: ContractHelper.parseTokenAmount
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};