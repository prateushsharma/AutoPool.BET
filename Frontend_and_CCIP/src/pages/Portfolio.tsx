// Place this file as: src/pages/Portfolio.tsx

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
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

  // Mock token balances - replace with real API calls later
  const mockTokenBalances: TokenBalance[] = [
    {
      symbol: 'USDC',
      balance: '1,250.50',
      usdValue: '1,250.50',
      icon: '💵'
    },
    {
      symbol: 'BET',
      balance: '5,000.00',
      usdValue: '2,500.00',
      icon: '🎯'
    },
    {
      symbol: 'AVAX',
      balance: '15.75',
      usdValue: '472.50',
      icon: '🔺'
    },
    {
      symbol: 'WETH',
      balance: '0.85',
      usdValue: '2,040.00',
      icon: '⟠'
    }
  ];

  // Mock win stats - replace with real data later
  const mockWinStats: WinStats = {
    totalBets: 47,
    winningBets: 29,
    totalWinnings: '3,450.75',
    totalLosses: '1,890.25',
    winRate: 61.7,
    roi: 82.6
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

  // Load mock data
  useEffect(() => {
    setTokenBalances(mockTokenBalances);
    setWinStats(mockWinStats);
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
    return tokenBalances.reduce((total, token) => {
      return total + parseFloat(token.usdValue.replace(',', ''));
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

        {/* Portfolio Overview */}
        <div className="portfolio-overview">
          <div className="overview-card total">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Total Portfolio Value</h3>
              <div className="card-value">${calculateTotalPortfolioValue()}</div>
              <div className="card-subtext">Across all tokens</div>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">🎯</div>
            <div className="card-content">
              <h3>Active Bets</h3>
              <div className="card-value">3</div>
              <div className="card-subtext">Currently running</div>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <h3>Total Profit</h3>
              <div className="card-value positive">+${winStats?.totalWinnings || '0'}</div>
              <div className="card-subtext">All time performance</div>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">🏆</div>
            <div className="card-content">
              <h3>Win Rate</h3>
              <div className="card-value">{winStats?.winRate || 0}%</div>
              <div className="card-subtext">{winStats?.winningBets || 0}/{winStats?.totalBets || 0} bets</div>
            </div>
          </div>
        </div>

        {/* Token Balances */}
        <div className="token-balances">
          <h3>Token Balances</h3>
          <div className="balance-list">
            {tokenBalances.map((token, index) => (
              <div key={index} className="balance-item">
                <div className="token-info">
                  <span className="token-icon">{token.icon}</span>
                  <div className="token-details">
                    <span className="token-symbol">{token.symbol}</span>
                    <span className="token-balance">{token.balance}</span>
                  </div>
                </div>
                <div className="token-value">
                  <span className="usd-value">${token.usdValue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* USDC to BET Conversion */}
        <div className="conversion-section">
          <h3>Convert USDC to BET Tokens</h3>
          <div className="conversion-card">
            <div className="conversion-header">
              <div className="conversion-rate">
                <span className="rate-info">Exchange Rate: 1 USDC = 2 BET</span>
              </div>
            </div>
            
            <div className="conversion-form">
              <div className="input-group">
                <label>Amount (USDC)</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={usdcToBetAmount}
                    onChange={(e) => setUsdcToBetAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <span className="input-currency">USDC</span>
                </div>
              </div>
              
              <div className="conversion-arrow">↓</div>
              
              <div className="output-group">
                <label>You'll receive</label>
                <div className="output-value">
                  {usdcToBetAmount ? (parseFloat(usdcToBetAmount) * 2).toFixed(2) : '0.00'} BET
                </div>
              </div>
              
              <button 
                className="convert-btn"
                onClick={handleConvertToBet}
                disabled={!usdcToBetAmount || parseFloat(usdcToBetAmount) <= 0 || isConverting}
              >
                {isConverting ? 'Converting...' : 'Convert to BET'}
              </button>
            </div>
          </div>
        </div>

        {/* Win Statistics */}
        <div className="win-statistics">
          <h3>Betting Performance</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <span className="stat-value">{winStats?.totalBets || 0}</span>
                <span className="stat-label">Total Bets</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <span className="stat-value">{winStats?.winningBets || 0}</span>
                <span className="stat-label">Winning Bets</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <span className="stat-value positive">${winStats?.totalWinnings || '0'}</span>
                <span className="stat-label">Total Winnings</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📉</div>
              <div className="stat-content">
                <span className="stat-value negative">-${winStats?.totalLosses || '0'}</span>
                <span className="stat-label">Total Losses</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <span className="stat-value">{winStats?.winRate || 0}%</span>
                <span className="stat-label">Win Rate</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <span className="stat-value positive">+{winStats?.roi || 0}%</span>
                <span className="stat-label">ROI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon win">🏆</div>
              <div className="activity-content">
                <span className="activity-title">Won bet on NBA Lakers vs Warriors</span>
                <span className="activity-time">2 hours ago</span>
              </div>
              <div className="activity-amount positive">+$125.50</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon convert">🔄</div>
              <div className="activity-content">
                <span className="activity-title">Converted 100 USDC to 200 BET</span>
                <span className="activity-time">1 day ago</span>
              </div>
              <div className="activity-amount">200 BET</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon loss">❌</div>
              <div className="activity-content">
                <span className="activity-title">Lost bet on Premier League Chelsea vs Arsenal</span>
                <span className="activity-time">2 days ago</span>
              </div>
              <div className="activity-amount negative">-$50.00</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon win">🏆</div>
              <div className="activity-content">
                <span className="activity-title">Won AI strategy bet on NFL</span>
                <span className="activity-time">3 days ago</span>
              </div>
              <div className="activity-amount positive">+$200.75</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;