// Place this file as: src/hooks/useContracts.ts
// Simple contract integration hook - use in your existing portfolio component

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Your deployed contract addresses (easy to change)
const CONTRACT_CONFIG = {
  // Sepolia contracts
  SEPOLIA: {
    BETmain_TOKEN: '0x5F4743a164e87C5596C30BE8e2C5119b5cfE48a5',
    ETH_EXCHANGE: '0xB889Eb906Eb01E0E82ca457981AF230C627B1Ae3',
    CCIP_BRIDGE: '0x22F6Db6967ac3b17848f0411648c4A47355DB7Cd',
    TREASURY: '0x6EbcFFA1401D473CF687e0a3cEF985877358280a'
  },
  
  // Arbitrum contracts  
  ARBITRUM_SEPOLIA: {
    DEPOSIT_AND_RECEIVE: '0x37Cc04eAb33A9F4cf945B440cAF6E87a79Ca534A',
    TREASURY: '0x6EbcFFA1401D473CF687e0a3cEF985877358280a'
  },

  // Easy to add more chains
  // AVALANCHE: { ... },
  // BASE: { ... },
};

// Simple ABIs
const BET_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

const ETH_EXCHANGE_ABI = [
  'function exchangeETHForBETmain() payable',
  'function ethToBETmainRate() view returns (uint256)',
  'function userTotalDeposited(address user) view returns (uint256)',
  'function userTotalReceived(address user) view returns (uint256)'
];

const CROSS_CHAIN_ABI = [
  'function depositETHForBETmain() payable',
  'function getFeeEstimate() view returns (uint256)',
  'function pendingBETmain(address user) view returns (uint256)'
];

interface TokenBalance {
  symbol: string;
  balance: string;
  usdValue: string;
  chainName: string;
}

interface ExchangeData {
  rate: number;
  userDeposited: string;
  userReceived: string;
}

export const useContracts = (userAddress?: string) => {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
  const [loading, setLoading] = useState(false);

  // Get BETmain balance on Sepolia
  const getBETmainBalance = async (provider: ethers.providers.Provider) => {
    if (!userAddress) return null;
    
    try {
      const contract = new ethers.Contract(
        CONTRACT_CONFIG.SEPOLIA.BETmain_TOKEN,
        BET_TOKEN_ABI,
        provider
      );
      
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      const symbol = await contract.symbol();
      
      const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
      
      return {
        symbol,
        balance: parseFloat(balanceFormatted).toFixed(4),
        usdValue: (parseFloat(balanceFormatted) * 0.5).toFixed(2), // Mock USD value
        chainName: 'Sepolia'
      };
    } catch (error) {
      console.error('Error getting BETmain balance:', error);
      return null;
    }
  };

  // Get ETH balance
  const getETHBalance = async (provider: ethers.providers.Provider) => {
    if (!userAddress) return null;
    
    try {
      const balance = await provider.getBalance(userAddress);
      const balanceFormatted = ethers.utils.formatEther(balance);
      
      return {
        symbol: 'ETH',
        balance: parseFloat(balanceFormatted).toFixed(6),
        usdValue: (parseFloat(balanceFormatted) * 2000).toFixed(2), // Mock USD value
        chainName: 'Sepolia'
      };
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      return null;
    }
  };

  // Get exchange data
  const getExchangeData = async (provider: ethers.providers.Provider) => {
    if (!userAddress) return null;
    
    try {
      const contract = new ethers.Contract(
        CONTRACT_CONFIG.SEPOLIA.ETH_EXCHANGE,
        ETH_EXCHANGE_ABI,
        provider
      );
      
      const rate = await contract.ethToBETmainRate();
      const userDeposited = await contract.userTotalDeposited(userAddress);
      const userReceived = await contract.userTotalReceived(userAddress);
      
      return {
        rate: rate.toNumber(),
        userDeposited: ethers.utils.formatEther(userDeposited),
        userReceived: ethers.utils.formatUnits(userReceived, 18)
      };
    } catch (error) {
      console.error('Error getting exchange data:', error);
      return null;
    }
  };

  // Load all data
  const loadPortfolioData = async () => {
    if (!userAddress || !window.ethereum) return;
    
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      const [betBalance, ethBalance, exchangeInfo] = await Promise.all([
        getBETmainBalance(provider),
        getETHBalance(provider),
        getExchangeData(provider)
      ]);
      
      const allBalances = [betBalance, ethBalance].filter(Boolean) as TokenBalance[];
      setBalances(allBalances);
      setExchangeData(exchangeInfo);
      
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Exchange ETH for BETmain
  const exchangeETH = async (ethAmount: string) => {
    if (!window.ethereum) throw new Error('No Web3 provider');
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    const contract = new ethers.Contract(
      CONTRACT_CONFIG.SEPOLIA.ETH_EXCHANGE,
      ETH_EXCHANGE_ABI,
      signer
    );
    
    const ethAmountWei = ethers.utils.parseEther(ethAmount);
    const tx = await contract.exchangeETHForBETmain({ value: ethAmountWei });
    
    return tx;
  };

  // Cross-chain deposit
  const depositCrossChain = async (ethAmount: string) => {
    if (!window.ethereum) throw new Error('No Web3 provider');
    
    // Switch to Arbitrum Sepolia first
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x66eee' }] // 421614 in hex
      });
    } catch (error) {
      console.error('Failed to switch to Arbitrum Sepolia:', error);
      throw new Error('Please switch to Arbitrum Sepolia network');
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    const contract = new ethers.Contract(
      CONTRACT_CONFIG.ARBITRUM_SEPOLIA.DEPOSIT_AND_RECEIVE,
      CROSS_CHAIN_ABI,
      signer
    );
    
    const fee = await contract.getFeeEstimate();
    const ethAmountWei = ethers.utils.parseEther(ethAmount);
    const totalValue = ethAmountWei.add(fee);
    
    const tx = await contract.depositETHForBETmain({ value: totalValue });
    
    return tx;
  };

  // Auto-load when user address changes
  useEffect(() => {
    if (userAddress) {
      loadPortfolioData();
    }
  }, [userAddress]);

  return {
    balances,
    exchangeData,
    loading,
    exchangeETH,
    depositCrossChain,
    refreshData: loadPortfolioData,
    CONTRACT_CONFIG // Export for easy address changes
  };
};

// Easy address update functions
export const updateContractAddress = (chain: string, contract: string, newAddress: string) => {
  (CONTRACT_CONFIG as any)[chain][contract] = newAddress;
  console.log(`✅ Updated ${contract} on ${chain} to ${newAddress}`);
};

// Quick update helpers
export const QuickUpdate = {
  sepoliaBETmain: (address: string) => updateContractAddress('SEPOLIA', 'BETmain_TOKEN', address),
  sepoliaExchange: (address: string) => updateContractAddress('SEPOLIA', 'ETH_EXCHANGE', address),
  arbitrumReceiver: (address: string) => updateContractAddress('ARBITRUM_SEPOLIA', 'DEPOSIT_AND_RECEIVE', address),
  
  // Add new chain easily
  addChain: (chainName: string, contracts: Record<string, string>) => {
    (CONTRACT_CONFIG as any)[chainName] = contracts;
    console.log(`✅ Added new chain: ${chainName}`);
  }
};