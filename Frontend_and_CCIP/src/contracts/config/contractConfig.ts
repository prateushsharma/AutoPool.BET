// File: src/contracts/config/contractConfig.ts
// Contract Addresses Configuration

export interface NetworkConfig {
  chainId: string;
  name: string;
  enhancedCompetitionFactory: string;
  betmainToken: string;
  prizeOracle: string;
}

export const CONTRACT_ADDRESSES: { [key: string]: NetworkConfig } = {
  // Avalanche Fuji Testnet
  '0xa869': {
    chainId: '0xa869',
    name: 'Avalanche Fuji',
    enhancedCompetitionFactory: '0xD48fAdd18f2536a0193F036d85383DA3f92E8f3D',
    betmainToken: '0x027dc7eAaE39Ea643e48523036AFec75eAdE6905',
    prizeOracle: '0x703F8d9f3e31c8D572b3e6497d503cC494E467E5',
  },
  
  // Ethereum Sepolia Testnet
  '0xaa36a7': {
    chainId: '0xaa36a7', 
    name: 'Ethereum Sepolia',
    enhancedCompetitionFactory: '0x0c52d6EbEb3d815fcF3eccf09522028ed787f74a', // SepoliaParticipation
    betmainToken: '0x...', // Not deployed on Sepolia
    prizeOracle: '0x...', // Not deployed on Sepolia
  },
  
  // Add more networks as needed
  '0x2105': {
    chainId: '0x2105',
    name: 'Base',
    enhancedCompetitionFactory: '0x...',
    betmainToken: '0x...',
    prizeOracle: '0x...',
  },
};

// Helper function to get contract addresses for current network
export const getContractAddress = (chainId: string, contractName: keyof NetworkConfig): string => {
  const network = CONTRACT_ADDRESSES[chainId];
  if (!network) {
    throw new Error(`Network ${chainId} not supported`);
  }
  
  const address = network[contractName];
  if (!address || address === '0x...') {
    throw new Error(`Contract ${contractName} not deployed on ${network.name}`);
  }
  
  return address;
};

// Helper to check if network is supported
export const isSupportedNetwork = (chainId: string): boolean => {
  return chainId in CONTRACT_ADDRESSES;
};

// Helper to get network name
export const getNetworkName = (chainId: string): string => {
  const network = CONTRACT_ADDRESSES[chainId];
  return network ? network.name : 'Unknown Network';
};