// Place this file as: src/config/contracts.ts
// Flexible multi-chain configuration - easily add/remove chains and switch environments

export interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  ccipChainSelector?: string;
  isTestnet: boolean;
  icon: string;
  color: string;
}

export interface ContractAddresses {
  BETmain_TOKEN?: string;
  ETH_EXCHANGE?: string;
  CCIP_BRIDGE?: string;
  DEPOSIT_AND_RECEIVE?: string;
  AMM_FACTORY?: string;
  STRATEGY_MANAGER?: string;
  AI_ORACLE?: string;
  TREASURY?: string;
  CCIP_ROUTER?: string;
  USDC_TOKEN?: string;
  WETH_TOKEN?: string;
}

// 🌐 ALL SUPPORTED CHAINS - Easy to add/remove
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  // 🧪 TESTNETS
  SEPOLIA: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
    ccipChainSelector: '16015286601757825753',
    isTestnet: true,
    icon: '⟠',
    color: '#627EEA'
  },
  
  ARBITRUM_SEPOLIA: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
    ccipChainSelector: '3478487238524512106',
    isTestnet: true,
    icon: '🔴',
    color: '#28A0F0'
  },

  AVALANCHE_FUJI: {
    name: 'Avalanche Fuji',
    chainId: 43113,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    blockExplorer: 'https://testnet.snowtrace.io',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    ccipChainSelector: '14767482510784806043',
    isTestnet: true,
    icon: '🔺',
    color: '#E84142'
  },

  BASE_SEPOLIA: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia-explorer.base.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    ccipChainSelector: '10344971235874465080',
    isTestnet: true,
    icon: '🔵',
    color: '#0052FF'
  },

  POLYGON_MUMBAI: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    ccipChainSelector: '12532609583862916517',
    isTestnet: true,
    icon: '🟣',
    color: '#8247E5'
  },

  // 🚀 MAINNETS
  ETHEREUM: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    ccipChainSelector: '5009297550715157269',
    isTestnet: false,
    icon: '⟠',
    color: '#627EEA'
  },

  ARBITRUM: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/demo',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    ccipChainSelector: '4949039107694359620',
    isTestnet: false,
    icon: '🔴',
    color: '#28A0F0'
  },

  AVALANCHE: {
    name: 'Avalanche C-Chain',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    ccipChainSelector: '6433500567565415381',
    isTestnet: false,
    icon: '🔺',
    color: '#E84142'
  },

  BASE: {
    name: 'Base Mainnet',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    ccipChainSelector: '15971525489660198786',
    isTestnet: false,
    icon: '🔵',
    color: '#0052FF'
  },

  POLYGON: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/demo',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    ccipChainSelector: '4051577828743386545',
    isTestnet: false,
    icon: '🟣',
    color: '#8247E5'
  },

  OPTIMISM: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    ccipChainSelector: '3734403246176062136',
    isTestnet: false,
    icon: '🔴',
    color: '#FF0420'
  }

  // 🔥 EASY TO ADD MORE CHAINS:
  // Just copy format above and add new chain config
  // Don't forget to add contract addresses below!
};

// 🎛️ ENVIRONMENT CONTROL - Change this to switch between testnet/mainnet
export const USE_TESTNET = true; // Set to false for mainnet deployment

// 📍 CONTRACT ADDRESSES - Organized by chain and environment
const getContractAddresses = (): Record<string, ContractAddresses> => {
  if (USE_TESTNET) {
    // 🧪 TESTNET ADDRESSES
    return {
      SEPOLIA: {
        BETmain_TOKEN: '0x5F4743a164e87C5596C30BE8e2C5119b5cfE48a5',
        ETH_EXCHANGE: '0xB889Eb906Eb01E0E82ca457981AF230C627B1Ae3',
        CCIP_BRIDGE: '0x22F6Db6967ac3b17848f0411648c4A47355DB7Cd',
        TREASURY: '0x6EbcFFA1401D473CF687e0a3cEF985877358280a',
        CCIP_ROUTER: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59',
        USDC_TOKEN: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Sepolia USDC
      },
      
      ARBITRUM_SEPOLIA: {
        DEPOSIT_AND_RECEIVE: '0x37Cc04eAb33A9F4cf945B440cAF6E87a79Ca534A',
        CCIP_ROUTER: '0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165',
        TREASURY: '0x6EbcFFA1401D473CF687e0a3cEF985877358280a',
        USDC_TOKEN: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' // Arbitrum Sepolia USDC
      },

      AVALANCHE_FUJI: {
        BETmain_TOKEN: '', // To be deployed
        AMM_FACTORY: '', // To be deployed
        STRATEGY_MANAGER: '', // To be deployed
        AI_ORACLE: '', // To be deployed
        TREASURY: '0x6EbcFFA1401D473CF687e0a3cEF985877358280a',
        CCIP_ROUTER: '0xF694E193200268f9a4868e4Aa017A0118C9a8177',
        USDC_TOKEN: '0x5425890298aed601595a70AB815c96711a31Bc65' // Fuji USDC
      },

      BASE_SEPOLIA: {
        BETmain_TOKEN: '', // To be deployed
        TREASURY: '0x6EbcFFA1401D473CF687e0a3cEF985877358280a',
        CCIP_ROUTER: '0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93',
        USDC_TOKEN: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Base Sepolia USDC
      },

      POLYGON_MUMBAI: {
        BETmain_TOKEN: '', // To be deployed
        TREASURY: '0x6EbcFFA1401D473CF687e0a3cEF985877358280a',
        CCIP_ROUTER: '0x1035CabC275068e0F4b745A29CEDf38E13aF41b1',
        USDC_TOKEN: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97' // Mumbai USDC
      }
    };
  } else {
    // 🚀 MAINNET ADDRESSES (when ready to deploy)
    return {
      ETHEREUM: {
        BETmain_TOKEN: '', // To be deployed
        ETH_EXCHANGE: '', // To be deployed
        CCIP_BRIDGE: '', // To be deployed
        TREASURY: '', // To be deployed
        CCIP_ROUTER: '0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D',
        USDC_TOKEN: '0xA0b86a33E6441b8FAcFdb560C1fd6064e7b40fB5' // Ethereum USDC
      },

      ARBITRUM: {
        DEPOSIT_AND_RECEIVE: '', // To be deployed
        CCIP_ROUTER: '0x141fa059441E0ca23ce184B6A78bafD2A517DdE8',
        TREASURY: '', // To be deployed
        USDC_TOKEN: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' // Arbitrum USDC
      },

      AVALANCHE: {
        BETmain_TOKEN: '', // To be deployed
        AMM_FACTORY: '', // To be deployed
        STRATEGY_MANAGER: '', // To be deployed
        AI_ORACLE: '', // To be deployed
        TREASURY: '', // To be deployed
        CCIP_ROUTER: '0xF4c7E640EdA248ef95972845a62bdC74237805dB',
        USDC_TOKEN: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' // Avalanche USDC
      },

      BASE: {
        BETmain_TOKEN: '', // To be deployed
        TREASURY: '', // To be deployed
        CCIP_ROUTER: '0x881e3A65B4d4a04dD529061dd0071cf975F58bCD',
        USDC_TOKEN: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC
      },

      POLYGON: {
        BETmain_TOKEN: '', // To be deployed
        TREASURY: '', // To be deployed
        CCIP_ROUTER: '0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe',
        USDC_TOKEN: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' // Polygon USDC
      },

      OPTIMISM: {
        BETmain_TOKEN: '', // To be deployed
        TREASURY: '', // To be deployed
        CCIP_ROUTER: '0x3206695CaE29952f4b0c22a169725a865bc8Ce0f',
        USDC_TOKEN: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' // Optimism USDC
      }
    };
  }
};

