// Place this file as: src/utils/configManager.ts
// Easy configuration management for switching between environments and updating addresses

import { 
  SUPPORTED_CHAINS, 
  CONTRACT_ADDRESSES, 
  USE_TESTNET,
  EXCHANGE_RATES,
  GLOBAL_LIMITS 
} from '../config/contracts';

/**
 * 🎛️ Configuration Manager
 * 
 * Easy way to:
 * 1. Switch between testnet/mainnet
 * 2. Update contract addresses 
 * 3. Manage exchange rates
 * 4. Configure limits
 * 5. Add new chains
 */

export class ConfigManager {
  
  // 🔄 Environment Management
  static getCurrentEnvironment() {
    return {
      isTestnet: USE_TESTNET,
      environment: USE_TESTNET ? 'TESTNET' : 'MAINNET',
      activeChains: Object.keys(CONTRACT_ADDRESSES),
      totalSupportedChains: Object.keys(SUPPORTED_CHAINS).length
    };
  }

  // 📍 Address Management
  static getContractAddresses(chainKey: string) {
    return CONTRACT_ADDRESSES[chainKey] || {};
  }

  static getAllContractAddresses() {
    return CONTRACT_ADDRESSES;
  }

  // ⚙️ Quick Address Updates (for development)
  static updateContractAddress(
    chainKey: string, 
    contractName: string, 
    newAddress: string
  ) {
    if (CONTRACT_ADDRESSES[chainKey]) {
      (CONTRACT_ADDRESSES[chainKey] as any)[contractName] = newAddress;
      console.log(`✅ Updated ${contractName} on ${chainKey} to ${newAddress}`);
    } else {
      console.warn(`❌ Chain ${chainKey} not found`);
    }
  }

  // 🔗 Chain Management
  static getSupportedChains() {
    return SUPPORTED_CHAINS;
  }

  static getActiveChains() {
    return Object.fromEntries(
      Object.entries(SUPPORTED_CHAINS).filter(([_, config]) => 
        config.isTestnet === USE_TESTNET
      )
    );
  }

  // 💱 Exchange Rate Management
  static getExchangeRates() {
    return EXCHANGE_RATES;
  }

  static updateExchangeRate(tokenPair: string, newRate: number) {
    (EXCHANGE_RATES as any)[tokenPair] = newRate;
    console.log(`✅ Updated ${tokenPair} rate to ${newRate}`);
  }

  // 🚫 Limits Management
  static getLimits() {
    return GLOBAL_LIMITS;
  }

  // 🛠️ Development Helpers
  static printCurrentConfig() {
    console.group('🎯 BET Protocol Configuration');
    console.log('Environment:', this.getCurrentEnvironment());
    console.log('Contract Addresses:', this.getAllContractAddresses());
    console.log('Exchange Rates:', this.getExchangeRates());
    console.log('Limits:', this.getLimits());
    console.groupEnd();
  }

  // 📋 Export Configuration (for backup/sharing)
  static exportConfig() {
    return {
      environment: this.getCurrentEnvironment(),
      chains: this.getSupportedChains(),
      contracts: this.getAllContractAddresses(),
      rates: this.getExchangeRates(),
      limits: this.getLimits(),
      exportDate: new Date().toISOString()
    };
  }

  // 🔍 Validation Helpers
  static validateChainConfig(chainKey: string) {
    const chain = SUPPORTED_CHAINS[chainKey];
    const contracts = CONTRACT_ADDRESSES[chainKey];
    
    if (!chain) {
      return { valid: false, error: `Chain ${chainKey} not found` };
    }
    
    if (!contracts) {
      return { valid: false, error: `No contracts deployed on ${chainKey}` };
    }
    
    return { valid: true, chain, contracts };
  }

  static validateContractAddress(address: string) {
    const regex = /^0x[a-fA-F0-9]{40}$/;
    return regex.test(address);
  }

  // 🚀 Quick Setup Helpers
  static quickSetupTestnet() {
    console.log('🧪 Setting up testnet configuration...');
    
    // Verify testnet contracts
    const testnetChains = ['SEPOLIA', 'ARBITRUM_SEPOLIA'];
    testnetChains.forEach(chain => {
      const validation = this.validateChainConfig(chain);
      console.log(`${chain}:`, validation.valid ? '✅' : '❌', validation.error || 'Ready');
    });
  }

