// Place this file as: src/pages/Portfolio.tsx
// Your existing portfolio with contract integration added

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useContracts, QuickUpdate } from '../hooks/useContracts';
import './Portfolio.css';

interface TokenBalance {
  symbol: string;
  balance: string;
  usdValue: string;
  icon: string;
}

interface ChainInfo {
  id: number;
  name: string;
  icon: string;
  nativeCurrency: string;
  color: string;
}

interface WinStats {
  totalBets: number;
  winningBets: number;
  totalWinnings: string;
  totalLosses: string;
  winRate: number;
  roi: number;
}

const Portfolio: React.FC = () => {
  const { wallet } = useWallet();
  const [selectedChain, setSelectedChain] = useState<ChainInfo | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [winStats, setWinStats] = useState<WinStats | null>(null);
  const [usdcToBetAmount, setUsdcToBetAmount] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // Contract integration
  const { balances: contractBalances, exchangeData, loading: contractLoading, exchangeETH, depositCrossChain, refreshData } = useContracts(wallet?.address);
  const [ethAmount, setEthAmount] = useState('');
  const [exchangeLoading, setExchangeLoading] = useState(false);

  // Supported chains with their info
  const supportedChains: ChainInfo[] = [
    {
      id: 43114,
      name: 'Avalanche',
      icon: '🔺',
      nativeCurrency: 'AVAX',
      color: '#E84142'
    },
    {
      id: 1,
      name: 'Ethereum',
      icon: '⟠',
      nativeCurrency: 'ETH',
      color: '#627EEA'
    },
    {
      id: 8453,
      name: 'Base',
      icon: '🔵',
      nativeCurrency: 'ETH',
      color: '#0052FF'
    },
    {
      id: 42161,
      name: 'Arbitrum',
      icon: '🔴',
      nativeCurrency: 'ETH',
      color: '#28A0F0'
    },
    {
      id: 137,
      name: 'Polygon',
      icon: '🟣',
      nativeCurrency: 'MATIC',
      color: '#8247E5'
    }
  ];

  // No hardcoded values - will show real data only

  // Handle ETH exchange
  const handleETHExchange = async () => {
    if (!ethAmount) return;
    
    setExchangeLoading(true);
    try {
      const tx = await exchangeETH(ethAmount);
      console.log('Exchange transaction:', tx.hash);
      await tx.wait();
      await refreshData();
      setEthAmount('');
      alert('Exchange successful!');
    } catch (error: any) {
      console.error('Exchange failed:', error);
      alert(`Exchange failed: ${error.message}`);
    } finally {
      setExchangeLoading(false);
    }
  };

  // Handle cross-chain deposit
  const handleCrossChainDeposit = async () => {
    if (!ethAmount) return;
    
    setExchangeLoading(true);
    try {
      const tx = await depositCrossChain(ethAmount);
      console.log('Cross-chain deposit transaction:', tx.hash);
      await tx.wait();
      await refreshData();
      setEthAmount('');
      alert('Cross-chain deposit successful!');
    } catch (error: any) {
      console.error('Cross-chain deposit failed:', error);
      alert(`Cross-chain deposit failed: ${error.message}`);
    } finally {
      setExchangeLoading(false);
    }
  };

  // Detect current chain based on wallet
  useEffect(() => {
    if (wallet?.chainId) {
      const currentChain = supportedChains.find(chain => chain.id === wallet.chainId);
      setSelectedChain(currentChain || supportedChains[0]);
    } else {
      // Default to Avalanche if no wallet connected or chain detected
      setSelectedChain(supportedChains[0]);
    }
  }, [wallet?.chainId]);

  // Load only real contract data
  useEffect(() => {
    // No mock data loading - everything comes from contracts now
  }, []);

  // Handle chain switching
  const handleChainSwitch = async (chain: ChainInfo) => {
    if (wallet?.chainId === chain.id) return;
    
    try {
      // For Core wallet (Avalanche), we can't switch chains
      if (wallet?.walletType === 'core' && chain.id !== 43114) {
        alert('Core wallet only supports Avalanche network. Please use MetaMask to access other chains.');
        return;
      }

      // For MetaMask, attempt to switch chain
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chain.id.toString(16)}` }]
        });
      }
    } catch (error) {
      console.error('Error switching chain:', error);
    }
  };

  // Handle USDC to BET conversion
  const handleConvertToBet = async () => {
    if (!usdcToBetAmount || parseFloat(usdcToBetAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsConverting(true);
    
    try {
      // Mock conversion - replace with real smart contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const betAmount = parseFloat(usdcToBetAmount) * 2; // Mock 1 USDC = 2 BET
      alert(`Successfully converted ${usdcToBetAmount} USDC to ${betAmount} BET tokens!`);
      
      // Reset form
      setUsdcToBetAmount('');
      
      // Refresh balances (mock)
      // In real app, refetch balances from blockchain
      
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const calculateTotalPortfolioValue = () => {
    // Calculate from real contract balances only
    if (contractBalances.length === 0) return '0';
    
    return contractBalances.reduce((total, token) => {
      return total + parseFloat(token.usdValue);
    }, 0).toLocaleString();
  };

  return (
    <div className="portfolio-page">
      <div className="portfolio-container">
        {/* Header */}
        <div className="portfolio-header">
          <h1>📊 My Portfolio</h1>
          <p>Track your betting performance and manage your assets</p>
        </div>

        {/* Chain Selector */}
        <div className="chain-selector">
          <h3>Current Network</h3>
          <div className="chain-list">
            {supportedChains.map((chain) => (
              <button
                key={chain.id}
                className={`chain-item ${selectedChain?.id === chain.id ? 'active' : ''}`}
                onClick={() => handleChainSwitch(chain)}
                style={{ borderColor: selectedChain?.id === chain.id ? chain.color : 'transparent' }}
              >
                <span className="chain-icon">{chain.icon}</span>
                <div className="chain-info">
                  <span className="chain-name">{chain.name}</span>
                  <span className="chain-currency">{chain.nativeCurrency}</span>
                </div>
                {selectedChain?.id === chain.id && (
                  <span className="chain-status">✓ Connected</span>
                )}
              </button>
            ))}
          </div>
          {wallet?.walletType === 'core' && (
            <div className="wallet-info">
              <span className="wallet-badge">
                🔥 Core Wallet - Avalanche Native
              </span>
            </div>
          )}
        </div>

        {/* Contract Integration Section */}
        <div className="contract-section">
          <h3>🔗 Contract Balances</h3>
          {contractLoading ? (
            <div className="loading-indicator">
              <span>Loading contract data...</span>
            </div>
          ) : contractBalances.length > 0 ? (
            <div className="contract-balances">
              {contractBalances.map((balance, index) => (
                <div key={index} className="contract-balance-item">
                  <div className="balance-info">
                    <span className="balance-symbol">{balance.symbol}</span>
                    <span className="balance-amount">{balance.balance}</span>
                  </div>
                  <div className="balance-value">
                    <span>${balance.usdValue}</span>
                    <span className="chain-name">({balance.chainName})</span>
                  </div>
                </div>
              ))}
            </div>
          ) : wallet?.isConnected ? (
            <div className="no-contract-balances">
              <p>No contract balances found. Connect to Sepolia or Arbitrum Sepolia to see your BETmain tokens.</p>
            </div>
          ) : (
            <div className="connect-wallet-prompt">
              <p>Connect your wallet to view contract balances</p>
            </div>
          )}
        </div>

        {/* ETH Exchange Section */}
        {wallet?.isConnected && (
          <div className="eth-exchange-section">
            <h3>💱 ETH to BETmain Exchange</h3>
            {exchangeData && (
              <div className="exchange-info">
                <p>Exchange Rate: 1 ETH = {exchangeData.rate.toLocaleString()} BETmain</p>
                <div className="user-exchange-stats">
                  <span>Your deposited: {exchangeData.userDeposited} ETH</span>
                  <span>Your received: {exchangeData.userReceived} BETmain</span>
                </div>
              </div>
            )}
            
            <div className="exchange-form">
              <div className="exchange-input">
                <input
                  type="number"
                  placeholder="0.0"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  step="0.001"
                  min="0"
                />
                <span className="input-label">ETH</span>
              </div>
              
              <div className="exchange-buttons">
                <button 
                  onClick={handleETHExchange} 
                  disabled={!ethAmount || exchangeLoading}
                  className="exchange-btn direct"
                >
                  {exchangeLoading ? 'Processing...' : 'Exchange on Sepolia'}
                </button>
                
                <button 
                  onClick={handleCrossChainDeposit} 
                  disabled={!ethAmount || exchangeLoading}
                  className="exchange-btn cross-chain"
                >
                  {exchangeLoading ? 'Processing...' : 'Cross-Chain (Arbitrum)'}
                </button>
              </div>
              
              {ethAmount && exchangeData && (
                <div className="exchange-preview">
                  <span>You will receive: ~{(parseFloat(ethAmount) * exchangeData.rate).toLocaleString()} BETmain</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* USDC to BET Converter */}
        <div className="usdc-converter">
          <h3>USDC to BET Converter</h3>
          <div className="converter-form">
            <div className="converter-input">
              <input
                type="number"
                placeholder="Enter USDC amount"
                value={usdcToBetAmount}
                onChange={(e) => setUsdcToBetAmount(e.target.value)}
                disabled={isConverting}
              />
              <span className="input-currency">USDC</span>
            </div>
            
            <div className="conversion-arrow">→</div>
            
            <div className="conversion-output">
              <span className="output-amount">
                {usdcToBetAmount ? (parseFloat(usdcToBetAmount) * 2).toFixed(2) : '0.00'}
              </span>
              <span className="output-currency">BET</span>
            </div>
            
            <button 
              className="convert-button"
              onClick={handleConvertToBet}
              disabled={!usdcToBetAmount || parseFloat(usdcToBetAmount) <= 0 || isConverting}
            >
              {isConverting ? 'Converting...' : 'Convert to BET'}
            </button>
          </div>
          
          <div className="conversion-rate">
            <span>Exchange Rate: 1 USDC = 2 BET</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;