export const CONTRACT_ADDRESSES = getContractAddresses();

// 🎯 HELPER FUNCTIONS FOR EASY CHAIN MANAGEMENT

// Get active chains based on environment
export const getActiveChains = (): Record<string, ChainConfig> => {
  return Object.fromEntries(
    Object.entries(SUPPORTED_CHAINS).filter(([_, config]) => 
      config.isTestnet === USE_TESTNET
    )
  );
};

// Get testnet chains only
export const getTestnetChains = (): Record<string, ChainConfig> => {
  return Object.fromEntries(
    Object.entries(SUPPORTED_CHAINS).filter(([_, config]) => config.isTestnet)
  );
};

// Get mainnet chains only
export const getMainnetChains = (): Record<string, ChainConfig> => {
  return Object.fromEntries(
    Object.entries(SUPPORTED_CHAINS).filter(([_, config]) => !config.isTestnet)
  );
};

// Get chain config by chain ID
export const getChainById = (chainId: number): ChainConfig | undefined => {
  return Object.values(SUPPORTED_CHAINS).find(chain => chain.chainId === chainId);
};

// Get contract address for specific chain and contract
export const getContractAddress = (
  chainKey: string, 
  contractName: keyof ContractAddresses
): string => {
  const address = CONTRACT_ADDRESSES[chainKey]?.[contractName];
  if (!address) {
    console.warn(`Contract ${contractName} not found on ${chainKey}`);
    return '';
  }
  return address;
};

// Check if chain supports CCIP
export const supportsССIP = (chainKey: string): boolean => {
  const chain = SUPPORTED_CHAINS[chainKey];
  return !!chain?.ccipChainSelector;
};

// Get all CCIP-enabled chains
export const getCCIPChains = (): Record<string, ChainConfig> => {
  return Object.fromEntries(
    Object.entries(getActiveChains()).filter(([_, config]) => 
      config.ccipChainSelector
    )
  );
};

// Exchange rates for different chains (easily configurable)
export const EXCHANGE_RATES = {
  ETH_TO_BETmain: 333333, // 1 ETH = 333,333 BETmain
  USDC_TO_BETmain: 2, // 1 USDC = 2 BETmain
  AVAX_TO_BETmain: 10000, // 1 AVAX = 10,000 BETmain
  MATIC_TO_BETmain: 5000 // 1 MATIC = 5,000 BETmain
};

// Global limits (easily adjustable)
export const GLOBAL_LIMITS = {
  MIN_ETH_DEPOSIT: '0.0001',
  MAX_ETH_DEPOSIT: '10',
  MIN_USDC_DEPOSIT: '1',
  MAX_USDC_DEPOSIT: '50000',
  DAILY_MINT_LIMIT: '10000000', // 10M BETmain per day
  MAX_TOTAL_SUPPLY: '1000000000' // 1B BETmain max
};

// Environment info
export const ENV_INFO = {
  CURRENT_ENV: USE_TESTNET ? 'TESTNET' : 'MAINNET',
  ACTIVE_CHAINS: Object.keys(getActiveChains()),
  CCIP_ENABLED_CHAINS: Object.keys(getCCIPChains()),
  TOTAL_SUPPORTED_CHAINS: Object.keys(SUPPORTED_CHAINS).length
};

console.log('🚀 BET Protocol Configuration Loaded:', ENV_INFO);