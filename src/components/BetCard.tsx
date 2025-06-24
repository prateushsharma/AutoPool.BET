// Place this file as: src/components/BetCard.tsx

import React from 'react';
import { BetMarket, BetOption } from '../types/betting';
import { generateBetPageUrl } from '../utils/telegram';
import './BetCard.css';

interface BetCardProps {
  market: BetMarket;
  className?: string;
}

const BetCard: React.FC<BetCardProps> = ({ market, className = '' }) => {
  const handleBetClick = (option: BetOption) => {
    // Navigate to bet page instead of opening Telegram
    const betUrl = generateBetPageUrl(market.id, option.id);
    window.location.href = betUrl;
  };

  const formatTimeRemaining = (endTime: Date): string => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`bet-card ${!market.isActive ? 'inactive' : ''} ${className}`}>
      <div className="bet-card-header">
        <h3 className="bet-title">{market.title}</h3>
        <span className={`category-badge ${market.category}`}>
          {market.category.toUpperCase()}
        </span>
      </div>
      
      {market.description && (
        <p className="bet-description">{market.description}</p>
      )}
      
      <div className="bet-options">
        {market.options.map((option) => (
          <button
            key={option.id}
            className="bet-option-button"
            onClick={() => handleBetClick(option)}
            disabled={!market.isActive}
          >
            <span className="option-name">{option.name}</span>
            <span className="option-odds">{option.odds.toFixed(2)}x</span>
          </button>
        ))}
      </div>
      
      <div className="bet-card-footer">
        <span className="time-remaining">
          {market.isActive ? `Ends in: ${formatTimeRemaining(market.endTime)}` : 'Market Closed'}
        </span>
      </div>
    </div>
  );
};

export default BetCard;