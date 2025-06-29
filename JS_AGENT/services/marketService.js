// services/marketService.js - Market data fetching service
const axios = require('axios');

class MarketService {
  constructor() {
    this.baseURL = 'https://api.coingecko.com/api/v3';
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  async getMarketData(symbol) {
    const cacheKey = symbol.toLowerCase();
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Convert symbol to CoinGecko ID format
      const coinId = this.symbolToCoinId(symbol);
      
      // Get basic price data
      const priceResponse = await axios.get(
        `${this.baseURL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      );

      // Get additional market data
      const marketResponse = await axios.get(
        `${this.baseURL}/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=hourly`
      );

      const priceData = priceResponse.data[coinId];
      const chartData = marketResponse.data;

      // Calculate technical indicators
      const prices = chartData.prices.map(p => p[1]);
      const volumes = chartData.total_volumes.map(v => v[1]);
      
      const marketData = {
        symbol: symbol.toUpperCase(),
        coinId,
        currentPrice: priceData.usd,
        priceChange24h: priceData.usd_24h_change,
        volume24h: priceData.usd_24h_vol,
        marketCap: priceData.usd_market_cap,
        
        // Technical data
        prices: prices.slice(-24), // Last 24 hours
        volumes: volumes.slice(-24),
        
        // Simple technical indicators
        rsi: this.calculateRSI(prices, 14),
        sma20: this.calculateSMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        volumeAvg: this.calculateSMA(volumes, 24),
        
        timestamp: new Date().toISOString()
      };

      // Cache the data
      this.cache.set(cacheKey, {
        data: marketData,
        timestamp: Date.now()
      });

      return marketData;

    } catch (error) {
      console.error(`Market data fetch error for ${symbol}:`, error.message);
      
      // Return mock data if API fails
      return this.getMockMarketData(symbol);
    }
  }

  symbolToCoinId(symbol) {
    const symbolMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum', 
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink',
      'UNI': 'uniswap'
    };
    
    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50; // Default neutral RSI
    
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateSMA(values, period) {
    if (values.length < period) return values[values.length - 1] || 0;
    
    const slice = values.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  getMockMarketData(symbol) {
    // Fallback mock data for testing
    return {
      symbol: symbol.toUpperCase(),
      currentPrice: 50000,
      priceChange24h: 2.5,
      volume24h: 25000000000,
      marketCap: 950000000000,
      rsi: 45,
      sma20: 49500,
      sma50: 48000,
      volumeAvg: 23000000000,
      prices: Array(24).fill().map(() => 50000 + (Math.random() - 0.5) * 2000),
      volumes: Array(24).fill().map(() => 25000000000 + (Math.random() - 0.5) * 5000000000),
      timestamp: new Date().toISOString(),
      mock: true
    };
  }

  async getMultipleMarketData(symbols) {
    const promises = symbols.map(symbol => this.getMarketData(symbol));
    return Promise.all(promises);
  }
}

module.exports = new MarketService();