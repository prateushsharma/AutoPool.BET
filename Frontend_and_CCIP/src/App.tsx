// FILE: src/App.tsx
// PLACE: Main application component at the root level

import React, { useState, useEffect } from 'react';
import { Zap, Globe, Trophy, TrendingUp, Users, DollarSign } from 'lucide-react';
import { WalletProvider } from './contexts/WalletContext';
import { ContractProvider } from './contexts/ContractContext';
import Navigation from './components/Navigation';
import CompetitionDashboard from './components/CompetitionDashboard';
import CreateCompetition from './components/CreateCompetition';
import JoinCompetition from './components/JoinCompetition';
import TransactionTracker from './components/TransactionTracker';
import ChainSelector from './components/ChainSelector';
import AdminPanel from './components/AdminPanel';

type ViewType = 'dashboard' | 'create' | 'join' | 'tracker' | 'admin';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initApp = async (): Promise<void> => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">PulsePicksAI</h2>
          <p className="text-blue-300">Initializing Cross-Chain AI Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <WalletProvider>
      <ContractProvider>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-white">PulsePicksAI</h1>
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                    LIVE
                  </span>
                </div>
                <Navigation activeView={activeView} setActiveView={setActiveView} />
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-300 font-semibold">Multi-Chain Protocol Active</p>
                  <p className="text-green-200 text-sm">
                    Avalanche Fuji: ✅ Active | Sepolia: ✅ CCIP Bridge | Dispatch: ✅ Teleporter
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-gray-300 text-sm">Active Competitions</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">247</p>
                    <p className="text-gray-300 text-sm">Total Participants</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">$45.2K</p>
                    <p className="text-gray-300 text-sm">Total Value Locked</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">89%</p>
                    <p className="text-gray-300 text-sm">AI Accuracy Rate</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {activeView === 'dashboard' && <CompetitionDashboard />}
              {activeView === 'create' && <CreateCompetition />}
              {activeView === 'join' && <JoinCompetition />}
              {activeView === 'tracker' && <TransactionTracker />}
              {activeView === 'admin' && <AdminPanel />}
            </div>
          </main>

          <ChainSelector />

          <footer className="mt-16 bg-black/20 backdrop-blur-md border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <p className="text-gray-300 text-sm">
                  Powered by Avalanche | Cross-Chain AI Strategy Protocol
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Built for the ultimate prediction market experience
                </p>
              </div>
            </div>
          </footer>
        </div>
      </ContractProvider>
    </WalletProvider>
  );
};

export default App;