// Place this file as: src/components/DashboardHeader.tsx (Updated for PulsePicksAI)

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import WalletConnectButton from './WalletConnectButton';
import './DashboardHeader.css';

interface DashboardHeaderProps {
  className?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, disconnectWallet } = useWallet();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActivePage = (path: string): boolean => {
    return location.pathname === path;
  };

  const handlePortfolioClick = () => {
    navigate('/portfolio');
    setShowUserMenu(false);
  };

  const handleHomeClick = () => {
    navigate('/');
    setShowUserMenu(false);
  };

  const navigationItems = [
    { path: '/', label: 'Markets', icon: '🎯' },
    { path: '/strategies', label: 'Strategies', icon: '🤖' },
    { path: '/amm', label: 'AMM Pools', icon: '📊' },
    { path: '/portfolio', label: 'Portfolio', icon: '💼' }
  ];

  return (
    <header className={`dashboard-header ${className}`}>
      <div className="header-container">
        {/* Logo and Brand */}
        <div className="header-logo" onClick={handleHomeClick}>
          <div className="logo-icon">⚡</div>
          <div className="brand-info">
            <h1 className="brand-name">PulsePicksAI</h1>
            <span className="brand-tagline">AI Betting Protocol</span>
          </div>
        </div>

        {/* Navigation (Desktop) */}
        <nav className="header-nav desktop-nav">
          {navigationItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${isActivePage(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right Section */}
        <div className="header-right">
          {wallet?.isConnected && (
            <>
              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="stat-item">
                  <span className="stat-label">Balance</span>
                  <span className="stat-value">{wallet.balance} AVAX</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Network</span>
                  <span className="stat-value">Avalanche</span>
                </div>
              </div>

              {/* User Menu */}
              <div className="user-menu-container">
                <button 
                  className="user-menu-trigger"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    {wallet.address ? wallet.address.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                  <span className="dropdown-arrow">▼</span>
                </button>

                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <div className="menu-header">
                      <div className="user-info">
                        <span className="user-address">
                          {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Unknown'}
                        </span>
                        <span className="user-network">Avalanche Network</span>
                      </div>
                    </div>

                    <div className="menu-items">
                      <button 
                        className={`menu-item ${isActivePage('/portfolio') ? 'active' : ''}`}
                        onClick={handlePortfolioClick}
                      >
                        <span className="menu-icon">💼</span>
                        <span className="menu-text">My Bets</span>
                      </button>
                      
                      <button 
                        className="menu-item"
                        onClick={() => {
                          navigate('/strategies');
                          setShowUserMenu(false);
                        }}
                      >
                        <span className="menu-icon">🤖</span>
                        <span className="menu-text">My Strategies</span>
                      </button>
                      
                      <button 
                        className="menu-item"
                        onClick={() => {
                          navigate('/amm');
                          setShowUserMenu(false);
                        }}
                      >
                        <span className="menu-icon">📊</span>
                        <span className="menu-text">LP Positions</span>
                      </button>
                      
                      <button 
                        className="menu-item"
                        onClick={() => {
                          navigate('/settings');
                          setShowUserMenu(false);
                        }}
                      >
                        <span className="menu-icon">⚙️</span>
                        <span className="menu-text">Settings</span>
                      </button>
                      
                      <div className="menu-divider"></div>
                      
                      <button 
                        className="menu-item disconnect"
                        onClick={() => {
                          disconnectWallet();
                          setShowUserMenu(false);
                        }}
                      >
                        <span className="menu-icon">🔌</span>
                        <span className="menu-text">Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {!wallet?.isConnected && (
            <WalletConnectButton className="connect-wallet-btn" />
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="mobile-nav">
        {navigationItems.map(item => (
          <button
            key={item.path}
            className={`nav-item ${isActivePage(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
};

export default DashboardHeader;