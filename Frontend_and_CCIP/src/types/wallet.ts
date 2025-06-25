// Place this file as: src/types/wallet.ts

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  chainName: string;
  isConnected: boolean;
  // New properties for enhanced portfolio functionality
  walletType?: string;  // 'core', 'metamask', 'coinbase', etc.
  walletIcon?: string;  // Icon for the wallet
  chainIcon?: string;   // Icon for the current chain
  nativeCurrency?: string;  // Native currency symbol (ETH, AVAX, etc.)
  canSwitchChains?: boolean;  // Whether wallet can switch chains
  supportedChains?: number[]; // Array of supported chain IDs
}

export interface WalletState {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  error: string | null;
}

export interface SupportedChain {
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  blockExplorer: string;
  icon: string;
}

export const SUPPORTED_CHAINS: Record<number, SupportedChain> = {
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    blockExplorer: 'https://etherscan.io',
    icon: '⟠'
  },
  43114: {
    chainId: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    icon: '🔺'
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    icon: '🔵'
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/your-api-key',
    blockExplorer: 'https://arbiscan.io',
    icon: '🔴'
  },
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key',
    blockExplorer: 'https://polygonscan.com',
    icon: '🟣'
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    icon: '🔴'
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/your-api-key',
    blockExplorer: 'https://sepolia.etherscan.io',
    icon: '⟠'
  },
  80001: {
    chainId: 80001,
    name: 'Mumbai Testnet',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/your-api-key',
    blockExplorer: 'https://mumbai.polygonscan.com',
    icon: '🟣'
  }
};