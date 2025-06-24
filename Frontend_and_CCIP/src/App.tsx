// Place this file as: src/App.tsx (Updated with Dashboard)

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext';
import DashboardHeader from './components/DashboardHeader';
import Home from './pages/Home';
import BetPage from './pages/BetPage';
import Portfolio from './pages/Portfolio';
import WalletConnectButton from './components/WalletConnectButton';
import './App.css';

// Landing page for non-connected users
const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-hero">
          <div className="hero-icon">⚡</div>
          <h1 className="hero-title">AI BetHub</h1>
          <p className="hero-subtitle">
            Next-generation betting powered by artificial intelligence
          </p>
          <p className="hero-description">
            Connect your wallet to access AI-generated markets, automated strategies, 
            and cross-chain betting opportunities.
          </p>
          
          <div className="hero-features">
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <span>AI-Powered Markets</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌉</span>
              <span>Cross-Chain Support</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Smart Strategies</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <span>Telegram Integration</span>
            </div>
          </div>
          
          <div className="hero-cta">
            <WalletConnectButton size="large" />
            <p className="cta-note">
              Connect with MetaMask, WalletConnect, or other Web3 wallets
            </p>
          </div>
        </div>
        
        <div className="landing-stats">
          <div className="stat-card">
            <div className="stat-number">1,247</div>
            <div className="stat-label">Active Markets</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">$2.4M</div>
            <div className="stat-label">Total Volume</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">5,891</div>
            <div className="stat-label">Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">94%</div>
            <div className="stat-label">AI Accuracy</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Protected dashboard layout
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <DashboardHeader />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
};

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { wallet } = useWallet();
  
  if (!wallet?.isConnected) {
    return <LandingPage />;
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
};

// Main App component
const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        
        <Route path="/bet/:marketId" element={
          <ProtectedRoute>
            <BetPage />
          </ProtectedRoute>
        } />
        
        <Route path="/portfolio" element={
          <ProtectedRoute>
            <Portfolio />
          </ProtectedRoute>
        } />
        
        <Route path="/strategies" element={
          <ProtectedRoute>
            <div className="page-placeholder">
              <h2>🤖 AI Strategies</h2>
              <p>Coming soon: Advanced AI betting strategies and automation</p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/history" element={
          <ProtectedRoute>
            <div className="page-placeholder">
              <h2>📈 Betting History</h2>
              <p>Coming soon: Complete betting history and analytics</p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <div className="page-placeholder">
              <h2>⚙️ Settings</h2>
              <p>Coming soon: Platform settings and preferences</p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/help" element={
          <ProtectedRoute>
            <div className="page-placeholder">
              <h2>❓ Help & Support</h2>
              <p>Coming soon: Help documentation and support center</p>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

// Root App with providers
const App: React.FC = () => {
  return (
    <WalletProvider>
      <div className="app">
        <AppContent />
      </div>
    </WalletProvider>
  );
};

export default App;