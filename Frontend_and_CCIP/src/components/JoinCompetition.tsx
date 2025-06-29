// FILE: src/components/JoinCompetition.tsx
// PLACE: Create this file in src/components/ directory

import React, { useState, useEffect } from 'react';
import { Users, Zap, Clock, TrendingUp, ArrowRight, Globe } from 'lucide-react';
import { useContract } from '../contexts/ContractContext';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACT_ADDRESSES } from '../config/contracts';

interface JoinForm {
  investment: string;
  strategy: string;
  confidence: number;
}

const JoinCompetition: React.FC = () => {
  const { competitions, joinCompetition, calculateRewards, getCompetitionDetails } = useContract();
  const { isConnected, chainId, getCurrentChain, formatTokenAmount } = useWallet();
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [joinForm, setJoinForm] = useState<JoinForm>({
    investment: '',
    strategy: '',
    confidence: 50
  });
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [competitionDetails, setCompetitionDetails] = useState<any>(null);

  const activeCompetitions = competitions.filter(comp => comp.isActive && !comp.isSettled);

  useEffect(() => {
    if (selectedCompetition) {
      loadCompetitionDetails(selectedCompetition.id);
    }
  }, [selectedCompetition]);

  const loadCompetitionDetails = async (competitionId: number): Promise<void> => {
    try {
      const details = await getCompetitionDetails(competitionId);
      setCompetitionDetails(details);
    } catch (error) {
      console.error('Failed to load competition details:', error);
    }
  };

  const handleJoin = async (): Promise<void> => {
    if (!selectedCompetition || !joinForm.investment || !joinForm.strategy.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsJoining(true);
    try {
      const receipt = await joinCompetition(
        selectedCompetition.id,
        joinForm.investment,
        joinForm.strategy.trim(),
        chainId!
      );

      console.log('Joined competition:', receipt);
      
      setJoinForm({
        investment: '',
        strategy: '',
        confidence: 50
      });
      
      if (receipt.crossChain) {
        alert(`Cross-chain participation initiated! Your transaction will arrive in approximately ${
          Math.round((receipt.estimatedArrival! - Date.now()) / 1000 / 60)
        } minutes.`);
      } else {
        alert('Successfully joined competition!');
      }
      
      loadCompetitionDetails(selectedCompetition.id);
    } catch (error) {
      console.error('Failed to join competition:', error);
      alert('Failed to join competition: ' + (error as Error).message);
    } finally {
      setIsJoining(false);
    }
  };

  const getChainInfo = (chainId: number) => {
    const chain = Object.values(CONTRACT_ADDRESSES).find(c => c.chainId === chainId);
    return chain || { name: 'Unknown', chainId };
  };

  const getJoinSpeed = (fromChainId: number) => {
    if (fromChainId === 43113) return { time: '~2s', cost: '$0.05', type: 'Direct' };
    if (fromChainId === 11155111) return { time: '~15m', cost: '$3-5', type: 'CCIP' };
    if (fromChainId === 779672) return { time: '~5s', cost: '$0.01', type: 'Teleporter' };
    return { time: '?', cost: '?', type: 'Unknown' };
  };

  const estimatedRewards = selectedCompetition && joinForm.investment ? 
    calculateRewards(
      parseFloat(selectedCompetition.totalPool || 0) + parseFloat(joinForm.investment),
      parseFloat(joinForm.investment),
      joinForm.confidence
    ) : null;

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400">Connect your wallet to join AI strategy competitions</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Join AI Strategy Competition</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Choose an active competition and submit your investment strategy. 
          Join from any supported chain with automatic cross-chain bridging.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(CONTRACT_ADDRESSES).map((chain) => {
          const speedInfo = getJoinSpeed(chain.chainId);
          const isCurrentChain = chainId === chain.chainId;
          
          return (
            <div
              key={chain.chainId}
              className={`p-4 rounded-lg border transition-all ${
                isCurrentChain
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">{chain.name}</h3>
                {isCurrentChain && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    Current
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="text-green-400">{speedInfo.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="text-yellow-400">{speedInfo.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-blue-400">{speedInfo.type}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">Active Competitions</h3>
          
          {activeCompetitions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No active competitions available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCompetitions.map((competition, index) => (
                <div
                  key={competition.id || index}
                  onClick={() => setSelectedCompetition(competition)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedCompetition?.id === competition.id
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-white">{competition.topic}</h4>
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                      Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Total Pool</p>
                      <p className="text-white font-medium">
                        {formatTokenAmount(competition.totalPool || 0)} BET
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Min Investment</p>
                      <p className="text-white font-medium">
                        {formatTokenAmount(competition.minInvestment || 0)} BET
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>Creator: {competition.creator?.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>ID: #{competition.id || index}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">Submit Your Strategy</h3>
          
          {!selectedCompetition ? (
            <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
              <ArrowRight className="w-12 h-12 text-gray-400 mx-auto mb-3 rotate-180" />
              <p className="text-gray-400">Select a competition to join</p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10 space-y-6">
              <div className="pb-4 border-b border-white/10">
                <h4 className="font-semibold text-white mb-2">{selectedCompetition.topic}</h4>
                {competitionDetails && (
                  <div className="text-sm text-gray-300">
                    <p>Participants: {competitionDetails.participants?.length || 0}</p>
                    <p>Current Pool: {formatTokenAmount(selectedCompetition.totalPool || 0)} BET</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Investment Amount (BET)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={formatTokenAmount(selectedCompetition.minInvestment || 0)}
                  value={joinForm.investment}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, investment: e.target.value }))}
                  placeholder={`Min: ${formatTokenAmount(selectedCompetition.minInvestment || 0)}`}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Strategy Confidence: {joinForm.confidence}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={joinForm.confidence}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Conservative</span>
                  <span>Moderate</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Your Investment Strategy
                </label>
                <textarea
                  value={joinForm.strategy}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, strategy: e.target.value }))}
                  placeholder="Describe your detailed investment strategy for this competition topic. Be specific about your approach, reasoning, and expected outcomes..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {joinForm.strategy.length}/1000 characters
                </p>
              </div>

              {estimatedRewards && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-green-300 mb-2">Estimated Rewards</h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Pool Share:</span>
                      <span>{estimatedRewards.poolShare}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence Weighted:</span>
                      <span>{estimatedRewards.estimatedShare}%</span>
                    </div>
                    <div className="flex justify-between font-medium text-green-300">
                      <span>Potential Reward:</span>
                      <span>{estimatedRewards.potentialReward} BET</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-2">Join Costs</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Your Investment:</span>
                    <span>{joinForm.investment || '0'} BET</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Fees:</span>
                    <span>{getJoinSpeed(chainId!).cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Time:</span>
                    <span>{getJoinSpeed(chainId!).time}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleJoin}
                disabled={isJoining || !joinForm.investment || !joinForm.strategy.trim()}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Joining Competition...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Join Competition</span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinCompetition;