// File: src/components/Dashboard.tsx
// Dashboard Component for PulsePicksAI

import React, { useState, useEffect } from 'react';
import { createCompetition, getCompetitionCounter } from '../contracts/CompetitionFactory';
import { ethers } from 'ethers';
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
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [isCreatingCompetition, setIsCreatingCompetition] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  
  // Create Competition Form State
  const [competitionForm, setCompetitionForm] = useState({
    title: '',
    investment: '',
    confidence: 50
  });

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
      '0x38': 'BSC',
      '0xfa': 'Fantom',
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  const networks = [
    { name: 'Avalanche Fuji', chainId: '0xa869', rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc', emoji: '🔺' },
    { name: 'Ethereum Sepolia', chainId: '0xaa36a7', rpcUrl: 'https://sepolia.infura.io/v3/YOUR_KEY', emoji: '🔷' },
    { name: 'Base', chainId: '0x2105', rpcUrl: 'https://mainnet.base.org', emoji: '🔵' },
    { name: 'Arbitrum', chainId: '0xa4b1', rpcUrl: 'https://arb1.arbitrum.io/rpc', emoji: '🔷' },
    { name: 'Polygon', chainId: '0x89', rpcUrl: 'https://polygon-rpc.com', emoji: '🟣' },
    { name: 'Optimism', chainId: '0xa', rpcUrl: 'https://mainnet.optimism.io', emoji: '🔴' },
    { name: 'Ethereum', chainId: '0x1', rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY', emoji: '💎' },
    { name: 'Avalanche', chainId: '0xa86a', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', emoji: '⛰️' },
  ];

  const switchNetwork = async (targetChainId: string, rpcUrl: string, networkName: string) => {
    if (!window.ethereum) {
      alert('MetaMask is not installed');
      return;
    }

    setIsSwitchingNetwork(true);
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: targetChainId,
                chainName: networkName,
                rpcUrls: [rpcUrl],
                nativeCurrency: getNetworkCurrency(targetChainId),
                blockExplorerUrls: getBlockExplorer(targetChainId),
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          alert('Failed to add network to MetaMask');
        }
      } else {
        console.error('Error switching network:', switchError);
        alert('Failed to switch network');
      }
    } finally {
      setIsSwitchingNetwork(false);
      setIsNetworkModalOpen(false);
    }
  };

  const getNetworkCurrency = (chainId: string) => {
    const currencies: { [key: string]: any } = {
      '0x1': { name: 'Ether', symbol: 'ETH', decimals: 18 },
      '0x89': { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
      '0xa86a': { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
      '0xa869': { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
      '0xa4b1': { name: 'Ether', symbol: 'ETH', decimals: 18 },
      '0x2105': { name: 'Ether', symbol: 'ETH', decimals: 18 },
      '0xa': { name: 'Ether', symbol: 'ETH', decimals: 18 },
      '0xaa36a7': { name: 'Ether', symbol: 'ETH', decimals: 18 },
    };
    return currencies[chainId] || { name: 'Ether', symbol: 'ETH', decimals: 18 };
  };

  const getBlockExplorer = (chainId: string) => {
    const explorers: { [key: string]: string[] } = {
      '0x1': ['https://etherscan.io'],
      '0x89': ['https://polygonscan.com'],
      '0xa86a': ['https://snowtrace.io'],
      '0xa869': ['https://testnet.snowtrace.io'],
      '0xa4b1': ['https://arbiscan.io'],
      '0x2105': ['https://basescan.org'],
      '0xa': ['https://optimistic.etherscan.io'],
      '0xaa36a7': ['https://sepolia.etherscan.io'],
    };
    return explorers[chainId] || ['https://etherscan.io'];
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

  const closeNetworkModal = () => {
    setIsNetworkModalOpen(false);
  };

  const handleNetworkSwitch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!connectedWallet) {
      alert('Please connect your wallet first');
      return;
    }
    setIsNetworkModalOpen(!isNetworkModalOpen);
  };

  // Close network modal when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isNetworkModalOpen) {
        setIsNetworkModalOpen(false);
      }
    };

    if (isNetworkModalOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isNetworkModalOpen]);

  const handleCreateCompetition = () => {
    if (!connectedWallet) {
      alert('Please connect your wallet first');
      return;
    }
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCompetitionForm({
      title: '',
      investment: '',
      confidence: 50
    });
  };

  const handleFormChange = (field: string, value: string | number) => {
    setCompetitionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitCreateCompetition = async () => {
    if (!window.ethereum || !chainId) {
      alert('Please connect your wallet');
      return;
    }

    if (!competitionForm.title.trim()) {
      alert('Please enter a competition title');
      return;
    }

    if (!competitionForm.investment || parseFloat(competitionForm.investment) <= 0) {
      alert('Please enter a valid investment amount');
      return;
    }

    setIsCreatingCompetition(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Get next competition ID
      const counterResult = await getCompetitionCounter(provider, chainId);
      if (!counterResult.success) {
        throw new Error(counterResult.error);
      }
      
      const nextId = parseInt(counterResult.data.nextId);
      
      // Create competition
      const result = await createCompetition(signer, chainId, {
        competitionId: nextId,
        title: competitionForm.title,
        investment: competitionForm.investment,
        confidence: competitionForm.confidence
      });

      if (result.success) {
        alert(`Competition created successfully! TX: ${result.txHash}`);
        closeCreateModal();
        // TODO: Refresh competitions list
      } else {
        alert(`Failed to create competition: ${result.error}`);
      }
      
    } catch (error: any) {
      console.error('Error creating competition:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsCreatingCompetition(false);
    }
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
          
          {connectedWallet && (
            <div className="network-dropdown">
              <button className="network-btn" onClick={handleNetworkSwitch}>
                <span className="network-icon">⚡</span>
                <span className="network-text">Network</span>
              </button>
              
              {isNetworkModalOpen && (
                <div className="network-popup">
                  <div className="network-popup-header">
                    <span>Select Network</span>
                    <button className="close-btn-small" onClick={closeNetworkModal}>×</button>
                  </div>
                  <div className="network-list">
                    {networks.map((network) => (
                      <button
                        key={network.chainId}
                        className={`network-item ${chainId === network.chainId ? 'current' : ''}`}
                        onClick={() => switchNetwork(network.chainId, network.rpcUrl, network.name)}
                        disabled={isSwitchingNetwork || chainId === network.chainId}
                      >
                        <span className="network-emoji">{network.emoji}</span>
                        <span className="network-name">{network.name}</span>
                        {chainId === network.chainId && (
                          <span className="current-badge">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button className="back-btn" onClick={onBackToLanding}>
            ← Exit
          </button>
        </div>
      </div>
      
      <div className="dashboard-main">
        <div className="page-header">
          <h2>Active Competitions</h2>
          <button className="create-competition-btn" onClick={handleCreateCompetition}>
            + Create Competition
          </button>
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

      {/* Create Competition Modal */}
      {isCreateModalOpen && (
        <div className="wallet-modal-overlay" onClick={closeCreateModal}>
          <div className="create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Competition</h3>
              <button className="close-btn" onClick={closeCreateModal}>×</button>
            </div>
            
            <div className="create-form">
              <div className="form-group">
                <label>Competition Title</label>
                <input
                  type="text"
                  placeholder="e.g. AI Trading Q1 2025"
                  value={competitionForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Investment Amount (BET)</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={competitionForm.investment}
                  onChange={(e) => handleFormChange('investment', e.target.value)}
                  className="form-input"
                  min="0"
                  step="0.01"
                />
                <span className="form-hint">Minimum: 10 BET tokens</span>
              </div>
              
              <div className="form-group">
                <label>Your Confidence Level: {competitionForm.confidence}%</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={competitionForm.confidence}
                  onChange={(e) => handleFormChange('confidence', parseInt(e.target.value))}
                  className="form-slider"
                />
                <div className="slider-labels">
                  <span>1%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  className="cancel-btn" 
                  onClick={closeCreateModal}
                  disabled={isCreatingCompetition}
                >
                  Cancel
                </button>
                <button 
                  className="submit-btn" 
                  onClick={submitCreateCompetition}
                  disabled={isCreatingCompetition}
                >
                  {isCreatingCompetition ? 'Creating...' : 'Create Competition'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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