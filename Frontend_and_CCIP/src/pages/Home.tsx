// Place this file as: src/pages/Home.tsx (Fixed with better card layout)

import React, { useState, useEffect } from 'react';
import BetCard from '../components/BetCard';
import { BetMarket } from '../types/betting';
import './Home.css';

const Home: React.FC = () => {
  const [markets, setMarkets] = useState<BetMarket[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Mock AI-generated markets - replace with actual API calls later
  useEffect(() => {
    const mockMarkets: BetMarket[] = [
      {
        id: '1',
        title: 'Bitcoin Price Prediction',
        description: 'Will Bitcoin reach $75,000 by end of this month? Our AI analysis shows high volatility with potential breakout patterns forming.',
        category: 'crypto',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        options: [
          { id: '1a', name: 'Yes - Above $75,000', odds: 2.3, description: 'Bitcoin breaks resistance level' },
          { id: '1b', name: 'No - Below $75,000', odds: 1.7, description: 'Bitcoin stays in current range' }
        ]
      },
      {
        id: '2',
        title: 'Premier League Top Scorer Race',
        description: 'Who will finish as the Premier League\'s top goal scorer this season? AI analyzes player form, injury history, and team dynamics.',
        category: 'sports',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        options: [
          { id: '2a', name: 'Erling Haaland', odds: 2.1, description: 'Man City striker in top form' },
          { id: '2b', name: 'Harry Kane', odds: 2.8, description: 'Bayern Munich star' },
          { id: '2c', name: 'Mohamed Salah', odds: 3.2, description: 'Liverpool\'s reliable scorer' },
          { id: '2d', name: 'Other Player', odds: 4.5, description: 'Dark horse candidate' }
        ]
      },
      {
        id: '3',
        title: 'Q4 Tech Stock Rally Champion',
        description: 'Which tech giant will deliver the highest returns this quarter? AI analysis considers earnings forecasts, market sentiment, and technical indicators.',
        category: 'crypto',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        options: [
          { id: '3a', name: 'NVIDIA', odds: 2.8, description: 'AI chip leader' },
          { id: '3b', name: 'Apple', odds: 2.3, description: 'Strong ecosystem' },
          { id: '3c', name: 'Microsoft', odds: 2.9, description: 'Azure growth' }
        ]
      },
      {
        id: '4',
        title: 'AI Startup IPO Success',
        description: 'Which AI startup will have the most successful IPO in the next 6 months? Based on funding rounds, market readiness, and technology advancement.',
        category: 'crypto',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000), // 110 days
        options: [
          { id: '4a', name: 'Anthropic', odds: 2.6, description: 'Constitutional AI leader' },
          { id: '4b', name: 'Perplexity', odds: 3.5, description: 'Search innovation' },
          { id: '4c', name: 'Runway ML', odds: 4.0, description: 'Video AI pioneer' }
        ]
      },
      {
        id: '5',
        title: 'Climate Summit Agreement',
        description: 'What will be the major outcome of the next Climate Summit? AI predicts based on political climate, economic factors, and environmental urgency.',
        category: 'politics',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        options: [
          { id: '5a', name: 'Binding Emissions Target', odds: 2.8, description: 'Strict global commitments' },
          { id: '5b', name: 'Voluntary Guidelines', odds: 1.9, description: 'Non-binding agreements' },
          { id: '5c', name: 'No Major Agreement', odds: 4.2, description: 'Political deadlock' }
        ]
      },
      {
        id: '6',
        title: 'Netflix vs Disney+ Subscriber War',
        description: 'Which streaming platform will gain more subscribers in Q4? AI considers content releases, pricing strategies, and market penetration.',
        category: 'entertainment',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        options: [
          { id: '6a', name: 'Netflix', odds: 1.8, description: 'Content powerhouse' },
          { id: '6b', name: 'Disney+', odds: 2.2, description: 'Family-friendly growth' },
          { id: '6c', name: 'Similar Growth', odds: 3.1, description: 'Neck and neck' }
        ]
      }
    ];

    // Simulate API loading with staggered animations
    setTimeout(() => {
      setMarkets(mockMarkets);
      setLoading(false);
    }, 1200);
  }, []);

  const categories = [
    { id: 'all', name: 'All Markets', emoji: '📊' },
    { id: 'sports', name: 'Sports', emoji: '⚽' },
    { id: 'crypto', name: 'Crypto & Tech', emoji: '💰' },
    { id: 'politics', name: 'Politics', emoji: '🏛️' },
    { id: 'entertainment', name: 'Entertainment', emoji: '🎬' }
  ];

  const filteredMarkets = selectedCategory === 'all' 
    ? markets 
    : markets.filter(market => market.category === selectedCategory);

  const getMarketStats = () => {
    const totalVolume = markets.length * 12500; // Mock volume calculation
    const activeCount = markets.filter(m => m.isActive).length;
    return { totalVolume, activeCount };
  };

  const stats = getMarketStats();

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>🤖 AI is generating fresh betting markets...</p>
          <p className="loading-subtext">Analyzing trends, news, and market data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚡ PulsePicksAI</h1>
        <p>Next-generation AI betting powered by advanced strategy analysis</p>
        <div className="header-stats">
          <span>🎯 {stats.activeCount} Live Markets</span>
          <span>🤖 AI-Powered Predictions</span>
          <span>💰 ${stats.totalVolume.toLocaleString()} Volume</span>
          <span>⚡ Avalanche Native</span>
        </div>
      </header>

      <nav className="category-nav">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="category-emoji">{category.emoji}</span>
            {category.name}
          </button>
        ))}
      </nav>

      <main className="markets-container">
        {filteredMarkets.length === 0 ? (
          <div className="no-markets">
            <h3>🔍 No Markets Found</h3>
            <p>No active markets in this category right now.</p>
            <p>Our AI is constantly analyzing data to create new opportunities!</p>
          </div>
        ) : (
          <>
            <div className="markets-header">
              <h2 className="markets-title">
                {selectedCategory === 'all' ? 'All Active Markets' : `${categories.find(c => c.id === selectedCategory)?.name} Markets`}
              </h2>
              <p className="markets-subtitle">
                Click any market to view details and place strategic bets
              </p>
            </div>
            
            <div className="markets-grid">
              {filteredMarkets.map((market, index) => (
                <BetCard 
                  key={market.id} 
                  market={market} 
                  compact={true}
                  className="slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>🤖 Markets powered by advanced AI analysis • ⚡ Lightning-fast execution on Avalanche</p>
        <p>🎲 Strategic betting with AMM liquidity • 📊 Real-time market updates</p>
        <p className="footer-note">All predictions are AI-generated and for entertainment purposes</p>
      </footer>
    </div>
  );
};

export default Home;