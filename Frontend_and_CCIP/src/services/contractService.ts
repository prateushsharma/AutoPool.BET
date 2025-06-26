// Place this file as: src/services/contractService.ts
// Universal contract interaction layer - handles all chains automatically

import { ethers } from 'ethers';
import { 
  SUPPORTED_CHAINS, 
  CONTRACT_ADDRESSES, 
  getChainById, 
  getContractAddress,
  EXCHANGE_RATES,
  GLOBAL_LIMITS 
} from '../config/contracts';

// Contract ABIs (add your full ABIs here)
const CONTRACT_ABIS = {
  BETmain_TOKEN: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function mint(address to, uint256 amount)',
    'function totalSupply() view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ],
  
  ETH_EXCHANGE: [
    'function exchangeETHForBETmain() payable',
    'function ethToBETmainRate() view returns (uint256)',
    'function minimumDeposit() view returns (uint256)',
    'function maximumDeposit() view returns (uint256)',
    'function userTotalDeposited(address user) view returns (uint256)',
    'function userTotalReceived(address user) view returns (uint256)',
    'function totalETHDeposited() view returns (uint256)',
    'function totalBETmainMinted() view returns (uint256)',
    'event ETHExchanged(address indexed user, uint256 ethAmount, uint256 betmainAmount)'
  ],
  
  CCIP_BRIDGE: [
    'function sendCCIPMessage(uint64 destinationChain, address receiver, bytes calldata data) payable returns (bytes32)',
    'function getFeeEstimate(uint64 destinationChain, address receiver, bytes calldata data) view returns (uint256)',
    'function authorizedSenders(address sender) view returns (bool)',
    'function setAuthorizedSender(address sender, bool authorized)',
    'event CCIPMessageSent(bytes32 indexed messageId, uint64 indexed destinationChain, address indexed receiver)'
  ],
  
  DEPOSIT_AND_RECEIVE: [
    'function depositETHForBETmain() payable',
    'function getFeeEstimate() view returns (uint256)',
    'function getUserStatus(address user) view returns (uint256, uint256, bool)',
    'function pendingBETmain(address user) view returns (uint256)',
    'function sepoliaMinter() view returns (address)',
    'function ethToBETmainRate() view returns (uint256)',
    'event ETHDeposited(address indexed user, uint256 amount, bytes32 messageId)',
    'event BETmainReceived(address indexed user, uint256 amount)'
  ],

  ERC20: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)'
  ]
};

export interface TokenBalance {
  symbol: string;
  balance: string;
  balanceWei: string;
  usdValue: string;
  decimals: number;
  contractAddress: string;
  chainId: number;
  chainName: string;
}

export interface ExchangeInfo {
  rate: number;
  minDeposit: string;
  maxDeposit: string;
  userDeposited: string;
  userReceived: string;
  totalDeposited: string;
  totalMinted: string;
}

export interface CCIPStatus {
  messageId: string;
  status: 'pending' | 'completed' | 'failed';
  sourceChain: number;
  destinationChain: number;
  amount: string;
  timestamp: number;
}

