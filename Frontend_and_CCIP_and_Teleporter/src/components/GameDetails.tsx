// File: src/components/GameDetails.tsx
// Updated GameDetails component to include Join Game Modal and Live Leaderboard

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

import JoinGameModal from './JoinGameModal';
import { getParticipationContractType } from '../utils/networkUtils';
import './GameDetails.css';

// Declare ethereum type for TypeScript
declare global {
 interface Window {
   ethereum?: any;
 }
}

interface GameDetailsData {
 id: string;
 title: string;
 description?: string;
 status: string;
 startingBalance: number;
 duration: number;
 startTime?: string;
 endTime?: string;
 allowedTokens?: string[];
 currentParticipants: number;
 maxParticipants: number;
 stats: {
   totalParticipants: number;
   totalTrades: number;
   totalVolume: number;
   averagePnL?: number;
 };
 settings?: {
   executionInterval: number;
   autoStart: boolean;
   minParticipants: number;
 };
 aiConfig?: {
   strategy?: string;
   gameType?: string;
   riskLevel?: string;
   targetProfitPercent?: number;
 };
}

const GameDetails: React.FC = () => {
 const { roundId } = useParams<{ roundId: string }>();
 const navigate = useNavigate();
 
 const [gameData, setGameData] = useState<GameDetailsData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 
 // Leaderboard State
 const [leaderboard, setLeaderboard] = useState<any[]>([]);
 const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
 const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
 
 // Join Modal State
 const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
 
 // Wallet and Network State
 const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
 const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
 const [walletAddress, setWalletAddress] = useState<string | null>(null);
 const [isConnecting, setIsConnecting] = useState(false);
 const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
 const [chainId, setChainId] = useState<string | null>(null);

const networks = [
  { name: 'Avalanche Fuji', chainId: '0xa869', rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc', emoji: '🔺' },
  { name: 'Ethereum Sepolia', chainId: '0xaa36a7', rpcUrl: 'https://sepolia.infura.io/v3/YOUR_KEY', emoji: '🔷' },
  { name: 'Dispatch L1 Testnet', chainId: '0xbe598', rpcUrl: 'https://subnets.avax.network/dispatch/testnet/rpc', emoji: '🚀' }, // ADDED
  { name: 'Base', chainId: '0x2105', rpcUrl: 'https://mainnet.base.org', emoji: '🔵' },
  { name: 'Arbitrum', chainId: '0xa4b1', rpcUrl: 'https://arb1.arbitrum.io/rpc', emoji: '🔷' },
  { name: 'Polygon', chainId: '0x89', rpcUrl: 'https://polygon-rpc.com', emoji: '🟣' },
  { name: 'Optimism', chainId: '0xa', rpcUrl: 'https://mainnet.optimism.io', emoji: '🔴' },
  { name: 'Ethereum', chainId: '0x1', rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY', emoji: '💎' },
  { name: 'Avalanche', chainId: '0xa86a', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', emoji: '⛰️' },
];

 useEffect(() => {
   if (roundId) {
     fetchGameDetails(roundId);
   }
   checkWalletConnection();
   setupEventListeners();
 }, [roundId]);

 // Auto-refresh leaderboard for active/running/finished games
 useEffect(() => {
   if (gameData && (gameData.status === 'active' || gameData.status === 'running' || gameData.status === 'finished')) {
     fetchLeaderboard(gameData.id);
     
     // Set up auto-refresh for active/running games
     if (gameData.status === 'active' || gameData.status === 'running') {
       const interval = setInterval(() => {
         fetchLeaderboard(gameData.id);
       }, 10000); // Refresh every 10 seconds
       
       return () => clearInterval(interval);
     }
   }
 }, [gameData]);

 const checkWalletConnection = async () => {
   if (typeof window.ethereum !== 'undefined') {
     try {
       const accounts = await window.ethereum.request({ method: 'eth_accounts' });
       if (accounts.length > 0) {
         setConnectedWallet('MetaMask');
         setWalletAddress(accounts[0]);
         
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
     window.ethereum.on('accountsChanged', (accounts: string[]) => {
       if (accounts.length === 0) {
         setConnectedWallet(null);
         setWalletAddress(null);
         setChainId(null);
       } else {
         setWalletAddress(accounts[0]);
       }
     });

     window.ethereum.on('chainChanged', (chainId: string) => {
       setChainId(chainId);
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
     const accounts = await window.ethereum.request({
       method: 'eth_requestAccounts',
     });

     if (accounts.length > 0) {
       setConnectedWallet('MetaMask');
       setWalletAddress(accounts[0]);
       
       const chainId = await window.ethereum.request({ method: 'eth_chainId' });
       setChainId(chainId);
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
    '0xbe598': 'Dispatch L1', 
  };
  return chains[chainId] || `Chain ${chainId}`;
};

 const switchNetwork = async (targetChainId: string, rpcUrl: string, networkName: string) => {
   if (!window.ethereum) {
     alert('MetaMask is not installed');
     return;
   }

   setIsSwitchingNetwork(true);
   try {
     await window.ethereum.request({
       method: 'wallet_switchEthereumChain',
       params: [{ chainId: targetChainId }],
     });
   } catch (switchError: any) {
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
    '0xbe598': { name: 'Dispatch L1', symbol: 'DIS', decimals: 18 },
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
    '0xbe598': ['https://subnets.avax.network/dispatch'],
  };
  return explorers[chainId] || ['https://etherscan.io'];
};

 const formatAddress = (address: string) => {
   return `${address.slice(0, 6)}...${address.slice(-4)}`;
 };

 const handleWalletConnect = () => {
   if (connectedWallet) {
     setConnectedWallet(null);
     setWalletAddress(null);
     setChainId(null);
   } else {
     connectMetaMask();
   }
 };

 const handleNetworkSwitch = (e: React.MouseEvent) => {
   e.stopPropagation();
   if (!connectedWallet) {
     alert('Please connect your wallet first');
     return;
   }
   setIsNetworkModalOpen(!isNetworkModalOpen);
 };

 const closeNetworkModal = () => {
   setIsNetworkModalOpen(false);
 };

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

 const fetchGameDetails = async (roundId: string) => {
   setLoading(true);
   setError(null);
   
   try {
     console.log('Fetching game details for:', roundId);
     
     const response = await fetch('http://localhost:5000/api/game/get-round', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ roundId })
     });

     const result = await response.json();

     if (result.success && result.round) {
       setGameData(result.round);
       console.log('Game details loaded:', result.round);
     } else {
       setError(result.error || 'Failed to load game details');
     }
   } catch (error: any) {
     console.error('Error fetching game details:', error);
     setError('Unable to connect to game server');
   } finally {
     setLoading(false);
   }
 };

 const fetchLeaderboard = async (roundId: string) => {
   setLoadingLeaderboard(true);
   setLeaderboardError(null);
   
   try {
     console.log('Fetching leaderboard for:', roundId);
     
     const response = await fetch('http://localhost:5000/api/game/get-enhanced-leaderboard', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ 
         roundId: roundId,
         limit: 20
       })
     });

     const result = await response.json();

     if (result.success && result.leaderboard) {
       setLeaderboard(result.leaderboard);
       console.log('Leaderboard loaded:', result.leaderboard);
     } else {
       setLeaderboardError(result.error || 'Failed to load leaderboard');
       setLeaderboard([]);
     }
   } catch (error: any) {
     console.error('Error fetching leaderboard:', error);
     setLeaderboardError('Unable to connect to game server');
     setLeaderboard([]);
   } finally {
     setLoadingLeaderboard(false);
   }
 };

 const handleBackToDashboard = () => {
   navigate('/home');
 };

 const handleJoinGameClick = () => {
   if (!connectedWallet) {
     alert('Please connect your wallet first');
     return;
   }

   if (!chainId) {
     alert('Unable to detect network');
     return;
   }

   const participationType = getParticipationContractType(chainId);
   
   if (participationType === 'unsupported') {
     alert(`Network ${getChainName(chainId)} is not supported yet. Please switch to Avalanche Fuji or Ethereum Sepolia.`);
     return;
   }

   setIsJoinModalOpen(true);
 };

 const getWalletProvider = () => {
   if (!window.ethereum) return null;
   return new ethers.providers.Web3Provider(window.ethereum);
 };

 const getWalletSigner = () => {
   const provider = getWalletProvider();
   if (!provider) return null;
   return provider.getSigner();
 };

 const getStatusColor = (status: string) => {
   switch (status.toLowerCase()) {
     case 'active': return '#22c55e';
     case 'waiting': return '#f59e0b';
     case 'running': return '#3b82f6';
     case 'finished': return '#6b7280';
     case 'cancelled': return '#ef4444';
     default: return '#9ca3af';
   }
 };

 const formatDuration = (ms: number) => {
   const seconds = Math.floor(ms / 1000);
   const minutes = Math.floor(seconds / 60);
   const hours = Math.floor(minutes / 60);
   
   if (hours > 0) {
     return `${hours}h ${minutes % 60}m`;
   } else if (minutes > 0) {
     return `${minutes}m ${seconds % 60}s`;
   } else {
     return `${seconds}s`;
   }
 };

 const formatTime = (timeString?: string) => {
   if (!timeString) return 'Not set';
   return new Date(timeString).toLocaleString();
 };

 if (loading) {
   return (
     <div className="game-details-container">
       <div className="loading-screen">
         <div className="loading-spinner"></div>
         <p>Loading game details...</p>
       </div>
     </div>
   );
 }

 if (error) {
   return (
     <div className="game-details-container">
       <div className="error-screen">
         <h2>❌ Error Loading Game</h2>
         <p>{error}</p>
         <button className="back-btn" onClick={handleBackToDashboard}>
           ← Back to Dashboard
         </button>
       </div>
     </div>
   );
 }

 if (!gameData) {
   return (
     <div className="game-details-container">
       <div className="error-screen">
         <h2>Game Not Found</h2>
         <p>The requested game could not be found.</p>
         <button className="back-btn" onClick={handleBackToDashboard}>
           ← Back to Dashboard
         </button>
       </div>
     </div>
   );
 }

 const provider = getWalletProvider();
 const signer = getWalletSigner();

 return (
   <div className="game-details-container">
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
         
         <button className="back-btn" onClick={handleBackToDashboard}>
           ← Back to Dashboard
         </button>
       </div>
     </div>

     <div className="game-details-header">
       <div className="header-info">
         <h1 className="game-title">{gameData.title}</h1>
         <div className="status-badge" style={{ backgroundColor: getStatusColor(gameData.status) }}>
           {gameData.status.toUpperCase()}
         </div>
       </div>
     </div>

     <div className="game-details-content">
       <div className="details-grid">
         <div className="details-card overview-card">
           <h3>📋 Game Overview</h3>
           <div className="detail-item">
             <span className="label">Game ID:</span>
             <span className="value mono">{gameData.id}</span>
           </div>
           {gameData.description && (
             <div className="detail-item">
               <span className="label">Description:</span>
               <span className="value">{gameData.description}</span>
             </div>
           )}
           <div className="detail-item">
             <span className="label">Starting Balance:</span>
             <span className="value">${gameData.startingBalance}</span>
           </div>
           <div className="detail-item">
             <span className="label">Duration:</span>
             <span className="value">{formatDuration(gameData.duration)}</span>
           </div>
           <div className="detail-item">
             <span className="label">Start Time:</span>
             <span className="value">{formatTime(gameData.startTime)}</span>
           </div>
           <div className="detail-item">
             <span className="label">End Time:</span>
             <span className="value">{formatTime(gameData.endTime)}</span>
           </div>
         </div>

         <div className="details-card participants-card">
           <h3>👥 Participants</h3>
           <div className="participants-stats">
             <div className="stat-item">
               <span className="stat-label">Current</span>
               <span className="stat-value">{gameData.currentParticipants}</span>
             </div>
             <div className="stat-divider">/</div>
             <div className="stat-item">
               <span className="stat-label">Maximum</span>
               <span className="stat-value">{gameData.maxParticipants}</span>
             </div>
           </div>
           {gameData.settings && (
             <div className="detail-item">
               <span className="label">Minimum to Start:</span>
               <span className="value">{gameData.settings.minParticipants}</span>
             </div>
           )}
           <div className="progress-bar">
             <div 
               className="progress-fill"
               style={{ 
                 width: `${(gameData.currentParticipants / gameData.maxParticipants) * 100}%` 
               }}
             ></div>
           </div>
         </div>

         <div className="details-card stats-card">
           <h3>📊 Trading Statistics</h3>
           <div className="detail-item">
             <span className="label">Total Trades:</span>
             <span className="value">{gameData.stats.totalTrades}</span>
           </div>
           <div className="detail-item">
             <span className="label">Total Volume:</span>
             <span className="value">${gameData.stats.totalVolume.toFixed(2)}</span>
           </div>
           {gameData.stats.averagePnL !== undefined && (
             <div className="detail-item">
               <span className="label">Average P&L:</span>
               <span className={`value ${gameData.stats.averagePnL >= 0 ? 'positive' : 'negative'}`}>
                 {gameData.stats.averagePnL >= 0 ? '+' : ''}{gameData.stats.averagePnL.toFixed(2)}%
               </span>
             </div>
           )}
         </div>

         {gameData.allowedTokens && (
           <div className="details-card tokens-card">
             <h3>🪙 Allowed Tokens</h3>
             <div className="tokens-list">
               {gameData.allowedTokens.map((token, index) => (
                 <span key={index} className="token-tag">{token}</span>
               ))}
             </div>
           </div>
         )}

         {gameData.aiConfig && (
           <div className="details-card ai-config-card">
             <h3>🤖 AI Configuration</h3>
             {gameData.aiConfig.strategy && (
               <div className="detail-item">
                 <span className="label">Strategy:</span>
                 <span className="value">{gameData.aiConfig.strategy}</span>
               </div>
             )}
             {gameData.aiConfig.gameType && (
               <div className="detail-item">
                 <span className="label">Game Type:</span>
                 <span className="value">{gameData.aiConfig.gameType}</span>
               </div>
             )}
             {gameData.aiConfig.riskLevel && (
               <div className="detail-item">
                 <span className="label">Risk Level:</span>
                 <span className="value">{gameData.aiConfig.riskLevel}</span>
               </div>
             )}
             {gameData.aiConfig.targetProfitPercent && (
               <div className="detail-item">
                 <span className="label">Target Profit:</span>
                 <span className="value">{gameData.aiConfig.targetProfitPercent}%</span>
               </div>
             )}
           </div>
         )}

         {gameData.settings && (
           <div className="details-card settings-card">
             <h3>⚙️ Game Settings</h3>
             <div className="detail-item">
               <span className="label">Execution Interval:</span>
               <span className="value">{gameData.settings.executionInterval / 1000}s</span>
             </div>
             <div className="detail-item">
               <span className="label">Auto Start:</span>
               <span className="value">{gameData.settings.autoStart ? 'Yes' : 'No'}</span>
             </div>
           </div>
         )}
       </div>

       <div className="action-buttons">
         {gameData.status === 'waiting' && (
           <button 
             className="join-game-btn"
             onClick={handleJoinGameClick}
             disabled={!connectedWallet}
           >
             {!connectedWallet ? '🔒 Connect Wallet to Join' : '🎮 Join Game'}
           </button>
         )}
         {gameData.status === 'active' && (
           <button className="view-live-btn">
             📈 View Live Trading
           </button>
         )}
         <button className="refresh-btn" onClick={() => fetchGameDetails(gameData.id)}>
           🔄 Refresh
         </button>
         {(gameData.status === 'active' || gameData.status === 'running' || gameData.status === 'finished') && (
           <button 
             className="refresh-btn" 
             onClick={() => fetchLeaderboard(gameData.id)}
             disabled={loadingLeaderboard}
           >
             {loadingLeaderboard ? '📊 Loading...' : '📊 Refresh Leaderboard'}
           </button>
         )}
       </div>

       {(gameData.status === 'active' || gameData.status === 'running' || gameData.status === 'finished') && (
         <div className="leaderboard-container">
           <div className="leaderboard-header-section">
             <h2>🏆 Live Leaderboard</h2>
             <div className="leaderboard-status">
               {gameData.status === 'active' || gameData.status === 'running' ? (
                 <span className="live-indicator">🔴 LIVE</span>
               ) : (
                 <span className="final-indicator">✅ FINAL</span>
               )}
             </div>
           </div>

           {loadingLeaderboard ? (
             <div className="leaderboard-loading">
               <div className="loading-spinner"></div>
               <p>Loading leaderboard...</p>
             </div>
           ) : leaderboardError ? (
             <div className="leaderboard-error">
               <p>❌ {leaderboardError}</p>
               <button 
                 className="retry-btn" 
                 onClick={() => fetchLeaderboard(gameData.id)}
               >
                 🔄 Retry
               </button>
             </div>
           ) : leaderboard.length > 0 ? (
             <div className="leaderboard-table">
               <div className="leaderboard-table-header">
                 <div className="rank-col">Rank</div>
                 <div className="player-col">Player</div>
                 <div className="pnl-col">P&L</div>
                 <div className="value-col">Portfolio</div>
                 <div className="trades-col">Trades</div>
                 <div className="winrate-col">Win Rate</div>
                 <div className="grade-col">Grade</div>
               </div>
               <div className="leaderboard-table-body">
                 {leaderboard.map((participant, index) => (
                   <div key={participant.walletAddress} className="leaderboard-row">
                     <div className="rank-col">
                       <span className={`rank-badge rank-${participant.rank <= 3 ? participant.rank : 'other'}`}>
                         #{participant.rank}
                       </span>
                     </div>
                     <div className="player-col">
                       <div className="player-info">
                         <span className="username">{participant.username}</span>
                         <span className="wallet-address">
                           {participant.walletAddress.slice(0, 6)}...{participant.walletAddress.slice(-4)}
                         </span>
                       </div>
                     </div>
                     <div className="pnl-col">
                       <span className={`pnl-value ${participant.pnlPercentage >= 0 ? 'positive' : 'negative'}`}>
                         {participant.pnlPercentage >= 0 ? '+' : ''}{participant.pnlPercentage.toFixed(2)}%
                       </span>
                       <span className="pnl-amount">
                         ${participant.pnl >= 0 ? '+' : ''}{participant.pnl.toFixed(2)}
                       </span>
                     </div>
                     <div className="value-col">
                       <span className="portfolio-value">${participant.totalValue.toFixed(2)}</span>
                     </div>
                     <div className="trades-col">
                       <span className="trades-count">{participant.trades}</span>
                     </div>
                     <div className="winrate-col">
                       <span className="winrate-value">{participant.winRate.toFixed(1)}%</span>
                     </div>
                     <div className="grade-col">
                       {participant.grade && (
                         <span className={`grade-badge grade-${participant.grade.toLowerCase()}`}>
                           {participant.grade}
                         </span>
                       )}
                       {participant.profitScore && (
                         <span className="profit-score">
                           {participant.profitScore.toFixed(2)}x
                         </span>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           ) : (
             <div className="no-leaderboard">
               <p>📊 No participant data available yet</p>
               <p>Leaderboard will appear once trading begins</p>
             </div>
           )}
         </div>
       )}
     </div>

     {isJoinModalOpen && provider && signer && walletAddress && chainId && (
       <JoinGameModal
         isOpen={isJoinModalOpen}
         onClose={() => setIsJoinModalOpen(false)}
         gameData={{
           id: gameData.id,
           title: gameData.title,
           startingBalance: gameData.startingBalance,
           currentParticipants: gameData.currentParticipants,
           maxParticipants: gameData.maxParticipants
         }}
         walletAddress={walletAddress}
         chainId={chainId}
         provider={provider}
         signer={signer}
       />
     )}
   </div>
 );
};

export default GameDetails;