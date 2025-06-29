// FILE: src/components/AdminPanel.tsx
// PLACE: Create this file in src/components/ directory

import React, { useState } from 'react';
import { Settings, Database, RefreshCw, AlertTriangle, FileText, Copy, ExternalLink } from 'lucide-react';
import { useContract } from '../contexts/ContractContext';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACT_ADDRESSES } from '../config/contracts';

type TabType = 'contracts' | 'abis' | 'system';
type AbiType = 'ENHANCED_COMPETITION_FACTORY' | 'BETMAIN_TOKEN' | 'SEPOLIA_PARTICIPATION' | 'DISPATCH_PARTICIPATION' | 'PRIZE_ORACLE';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
}

const AdminPanel: React.FC = () => {
  const { loadAbis, refreshCompetitions, isReady } = useContract();
  const { isConnected, getCurrentChain } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>('contracts');
  const [abiInput, setAbiInput] = useState<string>('');
  const [abiType, setAbiType] = useState<AbiType>('ENHANCED_COMPETITION_FACTORY');

  const handleLoadABI = (): void => {
    try {
      const parsedABI = JSON.parse(abiInput);
      const currentAbis: { [key: string]: any[] } = {};
      currentAbis[abiType] = parsedABI;
      loadAbis(currentAbis);
      alert(`${abiType} ABI loaded successfully!`);
      setAbiInput('');
    } catch (error) {
      alert('Invalid JSON format: ' + (error as Error).message);
    }
  };

  const copyContractAddress = (address: string): void => {
    navigator.clipboard.writeText(address);
    alert('Address copied to clipboard!');
  };

  const currentChain = getCurrentChain();

  const tabs: Tab[] = [
    { id: 'contracts', label: 'Contract Addresses', icon: Database },
    { id: 'abis', label: 'Load ABIs', icon: FileText },
    { id: 'system', label: 'System Status', icon: Settings }
  ];

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400">Connect your wallet to access admin functions</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Admin Panel</h2>
        <p className="text-gray-400">Configure contract addresses, load ABIs, and monitor system status</p>
      </div>

      <div className="flex space-x-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
        {activeTab === 'contracts' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Contract Addresses</h3>
            
            {Object.entries(CONTRACT_ADDRESSES).map(([chainKey, chain]) => (
              <div key={chainKey} className="space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-white/10">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-white">{chain.name}</h4>
                  <span className="text-sm text-gray-400">Chain ID: {chain.chainId}</span>
                  {currentChain?.chainId === chain.chainId && (
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                      Current
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(chain.contracts).map(([contractName, address]) => (
                    <div key={contractName} className="p-4 bg-black/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-white">{contractName.replace(/_/g, ' ')}</h5>
                        {address && (
                          <button
                            onClick={() => copyContractAddress(address)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">Address:</span>
                          <code className="text-xs text-white bg-black/30 px-2 py-1 rounded font-mono flex-1">
                            {address || 'NOT_SET - ADD YOUR ADDRESS HERE'}
                          </code>
                        </div>
                        {address && (
                          <a
                            href={`${chain.blockExplorer}/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                          >
                            <span>View on Explorer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-300 mb-1">Update Required</h4>
                  <p className="text-yellow-200 text-sm">
                    Replace the empty contract addresses with your deployed contract addresses in src/config/contracts.ts
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'abis' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Load Contract ABIs</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Select Contract Type
                </label>
                <select
                  value={abiType}
                  onChange={(e) => setAbiType(e.target.value as AbiType)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="ENHANCED_COMPETITION_FACTORY">Enhanced Competition Factory</option>
                  <option value="BETMAIN_TOKEN">BETmain Token</option>
                  <option value="SEPOLIA_PARTICIPATION">Sepolia Participation</option>
                  <option value="DISPATCH_PARTICIPATION">Dispatch Participation</option>
                  <option value="PRIZE_ORACLE">Prize Oracle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Paste Contract ABI (JSON format)
                </label>
                <textarea
                  value={abiInput}
                  onChange={(e) => setAbiInput(e.target.value)}
                  placeholder='[{"inputs":[],"name":"example","outputs":[],"stateMutability":"view","type":"function"}]'
                  rows={12}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                />
              </div>

              <button
                onClick={handleLoadABI}
                disabled={!abiInput.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Load {abiType.replace(/_/g, ' ')} ABI
              </button>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="font-medium text-blue-300 mb-2">How to get ABIs:</h4>
              <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
                <li>Compile your contracts with Hardhat or Remix</li>
                <li>Copy the ABI array from the compiled artifacts</li>
                <li>Paste the JSON array into the textbox above</li>
                <li>Select the correct contract type and click Load</li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">System Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Connection Status</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <span className="text-gray-300">Wallet Connected</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <span className="text-gray-300">Current Network</span>
                    <span className="text-white text-sm">
                      {currentChain ? currentChain.name : 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <span className="text-gray-300">Contract Service</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      isReady ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {isReady ? 'Ready' : 'Loading'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-white">Quick Actions</h4>
                
                <div className="space-y-3">
                  <button
                    onClick={refreshCompetitions}
                    className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh Competitions</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reload Application</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Supported Networks</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(CONTRACT_ADDRESSES).map((chain) => (
                  <div
                    key={chain.chainId}
                    className={`p-4 rounded-lg border transition-all ${
                      currentChain?.chainId === chain.chainId
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : 'bg-black/20 border-white/10'
                    }`}
                  >
                    <h5 className="font-medium text-white mb-2">{chain.name}</h5>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Chain ID:</span>
                        <span>{chain.chainId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Currency:</span>
                        <span>{chain.nativeCurrency.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contracts:</span>
                        <span>{Object.keys(chain.contracts).length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg">
              <h4 className="font-medium text-gray-300 mb-2">System Information</h4>
              <div className="text-sm text-gray-400 space-y-1">
                <p>• Frontend: React with ethers.js integration</p>
                <p>• Cross-chain: CCIP (Sepolia) + Teleporter (Dispatch)</p>
                <p>• Hub Chain: Avalanche Fuji (All core logic)</p>
                <p>• Auto-refresh: Transactions and competitions</p>
                <p>• State Management: React Context with persistent tracking</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;