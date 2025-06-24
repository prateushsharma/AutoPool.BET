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

  // Simple check for existing connection on page load
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const isMetaMaskInstalled = (): boolean => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask === true;
  };

  const checkExistingConnection = async () => {
    if (!isMetaMaskInstalled()) {
      return;
    }

    try {
      // Only check for existing accounts, don't request new ones
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        await getWalletInfo(accounts[0]);
        setupSimpleEventListeners();
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  };

  // Simplified event listeners that only set up after successful connection
  const setupSimpleEventListeners = () => {
    if (!isMetaMaskInstalled()) return;

    // Simple account change handler
    const handleAccountChange = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          dispatch({ type: 'DISCONNECT' });
        } else {
          await getWalletInfo(accounts[0]);
        }
      } catch (error) {
        console.error('Error handling account change:', error);
      }
    };

    // Simple chain change handler
    const handleChainChange = async () => {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const numChainId = parseInt(chainId, 16);
        const chainInfo = SUPPORTED_CHAINS[numChainId];
        
        dispatch({
          type: 'UPDATE_CHAIN',
          payload: {
            chainId: numChainId,
            chainName: chainInfo?.name || `Chain ${numChainId}`
          }
        });
        
        // Refresh balance after chain change
        if (state.wallet?.address) {
          refreshBalance();
        }
      } catch (error) {
        console.error('Error handling chain change:', error);
      }
    };

    // Set up listeners without the problematic addListener
    try {
      if (window.ethereum && typeof window.ethereum.on === 'function') {
        window.ethereum.on('accountsChanged', handleAccountChange);
        window.ethereum.on('chainChanged', handleChainChange);
      }
    } catch (error) {
      console.warn('Could not set up event listeners:', error);
    }
  };

  const getWalletInfo = async (address: string): Promise<void> => {
    try {
      // Get current chain ID
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      const numChainId = parseInt(chainId, 16);
      const chainInfo = SUPPORTED_CHAINS[numChainId];
      
      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Convert balance from wei to ETH
      const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
      
      const walletInfo: WalletInfo = {
        address,
        balance: balanceInEth,
        chainId: numChainId,
        chainName: chainInfo?.name || `Chain ${numChainId}`,
        isConnected: true
      };

      dispatch({ type: 'CONNECT_SUCCESS', payload: walletInfo });
    } catch (error) {
      console.error('Error getting wallet info:', error);
      dispatch({ type: 'CONNECT_ERROR', payload: 'Failed to get wallet information' });
    }
  };

  const connectWallet = async (): Promise<void> => {
    // Check if MetaMask is installed
    if (!isMetaMaskInstalled()) {
      dispatch({ 
        type: 'CONNECT_ERROR', 
        payload: 'MetaMask not detected. Please install MetaMask browser extension.' 
      });
      return;
    }

    dispatch({ type: 'CONNECT_START' });

    try {
      // Simple connection request without any event listener setup
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        await getWalletInfo(accounts[0]);
        // Only set up event listeners after successful connection
        setupSimpleEventListeners();
      } else {
        dispatch({ type: 'CONNECT_ERROR', payload: 'No accounts returned from MetaMask' });
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      
      let errorMessage = 'Failed to connect to MetaMask';
      
      if (error.code === 4001) {
        errorMessage = 'Connection rejected. Please approve the connection in MetaMask.';
      } else if (error.code === -32002) {
        errorMessage = 'Connection request pending. Please check MetaMask.';
      } else if (error.code === -32603) {
        errorMessage = 'Internal error. Try refreshing the page.';
      } else if (error.message && error.message.includes('User rejected')) {
        errorMessage = 'Connection was cancelled. Please try again.';
      }
      
      dispatch({ type: 'CONNECT_ERROR', payload: errorMessage });
    }
  };

  const disconnectWallet = (): void => {
    dispatch({ type: 'DISCONNECT' });
  };

  const switchChain = async (chainId: number): Promise<void> => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask not available');
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
          throw new Error('Failed to add network to MetaMask');
        }
      } else {
        throw new Error(`Failed to switch network: ${error.message}`);
      }
    }
  };

  const refreshBalance = async (): Promise<void> => {
    if (!state.wallet?.address || !isMetaMaskInstalled()) return;

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