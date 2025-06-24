// Place this file as: src/components/BetCard.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BetMarket, BetOption } from '../types/betting';
import './BetCard.css';

interface BetCardProps {
  market: BetMarket;
  className?: string;
  compact?: boolean; // For main page display
  style?: React.CSSProperties; // For inline styles like animation delays
}

const BetCard: React.FC<BetCardProps> = ({ market, className = '', compact = false, style }) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate to dedicated bet page
    navigate(`/bet/${market.id}`);
  };

  const handleOptionClick = (e: React.MouseEvent, option: BetOption) => {
    e.stopPropagation(); // Prevent card click
    // Navigate directly to bet page with option pre-selected
    navigate(`/bet/${market.id}?option=${option.id}`);
  };

  const formatTimeRemaining = (endTime: Date): string => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getDisplayOptions = () => {
    // In compact mode, show max 3 options to keep card clean
    return compact ? market.options.slice(0, 3) : market.options;
  };

  return (
    <div 
      className={`bet-card ${!market.isActive ? 'inactive' : ''} ${compact ? 'compact' : ''} ${className} fade-in`}
      onClick={handleCardClick}
      style={style}
    >
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
        {getDisplayOptions().map((option) => (
          <button
            key={option.id}
            className="bet-option-button"
            onClick={(e) => handleOptionClick(e, option)}
            disabled={!market.isActive}
          >
            <span className="option-name">{option.name}</span>
            <span className="option-odds">{option.odds.toFixed(2)}x</span>
          </button>
        ))}
        
        {compact && market.options.length > 3 && (
          <div className="more-options">
            <span>+{market.options.length - 3} more options</span>
          </div>
        )}
      </div>
      
      <div className="bet-card-footer">
        <span className="time-remaining">
          {market.isActive ? `Ends in: ${formatTimeRemaining(market.endTime)}` : 'Market Closed'}
        </span>
        
        {compact && (
          <span className="view-details">
            Click to view details →
          </span>
        )}
      </div>
    </div>
  );
};

export default BetCard;