// File: src/utils/networkUtils.ts
// Network utilities for cross-chain operations

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
    case '0x...': // Dispatch Chain (when deployed)
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