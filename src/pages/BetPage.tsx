// Place this file as: src/pages/BetPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import BetPlacement from '../components/BetPlacement';
import { BetMarket } from '../types/betting';
import './BetPage.css';

const BetPage: React.FC = () => {
  const { marketId } = useParams<{ marketId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [market, setMarket] = useState<BetMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBetForm, setShowBetForm] = useState(false);

  // Get pre-selected option from URL
  const preSelectedOption = searchParams.get('option');

  useEffect(() => {
    // Mock API call to get specific market
    const mockMarkets: { [key: string]: BetMarket } = {
      '1': {
        id: '1',
        title: 'Bitcoin Price Prediction',
        description: 'Will Bitcoin reach $75,000 by end of this month? Our AI analysis shows high volatility with potential breakout patterns forming. Technical indicators suggest a 60% probability of upward movement based on historical data and current market sentiment.',
        category: 'crypto',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        options: [
          { id: '1a', name: 'Yes - Above $75,000', odds: 2.3, description: 'Bitcoin breaks resistance level and continues rally' },
          { id: '1b', name: 'No - Below $75,000', odds: 1.7, description: 'Bitcoin consolidates in current range' }
        ]
      },
      '2': {
        id: '2',
        title: 'Premier League Top Scorer Race',
        description: 'Who will finish as the Premier League\'s top goal scorer this season? AI analyzes player form, injury history, team dynamics, and historical performance patterns to predict the most likely winner.',
        category: 'sports',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        options: [
          { id: '2a', name: 'Erling Haaland', odds: 2.1, description: 'Man City striker in exceptional form with strong team support' },
          { id: '2b', name: 'Harry Kane', odds: 2.8, description: 'Prolific scorer now at Bayern Munich' },
          { id: '2c', name: 'Mohamed Salah', odds: 3.2, description: 'Liverpool\'s consistent goal machine' },
          { id: '2d', name: 'Other Player', odds: 4.5, description: 'Dark horse candidate or breakout star' }
        ]
      },
      '3': {
        id: '3',
        title: 'Q4 Tech Stock Rally Champion',
        description: 'Which tech giant will deliver the highest returns this quarter? AI analysis considers earnings forecasts, market sentiment, technical indicators, and macroeconomic factors affecting tech valuations.',
        category: 'crypto',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        options: [
          { id: '3a', name: 'NVIDIA', odds: 2.0, description: 'AI chip market leader with strong demand' },
          { id: '3b', name: 'Apple', odds: 2.5, description: 'Consumer tech giant with loyal customer base' },
          { id: '3c', name: 'Microsoft', odds: 2.8, description: 'Cloud computing and AI integration leader' },
          { id: '3d', name: 'Tesla', odds: 3.5, description: 'EV pioneer with autonomous driving potential' }
        ]
      },
      '4': {
        id: '4',
        title: 'NBA Championship Prediction',
        description: 'Which team will claim the 2025 NBA Championship? Our AI considers team chemistry, player health, coaching effectiveness, and playoff experience to predict the most likely champion.',
        category: 'sports',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        options: [
          { id: '4a', name: 'Boston Celtics', odds: 3.5, description: 'Defending champions with proven playoff experience' },
          { id: '4b', name: 'Denver Nuggets', odds: 4.2, description: 'Jokic-led powerhouse with strong supporting cast' },
          { id: '4c', name: 'Phoenix Suns', odds: 5.1, description: 'Star-studded lineup with championship aspirations' },
          { id: '4d', name: 'Other Team', odds: 2.8, description: 'Surprise contender or dark horse team' }
        ]
      },
      '5': {
        id: '5',
        title: 'AI Company IPO Success',
        description: 'Which AI startup will have the most successful IPO in the next 6 months? Analysis based on funding rounds, market readiness, technology advancement, and investor sentiment in the AI sector.',
        category: 'crypto',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        options: [
          { id: '5a', name: 'Anthropic', odds: 2.2, description: 'AI safety leader with strong backing' },
          { id: '5b', name: 'Perplexity', odds: 3.1, description: 'Revolutionary search technology' },
          { id: '5c', name: 'Runway ML', odds: 4.0, description: 'Creative AI tools for content creation' },
          { id: '5d', name: 'Other Startup', odds: 3.8, description: 'Emerging AI company with breakthrough tech' }
        ]
      },
      '6': {
        id: '6',
        title: 'Climate Summit Outcome',
        description: 'What will be the major outcome of the next Climate Summit? AI predicts based on political climate, economic factors, environmental urgency, and historical summit patterns.',
        category: 'politics',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        options: [
          { id: '6a', name: 'Binding Emissions Target', odds: 2.8, description: 'Strict global commitments with enforcement' },
          { id: '6b', name: 'Voluntary Guidelines', odds: 1.9, description: 'Non-binding agreements and recommendations' },
          { id: '6c', name: 'No Major Agreement', odds: 4.2, description: 'Political deadlock prevents consensus' }
        ]
      }
    };

    setTimeout(() => {
      const foundMarket = mockMarkets[marketId || ''];
      setMarket(foundMarket || null);
      setLoading(false);
    }, 800);
  }, [marketId]);

  const handleBetSubmit = (betDetails: any) => {
    console.log('Bet submitted:', betDetails);
    
    if (betDetails.strategy) {
      alert(`🤖 Automated Strategy Launched! 
      
Strategy: ${betDetails.strategy.description}
Market: ${market?.title}
Initial Bet: $${betDetails.amount}

Your AI-powered strategy is now running! You'll receive real-time updates as it executes trades and manages your positions automatically.`);
    } else {
      alert(`✅ Bet Placed Successfully!
      
Amount: ${betDetails.amount}
Option: ${market?.options.find(opt => opt.id === betDetails.optionId)?.name}
Potential Win: ${(betDetails.amount * (market?.options.find(opt => opt.id === betDetails.optionId)?.odds || 1)).toFixed(2)}

Good luck! 🎲 Track your bet progress in real-time.`);
    }
    
    // Simulate success and redirect
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  const formatTimeRemaining = (endTime: Date): string => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Market Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getMarketStats = () => {
    if (!market) return { totalBets: 0, volume: 0, participants: 0 };
    
    // Mock statistics
    return {
      totalBets: Math.floor(Math.random() * 500) + 150,
      volume: Math.floor(Math.random() * 50000) + 25000,
      participants: Math.floor(Math.random() * 200) + 75
    };
  };

  const handleQuickBet = (optionId: string) => {
    setShowBetForm(true);
    // Scroll to bet form
    setTimeout(() => {
      document.querySelector('.main-bet-placement')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>🤖 Loading market details...</p>
          <p className="loading-subtext">Fetching real-time data and AI predictions</p>
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
          <button onClick={() => navigate('/')} className="back-home-btn">
            ← Explore Active Markets
          </button>
        </div>
      </div>
    );
  }

  const stats = getMarketStats();
  const selectedOption = market.options.find(opt => opt.id === preSelectedOption);

  return (
    <div className="bet-page">
      {/* Header */}
      <header className="bet-page-header">
        <button onClick={() => navigate('/')} className="back-link">
          Back to Markets
        </button>
        <div className="market-info">
          <span className="ai-badge">🤖 AI Generated</span>
          <span className={`category-badge ${market.category}`}>
            {market.category.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="bet-page-container">
        {/* Market Hero Section */}
        <section className="market-hero fade-in">
          <div className="market-hero-header">
            <h1 className="market-hero-title">{market.title}</h1>
            <div className="market-meta">
              <div className="market-timer">
                ⏰ {formatTimeRemaining(market.endTime)}
              </div>
            </div>
          </div>

          <p className="market-description">{market.description}</p>

          {/* Market Statistics */}
          <div className="market-stats">
            <div className="stat-card">
              <span className="stat-value">{stats.totalBets}</span>
              <span className="stat-label">Total Bets</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">${stats.volume.toLocaleString()}</span>
              <span className="stat-label">Volume</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.participants}</span>
              <span className="stat-label">Participants</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{market.options.length}</span>
              <span className="stat-label">Options</span>
            </div>
          </div>

          {/* Quick Options Grid */}
          <div className="quick-options-grid">
            {market.options.map((option) => (
              <div
                key={option.id}
                className="quick-option-card"
                onClick={() => handleQuickBet(option.id)}
              >
                <div className="quick-option-name">{option.name}</div>
                <div className="quick-option-odds">{option.odds.toFixed(2)}x</div>
                {option.description && (
                  <div className="quick-option-description">{option.description}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Betting Form */}
        <section className="main-bet-placement">
          <BetPlacement 
            market={market} 
            selectedOption={selectedOption}
            onBetSubmit={handleBetSubmit}
          />
        </section>
      </div>

      {/* Floating Action Button */}
      {!showBetForm && (
        <button 
          className="bet-fab"
          onClick={() => {
            setShowBetForm(true);
            document.querySelector('.main-bet-placement')?.scrollIntoView({ 
              behavior: 'smooth' 
            });
          }}
          title="Place Bet"
        >
          🎲
        </button>
      )}
    </div>
  );
};

export default BetPage;