// Place this file as: src/components/BetPlacement.tsx

import React, { useState } from 'react';
import { BetMarket, BetOption, BettingStrategy } from '../types/betting';
import './BetPlacement.css';

interface BetPlacementProps {
  market: BetMarket;
  selectedOption?: BetOption;
  onBetSubmit: (betDetails: {
    marketId: string;
    optionId: string;
    amount: number;
    strategy?: BettingStrategy;
  }) => void;
  className?: string;
}

const BetPlacement: React.FC<BetPlacementProps> = ({
  market,
  selectedOption,
  onBetSubmit,
  className = ''
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState(selectedOption?.id || '');
  const [betAmount, setBetAmount] = useState<number>(0);
  const [strategyType, setStrategyType] = useState<'manual' | 'automated'>('manual');
  const [strategy, setStrategy] = useState('');

  const selectedBetOption = market.options.find(opt => opt.id === selectedOptionId);
  const potentialWinning = selectedBetOption ? betAmount * selectedBetOption.odds : 0;

  const strategyTemplates = {
    simple: `// Simple Strategy
// Bet fixed amount on selected option
betAmount = ${betAmount || 10};
shouldBet = true;`,
    
    progressive: `// Progressive Strategy
// Increase bet after loss, reset after win
if (lastBetResult === 'loss') {
  betAmount = previousBetAmount * 1.5;
} else {
  betAmount = baseBetAmount;
}

// Safety check
if (betAmount > maxBetAmount) {
  betAmount = baseBetAmount;
}`,

    oddsBasedRand: `// Odds-Based Strategy
// Bet more when odds are favorable
if (currentOdds >= 2.5) {
  betAmount = balance * 0.05; // 5% of balance
} else if (currentOdds >= 2.0) {
  betAmount = balance * 0.03; // 3% of balance
} else {
  betAmount = balance * 0.01; // 1% of balance
}

shouldBet = betAmount >= minimumBet;`
  };

  const handleStrategyTemplate = (template: keyof typeof strategyTemplates) => {
    setStrategy(strategyTemplates[template]);
  };

  const handleSubmit = () => {
    if (!selectedOptionId || betAmount <= 0) {
      alert('Please select an option and enter a valid bet amount');
      return;
    }

    const betDetails = {
      marketId: market.id,
      optionId: selectedOptionId,
      amount: betAmount,
      strategy: strategyType === 'automated' ? {
        code: strategy,
        description: `Automated strategy for ${market.title}`,
        parameters: {
          maxBetAmount: betAmount * 5,
          riskLevel: 'medium' as const,
        }
      } : undefined
    };

    onBetSubmit(betDetails);
  };

  return (
    <div className={`bet-placement ${className}`}>
      <div className="bet-placement-header">
        <h2>{market.title}</h2>
        <p className="market-description">{market.description}</p>
      </div>

      {/* Option Selection */}
      <div className="option-selection">
        <h3>Select Your Option:</h3>
        <div className="options-grid">
          {market.options.map(option => (
            <button
              key={option.id}
              className={`option-button ${selectedOptionId === option.id ? 'selected' : ''}`}
              onClick={() => setSelectedOptionId(option.id)}
            >
              <span className="option-name">{option.name}</span>
              <span className="option-odds">{option.odds}x</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="bet-amount-section">
        <h3>Bet Amount:</h3>
        <div className="amount-input-container">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            placeholder="Enter amount"
            min="1"
            className="amount-input"
          />
          <div className="quick-amounts">
            {[10, 25, 50, 100].map(amount => (
              <button
                key={amount}
                className="quick-amount-btn"
                onClick={() => setBetAmount(amount)}
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Selection */}
      <div className="strategy-section">
        <h3>Betting Strategy:</h3>
        <div className="strategy-type-selection">
          <label className="strategy-radio">
            <input
              type="radio"
              value="manual"
              checked={strategyType === 'manual'}
              onChange={(e) => setStrategyType(e.target.value as 'manual' | 'automated')}
            />
            Manual Betting (One-time bet)
          </label>
          <label className="strategy-radio">
            <input
              type="radio"
              value="automated"
              checked={strategyType === 'automated'}
              onChange={(e) => setStrategyType(e.target.value as 'manual' | 'automated')}
            />
            Automated Strategy (Virtual execution)
          </label>
        </div>

        {strategyType === 'automated' && (
          <div className="strategy-builder">
            <div className="strategy-templates">
              <h4>Strategy Templates:</h4>
              <div className="template-buttons">
                {Object.keys(strategyTemplates).map(template => (
                  <button
                    key={template}
                    className="template-btn"
                    onClick={() => handleStrategyTemplate(template as keyof typeof strategyTemplates)}
                  >
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="strategy-editor">
              <h4>Strategy Code:</h4>
              <textarea
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="Enter your betting strategy code..."
                className="strategy-textarea"
                rows={10}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bet Summary */}
      {selectedBetOption && betAmount > 0 && (
        <div className="bet-summary">
          <h3>Bet Summary:</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Option:</span>
              <span>{selectedBetOption.name}</span>
            </div>
            <div className="summary-row">
              <span>Odds:</span>
              <span>{selectedBetOption.odds}x</span>
            </div>
            <div className="summary-row">
              <span>Bet Amount:</span>
              <span>${betAmount}</span>
            </div>
            <div className="summary-row">
              <span>Potential Win:</span>
              <span className="potential-win">${potentialWinning.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Strategy:</span>
              <span>{strategyType === 'manual' ? 'One-time bet' : 'Automated'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        className="submit-bet-btn"
        onClick={handleSubmit}
        disabled={!selectedOptionId || betAmount <= 0}
      >
        {strategyType === 'manual' ? 'Place Bet' : 'Start Automated Strategy'}
      </button>
    </div>
  );
};

export default BetPlacement;