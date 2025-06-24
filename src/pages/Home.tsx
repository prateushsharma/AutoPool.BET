// Place this file as: src/pages/Home.tsx

import React, { useState, useEffect } from 'react';
import BetCard from '../components/BetCard';
import { BetMarket } from '../types/betting';

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
        description: 'Will Bitcoin reach $75,000 by end of this month?',
        category: 'crypto',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        options: [
          { id: '1a', name: 'Yes - Above $75,000', odds: 2.3 },
          { id: '1b', name: 'No - Below $75,000', odds: 1.7 }
        ]
      },
      {
        id: '2',
        title: 'Premier League Top Scorer',
        description: 'Who will score the most goals this season?',
        category: 'sports',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        options: [
          { id: '2a', name: 'Erling Haaland', odds: 2.1 },
          { id: '2b', name: 'Harry Kane', odds: 2.8 },
          { id: '2c', name: 'Mohamed Salah', odds: 3.2 },
          { id: '2d', name: 'Other Player', odds: 4.5 }
        ]
      },
      {
        id: '3',
        title: 'Tech Stock Rally',
        description: 'Which tech stock will perform best this quarter?',
        category: 'crypto',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        options: [
          { id: '3a', name: 'NVIDIA', odds: 2.0 },
          { id: '3b', name: 'Apple', odds: 2.5 },
          { id: '3c', name: 'Microsoft', odds: 2.8 },
          { id: '3d', name: 'Tesla', odds: 3.5 }
        ]
      },
      {
        id: '4',
        title: 'NBA Championship Winner',
        description: 'Which team will win the 2025 NBA Championship?',
        category: 'sports',
        isActive: true,
        aiGenerated: true,
        createdAt: new Date(),
        endTime: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
        options: [
          { id: '4a', name: 'Boston Celtics', odds: 3.5 },
          { id: '4b', name: 'Denver Nuggets', odds: 4.2 },
          { id: '4c', name: 'Phoenix Suns', odds: 5.1 },
          { id: '4d', name: 'Other Team', odds: 2.8 }
        ]
      }
    ];

    // Simulate API loading
    setTimeout(() => {
      setMarkets(mockMarkets);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = ['all', 'sports', 'crypto', 'politics', 'entertainment'];

  const filteredMarkets = selectedCategory === 'all' 
    ? markets 
    : markets.filter(market => market.category === selectedCategory);

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading AI-generated betting markets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖 AI BetHub</h1>
        <p>AI-generated betting markets with automated strategies</p>
        <div className="header-stats">
          <span>🎯 {markets.length} Active Markets</span>
          <span>🤖 AI-Powered</span>
          <span>📱 Telegram Integration</span>
        </div>
      </header>

      <nav className="category-nav">
        {categories.map(category => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </nav>

      <main className="markets-container">
        {filteredMarkets.length === 0 ? (
          <div className="no-markets">
            <p>No active markets in this category</p>
            <p>Our AI is constantly creating new betting opportunities!</p>
          </div>
        ) : (
          <div className="markets-grid">
            {filteredMarkets.map(market => (
              <BetCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>🤖 Markets created by AI • 📱 Discover more on our Telegram bot</p>
        <p>🎲 Place strategic bets with automated execution</p>
      </footer>
    </div>
  );
};

export default Home;