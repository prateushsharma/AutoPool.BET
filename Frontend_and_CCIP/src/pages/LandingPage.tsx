// Place this file as: src/pages/LandingPage.tsx
// Landing page for PulsePicksAI - AI Strategy Betting Protocol

import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { USE_TESTNET, ENV_INFO } from '../config/contracts';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const { wallet, connectWallet } = useWallet();

  const isMetaMaskInstalled = (): boolean => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask === true;
  };

  const handleLaunchApp = async () => {
    if (!isMetaMaskInstalled()) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    
    try {
      await connectWallet();
      // Redirect to portfolio after successful connection
      window.location.href = '/portfolio';
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* Header Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-icon">⚡</div>
            <span className="brand-name">PulsePicksAI</span>
            {USE_TESTNET && (
              <span className="testnet-badge">TESTNET</span>
            )}
          </div>
          <div className="nav-links">
            <button onClick={() => scrollToSection('features')} className="nav-link">
              Protocol
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="nav-link">
              AMM System
            </button>
            <button onClick={() => scrollToSection('ai-scoring')} className="nav-link">
              AI Scoring
            </button>
            <button onClick={() => scrollToSection('tokenomics')} className="nav-link">
              Tokenomics
            </button>
          </div>
          <button className="launch-app-btn" onClick={handleLaunchApp}>
            {wallet?.isConnected ? 'Enter dApp →' : 'Launch dApp →'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🤖</span>
            Revolutionary AI-Powered Betting on {USE_TESTNET ? 'Testnet' : 'Multi-Chain'}
          </div>
          
          <h1 className="hero-title">
            AI Strategy Betting Protocol with{' '}
            <span className="highlight-text">Cross-Chain AMM</span>
          </h1>
          
          <p className="hero-description">
            Advanced {ENV_INFO.ACTIVE_CHAINS.join(', ')}-native platform combining AI strategy evaluation 
            with automated market maker liquidity. Submit trading strategies, 
            get AI scores, and earn rewards based on performance.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">{ENV_INFO.ACTIVE_CHAINS.length}</div>
              <div className="stat-label">Supported Chains</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">333K</div>
              <div className="stat-label">BET per ETH</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1B</div>
              <div className="stat-label">Max Supply</div>
            </div>
          </div>

          <div className="hero-actions">
            <button className="primary-btn" onClick={handleLaunchApp}>
              {isMetaMaskInstalled() ? 'Connect Wallet' : 'Install MetaMask'}
            </button>
            <button 
              className="secondary-btn"
              onClick={() => scrollToSection('features')}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <h2 className="section-title">🎯 Protocol Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Strategy Analysis</h3>
              <p>Advanced machine learning algorithms analyze and score trading strategies based on historical performance, risk metrics, and market conditions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌉</div>
              <h3>Cross-Chain Bridge</h3>
              <p>Seamless token transfers across multiple blockchains using Chainlink CCIP. Deposit on Arbitrum, mint on Sepolia, receive tokens back automatically.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>AMM Liquidity Pools</h3>
              <p>Automated market makers for each strategy token. Provide liquidity, earn fees, and participate in price discovery for strategy performance.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Yield Generation</h3>
              <p>Multiple ways to earn: stake BETmain tokens, provide liquidity to AMM pools, and receive rewards based on strategy performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <h2 className="section-title">🔄 How It Works</h2>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Connect & Deposit</h3>
                <p>Connect your wallet and deposit ETH on any supported chain. Our cross-chain bridge handles the rest automatically.</p>
              </div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Get BETmain Tokens</h3>
                <p>Receive BETmain tokens at a fixed rate of 333,333 BET per ETH. These are your base tokens for participating in the ecosystem.</p>
              </div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Trade Strategy Tokens</h3>
                <p>Use BETmain tokens to buy strategy tokens through our AMM pools. Each strategy has its own token and liquidity pool.</p>
              </div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Earn Rewards</h3>
                <p>Get rewards based on AI-scored strategy performance. Winners earn tokens, liquidity providers earn fees.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Scoring Section */}
      <section id="ai-scoring" className="ai-scoring-section">
        <div className="section-container">
          <h2 className="section-title">🧠 AI Scoring System</h2>
          <div className="scoring-content">
            <div className="scoring-text">
              <h3>Advanced Machine Learning</h3>
              <p>Our AI system evaluates trading strategies using multiple factors:</p>
              <ul>
                <li>📈 Historical performance analysis</li>
                <li>📊 Risk-adjusted returns</li>
                <li>🎯 Sharpe ratio optimization</li>
                <li>🌊 Market volatility adaptation</li>
                <li>⚡ Real-time market conditions</li>
              </ul>
              <p>Strategies are continuously re-evaluated and scores updated to reflect changing market dynamics.</p>
            </div>
            <div className="scoring-visual">
              <div className="score-display">
                <div className="score-item">
                  <div className="score-label">Strategy #123</div>
                  <div className="score-value good">87.5</div>
                </div>
                <div className="score-item">
                  <div className="score-label">Strategy #456</div>
                  <div className="score-value average">64.2</div>
                </div>
                <div className="score-item">
                  <div className="score-label">Strategy #789</div>
                  <div className="score-value poor">42.8</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tokenomics Section */}
      <section id="tokenomics" className="tokenomics-section">
        <div className="section-container">
          <h2 className="section-title">💎 Tokenomics</h2>
          <div className="tokenomics-grid">
            <div className="token-info">
              <h3>🪙 BETmain Token</h3>
              <div className="token-details">
                <div className="detail-item">
                  <span className="detail-label">Total Supply:</span>
                  <span className="detail-value">1,000,000,000 BET</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Exchange Rate:</span>
                  <span className="detail-value">333,333 BET per ETH</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Min Deposit:</span>
                  <span className="detail-value">0.0001 ETH</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Max Deposit:</span>
                  <span className="detail-value">10 ETH</span>
                </div>
              </div>
            </div>
            <div className="token-distribution">
              <h3>📊 Distribution</h3>
              <div className="distribution-chart">
                <div className="chart-item">
                  <div className="chart-bar" style={{width: '40%', backgroundColor: '#3b82f6'}}></div>
                  <span>40% Public Exchange</span>
                </div>
                <div className="chart-item">
                  <div className="chart-bar" style={{width: '25%', backgroundColor: '#8b5cf6'}}></div>
                  <span>25% Liquidity Pools</span>
                </div>
                <div className="chart-item">
                  <div className="chart-bar" style={{width: '20%', backgroundColor: '#10b981'}}></div>
                  <span>20% Strategy Rewards</span>
                </div>
                <div className="chart-item">
                  <div className="chart-bar" style={{width: '15%', backgroundColor: '#f59e0b'}}></div>
                  <span>15% Treasury</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="brand-icon">⚡</div>
            <span className="brand-name">PulsePicksAI</span>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">GitHub</a>
            <a href="#" className="footer-link">Discord</a>
            <a href="#" className="footer-link">Twitter</a>
          </div>
          <div className="footer-info">
            <p>&copy; 2024 PulsePicksAI. AI Strategy Betting Protocol.</p>
            <p>Current Environment: {USE_TESTNET ? 'Testnet' : 'Mainnet'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;