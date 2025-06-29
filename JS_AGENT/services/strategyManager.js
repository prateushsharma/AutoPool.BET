// services/strategyManager.js - Strategy ID Management Service
const redisService = require('./redisService');
const groqService = require('./groqService');

class StrategyManager {
  constructor() {
    this.strategyPrefix = 'strategy:';
    this.userStrategiesPrefix = 'user:strategies:';
    this.strategyCounterKey = 'strategy:counter';
  }

  /**
   * Register a new strategy and assign it an ID
   * @param {string} walletAddress - User's wallet address
   * @param {string} strategyText - The actual strategy text
   * @param {number} royaltyPercent - Royalty percentage (5-50%)
   * @param {string} name - Strategy name (optional)
   * @param {string} description - Strategy description (optional)
   * @returns {Object} Strategy data with assigned ID
   */
  async registerStrategy(walletAddress, strategyText, royaltyPercent = 20, name = '', description = '') {
    try {
      // Validate inputs
      if (!walletAddress || !strategyText) {
        throw new Error('Wallet address and strategy text are required');
      }

      if (royaltyPercent < 5 || royaltyPercent > 50) {
        throw new Error('Royalty percentage must be between 5% and 50%');
      }

      // Generate unique strategy ID
      const strategyId = await redisService.incr(this.strategyCounterKey);

      // Parse strategy with AI
      console.log(`🧠 Parsing strategy ${strategyId} for ${walletAddress.slice(0, 8)}...`);
      const parsedStrategy = await groqService.parseStrategy(strategyText);

      // Create strategy data
      const strategyData = {
        id: strategyId,
        owner: walletAddress,
        originalText: strategyText,
        parsed: parsedStrategy,
        royaltyPercent,
        name: name || `Strategy #${strategyId}`,
        description: description || `AI trading strategy by ${walletAddress.slice(0, 8)}...`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Performance tracking (off-chain)
        stats: {
          totalUses: 0,
          totalEarnings: 0,
          winRate: 0,
          successfulTrades: 0,
          totalTrades: 0,
          bestPerformance: 0,
          averageReturn: 0
        },
        
        // Status
        isActive: true,
        isVerified: false,
        tags: parsedStrategy.suggested_base_tokens || ['ETH', 'TOSHI', 'DEGEN']
      };

      // Store strategy data in Redis
      await redisService.set(
        `${this.strategyPrefix}${strategyId}`,
        JSON.stringify(strategyData),
        { ttl: 365 * 24 * 3600 } // 1 year TTL
      );

      // Add to user's strategy list
      await redisService.sAdd(`${this.userStrategiesPrefix}${walletAddress}`, strategyId);

      // Store strategy lookup by owner
      await redisService.hSet('strategies:by_owner', walletAddress, JSON.stringify([strategyId]));

      console.log(`✅ Strategy ${strategyId} registered for ${walletAddress.slice(0, 8)}...`);
      
      return {
        id: strategyId,
        owner: walletAddress,
        name: strategyData.name,
        royaltyPercent,
        createdAt: strategyData.createdAt,
        isActive: true
      };

    } catch (error) {
      console.error('Strategy registration error:', error);
      throw error;
    }
  }

  /**
   * Get strategy by ID
   * @param {number} strategyId - Strategy ID
   * @returns {Object} Strategy data
   */
  async getStrategy(strategyId) {
    try {
      const strategyData = await redisService.get(`${this.strategyPrefix}${strategyId}`);
      
      if (!strategyData) {
        throw new Error(`Strategy ${strategyId} not found`);
      }

      return JSON.parse(strategyData);
    } catch (error) {
      console.error(`Get strategy ${strategyId} error:`, error);
      throw error;
    }
  }

  /**
   * Get strategy for execution (returns parsed strategy only)
   * @param {number} strategyId - Strategy ID
   * @returns {Object} Parsed strategy for AI execution
   */
  async getStrategyForExecution(strategyId) {
    try {
      const strategy = await this.getStrategy(strategyId);
      return strategy.parsed;
    } catch (error) {
      console.error(`Get strategy for execution ${strategyId} error:`, error);
      throw error;
    }
  }

