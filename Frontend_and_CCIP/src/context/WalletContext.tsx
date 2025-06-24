// Place this file as: src/context/WalletContext.tsx

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { WalletState, WalletInfo, SUPPORTED_CHAINS } from '../types/wallet';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchChain: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

type WalletAction =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; payload: WalletInfo }
  | { type: 'CONNECT_ERROR'; payload: string }
  | { type: 'DISCONNECT' }
  | { type: 'UPDATE_BALANCE'; payload: string }
  | { type: 'UPDATE_CHAIN'; payload: { chainId: number; chainName: string } };

const initialState: WalletState = {
  wallet: null,
  isConnecting: false,
  error: null
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'CONNECT_START':
      return {
        ...state,
        isConnecting: true,
        error: null
      };
    case 'CONNECT_SUCCESS':
      return {
        ...state,
        wallet: action.payload,
        isConnecting: false,
        error: null
      };
    case 'CONNECT_ERROR':
      return {
        ...state,
        wallet: null,
        isConnecting: false,
        error: action.payload
      };
    case 'DISCONNECT':
      return {
        ...state,
        wallet: null,
        isConnecting: false,
        error: null
      };
    case 'UPDATE_BALANCE':
      return {
        ...state,
        wallet: state.wallet ? {
          ...state.wallet,
          balance: action.payload
        } : null
      };
    case 'UPDATE_CHAIN':
      return {
        ...state,
        wallet: state.wallet ? {
          ...state.wallet,
          chainId: action.payload.chainId,
          chainName: action.payload.chainName
        } : null
      };
    default:
      return state;
  }
}

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Check if wallet is already connected on page load
  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await getWalletInfo(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const setupEventListeners = () => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      dispatch({ type: 'DISCONNECT' });
    } else {
      getWalletInfo(accounts[0]);
    }
  };

  const handleChainChanged = (chainId: string) => {
    const numChainId = parseInt(chainId, 16);
    const chainInfo = SUPPORTED_CHAINS[numChainId];
    
    if (chainInfo) {
      dispatch({
        type: 'UPDATE_CHAIN',
        payload: {
          chainId: numChainId,
          chainName: chainInfo.name
        }
      });
      refreshBalance();
    }
  };

  const handleDisconnect = () => {
    dispatch({ type: 'DISCONNECT' });
  };

  const getWalletInfo = async (address: string): Promise<void> => {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const numChainId = parseInt(chainId, 16);
      const chainInfo = SUPPORTED_CHAINS[numChainId];
      
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
      
      const walletInfo: WalletInfo = {
        address,
        balance: balanceInEth,
        chainId: numChainId,
        chainName: chainInfo?.name || 'Unknown Network',
        isConnected: true
      };

      dispatch({ type: 'CONNECT_SUCCESS', payload: walletInfo });
    } catch (error) {
      console.error('Error getting wallet info:', error);
      dispatch({ type: 'CONNECT_ERROR', payload: 'Failed to get wallet information' });
    }
  };

  const connectWallet = async (): Promise<void> => {
    if (typeof window.ethereum === 'undefined') {
      dispatch({ type: 'CONNECT_ERROR', payload: 'Please install MetaMask or another Web3 wallet' });
      return;
    }

    dispatch({ type: 'CONNECT_START' });

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        await getWalletInfo(accounts[0]);
      } else {
        dispatch({ type: 'CONNECT_ERROR', payload: 'No accounts found' });
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      let errorMessage = 'Failed to connect wallet';
      if (error.code === 4001) {
        errorMessage = 'Wallet connection rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'Wallet connection request is already pending';
      }
      
      dispatch({ type: 'CONNECT_ERROR', payload: errorMessage });
    }
  };

  const disconnectWallet = (): void => {
    dispatch({ type: 'DISCONNECT' });
  };

  const switchChain = async (chainId: number): Promise<void> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Wallet not available');
    }

    const chainInfo = SUPPORTED_CHAINS[chainId];
    if (!chainInfo) {
      throw new Error('Unsupported chain');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch (error: any) {
      // Chain not added to wallet
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: chainInfo.name,
              nativeCurrency: {
                name: chainInfo.symbol,
                symbol: chainInfo.symbol,
                decimals: chainInfo.decimals
              },
              rpcUrls: [chainInfo.rpcUrl],
              blockExplorerUrls: [chainInfo.blockExplorer]
            }]
          });
        } catch (addError) {
          throw new Error('Failed to add network to wallet');
        }
      } else {
        throw new Error('Failed to switch network');
      }
    }
  };

  const refreshBalance = async (): Promise<void> => {
    if (!state.wallet?.address) return;

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [state.wallet.address, 'latest']
      });
      
      const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
      dispatch({ type: 'UPDATE_BALANCE', payload: balanceInEth });
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  const value: WalletContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    switchChain,
    refreshBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};