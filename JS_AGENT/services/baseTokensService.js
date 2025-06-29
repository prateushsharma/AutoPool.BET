// services/baseTokensService.js - Base network specific tokens and data
const axios = require('axios');

class BaseTokensService {
  constructor() {
    this.baseTokens = this.getBaseTokensConfig();
    this.dexScreenerBaseURL = 'https://api.dexscreener.com/latest/dex';
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds for DEX data
  }

  getBaseTokensConfig() {
    return {
      // Major tokens on Base
      'ETH': {
        address: '0x4200000000000000000000000000000000000006',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        coingeckoId: 'ethereum',
        isNative: true
      },
      'USDC': {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        coingeckoId: 'usd-coin'
      },
      'USDbC': {
        address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
        name: 'USD Base Coin',
        symbol: 'USDbC',
        decimals: 6,
        coingeckoId: 'bridged-usdc-base'
      },
      'DAI': {
        address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        coingeckoId: 'dai'
      },
      'CBETH': {
        address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
        name: 'Coinbase Wrapped Staked ETH',
        symbol: 'cbETH',
        decimals: 18,
        coingeckoId: 'coinbase-wrapped-staked-eth'
      },
      'WETH': {
        address: '0x4200000000000000000000000000000000000006',
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        coingeckoId: 'weth'
      },
      // Base ecosystem tokens
      'BALD': {
        address: '0x27D2DECb4bFC9C76F0309b8E88dec3a601Fe25a8',
        name: 'Bald',
        symbol: 'BALD',
        decimals: 18,
        coingeckoId: 'bald-base'
      },
      'TOSHI': {
        address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4',
        name: 'Toshi',
        symbol: 'TOSHI',
        decimals: 18,
        coingeckoId: 'toshi-base'
      },
      'DEGEN': {
        address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
        name: 'Degen',
        symbol: 'DEGEN',
        decimals: 18,
        coingeckoId: 'degen-base'
      },
      'BRETT': {
        address: '0x532f27101965dd16442E59d40670FaF5eBB142E4',
        name: 'Brett',
        symbol: 'BRETT',
        decimals: 18,
        coingeckoId: 'brett'
      },
      'HIGHER': {
        address: '0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe',
        name: 'Higher',
        symbol: 'HIGHER',
        decimals: 18,
        coingeckoId: 'higher'
      },
      'MOXIE': {
        address: '0x8C9037D1Ef5c6D1f6816278C7AAF5491d24CD527',
        name: 'Moxie',
        symbol: 'MOXIE',
        decimals: 18,
        coingeckoId: 'moxie'
      },
      'AERO': {
        address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
        name: 'Aerodrome Finance',
        symbol: 'AERO',
        decimals: 18,
        coingeckoId: 'aerodrome-finance'
      },
      // DeFi tokens on Base
      'COMP': {
        address: '0x9e1028F5F1D5eDE59748FFceE5532509976840E0',
        name: 'Compound',
        symbol: 'COMP',
        decimals: 18,
        coingeckoId: 'compound-governance-token'
      },
      'UNI': {
        address: '0xc3De830EA07524a0761646a6a4e4be0e114a3C83',
        name: 'Uniswap',
        symbol: 'UNI',
        decimals: 18,
        coingeckoId: 'uniswap'
      }
    };
  }

  getAllBaseTokens() {
    return Object.keys(this.baseTokens);
  }

  getTokenInfo(symbol) {
    return this.baseTokens[symbol.toUpperCase()];
  }

  isBaseToken(symbol) {
    return this.baseTokens.hasOwnProperty(symbol.toUpperCase());
  }