  /**
   * Get user's strategies
   * @param {string} walletAddress - User's wallet address
   * @returns {Array} List of user's strategies
   */
  async getUserStrategies(walletAddress) {
    try {
      const strategyIds = await redisService.sMembers(`${this.userStrategiesPrefix}${walletAddress}`);
      
      const strategies = [];
      for (const strategyId of strategyIds) {
        try {
          const strategy = await this.getStrategy(strategyId);
          // Return public info only
          strategies.push({
            id: strategy.id,
            name: strategy.name,
            description: strategy.description,
            royaltyPercent: strategy.royaltyPercent,
            createdAt: strategy.createdAt,
            isActive: strategy.isActive,
            isVerified: strategy.isVerified,
            stats: strategy.stats
          });
        } catch (error) {
          console.error(`Error loading strategy ${strategyId}:`, error);
        }
      }

      return strategies;
    } catch (error) {
      console.error(`Get user strategies for ${walletAddress} error:`, error);
      return [];
    }
  }

  /**
   * Get top strategies (public marketplace)
   * @param {number} limit - Number of strategies to return
   * @returns {Array} Top performing strategies
   */
  async getTopStrategies(limit = 10) {
    try {
      // Get all strategy IDs
      const allStrategyIds = [];
      let cursor = '0';
      
      do {
        const result = await redisService.scan(cursor, `${this.strategyPrefix}*`, 100);
        cursor = result.cursor;
        allStrategyIds.push(...result.keys);
      } while (cursor !== '0');

      // Load and rank strategies
      const strategies = [];
      for (const key of allStrategyIds) {
        try {
          const strategyData = await redisService.get(key);
          const strategy = JSON.parse(strategyData);
          
          if (strategy.isActive && strategy.isVerified) {
            strategies.push({
              id: strategy.id,
              name: strategy.name,
              description: strategy.description,
              owner: strategy.owner,
              royaltyPercent: strategy.royaltyPercent,
              stats: strategy.stats,
              tags: strategy.tags,
              createdAt: strategy.createdAt
            });
          }
        } catch (error) {
          console.error(`Error loading strategy from key ${key}:`, error);
        }
      }

      // Sort by performance (win rate * total uses)
      strategies.sort((a, b) => {
        const scoreA = (a.stats.winRate || 0) * (a.stats.totalUses || 0);
        const scoreB = (b.stats.winRate || 0) * (b.stats.totalUses || 0);
        return scoreB - scoreA;
      });

      return strategies.slice(0, limit);
    } catch (error) {
      console.error('Get top strategies error:', error);
      return [];
    }
  }

  /**
   * Update strategy performance stats
   * @param {number} strategyId - Strategy ID
   * @param {Object} performance - Performance data
   */
  async updateStrategyStats(strategyId, performance) {
    try {
      const strategy = await this.getStrategy(strategyId);
      
      // Update stats
      strategy.stats.totalUses += 1;
      strategy.stats.totalTrades += performance.trades || 0;
      
      if (performance.won) {
        strategy.stats.successfulTrades += 1;
      }
      
      if (performance.earnings) {
        strategy.stats.totalEarnings += performance.earnings;
      }
      
      if (performance.returnPercent > strategy.stats.bestPerformance) {
        strategy.stats.bestPerformance = performance.returnPercent;
      }
      
      // Recalculate win rate
      strategy.stats.winRate = strategy.stats.totalTrades > 0 
        ? (strategy.stats.successfulTrades / strategy.stats.totalTrades) * 100 
        : 0;
      
      // Recalculate average return
      strategy.stats.averageReturn = strategy.stats.totalUses > 0
        ? strategy.stats.totalEarnings / strategy.stats.totalUses
        : 0;
      
      strategy.updatedAt = new Date().toISOString();

      // Save updated strategy
      await redisService.set(
        `${this.strategyPrefix}${strategyId}`,
        JSON.stringify(strategy)
      );

      console.log(`📊 Updated stats for strategy ${strategyId}: ${strategy.stats.winRate.toFixed(1)}% win rate`);
      
    } catch (error) {
      console.error(`Update strategy stats ${strategyId} error:`, error);
    }
  }

