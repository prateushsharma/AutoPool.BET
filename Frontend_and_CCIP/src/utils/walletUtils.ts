// Place this file as: src/utils/walletUtils.ts

export interface ChainInfo {
  id: number;
  name: string;
  icon: string;
  nativeCurrency: string;
  color: string;
  rpcUrl?: string;
  blockExplorer?: string;
}

export interface WalletType {
  name: string;
  icon: string;
  isDetected: boolean;
  supportedChains: number[];
}

// Supported blockchain networks
export const SUPPORTED_CHAINS: Record<number, ChainInfo> = {
  43114: {
    id: 43114,
    name: 'Avalanche',
    icon: '🔺',
    nativeCurrency: 'AVAX',
    color: '#E84142',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io'
  },
  1: {
    id: 1,
    name: 'Ethereum',
    icon: '⟠',
    nativeCurrency: 'ETH',
    color: '#627EEA',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://etherscan.io'
  },
  8453: {
    id: 8453,
    name: 'Base',
    icon: '🔵',
    nativeCurrency: 'ETH',
    color: '#0052FF',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org'
  },
  42161: {
    id: 42161,
    name: 'Arbitrum',
    icon: '🔴',
    nativeCurrency: 'ETH',
    color: '#28A0F0',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io'
  },
  137: {
    id: 137,
    name: 'Polygon',
    icon: '🟣',
    nativeCurrency: 'MATIC',
    color: '#8247E5',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  10: {
    id: 10,
    name: 'Optimism',
    icon: '🔴',
    nativeCurrency: 'ETH',
    color: '#FF0420',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io'
  }
};

// Wallet detection functions
export const detectWalletType = (): WalletType[] => {
  const wallets: WalletType[] = [];

  // Check for Core Wallet (Avalanche native)
  if (typeof window !== 'undefined' && window.ethereum?.isAvalanche) {
    wallets.push({
      name: 'Core Wallet',
      icon: '🔥',
      isDetected: true,
      supportedChains: [43114] // Only Avalanche
    });
  }

  // Check for MetaMask
  if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
    wallets.push({
      name: 'MetaMask',
      icon: '🦊',
      isDetected: true,
      supportedChains: [1, 43114, 8453, 42161, 137, 10] // All chains
    });
  }

  // Check for Coinbase Wallet
  if (typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet) {
    wallets.push({
      name: 'Coinbase Wallet',
      icon: '💙',
      isDetected: true,
      supportedChains: [1, 8453, 42161, 137, 10] // All except Avalanche
    });
  }

  // Check for WalletConnect
  if (typeof window !== 'undefined' && window.ethereum?.isWalletConnect) {
    wallets.push({
      name: 'WalletConnect',
      icon: '🔗',
      isDetected: true,
      supportedChains: [1, 43114, 8453, 42161, 137, 10] // All chains
    });
  }

  return wallets;
};

// Get current wallet type
export const getCurrentWalletType = (): string => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return 'unknown';
  }

  if (window.ethereum.isAvalanche) {
    return 'core';
  }
  
  if (window.ethereum.isMetaMask) {
    return 'metamask';
  }
  
  if (window.ethereum.isCoinbaseWallet) {
    return 'coinbase';
  }
  
  if (window.ethereum.isWalletConnect) {
    return 'walletconnect';
  }

  return 'unknown';
};

// Get chain info by ID
export const getChainInfo = (chainId: number): ChainInfo | null => {
  return SUPPORTED_CHAINS[chainId] || null;
};

// Check if chain is supported by wallet
export const isChainSupportedByWallet = (chainId: number, walletType: string): boolean => {
  const wallets = detectWalletType();
  const wallet = wallets.find(w => w.name.toLowerCase().includes(walletType.toLowerCase()));
  
  if (!wallet) return false;
  
  return wallet.supportedChains.includes(chainId);
};

// Format address for display
export const formatAddress = (address: string, startChars = 6, endChars = 4): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

// Format balance for display
export const formatBalance = (balance: string | number, decimals = 2): string => {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (isNaN(num)) return '0.00';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimals)}M`;
  }
  
  if (num >= 1000) {
    return `${(num / 1000).toFixed(decimals)}K`;
  }
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Add network to wallet
export const addNetworkToWallet = async (chainId: number): Promise<boolean> => {
  const chainInfo = getChainInfo(chainId);
  
  if (!chainInfo || !window.ethereum) {
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${chainId.toString(16)}`,
        chainName: chainInfo.name,
        nativeCurrency: {
          name: chainInfo.nativeCurrency,
          symbol: chainInfo.nativeCurrency,
          decimals: 18
        },
        rpcUrls: chainInfo.rpcUrl ? [chainInfo.rpcUrl] : [],
        blockExplorerUrls: chainInfo.blockExplorer ? [chainInfo.blockExplorer] : []
      }]
    });
    
    return true;
  } catch (error) {
    console.error('Error adding network:', error);
    return false;
  }
};

// Switch to network
export const switchToNetwork = async (chainId: number): Promise<boolean> => {
  if (!window.ethereum) {
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
    
    return true;
  } catch (error: any) {
    // If network not added, try to add it
    if (error.code === 4902) {
      return await addNetworkToWallet(chainId);
    }
    
    console.error('Error switching network:', error);
    return false;
  }
};

// Get wallet capabilities
export const getWalletCapabilities = (walletType: string) => {
  const capabilities = {
    canSwitchChains: true,
    canAddNetworks: true,
    supportedChains: [] as number[],
    isNativeToChain: null as number | null
  };

  switch (walletType.toLowerCase()) {
    case 'core':
      capabilities.canSwitchChains = false; // Core is Avalanche-only
      capabilities.canAddNetworks = false;
      capabilities.supportedChains = [43114];
      capabilities.isNativeToChain = 43114;
      break;
      
    case 'metamask':
      capabilities.supportedChains = [1, 43114, 8453, 42161, 137, 10];
      break;
      
    case 'coinbase':
      capabilities.supportedChains = [1, 8453, 42161, 137, 10];
      capabilities.isNativeToChain = 8453; // Base is Coinbase's chain
      break;
      
    default:
      capabilities.supportedChains = [1, 43114, 8453, 42161, 137, 10];
  }

  return capabilities;
};

// Generate mock token balances for testing
export const generateMockBalances = (chainId: number) => {
  const baseBalances = [
    {
      symbol: 'USDC',
      balance: '1,250.50',
      usdValue: '1,250.50',
      icon: '💵',
      address: '0xa0b86a33e6776d02b59f3e926c4e33fb40a8eaab'
    },
    {
      symbol: 'BET',
      balance: '5,000.00',
      usdValue: '2,500.00',
      icon: '🎯',
      address: '0x...' // Your BET token address
    }
  ];

  // Add chain-specific native token
  const chainInfo = getChainInfo(chainId);
  if (chainInfo) {
    baseBalances.push({
      symbol: chainInfo.nativeCurrency,
      balance: chainId === 43114 ? '15.75' : '0.85',
      usdValue: chainId === 43114 ? '472.50' : '2,040.00',
      icon: chainInfo.icon,
      address: 'native'
    });
  }

  // Add chain-specific tokens
  if (chainId === 1) { // Ethereum
    baseBalances.push({
      symbol: 'WETH',
      balance: '0.85',
      usdValue: '2,040.00',
      icon: '⟠',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    });
  } else if (chainId === 8453) { // Base
    baseBalances.push({
      symbol: 'cbETH',
      balance: '0.92',
      usdValue: '2,208.00',
      icon: '💙',
      address: '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22'
    });
  }

  return baseBalances;
};