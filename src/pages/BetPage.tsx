// Place this file as: src/pages/BetPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BetPlacement from '../components/BetPlacement';
import { BetMarket } from '../types/betting';
import './BetPage.css';

const BetPage: React.FC = () => {
  const { marketId } = useParams<{ marketId: string }>();
  const [market, setMarket] = useState<BetMarket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock API call to get specific market
    // Replace with actual API call later
    const mockMarkets: { [key: string]: BetMarket } = {
      '1': {
        id: '1',
        title: 'Bitcoin Price Prediction',
        description: 'Will Bitcoin reach $75,000 by end of this month? Our AI analysis suggests high volatility expected.',
        category: 'crypto',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        options: [
          { id: '1a', name: 'Yes - Above $75,000', odds: 2.3, description: 'Bitcoin breaks resistance' },
          { id: '1b', name: 'No - Below $75,000', odds: 1.7, description: 'Bitcoin consolidates' }
        ]
      },
      '2': {
        id: '2',
        title: 'Premier League Top Scorer',
        description: 'Who will score the most goals this season? Based on current form and injury reports.',
        category: 'sports',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        options: [
          { id: '2a', name: 'Erling Haaland', odds: 2.1, description: 'Man City striker' },
          { id: '2b', name: 'Harry Kane', odds: 2.8, description: 'Bayern Munich forward' },
          { id: '2c', name: 'Mohamed Salah', odds: 3.2, description: 'Liverpool winger' },
          { id: '2d', name: 'Other Player', odds: 4.5, description: 'Any other player' }
        ]
      },
      '3': {
        id: '3',
        title: 'Tech Stock Rally',
        description: 'Which tech stock will perform best this quarter? AI analysis of market trends and earnings.',
        category: 'crypto',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        options: [
          { id: '3a', name: 'NVIDIA', odds: 2.0, description: 'AI chip leader' },
          { id: '3b', name: 'Apple', odds: 2.5, description: 'Consumer tech giant' },
          { id: '3c', name: 'Microsoft', odds: 2.8, description: 'Cloud computing' },
          { id: '3d', name: 'Tesla', odds: 3.5, description: 'EV pioneer' }
        ]
      },
      '4': {
        id: '4',
        title: 'NBA Championship Winner',
        description: 'Which team will win the 2025 NBA Championship? Analysis based on team performance and roster strength.',
        category: 'sports',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        options: [
          { id: '4a', name: 'Boston Celtics', odds: 3.5, description: 'Defending champions' },
          { id: '4b', name: 'Denver Nuggets', odds: 4.2, description: 'Strong core team' },
          { id: '4c', name: 'Phoenix Suns', odds: 5.1, description: 'Star-studded lineup' },
          { id: '4d', name: 'Other Team', odds: 2.8, description: 'Dark horse candidate' }
        ]
      }
    };

    setTimeout(() => {
      const foundMarket = mockMarkets[marketId || ''];
      setMarket(foundMarket || null);
      setLoading(false);
    }, 500);
  }, [marketId]);

  const handleBetSubmit = (betDetails: any) => {
    console.log('Bet submitted:', betDetails);
    
    // Here you would send the bet to your backend
    // The backend would handle the virtual execution if it's an automated strategy
    
    if (betDetails.strategy) {
      alert(`Automated strategy "${betDetails.strategy.description}" has been submitted! 
             Your strategy will be executed virtually with a maximum bet of $${betDetails.strategy.parameters?.maxBetAmount}.
             You'll receive updates on the execution progress.`);
    } else {
      alert(`Manual bet of $${betDetails.amount} placed successfully on "${market?.options.find(opt => opt.id === betDetails.optionId)?.name}"!
             Good luck! 🎲`);
    }
    
    // Redirect back to home after successful bet
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading betting market...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="app">
        <div className="error-container">
          <h2>❌ Market Not Found</h2>
          <p>The betting market you're looking for doesn't exist or has ended.</p>
          <p>Don't worry, our AI is constantly creating new opportunities!</p>
          <a href="/" className="back-home-btn">← Back to Markets</a>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="bet-page-header">
        <a href="/" className="back-link">← Back to Markets</a>
        <div className="market-info">
          <span className="ai-badge">🤖 AI Generated</span>
          <span className={`category-badge ${market.category}`}>
            {market.category.toUpperCase()}
          </span>
        </div>
      </header>

      <BetPlacement 
        market={market} 
        onBetSubmit={handleBetSubmit}
        className="main-bet-placement"
      />
    </div>
  );
};

export default BetPage;