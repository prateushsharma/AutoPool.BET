// Place this file as: src/components/DashboardHeader.tsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import WalletConnectButton from './WalletConnectButton';
import './DashboardHeader.css';

interface DashboardHeaderProps {
  className?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet } = useWallet();
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
    { path: '/portfolio', label: 'Portfolio', icon: '📊' },
    { path: '/strategies', label: 'Strategies', icon: '🤖' },
    { path: '/history', label: 'History', icon: '📈' }
  ];

  return (
    <header className={`dashboard-header ${className}`}>
      <div className="header-container">
        {/* Logo and Brand */}
        <div className="header-logo" onClick={handleHomeClick}>
          <div className="logo-icon">⚡</div>
          <div className="brand-info">
            <h1 className="brand-name">AI BetHub</h1>
            <span className="brand-tagline">Smart Betting</span>
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
                  <span className="stat-value">{wallet.balance} ETH</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Network</span>
                  <span className="stat-value">{wallet.chainName.split(' ')[0]}</span>
                </div>
              </div>

              {/* Portfolio Button */}
              <button 
                className={`portfolio-btn ${isActivePage('/portfolio') ? 'active' : ''}`}
                onClick={handlePortfolioClick}
              >
                <span className="portfolio-icon">📊</span>
                <span className="portfolio-text">My Portfolio</span>
              </button>

              {/* User Menu */}
              <div className="user-menu-container">
                <button 
                  className="user-menu-trigger"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    <span className="avatar-icon">👤</span>
                  </div>
                  <span className="dropdown-arrow">⌄</span>
                </button>

                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <div className="menu-header">
                      <div className="user-info">
                        <span className="user-address">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
                        <span className="user-network">{wallet.chainName}</span>
                      </div>
                    </div>
                    
                    <div className="menu-items">
                      <button className="menu-item" onClick={handlePortfolioClick}>
                        <span className="menu-icon">📊</span>
                        <span>Portfolio</span>
                      </button>
                      <button className="menu-item" onClick={() => navigate('/settings')}>
                        <span className="menu-icon">⚙️</span>
                        <span>Settings</span>
                      </button>
                      <button className="menu-item" onClick={() => navigate('/help')}>
                        <span className="menu-icon">❓</span>
                        <span>Help</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Wallet Connect */}
          <WalletConnectButton size="medium" />
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn">
          <span className="hamburger-icon">☰</span>
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav className="header-nav mobile-nav">
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

      {/* Close user menu when clicking outside */}
      {showUserMenu && (
        <div 
          className="menu-overlay"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default DashboardHeader;