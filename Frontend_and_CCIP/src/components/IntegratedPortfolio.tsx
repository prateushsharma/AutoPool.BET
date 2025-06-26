// Place this file as: src/components/IntegratedPortfolio.tsx
// Complete portfolio integration with all contracts and chains

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { contractService, ContractUtils, TokenBalance } from '../services/contractService';
import { 
  getActiveChains, 
  getCCIPChains, 
  USE_TESTNET, 
  ENV_INFO,
  EXCHANGE_RATES,
  getChainById 
} from '../config/contracts';
import './IntegratedPortfolio.css';

interface PortfolioSummary {
  totalUSDValue: string;
  totalBETmain: string;
  totalAssets: number;
  chainDistribution: Record<string, number>;
  balances: TokenBalance[];
}

interface ExchangeOperation {
  type: 'direct' | 'cross-chain';
  fromChain: string;
  toChain?: string;
  fromToken: string;
  toToken: string;
  amount: string;
  estimatedOutput: string;
  estimatedFee: string;
}

const IntegratedPortfolio: React.FC = () => {
  const { wallet } = useWallet();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'exchange' | 'bridge' | 'history'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Exchange state
  const [exchangeOperation, setExchangeOperation] = useState<ExchangeOperation>({
    type: 'direct',
    fromChain: 'SEPOLIA',
    toChain: 'ARBITRUM_SEPOLIA',
    fromToken: 'ETH',
    toToken: 'BETmain',
    amount: '',
    estimatedOutput: '0',
    estimatedFee: '0'
  });

  const [exchangeLoading, setExchangeLoading] = useState(false);

  // Load portfolio data
  const loadPortfolio = async () => {
    if (!wallet?.address) return;
    
    setLoading(true);
    try {
      const summary = await contractService.getPortfolioSummary(wallet.address);
      setPortfolio(summary);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh portfolio
  const refreshPortfolio = async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  };

  // Calculate exchange output
  const calculateOutput = () => {
    const { fromToken, toToken, amount } = exchangeOperation;
    if (!amount || parseFloat(amount) <= 0) return '0';

    const inputAmount = parseFloat(amount);
    let rate = 0;

    if (fromToken === 'ETH' && toToken === 'BETmain') {
      rate = EXCHANGE_RATES.ETH_TO_BETmain;
    } else if (fromToken === 'USDC' && toToken === 'BETmain') {
      rate = EXCHANGE_RATES.USDC_TO_BETmain;
    } else if (fromToken === 'AVAX' && toToken === 'BETmain') {
      rate = EXCHANGE_RATES.AVAX_TO_BETmain;
    }

    const output = inputAmount * rate;
    return output.toFixed(0);
  };

  // Handle exchange operation
  const handleExchange = async () => {
    if (!wallet?.address || !exchangeOperation.amount) return;

    setExchangeLoading(true);
    try {
      let tx;
      
      if (exchangeOperation.type === 'direct') {
        // Direct exchange on Sepolia
        tx = await contractService.exchangeETHForBETmain(exchangeOperation.amount);
      } else {
        // Cross-chain exchange
        tx = await contractService.depositETHCrossChain(exchangeOperation.amount);
      }

      console.log('Transaction submitted:', tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      // Refresh portfolio
      await refreshPortfolio();
      
      // Reset form
      setExchangeOperation(prev => ({ ...prev, amount: '', estimatedOutput: '0' }));
      
      alert('Exchange completed successfully!');
      
    } catch (error: any) {
      console.error('Exchange failed:', error);
      alert(`Exchange failed: ${error.message}`);
    } finally {
      setExchangeLoading(false);
    }
  };

  // Update estimated output when amount changes
  useEffect(() => {
    const output = calculateOutput();
    setExchangeOperation(prev => ({ ...prev, estimatedOutput: output }));
  }, [exchangeOperation.amount, exchangeOperation.fromToken, exchangeOperation.toToken]);

  // Load portfolio on wallet connection
  useEffect(() => {
    if (wallet?.address) {
      loadPortfolio();
    }
  }, [wallet?.address]);

  if (!wallet?.isConnected) {
    return (
      <div className="portfolio-container">
        <div className="portfolio-placeholder">
          <h2>🔌 Connect Your Wallet</h2>
          <p>Connect your wallet to view your BET Protocol portfolio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="integrated-portfolio">
      {/* Header */}
      <div className="portfolio-header">
        <div className="header-info">
          <h1>🎯 BET Protocol Portfolio</h1>
          <div className="env-badge">
            <span className={`env-indicator ${USE_TESTNET ? 'testnet' : 'mainnet'}`}>
              {ENV_INFO.CURRENT_ENV}
            </span>
            <span className="chain-count">{ENV_INFO.ACTIVE_CHAINS.length} chains</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={refreshPortfolio}
            disabled={refreshing}
          >
            🔄 {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="portfolio-summary">
          <div className="summary-card total-value">
            <h3>Total Portfolio Value</h3>
            <div className="value-display">
              <span className="currency">$</span>
              <span className="amount">{ContractUtils.formatLargeNumber(portfolio.totalUSDValue)}</span>
            </div>
          </div>
          
          <div className="summary-card betmain-balance">
            <h3>Total BETmain</h3>
            <div className="value-display">
              <span className="amount">{ContractUtils.formatLargeNumber(portfolio.totalBETmain)}</span>
              <span className="symbol">BET</span>
            </div>
          </div>
          
          <div className="summary-card asset-count">
            <h3>Total Assets</h3>
            <div className="value-display">
              <span className="amount">{portfolio.totalAssets}</span>
              <span className="symbol">tokens</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="portfolio-tabs">
        {[
          { key: 'overview', label: '📊 Overview', icon: '📊' },
          { key: 'exchange', label: '🔄 Exchange', icon: '🔄' },
          { key: 'bridge', label: '🌉 Bridge', icon: '🌉' },
          { key: 'history', label: '📜 History', icon: '📜' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading portfolio data...</p>
              </div>
            ) : portfolio ? (
              <>
                {/* Token Balances */}
                <div className="section">
                  <h3>💰 Token Balances</h3>
                  <div className="token-list">
                    {portfolio.balances.map((token, index) => (
                      <div key={index} className="token-item">
                        <div className="token-info">
                          <span className="token-symbol">{token.symbol}</span>
                          <span className="chain-name">
                            {ContractUtils.getChainIcon(token.chainId)} {token.chainName}
                          </span>
                        </div>
                        <div className="token-balance">
                          <span className="balance">{token.balance}</span>
                          <span className="usd-value">${token.usdValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chain Distribution */}
                <div className="section">
                  <h3>🌐 Chain Distribution</h3>
                  <div className="chain-distribution">
                    {Object.entries(portfolio.chainDistribution).map(([chainName, value]) => (
                      <div key={chainName} className="distribution-item">
                        <span className="chain-name">{chainName}</span>
                        <div className="distribution-bar">
                          <div 
                            className="distribution-fill"
                            style={{ 
                              width: `${(value / parseFloat(portfolio.totalUSDValue)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="distribution-value">${value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>No portfolio data available</p>
              </div>
            )}
          </div>
        )}

        {/* Exchange Tab */}
        {activeTab === 'exchange' && (
          <div className="exchange-content">
            <div className="section">
              <h3>🔄 Token Exchange</h3>
              
              {/* Exchange Type Toggle */}
              <div className="exchange-type-toggle">
                <button
                  className={`toggle-btn ${exchangeOperation.type === 'direct' ? 'active' : ''}`}
                  onClick={() => setExchangeOperation(prev => ({ ...prev, type: 'direct' }))}
                >
                  Direct Exchange (Sepolia)
                </button>
                <button
                  className={`toggle-btn ${exchangeOperation.type === 'cross-chain' ? 'active' : ''}`}
                  onClick={() => setExchangeOperation(prev => ({ ...prev, type: 'cross-chain' }))}
                >
                  Cross-Chain (Arbitrum → Sepolia)
                </button>
              </div>

              {/* Exchange Form */}
              <div className="exchange-form">
                <div className="form-group">
                  <label>From</label>
                  <div className="token-input">
                    <select
                      value={exchangeOperation.fromToken}
                      onChange={(e) => setExchangeOperation(prev => ({ 
                        ...prev, 
                        fromToken: e.target.value 
                      }))}
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                      <option value="AVAX">AVAX</option>
                    </select>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={exchangeOperation.amount}
                      onChange={(e) => setExchangeOperation(prev => ({ 
                        ...prev, 
                        amount: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <div className="exchange-arrow">⬇️</div>

                <div className="form-group">
                  <label>To</label>
                  <div className="token-output">
                    <span className="output-token">BETmain</span>
                    <span className="output-amount">
                      {ContractUtils.formatLargeNumber(exchangeOperation.estimatedOutput)}
                    </span>
                  </div>
                </div>

                <div className="exchange-info">
                  <div className="info-row">
                    <span>Exchange Rate:</span>
                    <span>
                      1 {exchangeOperation.fromToken} = {
                        exchangeOperation.fromToken === 'ETH' ? EXCHANGE_RATES.ETH_TO_BETmain.toLocaleString() :
                        exchangeOperation.fromToken === 'USDC' ? EXCHANGE_RATES.USDC_TO_BETmain :
                        EXCHANGE_RATES.AVAX_TO_BETmain.toLocaleString()
                      } BETmain
                    </span>
                  </div>
                  {exchangeOperation.type === 'cross-chain' && (
                    <div className="info-row">
                      <span>CCIP Fee:</span>
                      <span>~$3-5</span>
                    </div>
                  )}
                </div>

                <button
                  className="exchange-btn"
                  onClick={handleExchange}
                  disabled={!exchangeOperation.amount || parseFloat(exchangeOperation.amount) <= 0 || exchangeLoading}
                >
                  {exchangeLoading ? (
                    <>
                      <span className="loading-spinner small"></span>
                      Processing...
                    </>
                  ) : (
                    `Exchange ${exchangeOperation.fromToken} for BETmain`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bridge Tab */}
        {activeTab === 'bridge' && (
          <div className="bridge-content">
            <div className="section">
              <h3>🌉 Cross-Chain Bridge</h3>
              <div className="bridge-info">
                <p>Bridge your BETmain tokens between supported chains using Chainlink CCIP.</p>
                
                <div className="supported-chains">
                  <h4>Supported Chains:</h4>
                  <div className="chain-grid">
                    {Object.entries(getCCIPChains()).map(([key, chain]) => (
                      <div key={key} className="chain-card">
                        <span className="chain-icon">{chain.icon}</span>
                        <span className="chain-name">{chain.name}</span>
                        <span className={`chain-status ${chain.isTestnet ? 'testnet' : 'mainnet'}`}>
                          {chain.isTestnet ? 'Testnet' : 'Mainnet'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-content">
            <div className="section">
              <h3>📜 Transaction History</h3>
              <div className="coming-soon">
                <p>Transaction history will be available soon!</p>
                <p>You'll be able to track all your exchanges, bridges, and transfers here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegratedPortfolio;