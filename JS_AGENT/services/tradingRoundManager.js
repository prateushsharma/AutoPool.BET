// services/tradingRoundManager.js - Updated to disable problematic Redis pub/sub
const redisService = require('./redisService');
const groqService = require('./groqService');
const baseTokensService = require('./baseTokensService');
const { EventEmitter } = require('events');

class TradingRoundManager extends EventEmitter {
  constructor() {
    super();
    this.activeExecutions = new Map(); // roundId -> intervalId
    this.roundDefaults = {
      duration: 180000, // 3 minutes
      startingBalance: 10000,
      maxParticipants: 10,
      executionInterval: 15000, // 15 seconds
      maxPositionSize: 0.3,
      tradingFee: 0.001,
      allowedTokens: ['ETH', 'TOSHI', 'DEGEN', 'BRETT', 'HIGHER', 'AERO']
    };
  }

  // Create a new trading round
  async createRound(config = {}) {
    const roundId = `round_${Date.now()}_${this.generateId()}`;
    
    const round = {
      id: roundId,
      number: config.number || await this.getNextRoundNumber(),
      title: config.title || `Trading Round #${config.number || await this.getNextRoundNumber()}`,
      description: config.description || 'Compete with your AI trading strategies!',
      duration: config.duration || this.roundDefaults.duration,
      startingBalance: config.startingBalance || this.roundDefaults.startingBalance,
      maxParticipants: config.maxParticipants || this.roundDefaults.maxParticipants,
      status: 'waiting', // waiting, active, finished, cancelled
      createdAt: new Date().toISOString(),
      startTime: null,
      endTime: null,
      createdBy: config.createdBy || 'system',
      settings: {
        executionInterval: config.executionInterval || this.roundDefaults.executionInterval,
        maxPositionSize: config.maxPositionSize || this.roundDefaults.maxPositionSize,
        tradingFee: config.tradingFee || this.roundDefaults.tradingFee,
        allowedTokens: config.allowedTokens || this.roundDefaults.allowedTokens,
        autoStart: config.autoStart !== undefined ? config.autoStart : true,
        minParticipants: config.minParticipants || 2
      },
      stats: {
        totalParticipants: 0,
        totalTrades: 0,
        totalVolume: 0,
        averagePnL: 0
      }
    };

    // Store round with TTL (duration + 1 hour for viewing results)
    const ttl = Math.floor((round.duration + 3600000) / 1000);
    await redisService.set(`round:${roundId}`, JSON.stringify(round), { ttl });
    
    // Add to active rounds set
    await redisService.sAdd('rounds:active', roundId);
    
    // Store round number mapping
    await redisService.set(`round:number:${round.number}`, roundId);
    
    console.log(`🎮 Created trading round ${roundId}: ${round.title} (${round.duration/1000}s)`);
    
    // Emit event
    this.emit('roundCreated', { roundId, round });
    
    return round;
  }

  // Join round with wallet address and strategy
  async joinRound(roundId, participantData) {
    const { walletAddress, strategy, username } = participantData;
    
    if (!walletAddress || !strategy) {
      throw new Error('Wallet address and strategy are required');
    }

    // Get round data
    const roundData = await redisService.get(`round:${roundId}`);
    if (!roundData) {
      throw new Error('Round not found');
    }

    const round = JSON.parse(roundData);
    
    if (round.status !== 'waiting') {
      throw new Error(`Round is ${round.status}, cannot join`);
    }

    // Check if wallet already joined
    const participantKey = `round:${roundId}:participant:${walletAddress}`;
    const existingParticipant = await redisService.get(participantKey);
    if (existingParticipant) {
      throw new Error('Wallet already joined this round');
    }

    // Check participant limit
    if (round.stats.totalParticipants >= round.maxParticipants) {
      throw new Error('Round is full');
    }

    // Parse strategy with AI
    console.log(`🧠 Parsing strategy for ${walletAddress.slice(0, 8)}...`);
    const parsedStrategy = await groqService.parseStrategy(strategy);

    // Create participant data
    const participant = {
      walletAddress,
      username: username || `Player_${walletAddress.slice(-6)}`,
      strategy: {
        original: strategy,
        parsed: parsedStrategy,
        enabled: true
      },
      portfolio: {
        cash: round.startingBalance,
        positions: {}, // token -> { amount, avgPrice, currentValue, pnl }
        totalValue: round.startingBalance,
        pnl: 0,
        pnlPercentage: 0,
        maxDrawdown: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      },
      joinedAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      isActive: true
    };

    // Store participant data
    await redisService.set(participantKey, JSON.stringify(participant));
    
    // Add to participants set
    await redisService.sAdd(`round:${roundId}:participants`, walletAddress);
    
    // Update round stats
    round.stats.totalParticipants += 1;
    await redisService.set(`round:${roundId}`, JSON.stringify(round));

    console.log(`👤 ${participant.username} (${walletAddress.slice(0, 8)}...) joined round ${roundId}`);
    
    // Auto-start if conditions met
    if (round.settings.autoStart && round.stats.totalParticipants >= round.settings.minParticipants) {
      if (round.stats.totalParticipants === round.maxParticipants) {
        setTimeout(() => this.startRound(roundId), 5000); // 5 second delay
      }
    }

    // Emit event
    this.emit('participantJoined', { roundId, participant, totalParticipants: round.stats.totalParticipants });
    
    return participant;
  }

  // Start round execution
  async startRound(roundId) {
    const roundData = await redisService.get(`round:${roundId}`);
    if (!roundData) {
      throw new Error('Round not found');
    }

    const round = JSON.parse(roundData);
    
    if (round.status !== 'waiting') {
      throw new Error(`Round already ${round.status}`);
    }

    if (round.stats.totalParticipants < round.settings.minParticipants) {
      throw new Error(`Need at least ${round.settings.minParticipants} participants`);
    }

    // Update round status
    round.status = 'active';
    round.startTime = new Date().toISOString();
    round.endTime = new Date(Date.now() + round.duration).toISOString();
    
    await redisService.set(`round:${roundId}`, JSON.stringify(round));
    
    // Move from active to running
    await redisService.sRem('rounds:active', roundId);
    await redisService.sAdd('rounds:running', roundId);

    console.log(`🚀 Started trading round ${roundId} with ${round.stats.totalParticipants} participants`);
    
    // Start strategy execution
    this.startStrategyExecution(roundId, round);
    
    // Emit event
    this.emit('roundStarted', { roundId, round });
    
    return round;
  }

  // Execute strategies for all participants
  async startStrategyExecution(roundId, round) {
    const executeStrategies = async () => {
      try {
        // Check if round should end
        if (new Date() >= new Date(round.endTime)) {
          await this.endRound(roundId);
          return;
        }

        console.log(`⚡ Executing strategies for round ${roundId}`);
        
        // Get all participants
        const participantAddresses = await redisService.sMembers(`round:${roundId}:participants`);
        
        // Execute each participant's strategy
        const promises = participantAddresses.map(address => 
          this.executeParticipantStrategy(roundId, address)
        );
        
        await Promise.all(promises);
        
        // Update leaderboard
        await this.updateLeaderboard(roundId);
        
        // Broadcast updates (now uses console log instead of Redis pub/sub)
        await this.broadcastRoundUpdate(roundId);
        
      } catch (error) {
        console.error(`Strategy execution error for round ${roundId}:`, error);
      }
    };

    // Execute immediately
    await executeStrategies();
    
    // Set up interval
    const intervalId = setInterval(executeStrategies, round.settings.executionInterval);
    this.activeExecutions.set(roundId, intervalId);
  }

  // Execute individual participant strategy
  async executeParticipantStrategy(roundId, walletAddress) {
    try {
      const participantKey = `round:${roundId}:participant:${walletAddress}`;
      const participantData = await redisService.get(participantKey);
      
      if (!participantData) return;
      
      const participant = JSON.parse(participantData);
      if (!participant.isActive || !participant.strategy.enabled) return;

      const strategy = participant.strategy.parsed;
      const allowedTokens = strategy.suggested_base_tokens || 
                           strategy.assets || 
                           ['ETH', 'TOSHI', 'DEGEN'];

      // Execute for top 3 tokens max
      for (const token of allowedTokens.slice(0, 3)) {
        if (!baseTokensService.isBaseToken(token)) continue;

        try {
          // Get market data
          const marketData = await baseTokensService.getBaseTokenPrice(token);
          
          // Generate signal
          const signal = await groqService.analyzeMarketConditions(marketData, strategy);
          
          // Process signal
          await this.processSignal(roundId, walletAddress, token, signal, marketData);
          
        } catch (error) {
          console.error(`Signal error for ${walletAddress} - ${token}:`, error.message);
        }
      }

      // Update portfolio value
      await this.updatePortfolioValue(roundId, walletAddress);
      
    } catch (error) {
      console.error(`Strategy execution error for ${walletAddress}:`, error);
    }
  }

  // Process buy/sell signals
  async processSignal(roundId, walletAddress, token, signal, marketData) {
    try {
      const participantKey = `round:${roundId}:participant:${walletAddress}`;
      const participantData = await redisService.get(participantKey);
      
      if (!participantData) {
        console.error(`Participant not found: ${walletAddress}`);
        return;
      }
      
      const participant = JSON.parse(participantData);
      
      // Add roundId to participant for trade execution
      participant.roundId = roundId;
      
      const signalType = signal.signal?.toUpperCase();
      const price = marketData.price;
      const confidence = signal.confidence || 5;
      
      // Log signal
      const logEntry = {
        timestamp: new Date().toISOString(),
        token,
        signal: signalType,
        price,
        confidence,
        reason: signal.reason || 'AI analysis',
        executed: false
      };

      // Execute trade based on signal
      if (signalType === 'BUY') {
        const success = await this.executeBuyOrder(participant, token, price, confidence, signal);
        logEntry.executed = success;
      } else if (signalType === 'SELL') {
        const success = await this.executeSellOrder(participant, token, price, signal);
        logEntry.executed = success;
      }

      // Store updated participant
      await redisService.set(participantKey, JSON.stringify(participant));
      
      // Store trade log
      await redisService.hSet(`round:${roundId}:logs:${walletAddress}`, 
                             Date.now().toString(), 
                             JSON.stringify(logEntry));
                             
    } catch (error) {
      console.error(`Process signal error for ${walletAddress}:`, error);
    }
  }

  // Execute buy order
  async executeBuyOrder(participant, token, price, confidence, signal) {
    try {
      // Get round data to access settings
      const roundData = await redisService.get(`round:${participant.roundId || 'unknown'}`);
      let round = { settings: { maxPositionSize: 0.3, tradingFee: 0.001 } }; // Default settings
      
      if (roundData) {
        round = JSON.parse(roundData);
      }
      
      // Calculate position size based on confidence
      const maxPositionValue = participant.portfolio.cash * round.settings.maxPositionSize;
      const confidenceMultiplier = Math.min(confidence / 10, 1);
      const positionValue = maxPositionValue * confidenceMultiplier;
      
      if (positionValue < participant.portfolio.cash * 0.05) { // Minimum 5%
        return false;
      }

      const fee = positionValue * round.settings.tradingFee;
      const totalCost = positionValue + fee;
      
      if (totalCost > participant.portfolio.cash) {
        return false;
      }

      const amount = positionValue / price;
      
      // Update portfolio
      participant.portfolio.cash -= totalCost;
      
      if (!participant.portfolio.positions[token]) {
        participant.portfolio.positions[token] = {
          amount: 0,
          avgPrice: 0,
          totalInvested: 0
        };
      }
      
      const position = participant.portfolio.positions[token];
      const newAmount = position.amount + amount;
      const newInvested = position.totalInvested + positionValue;
      
      position.avgPrice = newInvested / newAmount;
      position.amount = newAmount;
      position.totalInvested = newInvested;
      
      participant.portfolio.trades++;
      
      return true;
    } catch (error) {
      console.error('Buy order execution error:', error);
      return false;
    }
  }

  // Execute sell order
  async executeSellOrder(participant, token, price, signal) {
    try {
      const position = participant.portfolio.positions[token];
      if (!position || position.amount <= 0) {
        return false;
      }

      // Sell entire position
      const saleValue = position.amount * price;
      const fee = saleValue * 0.001; // Trading fee
      const netProceeds = saleValue - fee;
      
      // Calculate P&L
      const pnl = netProceeds - position.totalInvested;
      
      // Update portfolio
      participant.portfolio.cash += netProceeds;
      
      if (pnl > 0) {
        participant.portfolio.wins++;
      } else {
        participant.portfolio.losses++;
      }
      
      // Remove position
      delete participant.portfolio.positions[token];
      participant.portfolio.trades++;
      
      return true;
    } catch (error) {
      console.error('Sell order execution error:', error);
      return false;
    }
  }

  // Update portfolio value
  async updatePortfolioValue(roundId, walletAddress) {
    const participantKey = `round:${roundId}:participant:${walletAddress}`;
    const participantData = await redisService.get(participantKey);
    const participant = JSON.parse(participantData);
    
    let totalValue = participant.portfolio.cash;
    
    // Calculate position values
    for (const [token, position] of Object.entries(participant.portfolio.positions)) {
      try {
        const marketData = await baseTokensService.getBaseTokenPrice(token);
        const currentValue = position.amount * marketData.price;
        totalValue += currentValue;
        
        // Update position current value
        position.currentValue = currentValue;
        position.pnl = currentValue - position.totalInvested;
      } catch (error) {
        console.error(`Price update error for ${token}:`, error.message);
      }
    }
    
    // Update portfolio metrics
    const roundData = await redisService.get(`round:${roundId}`);
    const round = JSON.parse(roundData);
    const startingBalance = round.startingBalance;
    
    participant.portfolio.totalValue = totalValue;
    participant.portfolio.pnl = totalValue - startingBalance;
    participant.portfolio.pnlPercentage = ((totalValue - startingBalance) / startingBalance) * 100;
    participant.portfolio.winRate = participant.portfolio.trades > 0 ? 
      (participant.portfolio.wins / participant.portfolio.trades) * 100 : 0;
    participant.lastUpdate = new Date().toISOString();
    
    // Store updated participant
    await redisService.set(participantKey, JSON.stringify(participant));
  }

  // Update leaderboard
  async updateLeaderboard(roundId) {
    const participantAddresses = await redisService.sMembers(`round:${roundId}:participants`);
    
    // Clear existing leaderboard
    await redisService.del(`round:${roundId}:leaderboard`);
    
    // Add participants to sorted set by PnL percentage
    for (const address of participantAddresses) {
      const participantData = await redisService.get(`round:${roundId}:participant:${address}`);
      if (participantData) {
        const participant = JSON.parse(participantData);
        await redisService.zAdd(`round:${roundId}:leaderboard`, 
                                participant.portfolio.pnlPercentage, 
                                address);
      }
    }
  }

  // End round
  async endRound(roundId) {
    // Clear execution interval
    const intervalId = this.activeExecutions.get(roundId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeExecutions.delete(roundId);
    }

    // Update round status
    const roundData = await redisService.get(`round:${roundId}`);
    const round = JSON.parse(roundData);
    round.status = 'finished';
    round.endTime = new Date().toISOString();
    
    await redisService.set(`round:${roundId}`, JSON.stringify(round));
    
    // Move to finished rounds
    await redisService.sRem('rounds:running', roundId);
    await redisService.sAdd('rounds:finished', roundId);
    
    // Final leaderboard update
    await this.updateLeaderboard(roundId);
    
    console.log(`🏁 Round ${roundId} finished`);
    
    // Emit event
    this.emit('roundEnded', { roundId, round });
    
    return round;
  }

  // Get round leaderboard
  async getLeaderboard(roundId, limit = 10) {
    try {
      // Try Redis sorted set first
      const leaderboardData = await redisService.zRevRange(`round:${roundId}:leaderboard`, 0, limit - 1);
      
      const leaderboard = [];
      
      // Handle different Redis response formats
      if (Array.isArray(leaderboardData) && leaderboardData.length > 0) {
        for (let i = 0; i < leaderboardData.length; i += 2) {
          const address = leaderboardData[i];
          const score = parseFloat(leaderboardData[i + 1] || 0);
          
          if (address) {
            const participantData = await redisService.get(`round:${roundId}:participant:${address}`);
            if (participantData) {
              const participant = JSON.parse(participantData);
              leaderboard.push({
                rank: Math.floor(i / 2) + 1,
                walletAddress: address,
                username: participant.username,
                pnl: participant.portfolio.pnl || 0,
                pnlPercentage: score,
                totalValue: participant.portfolio.totalValue || 0,
                trades: participant.portfolio.trades || 0,
                winRate: participant.portfolio.winRate || 0
              });
            }
          }
        }
      } else {
        // Fallback: manually build leaderboard from participants
        console.log('Using fallback leaderboard method...');
        const participantAddresses = await redisService.sMembers(`round:${roundId}:participants`);
        
        for (const address of participantAddresses) {
          const participantData = await redisService.get(`round:${roundId}:participant:${address}`);
          if (participantData) {
            const participant = JSON.parse(participantData);
            leaderboard.push({
              rank: 0, // Will be set after sorting
              walletAddress: address,
              username: participant.username,
              pnl: participant.portfolio.pnl || 0,
              pnlPercentage: participant.portfolio.pnlPercentage || 0,
              totalValue: participant.portfolio.totalValue || 0,
              trades: participant.portfolio.trades || 0,
              winRate: participant.portfolio.winRate || 0
            });
          }
        }
        
        // Sort by PnL percentage and assign ranks
        leaderboard.sort((a, b) => b.pnlPercentage - a.pnlPercentage);
        leaderboard.forEach((entry, index) => {
          entry.rank = index + 1;
        });
      }
      
      return leaderboard.slice(0, limit);
    } catch (error) {
      console.error(`Leaderboard error for round ${roundId}:`, error);
      return [];
    }
  }

  // Get participant logs
  async getParticipantLogs(roundId, walletAddress) {
    const logs = await redisService.hGetAll(`round:${roundId}:logs:${walletAddress}`);
    
    return Object.entries(logs)
      .map(([timestamp, logData]) => ({
        timestamp: parseInt(timestamp),
        ...JSON.parse(logData)
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Broadcast round updates - UPDATED to use console logging instead of Redis pub/sub
  async broadcastRoundUpdate(roundId) {
    try {
      const leaderboard = await this.getLeaderboard(roundId);
      
      // Instead of Redis pub/sub, just log the update
      console.log(`📊 Leaderboard update for round ${roundId}:`, {
        roundId,
        participantCount: leaderboard.length,
        topPlayer: leaderboard[0] ? `${leaderboard[0].username} (${leaderboard[0].pnlPercentage.toFixed(2)}%)` : 'None',
        timestamp: new Date().toISOString()
      });
      
      // Note: Real-time broadcasting via Redis pub/sub is disabled for stability
      // If you need real-time updates, consider using Socket.IO direct emit or polling
      
    } catch (error) {
      console.error(`Broadcast error for round ${roundId}:`, error);
    }
  }

  // Utility methods
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  async getNextRoundNumber() {
    return await redisService.incr('round:counter');
  }

  // Get round data
  async getRound(roundId) {
    const roundData = await redisService.get(`round:${roundId}`);
    return roundData ? JSON.parse(roundData) : null;
  }

  // List rounds by status
  async listRounds(status = 'active') {
    const roundIds = await redisService.sMembers(`rounds:${status}`);
    const rounds = [];
    
    for (const roundId of roundIds) {
      const round = await this.getRound(roundId);
      if (round) rounds.push(round);
    }
    
    return rounds;
  }
}

module.exports = new TradingRoundManager();