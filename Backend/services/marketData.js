// Place this file as: ai-betting-bot/services/marketData.js

// Mock market data - matches your frontend data
const mockMarkets = [
  {
    id: '1',
    title: 'Bitcoin Price Prediction',
    description: 'Will Bitcoin reach $75,000 by end of this month?',
    category: 'crypto',
    isActive: true,
    aiGenerated: true,
    createdAt: new Date(),
    endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    options: [
      { id: '1a', name: 'Yes - Above $75,000', odds: 2.3 },
      { id: '1b', name: 'No - Below $75,000', odds: 1.7 }
    ]
  },
  {
    id: '2',
    title: 'Premier League Top Scorer Race',
    description: 'Who will finish as the Premier League\'s top goal scorer this season?',
    category: 'sports',
    isActive: true,
    aiGenerated: true,
    createdAt: new Date(),
    endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    options: [
      { id: '2a', name: 'Erling Haaland', odds: 2.1 },
      { id: '2b', name: 'Harry Kane', odds: 2.8 },
      { id: '2c', name: 'Mohamed Salah', odds: 3.2 },
      { id: '2d', name: 'Other Player', odds: 4.5 }
    ]
  },
  {
    id: '3',
    title: 'Q4 Tech Stock Rally Champion',
    description: 'Which tech giant will deliver the highest returns this quarter?',
    category: 'crypto',
    isActive: true,
    aiGenerated: true,
    createdAt: new Date(),
    endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    options: [
      { id: '3a', name: 'NVIDIA', odds: 2.0 },
      { id: '3b', name: 'Apple', odds: 2.5 },
      { id: '3c', name: 'Microsoft', odds: 2.8 },
      { id: '3d', name: 'Tesla', odds: 3.5 }
    ]
  },
  {
    id: '4',
    title: 'NBA Championship Prediction',
    description: 'Which team will claim the 2025 NBA Championship?',
    category: 'sports',
    isActive: true,
    aiGenerated: true,
    createdAt: new Date(),
    endTime: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    options: [
      { id: '4a', name: 'Boston Celtics', odds: 3.5 },
      { id: '4b', name: 'Denver Nuggets', odds: 4.2 },
      { id: '4c', name: 'Phoenix Suns', odds: 5.1 },
      { id: '4d', name: 'Other Team', odds: 2.8 }
    ]
  },
  {
    id: '5',
    title: 'AI Company IPO Success',
    description: 'Which AI startup will have the most successful IPO in the next 6 months?',
    category: 'crypto',
    isActive: true,
    aiGenerated: true,
    createdAt: new Date(),
    endTime: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    options: [
      { id: '5a', name: 'Anthropic', odds: 2.2 },
      { id: '5b', name: 'Perplexity', odds: 3.1 },
      { id: '5c', name: 'Runway ML', odds: 4.0 },
      { id: '5d', name: 'Other Startup', odds: 3.8 }
    ]
  },
  {
    id: '6',
    title: 'Climate Summit Outcome',
    description: 'What will be the major outcome of the next Climate Summit?',
    category: 'politics',
    isActive: true,
    aiGenerated: true,
    createdAt: new Date(),
    endTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    options: [
      { id: '6a', name: 'Binding Emissions Target', odds: 2.8 },
      { id: '6b', name: 'Voluntary Guidelines', odds: 1.9 },
      { id: '6c', name: 'No Major Agreement', odds: 4.2 }
    ]
  }
];

class MarketDataService {
  constructor() {
    this.markets = [...mockMarkets];
    this.subscribers = new Set(); // Users who want market updates
  }

  // Get all active markets
  getAllMarkets() {
    return this.markets.filter(market => market.isActive);
  }

  // Get markets by category
  getMarketsByCategory(category) {
    if (category === 'all') {
      return this.getAllMarkets();
    }
    return this.markets.filter(market => 
      market.isActive && market.category === category
    );
  }

  // Get specific market by ID
  getMarketById(marketId) {
    return this.markets.find(market => market.id === marketId);
  }

  // Add new market (for AI generation later)
  addMarket(market) {
    const newMarket = {
      ...market,
      id: this.generateMarketId(),
      createdAt: new Date(),
      aiGenerated: true,
      isActive: true
    };
    this.markets.push(newMarket);
    return newMarket;
  }

  // Update market status
  updateMarket(marketId, updates) {
    const marketIndex = this.markets.findIndex(m => m.id === marketId);
    if (marketIndex !== -1) {
      this.markets[marketIndex] = { ...this.markets[marketIndex], ...updates };
      return this.markets[marketIndex];
    }
    return null;
  }

  // Close expired markets
  closeExpiredMarkets() {
    const now = new Date();
    const closedMarkets = [];
    
    this.markets.forEach(market => {
      if (market.isActive && new Date(market.endTime) <= now) {
        market.isActive = false;
        closedMarkets.push(market);
      }
    });
    
    return closedMarkets;
  }

  // Subscribe user for market updates
  subscribeUser(chatId) {
    this.subscribers.add(chatId);
    return true;
  }

  // Unsubscribe user
  unsubscribeUser(chatId) {
    return this.subscribers.delete(chatId);
  }

  // Get all subscribers
  getSubscribers() {
    return Array.from(this.subscribers);
  }

  // Generate random market ID
  generateMarketId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Get market statistics
  getMarketStats() {
    const activeMarkets = this.getAllMarkets();
    const categories = {};
    
    activeMarkets.forEach(market => {
      categories[market.category] = (categories[market.category] || 0) + 1;
    });

    return {
      total: activeMarkets.length,
      categories,
      totalOptions: activeMarkets.reduce((sum, market) => sum + market.options.length, 0),
      newestMarket: activeMarkets.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0]
    };
  }

  // Simulate AI generating new markets (for demo)
  generateRandomMarket() {
    const templates = [
      {
        title: 'Crypto Market Flash Prediction',
        description: 'Will {coin} reach ${price} in the next {time}?',
        category: 'crypto',
        options: [
          { name: 'Yes - Price Target Hit', odds: 2.4 },
          { name: 'No - Stays Below Target', odds: 1.6 }
        ]
      },
      {
        title: 'Sports Upset Alert',
        description: 'Will {underdog} defeat {favorite} in upcoming match?',
        category: 'sports',
        options: [
          { name: 'Yes - Upset Victory', odds: 3.2 },
          { name: 'No - Favorite Wins', odds: 1.3 }
        ]
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const market = {
      ...template,
      endTime: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random end time up to 30 days
      options: template.options.map((option, index) => ({
        ...option,
        id: this.generateMarketId() + index
      }))
    };

    return this.addMarket(market);
  }
}

// Export singleton instance
module.exports = new MarketDataService();