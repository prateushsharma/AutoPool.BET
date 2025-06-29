// File: src/App.tsx
// PulsePicksAI Main App Component with React Router

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
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