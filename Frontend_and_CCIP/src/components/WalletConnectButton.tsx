// Place this file as: src/components/WalletConnectButton.tsx

import React from 'react';
import { useWallet } from '../context/WalletContext';
import './WalletConnectButton.css';

interface WalletConnectButtonProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ 
  className = '', 
  size = 'medium' 
}) => {
  const { wallet, isConnecting, error, connectWallet, disconnectWallet } = useWallet();

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    return num.toFixed(3);
  };

  if (wallet?.isConnected) {
    return (
      <div className={`wallet-connected ${size} ${className}`}>
        <div className="wallet-info">
          <div className="wallet-address">
            <span className="address-text">{formatAddress(wallet.address)}</span>
            <button 
              className="disconnect-btn"
              onClick={disconnectWallet}
              title="Disconnect Wallet"
            >
              ⚡
            </button>
          </div>
          <div className="wallet-balance">
            {formatBalance(wallet.balance)} ETH
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`wallet-connect-container ${className}`}>
      <button
        className={`wallet-connect-btn ${size} ${isConnecting ? 'connecting' : ''}`}
        onClick={connectWallet}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <span className="connecting-spinner"></span>
            Connecting...
          </>
        ) : (
          <>
            <span className="wallet-icon">👛</span>
            Connect Wallet
          </>
        )}
      </button>
      
      {error && (
        <div className="wallet-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}
    </div>
  );
};

export default WalletConnectButton;