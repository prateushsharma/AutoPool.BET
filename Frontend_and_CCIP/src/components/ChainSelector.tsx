// FILE: src/components/ChainSelector.tsx
// PLACE: Create this file in src/components/ directory

import React, { useState } from 'react';
import { ChevronDown, Globe, Clock, DollarSign } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACT_ADDRESSES } from '../config/contracts';

const ChainSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { chainId, switchNetwork, getCurrentChain, isOnSupportedNetwork } = useWallet();

  const chains = Object.values(CONTRACT_ADDRESSES);
  const currentChain = getCurrentChain();

  const handleChainSwitch = async (targetChainId: number): Promise<void> => {
    try {
      await switchNetwork(targetChainId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const getChainIcon = (chainId: number): string => {
    if (chainId === 43113) return '🔺'; // Avalanche
    if (chainId === 11155111) return '🔷'; // Ethereum
    if (chainId === 779672) return '⚡'; // Dispatch
    return '🌐';
  };

  const getSpeedInfo = (chainId: number) => {
    if (chainId === 43113) return { speed: 'Hub', cost: 'Low', time: '~2s' };
    if (chainId === 11155111) return { speed: 'CCIP', cost: '$3-5', time: '~15m' };
    if (chainId === 779672) return { speed: 'Teleporter', cost: '$0.01', time: '~5s' };
    return { speed: 'Unknown', cost: '?', time: '?' };
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-3 rounded-lg backdrop-blur-md border transition-all flex items-center space-x-2 ${
            isOnSupportedNetwork()
              ? 'bg-green-500/20 border-green-500/30 text-green-300'
              : 'bg-red-500/20 border-red-500/30 text-red-300'
          }`}
        >
          <Globe className="w-5 h-5" />
          <span className="font-medium">
            {currentChain ? `${getChainIcon(currentChain.chainId)} ${currentChain.name}` : 'Unknown Network'}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute bottom-full mb-2 right-0 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 min-w-80">
            <div className="space-y-2">
              {chains.map((chain) => {
                const speedInfo = getSpeedInfo(chain.chainId);
                const isActive = chainId === chain.chainId;
                
                return (
                  <button
                    key={chain.chainId}
                    onClick={() => handleChainSwitch(chain.chainId)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getChainIcon(chain.chainId)}</span>
                        <div>
                          <p className="font-medium text-white">{chain.name}</p>
                          <p className="text-sm text-gray-400">Chain ID: {chain.chainId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-xs">
                          <Clock className="w-3 h-3" />
                          <span className="text-gray-300">{speedInfo.time}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs">
                          <DollarSign className="w-3 h-3" />
                          <span className="text-gray-300">{speedInfo.cost}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400 text-center">
                Switch networks to participate from different chains
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChainSelector;