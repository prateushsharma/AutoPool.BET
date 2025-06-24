// Place this file as: src/pages/Portfolio.tsx

import React from 'react';
import { useWallet } from '../context/WalletContext';

const Portfolio: React.FC = () => {
  const { wallet } = useWallet();

  return (
    <div className="portfolio-page">
      <div className="portfolio-container">
        <div className="portfolio-header">
          <h1>📊 My Portfolio</h1>
          <p>Track your betting performance and manage your strategies</p>
        </div>

        <div className="portfolio-overview">
          <div className="overview-card">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Total Balance</h3>
              <div className="card-value">{wallet?.balance || '0'} ETH</div>
              <div className="card-subtext">Available for betting</div>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">🎯</div>
            <div className="card-content">
              <h3>Active Bets</h3>
              <div className="card-value">0</div>
              <div className="card-subtext">Currently running</div>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <h3>Total Profit</h3>
              <div className="card-value positive">+$0.00</div>
              <div className="card-subtext">All time performance</div>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">🎲</div>
            <div className="card-content">
              <h3>Win Rate</h3>
              <div className="card-value">0%</div>
              <div className="card-subtext">Success percentage</div>
            </div>
          </div>
        </div>

        <div className="coming-soon-section">
          <div className="coming-soon-card">
            <h2>🚧 Portfolio Features Coming Soon</h2>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div>
                  <h4>Detailed Analytics</h4>
                  <p>Track your betting performance with comprehensive charts and metrics</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <div>
                  <h4>Strategy Management</h4>
                  <p>Create, edit, and monitor your automated betting strategies</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📈</span>
                <div>
                  <h4>Performance Tracking</h4>
                  <p>Monitor profits, losses, and ROI across different markets</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌉</span>
                <div>
                  <h4>Cross-Chain Portfolio</h4>
                  <p>View and manage assets across multiple blockchain networks</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <div>
                  <h4>Telegram Notifications</h4>
                  <p>Get real-time updates on your bets and strategy performance</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div>
                  <h4>Risk Management</h4>
                  <p>Set stop-losses, take-profits, and position sizing rules</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;