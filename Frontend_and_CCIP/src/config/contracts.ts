// FILE: src/config/contracts.ts
// PLACE: Create this file in src/config/ directory

export interface ChainConfig {
  chainId: number;
  name: string;
  rpc: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  contracts: {
    [key: string]: string;
  };
}

export interface ContractAddresses {
  [key: string]: ChainConfig;
}

export const CONTRACT_ADDRESSES: ContractAddresses = {
  // Avalanche Fuji (Main Hub)
  AVALANCHE_FUJI: {
    chainId: 43113,
    name: 'Avalanche Fuji',
    rpc: 'https://api.avax-test.network/ext/bc/C/rpc',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    blockExplorer: 'https://testnet.snowtrace.io',
    contracts: {
      ENHANCED_COMPETITION_FACTORY: '', // ADD YOUR CONTRACT ADDRESS HERE
      BETMAIN_TOKEN: '',                // ADD YOUR CONTRACT ADDRESS HERE  
      PRIZE_ORACLE: '',                 // ADD YOUR CONTRACT ADDRESS HERE
      TELEPORTER_CCIP_BRIDGE: ''        // ADD YOUR CONTRACT ADDRESS HERE
    }
  },
  
  // Ethereum Sepolia (CCIP Chain)
  ETHEREUM_SEPOLIA: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpc: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // UPDATE WITH YOUR KEY
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://sepolia.etherscan.io',
    contracts: {
      SEPOLIA_PARTICIPATION: ''         // ADD YOUR CONTRACT ADDRESS HERE
    }
  },
  
  // Dispatch Chain (Teleporter)  
  DISPATCH_CHAIN: {
    chainId: 779672,
    name: 'Dispatch Subnet',
    rpc: 'https://subnets.avax.network/dispatch/testnet/rpc',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    blockExplorer: 'https://subnets.avax.network/dispatch',
    contracts: {
      DISPATCH_PARTICIPATION: ''        // ADD YOUR CONTRACT ADDRESS HERE
    }
  }
};

// Default chain for the application
export const DEFAULT_CHAIN: ChainConfig = CONTRACT_ADDRESSES.AVALANCHE_FUJI;

// Cross-chain message tracking
export interface CrossChainConfig {
  CCIP_ESTIMATED_TIME: number;
  TELEPORTER_ESTIMATED_TIME: number;
  POLLING_INTERVAL: number;
}

export const CROSS_CHAIN_CONFIG: CrossChainConfig = {
  CCIP_ESTIMATED_TIME: 15 * 60 * 1000,      // 15 minutes in milliseconds
  TELEPORTER_ESTIMATED_TIME: 5 * 1000,       // 5 seconds in milliseconds
  POLLING_INTERVAL: 3000                      // Poll every 3 seconds
};