  async getBaseTokenPrice(symbol, forceRefresh = false) {
    const tokenInfo = this.getTokenInfo(symbol);
    if (!tokenInfo) {
      throw new Error(`Token ${symbol} not found on Base network`);
    }

    const cacheKey = `price_${symbol.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Try DEXScreener first for Base-specific data
      const dexData = await this.getDEXScreenerData(tokenInfo.address);
      
      if (dexData) {
        const priceData = {
          symbol: symbol.toUpperCase(),
          price: parseFloat(dexData.priceUsd),
          priceChange24h: parseFloat(dexData.priceChange?.h24 || 0),
          volume24h: parseFloat(dexData.volume?.h24 || 0),
          liquidity: parseFloat(dexData.liquidity?.usd || 0),
          fdv: parseFloat(dexData.fdv || 0),
          marketCap: parseFloat(dexData.marketCap || 0),
          source: 'dexscreener',
          network: 'base',
          timestamp: new Date().toISOString()
        };

        this.cache.set(cacheKey, {
          data: priceData,
          timestamp: Date.now()
        });

        return priceData;
      }

      // Fallback to CoinGecko if available
      if (tokenInfo.coingeckoId) {
        return await this.getCoinGeckoPrice(tokenInfo.coingeckoId, symbol);
      }

      // Ultimate fallback - mock data for testing
      return this.getMockPriceData(symbol);

    } catch (error) {
      console.error(`Price fetch error for ${symbol}:`, error.message);
      
      // Return mock data on error for testing
      return this.getMockPriceData(symbol);
    }
  }

  async getDEXScreenerData(tokenAddress) {
    try {
      const response = await axios.get(
        `${this.dexScreenerBaseURL}/tokens/${tokenAddress}`,
        { timeout: 5000 }
      );

      const pairs = response.data?.pairs;
      if (!pairs || pairs.length === 0) {
        return null;
      }

      // Find the best pair (highest liquidity on Base)
      const basePairs = pairs.filter(pair => 
        pair.chainId === 'base' && pair.liquidity?.usd > 1000
      );

      if (basePairs.length === 0) {
        return pairs[0]; // Fallback to first pair
      }

      // Return pair with highest liquidity
      return basePairs.reduce((best, current) => 
        parseFloat(current.liquidity?.usd) > parseFloat(best.liquidity?.usd) ? current : best
      );

    } catch (error) {
      console.error('DEXScreener API error:', error.message);
      return null;
    }
  }

  async getCoinGeckoPrice(coingeckoId, symbol) {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      );

      const data = response.data[coingeckoId];
      return {
        symbol: symbol.toUpperCase(),
        price: data.usd,
        priceChange24h: data.usd_24h_change,
        volume24h: data.usd_24h_vol,
        marketCap: data.usd_market_cap,
        source: 'coingecko',
        network: 'base',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('CoinGecko API error:', error.message);
      throw error;
    }
  }

  getMockPriceData(symbol) {
    // Mock data for testing when APIs fail
    const mockPrices = {
      'ETH': 3245.67,
      'USDC': 1.00,
      'TOSHI': 0.000123,
      'DEGEN': 0.0234,
      'BRETT': 0.156,
      'HIGHER': 0.087,
      'AERO': 1.234,
      'BALD': 0.00045,
      'MOXIE': 0.078
    };

    const basePrice = mockPrices[symbol.toUpperCase()] || 1.00;
    const randomChange = (Math.random() - 0.5) * 10; // Random ±5%
    
    return {
      symbol: symbol.toUpperCase(),
      price: basePrice * (1 + randomChange / 100),
      priceChange24h: randomChange,
      volume24h: Math.random() * 1000000,
      liquidity: Math.random() * 5000000,
      marketCap: Math.random() * 100000000,
      source: 'mock',
      network: 'base',
      timestamp: new Date().toISOString(),
      mock: true
    };
  }

  async getTopBaseTokens(limit = 10) {
    try {
      const tokens = this.getAllBaseTokens().slice(0, limit);
      const pricePromises = tokens.map(async symbol => {
        try {
          const price = await this.getBaseTokenPrice(symbol);
          return { symbol, ...price };
        } catch (error) {
          console.error(`Failed to get price for ${symbol}:`, error.message);
          return null;
        }
      });

      const results = await Promise.all(pricePromises);
      return results.filter(Boolean).sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));

    } catch (error) {
      console.error('Error fetching top Base tokens:', error);
      throw error;
    }
  }

  async getBaseTrendingTokens() {
    try {
      // Get tokens with highest 24h price change
      const tokens = await this.getTopBaseTokens(20);
      return tokens
        .filter(token => token.priceChange24h > 0) // Only positive movers
        .sort((a, b) => b.priceChange24h - a.priceChange24h)
        .slice(0, 10);

    } catch (error) {
      console.error('Error fetching trending Base tokens:', error);
      return [];
    }
  }

  getRandomBaseToken() {
    const tokens = this.getAllBaseTokens();
    return tokens[Math.floor(Math.random() * tokens.length)];
  }

  // Helper for strategy suggestions based on Base ecosystem
  getBaseEcosystemStrategies() {
    return [
      {
        name: "Base Ecosystem Momentum",
        description: "Trade TOSHI, BALD, DEGEN based on Base network activity",
        tokens: ['TOSHI', 'BALD', 'DEGEN', 'BRETT']
      },
      {
        name: "Base DeFi Yield",
        description: "Focus on AERO, COMP, UNI for DeFi opportunities",
        tokens: ['AERO', 'COMP', 'UNI']
      },
      {
        name: "Base Stablecoin Arb",
        description: "Arbitrage between USDC, USDbC, DAI",
        tokens: ['USDC', 'USDbC', 'DAI']
      },
      {
        name: "ETH Base Plays",
        description: "Trade ETH, WETH, cbETH correlation",
        tokens: ['ETH', 'WETH', 'CBETH']
      }
    ];
  }
}

module.exports = new BaseTokensService();