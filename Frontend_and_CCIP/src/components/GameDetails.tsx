// File: src/components/GameDetails.tsx
// Game Details Page Component for PulsePicksAI

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './GameDetails.css';

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

  useEffect(() => {
    if (roundId) {
      fetchGameDetails(roundId);
    }
  }, [roundId]);

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

  const handleBackToDashboard = () => {
    navigate('/home');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#22c55e';
      case 'waiting': return '#f59e0b';
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

  return (
    <div className="game-details-container">
      <div className="game-details-header">
        <button className="back-btn" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <div className="header-info">
          <h1 className="game-title">{gameData.title}</h1>
          <div className="status-badge" style={{ backgroundColor: getStatusColor(gameData.status) }}>
            {gameData.status.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="game-details-content">
        <div className="details-grid">
          {/* Game Overview */}
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

          {/* Participants */}
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

          {/* Trading Stats */}
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

          {/* Allowed Tokens */}
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

          {/* AI Configuration */}
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

          {/* Game Settings */}
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

        {/* Action Buttons */}
        <div className="action-buttons">
          {gameData.status === 'waiting' && (
            <button className="join-game-btn">
              🎮 Join Game
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
        </div>
      </div>
    </div>
  );
};

export default GameDetails;