  /**
   * License a strategy for a specific round
   * @param {string} userAddress - User licensing the strategy
   * @param {number} strategyId - Strategy to license
   * @param {number} roundId - Round to use strategy in
   * @returns {Object} License information
   */
  async licenseStrategy(userAddress, strategyId, roundId) {
    try {
      const strategy = await this.getStrategy(strategyId);
      
      if (!strategy.isActive) {
        throw new Error('Strategy is not active');
      }
      
      if (strategy.owner === userAddress) {
        throw new Error('Cannot license your own strategy');
      }

      // Check if user already has a license for this round
      const existingLicense = await redisService.get(`license:${userAddress}:${roundId}`);
      if (existingLicense) {
        throw new Error('Already licensed a strategy for this round');
      }

      // Create license record
      const licenseData = {
        userAddress,
        strategyId,
        roundId,
        strategyOwner: strategy.owner,
        royaltyPercent: strategy.royaltyPercent,
        licensedAt: new Date().toISOString(),
        isActive: true,
        profitShared: 0
      };

      // Store license
      await redisService.set(
        `license:${userAddress}:${roundId}`,
        JSON.stringify(licenseData),
        { ttl: 30 * 24 * 3600 } // 30 days TTL
      );

      // Track strategy usage
      await redisService.sAdd(`strategy:${strategyId}:licenses`, `${userAddress}:${roundId}`);

      console.log(`📜 User ${userAddress.slice(0, 8)}... licensed strategy ${strategyId} for round ${roundId}`);
      
      return licenseData;
    } catch (error) {
      console.error('License strategy error:', error);
      throw error;
    }
  }

  /**
   * Get user's licensed strategy for a round
   * @param {string} userAddress - User address
   * @param {number} roundId - Round ID
   * @returns {Object|null} License data or null
   */
  async getUserRoundLicense(userAddress, roundId) {
    try {
      const licenseData = await redisService.get(`license:${userAddress}:${roundId}`);
      return licenseData ? JSON.parse(licenseData) : null;
    } catch (error) {
      console.error('Get user round license error:', error);
      return null;
    }
  }

  /**
   * Update strategy verification status (admin only)
   * @param {number} strategyId - Strategy ID
   * @param {boolean} isVerified - Verification status
   */
  async verifyStrategy(strategyId, isVerified) {
    try {
      const strategy = await this.getStrategy(strategyId);
      strategy.isVerified = isVerified;
      strategy.updatedAt = new Date().toISOString();

      await redisService.set(
        `${this.strategyPrefix}${strategyId}`,
        JSON.stringify(strategy)
      );

      console.log(`✅ Strategy ${strategyId} verification set to: ${isVerified}`);
    } catch (error) {
      console.error(`Verify strategy ${strategyId} error:`, error);
      throw error;
    }
  }

  /**
   * Toggle strategy active status
   * @param {number} strategyId - Strategy ID
   * @param {string} ownerAddress - Strategy owner address
   * @param {boolean} isActive - Active status
   */
  async setStrategyStatus(strategyId, ownerAddress, isActive) {
    try {
      const strategy = await this.getStrategy(strategyId);
      
      if (strategy.owner !== ownerAddress) {
        throw new Error('Not strategy owner');
      }

      strategy.isActive = isActive;
      strategy.updatedAt = new Date().toISOString();

      await redisService.set(
        `${this.strategyPrefix}${strategyId}`,
        JSON.stringify(strategy)
      );

      console.log(`🔄 Strategy ${strategyId} status set to: ${isActive ? 'active' : 'inactive'}`);
    } catch (error) {
      console.error(`Set strategy status ${strategyId} error:`, error);
      throw error;
    }
  }

  /**
   * Search strategies by tags or text
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @returns {Array} Matching strategies
   */
  async searchStrategies(query, limit = 10) {
    try {
      const topStrategies = await this.getTopStrategies(50); // Get more for filtering
      
      const filteredStrategies = topStrategies.filter(strategy => {
        const searchText = `${strategy.name} ${strategy.description} ${strategy.tags.join(' ')}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });

      return filteredStrategies.slice(0, limit);
    } catch (error) {
      console.error('Search strategies error:', error);
      return [];
    }
  }
}

module.exports = new StrategyManager();