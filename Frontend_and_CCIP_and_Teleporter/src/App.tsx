// File: src/App.tsx
// Updated PulsePicksAI Main App Component with Enhanced Landing Page

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
//import Dashboard from './components/Dashboard';
import Dashboard from './components/Dashboard';
import GameDetails from './components/GameDetails';
import './App.css';

// Landing Page Component
const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLaunchDApp = () => {
    navigate('/home');
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="project-title">PulsePicksAI</h1>
          <p className="project-subtitle">Cross-Chain AI Strategy Betting Protocol</p>
          
          <div className="description-section">
            <p className="project-description">
              Revolutionary AI-powered prediction markets where creators compete with their own strategies. 
              Participate from any chain with confidence-weighted rewards.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <h3>🌉 Cross-Chain</h3>
              <p>Participate from Ethereum, Avalanche, or Dispatch Chain</p>
            </div>
            <div className="feature-card">
              <h3>🤖 AI-Powered</h3>
              <p>Strategies evaluated by advanced AI scoring systems</p>
            </div>
            <div className="feature-card">
              <h3>👥 Creator-Competitor</h3>
              <p>Pool creators must participate with their own strategies</p>
            </div>
            <div className="feature-card">
              <h3>💰 Confidence Rewards</h3>
              <p>Rewards based on investment × AI score × confidence</p>
            </div>
          </div>

          <button className="launch-dapp-btn" onClick={handleLaunchDApp}>
            Launch dApp
          </button>
        </div>

        {/* How It Works Section */}
        <div className="how-it-works-section">
          <h2 className="section-title">🎮 How PulsePicksAI Works</h2>
          <p className="section-subtitle">Thrill in 4 Simple Steps</p>
          
          <div className="process-flow">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>🤖 Describe Your Strategy</h3>
                <p>Tell our AI: <em>"Create a 5-minute ETH trading game with $100 targeting 5% profits"</em></p>
                <div className="step-highlight">AI analyzes intent → Sets parameters → Deploys instantly</div>
              </div>
            </div>

            <div className="process-arrow">↓</div>

            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>⚡ Connect Any Chain</h3>
                <div className="chain-options">
                  <span className="chain-badge native">🔺 Avalanche Native</span>
                  <span className="chain-badge ccip">🔷 Ethereum CCIP</span>
                  <span className="chain-badge teleporter">🚀 Dispatch Teleporter</span>
                </div>
                <p>Cross-chain participation with automatic bridging</p>
              </div>
            </div>

            <div className="process-arrow">↓</div>

            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>🏆 Real-Time Competition</h3>
                <p>AI agents execute your strategy while you watch live rankings update</p>
                <div className="live-demo">
                  <div className="leaderboard-mini">
                    <div className="rank-item">🥇 CryptoTrader: +8.45%</div>
                    <div className="rank-item">🥈 QuickFlip: +3.21%</div>
                    <div className="rank-item">🥉 AIBot: +1.67%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="process-arrow">↓</div>

            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>💸 Profit Explosion!</h3>
                <p>Rewards scale with both skill and confidence:</p>
                <div className="reward-formula">
                  <code>Reward = Investment × AI Score × Confidence Weight</code>
                </div>
                <div className="profit-example">
                  <span className="profit-highlight">1st Place: $100 → $225 (+125%!)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Chain Architecture */}
        <div className="architecture-section">
          <h2 className="section-title">🌉 Multi-Chain Architecture</h2>
          <p className="section-subtitle">Seamless Cross-Chain Access Powered by Industry Leaders</p>
          
          <div className="architecture-diagram">
            {/* Central Hub - PulsePicksAI Core */}
            <div className="central-hub">
              <div className="hub-core">
                <div className="hub-icon">⚡</div>
                <h2>PULSEPICKS</h2>
                <div className="hub-subtitle">AI Core</div>
              </div>
            </div>

            {/* Orbiting Chain Nodes */}
            <div className="chain-node ethereum">
              <div className="chain-icon">🔷</div>
              <h3>Ethereum</h3>
              <p>Sepolia</p>
            </div>

            <div className="chain-node dispatch">
              <div className="chain-icon">🚀</div>
              <h3>Dispatch</h3>
              <p>L1 Chain</p>
            </div>

            <div className="chain-node avalanche-left">
              <div className="chain-icon">🔺</div>
              <h3>Avalanche</h3>
              <p>Fuji</p>
            </div>

            <div className="chain-node avalanche-right">
              <div className="chain-icon">⛰️</div>
              <h3>Avalanche</h3>
              <p>Mainnet</p>
            </div>

            <div className="chain-node base">
              <div className="chain-icon">🔵</div>
              <h3>Base</h3>
              <p>L2</p>
            </div>

            <div className="chain-node polygon">
              <div className="chain-icon">🟣</div>
              <h3>Polygon</h3>
              <p>PoS</p>
            </div>

            {/* Protocol Labels */}
            <div className="protocol-label ccip">Chainlink CCIP</div>
            <div className="protocol-label teleporter">AWM Teleporter</div>
            <div className="protocol-label native-left">Native</div>
            <div className="protocol-label native-right">Native</div>
          </div>

          <div className="bridge-info">
            <div className="bridge-card ccip-card">
              <h4>🔗 Chainlink CCIP</h4>
              <p>Cross-Chain Interoperability Protocol</p>
              <div className="bridge-stats">
                <span>⏱ 10-20 minutes</span>
                <span>💰 ~$3-5 fees</span>
                <span>🔒 Battle-tested security</span>
                <span>🌐 Ethereum Sepolia</span>
              </div>
            </div>

            <div className="bridge-card teleporter-card">
              <h4>📡 AWM Teleporter</h4>
              <p>Avalanche Warp Messaging</p>
              <div className="bridge-stats">
                <span>⚡ 2-5 seconds</span>
                <span>💎 ~$0.01-0.05 fees</span>
                <span>🚀 Native Avalanche speed</span>
                <span>🌉 Dispatch Chain</span>
              </div>
            </div>

            <div className="bridge-card native-card">
              <h4>🔺 Avalanche Native</h4>
              <p>Primary Execution Layer</p>
              <div className="bridge-stats">
                <span>⚡ Instant execution</span>
                <span>💫 Gas optimized</span>
                <span>🏆 AI competition engine</span>
                <span>🎯 Fuji testnet ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose PulsePicksAI */}
        <div className="comparison-section">
          <h2 className="section-title">💡 Why PulsePicksAI Dominates</h2>
          
          <div className="comparison-table">
            <div className="comparison-header">
              <div className="feature-col">Feature</div>
              <div className="traditional-col">Traditional Platforms</div>
              <div className="pulsepicks-col">PulsePicksAI</div>
            </div>

            <div className="comparison-row">
              <div className="feature-col">House Edge</div>
              <div className="traditional-col">✅ Always Present</div>
              <div className="pulsepicks-col highlight">❌ Zero House Edge!</div>
            </div>

            <div className="comparison-row">
              <div className="feature-col">AI Strategy</div>
              <div className="traditional-col">❌ Manual Only</div>
              <div className="pulseicks-col highlight">✅ AI-Powered Execution</div>
            </div>

            <div className="comparison-row">
              <div className="feature-col">Cross-Chain</div>
              <div className="traditional-col">❌ Single Chain</div>
              <div className="pulseicks-col highlight">✅ CCIP + Teleporter</div>
            </div>

            <div className="comparison-row">
              <div className="feature-col">Reward Model</div>
              <div className="traditional-col">Fixed Odds</div>
              <div className="pulseicks-col highlight">🔥 Confidence-Weighted</div>
            </div>

            <div className="comparison-row">
              <div className="feature-col">Creator Model</div>
              <div className="traditional-col">House vs Players</div>
              <div className="pulseicks-col highlight">🏆 Creators Compete Too!</div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="technology-section">
          <h2 className="section-title">🔧 Technology Stack</h2>
          <p className="section-subtitle">Built on Industry-Leading Infrastructure</p>
          
          <div className="tech-stack">
            <div className="tech-category">
              <h3>🌉 Cross-Chain Bridges</h3>
              <div className="tech-cards">
                <div className="tech-card ccip">
                  <div className="tech-icon">🔗</div>
                  <h4>Chainlink CCIP</h4>
                  <p>Secure cross-chain messaging for Ethereum Sepolia integration</p>
                  <div className="tech-badge">Battle-Tested</div>
                </div>
                <div className="tech-card teleporter">
                  <div className="tech-icon">📡</div>
                  <h4>AWM Teleporter</h4>
                  <p>Lightning-fast Avalanche native messaging for Dispatch Chain</p>
                  <div className="tech-badge">Sub-5 Second</div>
                </div>
              </div>
            </div>

            <div className="tech-category">
              <h3>⚡ Core Infrastructure</h3>
              <div className="tech-cards">
                <div className="tech-card avalanche">
                  <div className="tech-icon">🔺</div>
                  <h4>Avalanche Fuji</h4>
                  <p>Native execution layer for AI competitions and strategy battles</p>
                  <div className="tech-badge">Primary Chain</div>
                </div>
                <div className="tech-card ai">
                  <div className="tech-icon">🤖</div>
                  <h4>AI Engine</h4>
                  <p>Advanced strategy parsing, execution, and performance scoring</p>
                  <div className="tech-badge">GPT-Powered</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="final-cta">
          <h2>🚀 Ready to Battle?</h2>
          <p>Join the future of AI-powered competitive betting</p>
          <button className="launch-dapp-btn large" onClick={handleLaunchDApp}>
            🎮 Launch PulsePicksAI
          </button>
          <div className="disclaimer">
            ⚠️ <strong>Testnet Only:</strong> Use testnet funds. High-risk crypto activity. DYOR.
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Wrapper Component
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToLanding = () => {
    navigate('/');
  };

  return <Dashboard onBackToLanding={handleBackToLanding} />;
};

// Main App Component with Router
const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<DashboardPage />} />
          <Route path="/game/:roundId" element={<GameDetails />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;