  static quickSetupMainnet() {
    console.log('🚀 Setting up mainnet configuration...');
    console.warn('⚠️ Make sure all mainnet addresses are properly configured before deployment!');
    
    // Check mainnet contract addresses
    const mainnetChains = ['ETHEREUM', 'ARBITRUM', 'AVALANCHE'];
    mainnetChains.forEach(chain => {
      const contracts = CONTRACT_ADDRESSES[chain];
      if (contracts) {
        const emptyContracts = Object.entries(contracts).filter(([_, addr]) => !addr);
        if (emptyContracts.length > 0) {
          console.warn(`${chain} missing contracts:`, emptyContracts.map(([name]) => name));
        } else {
          console.log(`${chain}: ✅ All contracts configured`);
        }
      } else {
        console.warn(`${chain}: ❌ No contracts configured`);
      }
    });
  }
}

// 🎯 Easy-to-use shortcuts for common operations
export const QuickConfig = {
  // Switch environments (restart required)
  switchToTestnet: () => {
    console.log('🧪 To switch to testnet, set USE_TESTNET = true in contracts.ts');
  },
  
  switchToMainnet: () => {
    console.log('🚀 To switch to mainnet, set USE_TESTNET = false in contracts.ts');
  },

  // Update specific addresses quickly
  updateSepoliaBETmain: (address: string) => {
    ConfigManager.updateContractAddress('SEPOLIA', 'BETmain_TOKEN', address);
  },

  updateSepoliaExchange: (address: string) => {
    ConfigManager.updateContractAddress('SEPOLIA', 'ETH_EXCHANGE', address);
  },

  updateArbitrumReceiver: (address: string) => {
    ConfigManager.updateContractAddress('ARBITRUM_SEPOLIA', 'DEPOSIT_AND_RECEIVE', address);
  },

  // Update rates quickly
  updateETHRate: (newRate: number) => {
    ConfigManager.updateExchangeRate('ETH_TO_BETmain', newRate);
  },

  updateUSDCRate: (newRate: number) => {
    ConfigManager.updateExchangeRate('USDC_TO_BETmain', newRate);
  },

  // Bulk updates for new deployment
  updateAllAddresses: (addresses: Record<string, Record<string, string>>) => {
    Object.entries(addresses).forEach(([chainKey, contracts]) => {
      Object.entries(contracts).forEach(([contractName, address]) => {
        ConfigManager.updateContractAddress(chainKey, contractName, address);
      });
    });
    console.log('✅ All addresses updated');
  },

  // Validation shortcuts
  checkAllContracts: () => {
    const activeChains = ConfigManager.getActiveChains();
    Object.keys(activeChains).forEach(chainKey => {
      const validation = ConfigManager.validateChainConfig(chainKey);
      console.log(`${chainKey}:`, validation.valid ? '✅' : '❌');
    });
  },

  // Development helpers
  printConfig: () => ConfigManager.printCurrentConfig(),
  
  exportConfig: () => {
    const config = ConfigManager.exportConfig();
    console.log('📋 Configuration exported:', config);
    return config;
  }
};

// 🔧 Auto-run configuration check in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 BET Protocol Configuration Check:');
  QuickConfig.checkAllContracts();
}

// 💡 Usage Examples:
/*

// 1. Quick address updates during development:
QuickConfig.updateSepoliaBETmain('0xNewAddress...');
QuickConfig.updateArbitrumReceiver('0xNewAddress...');

// 2. Bulk update after new deployment:
QuickConfig.updateAllAddresses({
  SEPOLIA: {
    BETmain_TOKEN: '0xNewBETmainAddress...',
    ETH_EXCHANGE: '0xNewExchangeAddress...'
  },
  ARBITRUM_SEPOLIA: {
    DEPOSIT_AND_RECEIVE: '0xNewReceiverAddress...'
  }
});

// 3. Rate adjustments:
QuickConfig.updateETHRate(500000); // 1 ETH = 500,000 BETmain
QuickConfig.updateUSDCRate(5); // 1 USDC = 5 BETmain

// 4. Check current configuration:
QuickConfig.printConfig();
QuickConfig.checkAllContracts();

// 5. Environment switching (requires restart):
QuickConfig.switchToMainnet();

*/