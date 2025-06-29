// FILE: src/components/Navigation.tsx
// PLACE: Create this file in src/components/ directory

import React from 'react';
import { Home, Plus, Users, Activity, Settings, Wallet } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, setActiveView }) => {
  const { account, connectWallet, disconnectWallet, isConnecting, isConnected } = useWallet();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'join', label: 'Join', icon: Users },
    { id: 'tracker', label: 'Tracker', icon: Activity },
    { id: 'admin', label: 'Admin', icon: Settings }
  ];

  return (
    <div className="flex items-center space-x-6">
      <nav className="flex space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="ml-8">
        {isConnected ? (
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-300">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </p>
            </div>
            <button
              onClick={disconnectWallet}
              className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <Wallet className="w-4 h-4" />
            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Navigation;