// File: src/App.tsx
// PulsePicksAI Landing Page Component

import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'dashboard'>('landing');

  const handleLaunchDApp = () => {
    setCurrentPage('dashboard');
  };

  const handleBackToLanding = () => {
    setCurrentPage('landing');
  };

  if (currentPage === 'dashboard') {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <button className="back-btn" onClick={handleBackToLanding}>
            ← Back to Landing
          </button>
          <h1>PulsePicksAI Dashboard</h1>
        </div>
        <div className="dashboard-content">
          <h2>Dashboard Coming Soon...</h2>
          <p>This will be the main dashboard with betting pools</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-container">
      <div className="landing-content">
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
              <h3>Cross-Chain</h3>
              <p>Participate from Ethereum, Avalanche, or Dispatch Chain</p>
            </div>
            <div className="feature-card">
              <h3>AI-Powered</h3>
              <p>Strategies evaluated by advanced AI scoring systems</p>
            </div>
            <div className="feature-card">
              <h3>Creator-Competitor</h3>
              <p>Pool creators must participate with their own strategies</p>
            </div>
            <div className="feature-card">
              <h3>Confidence Rewards</h3>
              <p>Rewards based on investment × AI score × confidence</p>
            </div>
          </div>

          <button className="launch-dapp-btn" onClick={handleLaunchDApp}>
            Launch dApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;