export class ContractService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private currentChainId: number | null = null;

  constructor() {
    this.initializeProvider();
  }

  // 🔄 Initialize provider
  private async initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      
      // Get current chain
      const network = await this.provider.getNetwork();
      this.currentChainId = network.chainId;
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        this.currentChainId = parseInt(chainId, 16);
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
      });
    }
  }

  // 🌐 Get contract instance for any chain
  private getContract(contractName: string, chainKey?: string) {
    if (!this.provider || !this.signer) {
      throw new Error('Wallet not connected');
    }

    // Use current chain if not specified
    if (!chainKey) {
      const currentChain = getChainById(this.currentChainId!);
      if (!currentChain) {
        throw new Error(`Unsupported chain: ${this.currentChainId}`);
      }
      chainKey = Object.keys(SUPPORTED_CHAINS).find(
        key => SUPPORTED_CHAINS[key].chainId === this.currentChainId
      )!;
    }

    const contractAddress = getContractAddress(chainKey, contractName as any);
    if (!contractAddress) {
      throw new Error(`Contract ${contractName} not deployed on ${chainKey}`);
    }

    const abi = CONTRACT_ABIS[contractName as keyof typeof CONTRACT_ABIS];
    if (!abi) {
      throw new Error(`ABI not found for contract ${contractName}`);
    }

    return new ethers.Contract(contractAddress, abi, this.signer);
  }

  // 🔄 Switch to specific chain
  async switchToChain(chainKey: string) {
    const chainConfig = SUPPORTED_CHAINS[chainKey];
    if (!chainConfig) {
      throw new Error(`Chain ${chainKey} not supported`);
    }

    if (!window.ethereum) {
      throw new Error('No Web3 provider found');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainConfig.chainId.toString(16)}` }]
      });
    } catch (switchError: any) {
      // Chain not added to wallet
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chainConfig.chainId.toString(16)}`,
            chainName: chainConfig.name,
            nativeCurrency: chainConfig.nativeCurrency,
            rpcUrls: [chainConfig.rpcUrl],
            blockExplorerUrls: [chainConfig.blockExplorer]
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  // 💰 Get BETmain token balance on any chain
  async getBETmainBalance(userAddress: string, chainKey?: string): Promise<TokenBalance> {
    const contract = this.getContract('BETmain_TOKEN', chainKey);
    const chain = chainKey ? SUPPORTED_CHAINS[chainKey] : getChainById(this.currentChainId!)!;
    
    const [balance, decimals, symbol, name] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.decimals(),
      contract.symbol(),
      contract.name()
    ]);

    const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
    
    return {
      symbol,
      balance: parseFloat(balanceFormatted).toFixed(4),
      balanceWei: balance.toString(),
      usdValue: (parseFloat(balanceFormatted) * 0.50).toFixed(2), // Mock USD value
      decimals,
      contractAddress: getContractAddress(chainKey || '', 'BETmain_TOKEN'),
      chainId: chain.chainId,
      chainName: chain.name
    };
  }

  // 💰 Get all token balances across chains
  async getAllTokenBalances(userAddress: string): Promise<TokenBalance[]> {
    const balances: TokenBalance[] = [];
    
    // Get BETmain balances from all chains where it's deployed
    for (const [chainKey, addresses] of Object.entries(CONTRACT_ADDRESSES)) {
      if (addresses.BETmain_TOKEN) {
        try {
          const balance = await this.getBETmainBalance(userAddress, chainKey);
          if (parseFloat(balance.balance) > 0) {
            balances.push(balance);
          }
        } catch (error) {
          console.warn(`Failed to get BETmain balance on ${chainKey}:`, error);
        }
      }
    }

    // Get native token balances
    for (const [chainKey, chainConfig] of Object.entries(SUPPORTED_CHAINS)) {
      try {
        // Switch to chain temporarily (in a real app, you'd query multiple RPCs)
        const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl);
        const balance = await provider.getBalance(userAddress);
        const balanceFormatted = ethers.utils.formatEther(balance);
        
        if (parseFloat(balanceFormatted) > 0.001) { // Only show if > 0.001
          balances.push({
            symbol: chainConfig.nativeCurrency.symbol,
            balance: parseFloat(balanceFormatted).toFixed(6),
            balanceWei: balance.toString(),
            usdValue: (parseFloat(balanceFormatted) * 2000).toFixed(2), // Mock USD value
            decimals: 18,
            contractAddress: 'native',
            chainId: chainConfig.chainId,
            chainName: chainConfig.name
          });
        }
      } catch (error) {
        console.warn(`Failed to get native balance on ${chainKey}:`, error);
      }
    }

    return balances;
  }

  // 🔄 Exchange ETH for BETmain (Sepolia)
  async exchangeETHForBETmain(ethAmount: string): Promise<ethers.providers.TransactionResponse> {
    await this.switchToChain('SEPOLIA');
    const contract = this.getContract('ETH_EXCHANGE', 'SEPOLIA');
    
    const ethAmountWei = ethers.utils.parseEther(ethAmount);
    return await contract.exchangeETHForBETmain({ value: ethAmountWei });
  }

  // 🌉 Cross-chain ETH deposit (Arbitrum -> Sepolia -> Arbitrum)
  async depositETHCrossChain(ethAmount: string): Promise<ethers.providers.TransactionResponse> {
    await this.switchToChain('ARBITRUM_SEPOLIA');
    const contract = this.getContract('DEPOSIT_AND_RECEIVE', 'ARBITRUM_SEPOLIA');
    
    // Get CCIP fee estimate
    const fee = await contract.getFeeEstimate();
    const ethAmountWei = ethers.utils.parseEther(ethAmount);
    const totalValue = ethAmountWei.add(fee);
    
    return await contract.depositETHForBETmain({ value: totalValue });
  }

  // 📊 Get exchange information
  async getExchangeInfo(userAddress: string, chainKey: string = 'SEPOLIA'): Promise<ExchangeInfo> {
    const contract = this.getContract('ETH_EXCHANGE', chainKey);
    
    const [rate, minDeposit, maxDeposit, userDeposited, userReceived, totalDeposited, totalMinted] = await Promise.all([
      contract.ethToBETmainRate(),
      contract.minimumDeposit(),
      contract.maximumDeposit(),
      contract.userTotalDeposited(userAddress),
      contract.userTotalReceived(userAddress),
      contract.totalETHDeposited(),
      contract.totalBETmainMinted()
    ]);

    return {
      rate: rate.toNumber(),
      minDeposit: ethers.utils.formatEther(minDeposit),
      maxDeposit: ethers.utils.formatEther(maxDeposit),
      userDeposited: ethers.utils.formatEther(userDeposited),
      userReceived: ethers.utils.formatUnits(userReceived, 18),
      totalDeposited: ethers.utils.formatEther(totalDeposited),
      totalMinted: ethers.utils.formatUnits(totalMinted, 18)
    };
  }

  // 🌉 Get CCIP status
  async getCCIPStatus(userAddress: string, chainKey: string = 'ARBITRUM_SEPOLIA'): Promise<CCIPStatus[]> {
    const contract = this.getContract('DEPOSIT_AND_RECEIVE', chainKey);
    
    // Get user status
    const [pendingAmount, totalDeposited, hasReceived] = await contract.getUserStatus(userAddress);
    
    // Mock CCIP status - in real implementation, you'd query CCIP explorer or events
    const mockStatuses: CCIPStatus[] = [];
    
    if (pendingAmount.gt(0)) {
      mockStatuses.push({
        messageId: 'mock-message-id-1',
        status: 'pending',
        sourceChain: 421614, // Arbitrum Sepolia
        destinationChain: 11155111, // Sepolia
        amount: ethers.utils.formatUnits(pendingAmount, 18),
        timestamp: Date.now() - 300000 // 5 minutes ago
      });
    }

    return mockStatuses;
  }

  // 💸 Transfer BETmain tokens
  async transferBETmain(
    toAddress: string, 
    amount: string, 
    chainKey?: string
  ): Promise<ethers.providers.TransactionResponse> {
    const contract = this.getContract('BETmain_TOKEN', chainKey);
    const decimals = await contract.decimals();
    const amountWei = ethers.utils.parseUnits(amount, decimals);
    
    return await contract.transfer(toAddress, amountWei);
  }

  // ✅ Approve BETmain tokens
  async approveBETmain(
    spenderAddress: string, 
    amount: string, 
    chainKey?: string
  ): Promise<ethers.providers.TransactionResponse> {
    const contract = this.getContract('BETmain_TOKEN', chainKey);
    const decimals = await contract.decimals();
    const amountWei = ethers.utils.parseUnits(amount, decimals);
    
    return await contract.approve(spenderAddress, amountWei);
  }

  // 🔍 Get allowance
  async getAllowance(
    ownerAddress: string, 
    spenderAddress: string, 
    chainKey?: string
  ): Promise<string> {
    const contract = this.getContract('BETmain_TOKEN', chainKey);
    const allowance = await contract.allowance(ownerAddress, spenderAddress);
    const decimals = await contract.decimals();
    
    return ethers.utils.formatUnits(allowance, decimals);
  }

  // 📈 Get portfolio summary
  async getPortfolioSummary(userAddress: string) {
    const balances = await this.getAllTokenBalances(userAddress);
    
    let totalUSDValue = 0;
    let totalBETmain = 0;
    const chainDistribution: Record<string, number> = {};
    
    balances.forEach(balance => {
      totalUSDValue += parseFloat(balance.usdValue);
      
      if (balance.symbol === 'BETmain') {
        totalBETmain += parseFloat(balance.balance);
      }
      
      chainDistribution[balance.chainName] = 
        (chainDistribution[balance.chainName] || 0) + parseFloat(balance.usdValue);
    });
    
    return {
      totalUSDValue: totalUSDValue.toFixed(2),
      totalBETmain: totalBETmain.toFixed(4),
      totalAssets: balances.length,
      chainDistribution,
      balances
    };
  }

  // 🚨 Emergency functions
  async estimateGas(contractName: string, functionName: string, params: any[], chainKey?: string) {
    const contract = this.getContract(contractName, chainKey);
    return await contract.estimateGas[functionName](...params);
  }

  async getCurrentGasPrice(chainKey?: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const gasPrice = await this.provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }

  // 🔄 Refresh connection
  async refreshConnection() {
    await this.initializeProvider();
  }
}

