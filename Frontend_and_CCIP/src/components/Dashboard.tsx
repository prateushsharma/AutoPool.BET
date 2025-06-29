// File: src/components/Dashboard.tsx
// Dashboard Component for PulsePicksAI

import React, { useState, useEffect } from 'react';
import './Dashboard.css';

// Declare ethereum type for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface DashboardProps {
  onBackToLanding: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onBackToLanding }) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    checkWalletConnection();
    setupEventListeners();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnectedWallet('MetaMask');
          setWalletAddress(accounts[0]);
          
          // Get chain ID
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(chainId);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const setupEventListeners = () => {
    if (typeof window.ethereum !== 'undefined') {
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setConnectedWallet(null);
          setWalletAddress(null);
          setChainId(null);
        } else {
          setWalletAddress(accounts[0]);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        setChainId(chainId);
        // Reload page on chain change (recommended by MetaMask)
        window.location.reload();
      });
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install MetaMask and try again.');
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setConnectedWallet('MetaMask');
        setWalletAddress(accounts[0]);
        
        // Get chain ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(chainId);
        
        console.log('Connected to MetaMask:', accounts[0]);
        console.log('Chain ID:', chainId);
      }
    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error);
      if (error.code === 4001) {
        alert('Please connect to MetaMask to continue.');
      } else {
        alert('Failed to connect to MetaMask. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setWalletAddress(null);
    setChainId(null);
  };

  const getChainName = (chainId: string) => {
    const chains: { [key: string]: string } = {
      '0x1': 'Ethereum',
      '0x89': 'Polygon',
      '0xa86a': 'Avalanche',
      '0xa4b1': 'Arbitrum',
      '0x2105': 'Base',
      '0xa': 'Optimism',
      '0xaa36a7': 'Sepolia',
      '0xa869': 'Avalanche Fuji',
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleWalletConnect = () => {
    if (connectedWallet) {
      disconnectWallet();
    } else {
      setIsWalletModalOpen(true);
    }
  };

  const handleWalletSelection = async (walletType: 'metamask' | 'core') => {
    setIsWalletModalOpen(false);
    
    if (walletType === 'metamask') {
      await connectMetaMask();
    } else {
      // Core Wallet connection (placeholder for now)
      alert('Core Wallet integration coming soon!');
    }
  };

  const closeModal = () => {
    setIsWalletModalOpen(false);
  };
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">PulsePicksAI</h1>
          <span className="dashboard-subtitle">AI Strategy Betting Protocol</span>
        </div>
        <div className="header-right">
          <button className="wallet-btn" onClick={handleWalletConnect}>
            {connectedWallet ? (
              <div className="wallet-connected">
                <span className="wallet-status">
                  {connectedWallet} • {chainId ? getChainName(chainId) : 'Unknown'}
                </span>
                <span className="wallet-address">
                  {walletAddress ? formatAddress(walletAddress) : ''}
                </span>
              </div>
            ) : (
              'Connect Wallet'
            )}
          </button>
          <button className="back-btn" onClick={onBackToLanding}>
            ← Exit
          </button>
        </div>
      </div>
      
      <div className="dashboard-main">
        <div className="page-header">
          <h2>Active Competitions</h2>
          <button className="create-competition-btn">+ Create Competition</button>
        </div>
        
        <div className="competitions-grid">
          <div className="competition-card">
            <div className="card-header">
              <h3>AI Trading Q1 2025</h3>
              <span className="status-badge active">Active</span>
            </div>
            <div className="card-content">
              <div className="pool-info">
                <span className="pool-label">Total Pool</span>
                <span className="pool-amount">1,250 BET</span>
              </div>
              <div className="participants-info">
                <span className="participants-label">Participants</span>
                <span className="participants-count">8/20</span>
              </div>
              <div className="creator-info">
                <span className="creator-label">Creator</span>
                <span className="creator-address">0x742d...5B38</span>
              </div>
            </div>
            <button className="join-btn">Join Competition</button>
          </div>

          <div className="competition-card">
            <div className="card-header">
              <h3>DeFi Strategy Master</h3>
              <span className="status-badge active">Active</span>
            </div>
            <div className="card-content">
              <div className="pool-info">
                <span className="pool-label">Total Pool</span>
                <span className="pool-amount">890 BET</span>
              </div>
              <div className="participants-info">
                <span className="participants-label">Participants</span>
                <span className="participants-count">5/15</span>
              </div>
              <div className="creator-info">
                <span className="creator-label">Creator</span>
                <span className="creator-address">0x8f1a...9C22</span>
              </div>
            </div>
            <button className="join-btn">Join Competition</button>
          </div>

          <div className="competition-card">
            <div className="card-header">
              <h3>Crypto Prediction Pro</h3>
              <span className="status-badge closed">Closed</span>
            </div>
            <div className="card-content">
              <div className="pool-info">
                <span className="pool-label">Total Pool</span>
                <span className="pool-amount">2,150 BET</span>
              </div>
              <div className="participants-info">
                <span className="participants-label">Participants</span>
                <span className="participants-count">12/12</span>
              </div>
              <div className="creator-info">
                <span className="creator-label">Creator</span>
                <span className="creator-address">0x3d8b...7F44</span>
              </div>
            </div>
            <button className="join-btn disabled">View Results</button>
          </div>
        </div>
      </div>

      {/* Wallet Selection Modal */}
      {isWalletModalOpen && (
        <div className="wallet-modal-overlay" onClick={closeModal}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect Wallet</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="wallet-options">
              <button 
                className="wallet-option" 
                onClick={() => handleWalletSelection('metamask')}
                disabled={isConnecting}
              >
                <div className="wallet-icon metamask-icon">🦊</div>
                <div className="wallet-info">
                  <span className="wallet-name">MetaMask</span>
                  <span className="wallet-desc">
                    {isConnecting ? 'Connecting...' : 'Connect using browser wallet'}
                  </span>
                </div>
              </button>
              <button 
                className="wallet-option" 
                onClick={() => handleWalletSelection('core')}
              >
                <div className="wallet-icon core-icon">⚡</div>
                <div className="wallet-info">
                  <span className="wallet-name">Core Wallet</span>
                  <span className="wallet-desc">Connect using Core wallet</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;