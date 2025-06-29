// FILE: src/components/CompetitionDashboard.tsx
// PLACE: Create this file in src/components/ directory

import React, { useState, useEffect } from 'react';
import { Trophy, Users, Clock, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';
import { useContract } from '../contexts/ContractContext';
import { useWallet } from '../contexts/WalletContext';

type FilterType = 'all' | 'active' | 'ended';
type SortType = 'newest' | 'oldest' | 'pool-size';

interface CompetitionStatus {
  status: string;
  color: string;
}

const CompetitionDashboard: React.FC = () => {
  const { competitions, isLoading, refreshCompetitions, isReady } = useContract();
  const { isConnected, formatTokenAmount, formatAddress } = useWallet();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');

  useEffect(() => {
    if (isReady && isConnected) {
      refreshCompetitions();
    }
  }, [isReady, isConnected]);

  const filteredCompetitions = competitions.filter(comp => {
    if (filter === 'active') return comp.isActive && !comp.isSettled;
    if (filter === 'ended') return comp.isSettled;
    return true;
  });

  const sortedCompetitions = [...filteredCompetitions].sort((a, b) => {
    if (sortBy === 'newest') return b.startTime - a.startTime;
    if (sortBy === 'oldest') return a.startTime - b.startTime;
    if (sortBy === 'pool-size') return b.totalPool - a.totalPool;
    return 0;
  });

  const getCompetitionStatus = (competition: any): CompetitionStatus => {
    if (competition.isSettled) return { status: 'Ended', color: 'text-gray-400' };
    if (competition.isActive) return { status: 'Active', color: 'text-green-400' };
    return { status: 'Starting Soon', color: 'text-yellow-400' };
  };

  const getTimeRemaining = (endTime: number): string => {
    const now = Date.now() / 1000;
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400">Connect your wallet to view and participate in AI strategy competitions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Strategy Competitions</h2>
          <p className="text-gray-400">Compete with AI-evaluated investment strategies across multiple chains</p>
        </div>
        
        <button
          onClick={refreshCompetitions}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex space-x-2">
          {(['all', 'active', 'ended'] as FilterType[]).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
          className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="pool-size">Largest Pool</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-3"></div>
              <div className="h-6 bg-white/10 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded"></div>
                <div className="h-3 bg-white/10 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedCompetitions.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Competitions Found</h3>
          <p className="text-gray-400">Be the first to create an AI strategy competition!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCompetitions.map((competition, index) => {
            const statusInfo = getCompetitionStatus(competition);
            
            return (
              <div
                key={competition.id || index}
                className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        #{competition.id || index}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {competition.topic}
                    </h3>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-300">Total Pool</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {formatTokenAmount(competition.totalPool || 0)} BET
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-300">Participants</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {competition.participantCount || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Time Left</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {getTimeRemaining(competition.endTime)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Creator:</span>
                    <span className="text-xs text-white font-mono">
                      {formatAddress(competition.creator)}
                    </span>
                    <span className="text-xs text-green-400">
                      {formatTokenAmount(competition.creatorStake || 0)} BET
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <button className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompetitionDashboard;