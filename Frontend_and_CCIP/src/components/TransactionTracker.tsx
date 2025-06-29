// FILE: src/components/TransactionTracker.tsx
// PLACE: Create this file in src/components/ directory

import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useContract } from '../contexts/ContractContext';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { TrackedTransaction } from '../utils/transactionTracker';

type FilterType = 'all' | 'pending' | 'confirmed' | 'failed';

const TransactionTracker: React.FC = () => {
  const { getTrackedTransactions, updateTransactionStatus } = useContract();
  const [transactions, setTransactions] = useState<TrackedTransaction[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const loadTransactions = (): void => {
      const txs = getTrackedTransactions();
      setTransactions(txs);
    };

    loadTransactions();
    const interval = setInterval(loadTransactions, 3000);

    return () => clearInterval(interval);
  }, [getTrackedTransactions]);

  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getChainName = (chainId?: number): string => {
    if (!chainId) return 'Unknown';
    const chain = Object.values(CONTRACT_ADDRESSES).find(c => c.chainId === chainId);
    return chain?.name || `Chain ${chainId}`;
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getTransactionUrl = (hash: string, chainId?: number): string | null => {
    if (!chainId) return null;
    const chain = Object.values(CONTRACT_ADDRESSES).find(c => c.chainId === chainId);
    if (!chain) return null;
    return `${chain.blockExplorer}/tx/${hash}`;
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'pending') return tx.status === 'pending';
    if (filter === 'confirmed') return tx.status === 'confirmed';
    if (filter === 'failed') return tx.status === 'failed';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction Tracker</h2>
          <p className="text-gray-400">Monitor your cross-chain and local transactions</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">Auto-refresh: 3s</span>
        </div>
      </div>

      <div className="flex space-x-2">
        {(['all', 'pending', 'confirmed', 'failed'] as FilterType[]).map((filterOption) => (
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
            <span className="ml-1">
              ({transactions.filter(tx => filterOption === 'all' || tx.status === filterOption).length})
            </span>
          </button>
        ))}
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Transactions Found</h3>
          <p className="text-gray-400">Your transactions will appear here as you interact with the protocol</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.hash}
              className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(tx.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-white">
                        {tx.type === 'create' && 'Create Competition'}
                        {tx.type === 'join' && 'Join Competition'}
                        {tx.type === 'cross-chain-join' && 'Cross-Chain Join'}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        tx.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-1">Transaction Hash:</p>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs text-white bg-black/30 px-2 py-1 rounded font-mono">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </code>
                        {getTransactionUrl(tx.hash, tx.fromChain || 43113) && (
                          <a
                            href={getTransactionUrl(tx.hash, tx.fromChain || 43113)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {tx.topic && (
                        <div>
                          <p className="text-gray-400">Topic:</p>
                          <p className="text-white truncate">{tx.topic}</p>
                        </div>
                      )}
                      {tx.competitionId && (
                        <div>
                          <p className="text-gray-400">Competition ID:</p>
                          <p className="text-white">#{tx.competitionId}</p>
                        </div>
                      )}
                      {tx.investment && (
                        <div>
                          <p className="text-gray-400">Investment:</p>
                          <p className="text-white">{tx.investment} BET</p>
                        </div>
                      )}
                      {tx.creatorStake && (
                        <div>
                          <p className="text-gray-400">Creator Stake:</p>
                          <p className="text-white">{tx.creatorStake} BET</p>
                        </div>
                      )}
                    </div>

                    {tx.crossChain && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-blue-300">Cross-Chain Transaction</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">From:</p>
                            <p className="text-white">{getChainName(tx.fromChain)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">To:</p>
                            <p className="text-white">{getChainName(tx.toChain)}</p>
                          </div>
                          {tx.estimatedArrival && (
                            <div className="col-span-2">
                              <p className="text-gray-400">Estimated Arrival:</p>
                              <p className="text-white">
                                {tx.estimatedArrival > Date.now() 
                                  ? `${Math.round((tx.estimatedArrival - Date.now()) / 60000)} minutes`
                                  : 'Should have arrived'
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right text-sm text-gray-400">
                  {formatTimeAgo(tx.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionTracker;