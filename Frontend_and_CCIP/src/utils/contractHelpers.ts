// FILE: src/utils/contractHelpers.ts  
// PLACE: Create this file in src/utils/ directory

import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, ChainConfig } from '../config/contracts';

export class ContractHelper {
  private provider: ethers.providers.Web3Provider;
  private signer?: ethers.Signer;

  constructor(provider: ethers.providers.Web3Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  // Get contract instance
  getContract(chainId: number, contractName: string, abi: any[]): ethers.Contract {
    const chain = Object.values(CONTRACT_ADDRESSES).find(c => c.chainId === chainId);
    if (!chain || !chain.contracts[contractName]) {
      throw new Error(`Contract ${contractName} not found on chain ${chainId}`);
    }
    
    const address = chain.contracts[contractName];
    return new ethers.Contract(address, abi, this.signer || this.provider);
  }

  // Switch to specific chain
  async switchToChain(chainId: number): Promise<void> {
    if (!window.ethereum) throw new Error('MetaMask not installed');
    
    const chain = Object.values(CONTRACT_ADDRESSES).find(c => c.chainId === chainId);
    if (!chain) throw new Error(`Chain ${chainId} not supported`);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        await this.addChainToMetaMask(chain);
      } else {
        throw switchError;
      }
    }
  }

  // Add chain to MetaMask
  async addChainToMetaMask(chain: ChainConfig): Promise<void> {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${chain.chainId.toString(16)}`,
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: [chain.rpc],
        blockExplorerUrls: [chain.blockExplorer]
      }]
    });
  }

  // Format address for display
  static formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Format token amount
  static formatTokenAmount(amount: string | number, decimals: number = 18, displayDecimals: number = 4): string {
    if (!amount) return '0';
    const formatted = ethers.utils.formatUnits(amount.toString(), decimals);
    return parseFloat(formatted).toFixed(displayDecimals);
  }

  // Parse token amount
  static parseTokenAmount(amount: string | number, decimals: number = 18): ethers.BigNumber {
    return ethers.utils.parseUnits(amount.toString(), decimals);
  }
}