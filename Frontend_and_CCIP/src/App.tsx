// Place this file as: src/App.tsx (PulsePicksAI Landing Page inspired by Suthetic structure)

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext';
import DashboardHeader from './components/DashboardHeader';
import Home from './pages/Home';
import BetPage from './pages/BetPage';
import Portfolio from './pages/Portfolio';
import WalletConnectButton from './components/WalletConnectButton';
import './App.css';

// Landing page for PulsePicksAI - AI Strategy Betting Protocol
const LandingPage: React.FC = () => {
  const { wallet, connectWallet } = useWallet();

  const isMetaMaskInstalled = (): boolean => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask === true;
  };

  const handleLaunchApp = () => {
    if (!isMetaMaskInstalled()) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    connectWallet();
  };

  return (
    <div className="landing-page">
      {/* Header Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-icon">⚡</div>
            <span className="brand-name">PulsePicksAI</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Protocol</a>
            <a href="#how-it-works" className="nav-link">AMM System</a>
            <a href="#ai-scoring" className="nav-link">AI Scoring</a>
            <a href="#tokenomics" className="nav-link">Tokenomics</a>
            <a href="#whitepaper" className="nav-link">Whitepaper</a>
          </div>
          <button className="launch-app-btn" onClick={handleLaunchApp}>
            Launch dApp →
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="landing-main">
        <div className="landing-content">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-badge">
              <span className="badge-icon">🤖</span>
              Revolutionary AI-Powered Betting on Avalanche
            </div>
            
            <h1 className="hero-title">
              AI Strategy Betting Protocol with{' '}
              <span className="highlight-text">Cross-Chain AMM</span>
            </h1>
            
            <p className="hero-description">
              Advanced Avalanche-native platform combining AI strategy evaluation 
              with automated market maker liquidity. Submit trading strategies, 
              get AI scores, and earn rewards based on performance.
            </p>

            <div className="hero-actions">
              <WalletConnectButton className="launch-btn" />
              <button className="learn-more-btn" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                View Protocol →
              </button>
            </div>
          </div>

          {/* Diagram Section */}
          <div className="diagram-section">
            <div className="diagram-container">
              {/* Central AI Engine */}
              <div className="ai-circle">
                <div className="ai-icon">AI</div>
                <div className="ai-subtitle">Engine</div>
              </div>

              {/* Floating Components */}
              <div className="floating-icon top">
                <div className="icon-wrapper">
                  <div className="icon">📊</div>
                  <div className="icon-label">AMM Pools</div>
                </div>
              </div>
              
              <div className="floating-icon top-right">
                <div className="icon-wrapper">
                  <div className="icon">🔗</div>
                  <div className="icon-label">CCIP Bridge</div>
                </div>
              </div>
              
              <div className="floating-icon right">
                <div className="icon-wrapper">
                  <div className="icon">💰</div>
                  <div className="icon-label">Rewards</div>
                </div>
              </div>
              
              <div className="floating-icon bottom-right">
                <div className="icon-wrapper">
                  <div className="icon">⚡</div>
                  <div className="icon-label">Avalanche</div>
                </div>
              </div>
              
              <div className="floating-icon bottom">
                <div className="icon-wrapper">
                  <div className="icon">🎯</div>
                  <div className="icon-label">Strategies</div>
                </div>
              </div>
              
              <div className="floating-icon bottom-left">
                <div className="icon-wrapper">
                  <div className="icon">💎</div>
                  <div className="icon-label">LP Tokens</div>
                </div>
              </div>
              
              <div className="floating-icon left">
                <div className="icon-wrapper">
                  <div className="icon">🌐</div>
                  <div className="icon-label">Cross-Chain</div>
                </div>
              </div>
              
              <div className="floating-icon top-left">
                <div className="icon-wrapper">
                  <div className="icon">📈</div>
                  <div className="icon-label">Performance</div>
                </div>
              </div>

              {/* Connecting Lines */}
              <div className="connection-lines">
                <div className="line line-1"></div>
                <div className="line line-2"></div>
                <div className="line line-3"></div>
                <div className="line line-4"></div>
                <div className="line line-5"></div>
                <div className="line line-6"></div>
                <div className="line line-7"></div>
                <div className="line line-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Features Section */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Revolutionary DeFi Betting Protocol</h2>
            <p className="section-subtitle">
              PulsePicksAI combines cutting-edge AI evaluation with efficient AMM mechanics 
              for a new paradigm in decentralized prediction markets.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI-Powered Scoring</h3>
              <p className="feature-description">
                Advanced multi-dimensional AI analysis 
                evaluates trading strategies using Sharpe 
                ratios, risk metrics, and performance 
                indicators for fair scoring.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Avalanche Native</h3>
              <p className="feature-description">
                Built natively on Avalanche for instant 
                execution and low fees, with cross-chain 
                asset bridging via Chainlink CCIP for 
                maximum accessibility.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Dynamic AMM System</h3>
              <p className="feature-description">
                Each strategy creates unique AMM pools 
                with adaptive fees, liquidity incentives, 
                and automated market making for 
                efficient price discovery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="how-it-works-container">
          <div className="section-header">
            <h2 className="section-title">How PulsePicksAI Works</h2>
            <p className="section-subtitle">
              Our innovative architecture leverages Avalanche's speed with cross-chain 
              accessibility and sophisticated AI evaluation systems.
            </p>
          </div>

          <div className="steps-container">
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3 className="step-title">Submit Strategy</h3>
                <p className="step-description">
                  Users submit trading strategies to the protocol. 
                  Each strategy gets a unique BET token and 
                  dedicated AMM pool paired with BETmain.
                </p>
              </div>
              
              <div className="step-card">
                <div className="step-number">2</div>
                <h3 className="step-title">AI Evaluation</h3>
                <p className="step-description">
                  Advanced AI engine analyzes strategies using 
                  multi-dimensional scoring including ROI, Sharpe 
                  ratio, maximum drawdown, and innovation metrics.
                </p>
              </div>
              
              <div className="step-card">
                <div className="step-number">3</div>
                <h3 className="step-title">AMM Trading</h3>
                <p className="step-description">
                  Users swap BETmain for strategy tokens via 
                  Uniswap V2 AMM with dynamic fees. LPs provide 
                  liquidity and earn trading fees.
                </p>
              </div>
              
              <div className="step-card">
                <div className="step-number">4</div>
                <h3 className="step-title">Reward Distribution</h3>
                <p className="step-description">
                  Performance-based rewards distributed using 
                  weighted mass calculation. Higher AI scores 
                  and token holdings earn proportionally more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Scoring Section */}
      <section className="ai-scoring-section" id="ai-scoring">
        <div className="ai-scoring-container">
          <div className="section-header">
            <h2 className="section-title">Advanced AI Scoring Engine</h2>
            <p className="section-subtitle">
              Our sophisticated AI evaluation system uses multiple complexity levels 
              to ensure fair and accurate strategy assessment.
            </p>
          </div>

          <div className="scoring-levels">
            <div className="scoring-card">
              <div className="level-badge">Level 1</div>
              <h3 className="scoring-title">Basic Performance</h3>
              <p className="scoring-description">ROI calculation and basic return metrics</p>
            </div>
            
            <div className="scoring-card">
              <div className="level-badge">Level 2</div>
              <h3 className="scoring-title">Risk-Adjusted Returns</h3>
              <p className="scoring-description">Sharpe ratio and Information ratio analysis</p>
            </div>
            
            <div className="scoring-card">
              <div className="level-badge">Level 3</div>
              <h3 className="scoring-title">Advanced Risk Metrics</h3>
              <p className="scoring-description">VaR, CVaR, and Ulcer index calculations</p>
            </div>
            
            <div className="scoring-card">
              <div className="level-badge">Level 4</div>
              <h3 className="scoring-title">Behavioral Finance</h3>
              <p className="scoring-description">Prospect theory and behavioral analysis</p>
            </div>
            
            <div className="scoring-card">
              <div className="level-badge">Level 5</div>
              <h3 className="scoring-title">ML Performance</h3>
              <p className="scoring-description">Confidence metrics and overfitting detection</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tokenomics Section */}
      <section className="tokenomics-section" id="tokenomics">
        <div className="tokenomics-container">
          <div className="section-header">
            <h2 className="section-title">Dual-Token Economy</h2>
            <p className="section-subtitle">
              Efficient token design with BETmain as universal base and BET
              tokens for specific strategy exposure.
            </p>
          </div>

          <div className="tokens-grid">
            <div className="token-card">
              <div className="token-icon">🏛️</div>
              <h3 className="token-title">BETmain Token</h3>
              <div className="token-details">
                <p>• Universal base token for all pairs</p>
                <p>• 1:1 USDC backing via CCIP bridge</p>
                <p>• Required for all betting activities</p>
                <p>• Dynamic supply based on deposits</p>
              </div>
            </div>
            
            <div className="token-card">
              <div className="token-icon">🎯</div>
              <h3 className="token-title">BET Tokens</h3>
              <div className="token-details">
                <p>• Strategy-specific ERC-20 tokens</p>
                <p>• Paired with BETmain in AMM pools</p>
                <p>• Redeemable based on AI performance</p>
                <p>• Tradeable during betting phase</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Chain Section */}
      <section className="cross-chain-section">
        <div className="cross-chain-container">
          <div className="section-header">
            <h2 className="section-title">Cross-Chain Architecture via CCIP</h2>
            <p className="section-subtitle">
              Avalanche-native execution with seamless cross-chain asset flow through 
              Chainlink's Cross-Chain Interoperability Protocol.
            </p>
          </div>

          <div className="chain-diagram">
            <div className="supported-chains">
              <div className="chain-item">
                <div className="chain-logo">🔷</div>
                <span className="chain-name">Ethereum</span>
              </div>
              <div className="chain-item">
                <div className="chain-logo">🟣</div>
                <span className="chain-name">Polygon</span>
              </div>
              <div className="chain-item">
                <div className="chain-logo">🔵</div>
                <span className="chain-name">Arbitrum</span>
              </div>
              <div className="chain-item">
                <div className="chain-logo">🔴</div>
                <span className="chain-name">Base</span>
              </div>
            </div>
            
            <div className="ccip-bridge">
              <div className="bridge-icon">🌉</div>
              <span className="bridge-label">CCIP Bridge</span>
            </div>
            
            <div className="avalanche-core">
              <div className="avalanche-logo">⚡</div>
              <div className="avalanche-features">
                <h4>Avalanche Core</h4>
                <p>• All betting logic</p>
                <p>• AMM pools</p>
                <p>• AI scoring engine</p>
                <p>• Reward distribution</p>
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
            <a href="#" className="footer-link">Protocol</a>
            <a href="#" className="footer-link">Whitepaper</a>
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Community</a>
            <a href="#" className="footer-link">GitHub</a>
          </div>
          <button className="footer-cta" onClick={handleLaunchApp}>
            Launch dApp
          </button>
        </div>
      </footer>
    </div>
  );
};

// Main App Component with routing
const AppContent: React.FC = () => {
  const { wallet } = useWallet();

  if (!wallet?.isConnected) {
    return <LandingPage />;
  }

  return (
    <div className="dashboard-layout">
      <DashboardHeader />
      <main className="dashboard-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bet/:marketId" element={<BetPage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <WalletProvider>
      <Router>
        <AppContent />
      </Router>
    </WalletProvider>
  );
};

export default App;