// 🎯 Export singleton instance
export const contractService = new ContractService();

// 🛠️ Utility functions for easy integration
export const ContractUtils = {
  // Format large numbers
  formatLargeNumber: (num: string | number): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(2);
  },

  // Calculate exchange output
  calculateExchangeOutput: (inputAmount: string, rate: number): string => {
    const input = parseFloat(inputAmount);
    const output = input * rate;
    return output.toFixed(0);
  },

  // Get chain icon by chain ID
  getChainIcon: (chainId: number): string => {
    const chain = getChainById(chainId);
    return chain?.icon || '🌐';
  },

  // Get supported chains for UI
  getSupportedChainsForUI: () => {
    return Object.entries(SUPPORTED_CHAINS).map(([key, config]) => ({
      key,
      ...config,
      hasContracts: !!CONTRACT_ADDRESSES[key],
      contractCount: CONTRACT_ADDRESSES[key] ? Object.keys(CONTRACT_ADDRESSES[key]).length : 0
    }));
  },

  // Check if user is on correct chain
  isOnCorrectChain: (requiredChainKey: string, currentChainId: number): boolean => {
    const requiredChain = SUPPORTED_CHAINS[requiredChainKey];
    return requiredChain?.chainId === currentChainId;
  },

  // Get transaction URL
  getTxUrl: (txHash: string, chainId: number): string => {
    const chain = getChainById(chainId);
    return chain ? `${chain.blockExplorer}/tx/${txHash}` : '';
  },

  // Get address URL
  getAddressUrl: (address: string, chainId: number): string => {
    const chain = getChainById(chainId);
    return chain ? `${chain.blockExplorer}/address/${address}` : '';
  }
};