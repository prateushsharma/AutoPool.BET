// File: src/components/JoinGameModal.tsx
// Join Game Modal Component with cost calculation and dual transactions

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getParticipationCost, joinCompetitionWithETH, ParticipationCost } from '../contracts/SepoliaParticipation';
import { generateUsername, isCrossChainParticipation, getParticipationContractType, formatCurrency } from '../utils/networkUtils';
import './JoinGameModal.css';

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameData: {
    id: string;
    title: string;
    startingBalance: number;
    currentParticipants: number;
    maxParticipants: number;
  };
  walletAddress: string;
  chainId: string;
  provider: ethers.providers.Provider;
  signer: ethers.Signer;
}

const JoinGameModal: React.FC<JoinGameModalProps> = ({
  isOpen,
  onClose,
  gameData,
  walletAddress,
  chainId,
  provider,
  signer
}) => {
  // Form state
  const [investmentAmount, setInvestmentAmount] = useState('0.1');
  const [confidence, setConfidence] = useState(75);
  const [strategy, setStrategy] = useState('');
  
  // Cost calculation state
  const [costData, setCostData] = useState<ParticipationCost | null>(null);
  const [loadingCost, setLoadingCost] = useState(false);
  const [costError, setCostError] = useState<string | null>(null);
  
  // Transaction state
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  
  // User balance state
  const [userBalance, setUserBalance] = useState<string>('0');
  
  // Generate username
  const username = generateUsername(walletAddress, chainId);
  const participationType = getParticipationContractType(chainId);
  const isCrossChain = isCrossChainParticipation(chainId);
  
  // Extract competition ID from game ID
  const extractCompetitionId = (gameId: string): number => {
    const parts = gameId.split('_');
    const timestamp = parts[1];
    return parseInt(timestamp.slice(-4));
  };
  
  const competitionId = extractCompetitionId(gameData.id);

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await provider.getBalance(walletAddress);
        setUserBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };
    
    if (isOpen && walletAddress && provider) {
      fetchBalance();
    }
  }, [isOpen, walletAddress, provider]);

  // Real-time cost calculation
  useEffect(() => {
    const calculateCost = async () => {
      if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
        setCostData(null);
        setCostError(null);
        return;
      }
      
      // Only calculate cost for cross-chain participation (Sepolia)
      if (participationType !== 'sepolia') {
        setCostData(null);
        setCostError(null);
        return;
      }
      
      setLoadingCost(true);
      setCostError(null);
      
      try {
        const result = await getParticipationCost(provider, investmentAmount);
        
        if (result.success && result.data) {
          setCostData(result.data as ParticipationCost);
        } else {
          setCostError(result.error || 'Failed to calculate cost');
          setCostData(null);
        }
      } catch (error: any) {
        setCostError(error.message);
        setCostData(null);
      } finally {
        setLoadingCost(false);
      }
    };
    
    // Debounce cost calculation
    const timer = setTimeout(calculateCost, 500);
    return () => clearTimeout(timer);
  }, [investmentAmount, provider, participationType]);

  // Check if user can afford participation
  const canAfford = () => {
    if (!costData || !userBalance) return false;
    return parseFloat(userBalance) >= parseFloat(costData.totalCostEth);
  };

  // Validate form
  const isFormValid = () => {
    return (
      investmentAmount &&
      parseFloat(investmentAmount) > 0 &&
      confidence >= 1 &&
      confidence <= 100 &&
      strategy.trim().length > 0 &&
      (participationType !== 'sepolia' || canAfford())
    );
  };

  // Handle join competition
  const handleJoinCompetition = async () => {
    if (!isFormValid()) {
      setJoinError('Please fill all required fields correctly');
      return;
    }
    
    setIsJoining(true);
    setJoinError(null);
    setJoinSuccess(false);
    
    try {
      console.log('=== STARTING JOIN COMPETITION FLOW ===');
      
      // Step 1: Join competition on blockchain
      console.log('Step 1: Blockchain transaction...');
      
      let blockchainResult;
      
      if (participationType === 'sepolia') {
        // Cross-chain participation via Sepolia
        blockchainResult = await joinCompetitionWithETH(signer, {
          competitionId: competitionId,
          confidence: confidence,
          investmentEth: investmentAmount
        });
      } else if (participationType === 'native') {
        // Native Avalanche participation (to be implemented)
        throw new Error('Native Avalanche participation not yet implemented in this modal');
      } else {
        throw new Error(`Unsupported network: ${chainId}`);
      }
      
      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error || 'Blockchain transaction failed');
      }
      
      console.log('✅ Blockchain transaction successful:', blockchainResult.txHash);
      
      // Step 2: Register with trading agent API
      console.log('Step 2: Trading agent registration...');
      
      const apiResponse = await fetch('http://localhost:5000/api/game/join-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId: gameData.id,
          walletAddress: walletAddress,
          strategy: strategy.trim(),
          username: username
        })
      });
      
      const apiResult = await apiResponse.json();
      
      if (!apiResult.success) {
        console.warn('⚠️ API registration failed:', apiResult.error);
        // Continue anyway since blockchain transaction succeeded
      } else {
        console.log('✅ Trading agent registration successful');
      }
      
      // Success!
      setJoinSuccess(true);
      console.log('🎉 JOIN COMPETITION COMPLETED SUCCESSFULLY');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        // Refresh page to show updated game state
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Join competition failed:', error);
      setJoinError(error.message || 'Failed to join competition');
    } finally {
      setIsJoining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="join-modal-overlay" onClick={onClose}>
      <div className="join-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🎮 Join Competition</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {/* Game Info */}
        <div className="game-info-section">
          <div className="game-info-item">
            <span className="label">Game:</span>
            <span className="value">{gameData.title}</span>
          </div>
          <div className="game-info-item">
            <span className="label">Participants:</span>
            <span className="value">{gameData.currentParticipants}/{gameData.maxParticipants}</span>
          </div>
          <div className="game-info-item">
            <span className="label">Username:</span>
            <span className="value mono">{username}</span>
          </div>
          <div className="game-info-item">
            <span className="label">Network:</span>
            <span className="value">{isCrossChain ? '🔗 Cross-Chain' : '🏠 Native'}</span>
          </div>
        </div>

        {/* Form */}
        <div className="join-form">
          {/* Investment Amount */}
          <div className="form-group">
            <label>Investment Amount (ETH)</label>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              className="form-input"
              placeholder="0.1"
              min="0"
              step="0.001"
            />
            <div className="balance-info">
              Balance: {formatCurrency(userBalance, 'ETH')}
            </div>
          </div>

          {/* Cost Breakdown (Cross-chain only) */}
          {participationType === 'sepolia' && (
            <div className="cost-breakdown">
              <h4>💰 Cost Breakdown</h4>
              {loadingCost ? (
                <div className="loading-cost">Calculating...</div>
              ) : costError ? (
                <div className="cost-error">❌ {costError}</div>
              ) : costData ? (
                <div className="cost-details">
                  <div className="cost-item">
                    <span>Investment:</span>
                    <span>{formatCurrency(costData.actualParticipationEth, 'ETH')}</span>
                  </div>
                  <div className="cost-item">
                    <span>CCIP Fee:</span>
                    <span>{formatCurrency(costData.ccipFeeEth, 'ETH')}</span>
                  </div>
                  <div className="cost-item total">
                    <span><strong>Total Required:</strong></span>
                    <span><strong>{formatCurrency(costData.totalCostEth, 'ETH')}</strong></span>
                  </div>
                  {!canAfford() && (
                    <div className="insufficient-balance">
                      ⚠️ Insufficient balance
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Confidence Slider */}
          <div className="form-group">
            <label>Confidence Level: {confidence}%</label>
            <input
              type="range"
              min="1"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="form-slider"
            />
            <div className="slider-labels">
              <span>1%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Strategy */}
          <div className="form-group">
            <label>Trading Strategy</label>
            <textarea
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="form-textarea"
              placeholder="Describe your trading strategy (e.g., Buy ETH when volume spikes 20%, sell at 5% profit or 2% loss)"
              rows={3}
            />
            <div className="form-hint">
              This strategy will be evaluated by AI and used for automated trading
            </div>
          </div>

          {/* Error Display */}
          {joinError && (
            <div className="error-message">
              ❌ {joinError}
            </div>
          )}

          {/* Success Display */}
          {joinSuccess && (
            <div className="success-message">
              🎉 Successfully joined competition! Redirecting...
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              className="cancel-btn" 
              onClick={onClose}
              disabled={isJoining}
            >
              Cancel
            </button>
            <button 
              className="join-btn" 
              onClick={handleJoinCompetition}
              disabled={!isFormValid() || isJoining || joinSuccess}
            >
              {isJoining ? (
                '🔄 Joining...'
              ) : participationType === 'sepolia' ? (
                `🚀 Join (${costData ? formatCurrency(costData.totalCostEth, 'ETH') : '...'} total)`
              ) : (
                '🎮 Join Competition'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinGameModal;