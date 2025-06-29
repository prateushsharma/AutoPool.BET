// File: src/utils/networkUtils.ts (Updated)
// Updated with REAL Dispatch Chain configuration

export const getNetworkShortName = (chainId: string): string => {
  const networks: { [key: string]: string } = {
    '0x1': 'eth',
    '0x89': 'poly',
    '0xa86a': 'avax',
    '0xa869': 'fuji',
    '0xa4b1': 'arb',
    '0x2105': 'base',
    '0xa': 'op',
    '0xaa36a7': 'sep',
    '0x38': 'bsc',
    '0xfa': 'ftm',
    '0xbe598': 'dispatch', // REAL Dispatch Chain ID: 779672 (0xbe598)
  };
  return networks[chainId] || 'unknown';
};

export const generateUsername = (walletAddress: string, chainId: string): string => {
  const shortAddress = `${walletAddress.slice(2, 6)}${walletAddress.slice(-4)}`;
  const networkName = getNetworkShortName(chainId);
  return `${shortAddress}_${networkName}`;
};

export const isCrossChainParticipation = (chainId: string): boolean => {
  // Only Avalanche Fuji is native, others are cross-chain
  return chainId !== '0xa869';
};

export const getParticipationContractType = (chainId: string): 'native' | 'sepolia' | 'dispatch' | 'unsupported' => {
  switch (chainId) {
    case '0xa869': // Avalanche Fuji
      return 'native';
    case '0xaa36a7': // Ethereum Sepolia  
      return 'sepolia';
    case '0xbe598': // Dispatch L1 Testnet (779672)
      return 'dispatch';
    default:
      return 'unsupported';
  }
};

export const formatCurrency = (amount: string, symbol: string): string => {
  const num = parseFloat(amount);
  if (num < 0.001) {
    return `${num.toFixed(6)} ${symbol}`;
  } else if (num < 1) {
    return `${num.toFixed(4)} ${symbol}`;
  } else {
    return `${num.toFixed(3)} ${symbol}`;
  }
};

// Get native currency symbol for chain
export const getNativeCurrency = (chainId: string): string => {
  const currencies: { [key: string]: string } = {
    '0x1': 'ETH',
    '0x89': 'MATIC',
    '0xa86a': 'AVAX',
    '0xa869': 'AVAX',
    '0xa4b1': 'ETH',
    '0x2105': 'ETH',
    '0xa': 'ETH',
    '0xaa36a7': 'ETH',
    '0x38': 'BNB',
    '0xfa': 'FTM',
    '0xbe598': 'DIS', // Dispatch uses AVAX
  };
  return currencies[chainId] || 'ETH';
};

// Get bridge/messaging protocol name
export const getBridgeProtocol = (chainId: string): string => {
  const protocols: { [key: string]: string } = {
    '0xaa36a7': 'CCIP',
    '0xbe598': 'Teleporter', // Dispatch Chain
  };
  return protocols[chainId] || 'Native';
};

// Get estimated bridge time
export const getBridgeTime = (chainId: string): string => {
  const times: { [key: string]: string } = {
    '0xaa36a7': '10-20 minutes',
    '0xbe598': '2-5 seconds', // Dispatch Chain
  };
  return times[chainId] || 'Instant';
};

// Get estimated bridge fee
export const getBridgeFee = (chainId: string): string => {
  const fees: { [key: string]: string } = {
    '0xaa36a7': '~$3-5',
    '0xbe598': '~$0.01-0.05', // Dispatch Chain
  };
  return fees[chainId] || 'Variable';
};