// routes/game.js - Enhanced with AI-powered game creation and profit tracking
const express = require('express');
const router = express.Router();
const tradingRoundManager = require('../services/tradingRoundManager');
const strategyManager = require('../services/strategyManager');
const redisService = require('../services/redisService');
const groqService = require('../services/groqService');

// ========== ENHANCED AI FUNCTIONS ==========

// Enhanced AI Prompt Parser Function with Profit Tracking
async function parseGamePrompt(query) {
  const prompt = `
Parse this game creation request and extract EXACT values:

User Request: "${query}"

Return ONLY this JSON format:
{
  "title": "extracted game title",
  "description": "game description", 
  "tokens": ["token1", "token2", "token3"],
  "duration": 300,
  "startingBalance": 100,
  "targetProfitPercent": 5,
  "expectedProfit": 5,
  "investmentAmount": 100,
  "strategy": "suggested trading strategy",
  "gameType": "trending/momentum/arbitrage/prediction",
  "riskLevel": "low/medium/high",
  "timeframe": "5m/15m/1h"
}

IMPORTANT EXTRACTION RULES:
- If user mentions "100USD", "100 investment", "$100" → set startingBalance: 100, investmentAmount: 100
- If user mentions "5% profits", "5% target" → set targetProfitPercent: 5, expectedProfit: 5
- If user mentions "trending tokens" → extract 1-3 trending tokens for the tokens array
- Duration: extract from "5 minutes" = 300, "10 minutes" = 600, etc.

Default values if not mentioned:
- startingBalance: 10000
- targetProfitPercent: 5
- tokens: ["ETH", "TOSHI", "DEGEN"]
`;

  try {
    const response = await groqService.makeGroqRequest(async () => {
      const completion = await groqService.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a game configuration parser. Extract EXACT numbers from user requests. Always respond with valid JSON only.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 800
      });

      return completion.choices[0]?.message?.content;
    });

    const parsed = groqService.cleanAndParseJSON(response);
    
    // Ensure we have the required fields
    parsed.investmentAmount = parsed.investmentAmount || parsed.startingBalance || 10000;
    parsed.expectedProfit = parsed.expectedProfit || parsed.targetProfitPercent || 5;
    parsed.targetProfitPercent = parsed.targetProfitPercent || parsed.expectedProfit || 5;
    
    return parsed;
  } catch (error) {
    console.error('Prompt parsing error:', error);
    // Return default config if AI fails
    return {
      title: "AI Trading Game",
      description: "Generated from user prompt",
      tokens: ["ETH", "TOSHI", "DEGEN"],
      duration: 300,
      startingBalance: 100,
      investmentAmount: 100,
      targetProfitPercent: 5,
      expectedProfit: 5,
      strategy: "Buy trending tokens and sell on profit",
      gameType: "trending",
      riskLevel: "medium"
    };
  }
}

// Generate game title from configuration
function generateGameTitle(config) {
  const templates = [
    `${config.gameType?.charAt(0).toUpperCase() + config.gameType?.slice(1) || 'Trading'} Challenge`,
    `${config.targetProfitPercent || 5}% Profit Hunt`,
    `${config.riskLevel?.charAt(0).toUpperCase() + config.riskLevel?.slice(1) || 'Medium'} Risk Battle`,
    `${config.tokens?.[0] || 'Multi-Token'} Trading Arena`,
    `AI ${config.focus || 'Strategy'} Game`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// ========== BASIC ROUND MANAGEMENT ==========

// Create a new trading round
router.post('/create-round', async (req, res) => {
  try {
    const config = {
      title: req.body.title,
      description: req.body.description,
      duration: req.body.duration ? parseInt(req.body.duration) * 1000 : undefined,
      startingBalance: req.body.startingBalance ? parseFloat(req.body.startingBalance) : undefined,
      maxParticipants: req.body.maxParticipants ? parseInt(req.body.maxParticipants) : undefined,
      executionInterval: req.body.executionInterval ? parseInt(req.body.executionInterval) * 1000 : undefined,
      allowedTokens: req.body.allowedTokens,
      autoStart: req.body.autoStart,
      minParticipants: req.body.minParticipants ? parseInt(req.body.minParticipants) : undefined,
      createdBy: req.body.createdBy || 'api'
    };

    const round = await tradingRoundManager.createRound(config);
    
    res.json({
      success: true,
      round,
      message: 'Trading round created successfully'
    });

  } catch (error) {
    console.error('Create round error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create round',
      message: error.message
    });
  }
});

// ========== ENHANCED AI-POWERED GAME CREATION ==========

// Enhanced AI-Powered Game Creation Route
// Backend/routes/game.js - Fixed Enhanced AI-Powered Game Creation Route
// Replace the existing create-game-from-prompt route with this corrected version

// Enhanced AI-Powered Game Creation Route
// Backend/routes/game.js - Fixed Enhanced AI-Powered Game Creation Route
// Replace the existing create-game-from-prompt route with this corrected version

// Enhanced AI-Powered Game Creation Route
router.post('/create-game-from-prompt', async (req, res) => {
  try {
    const { 
      query, 
      maxParticipants = 10,
      minParticipants = 2,
      duration, // Will be extracted from prompt
      startingBalance, // Will be extracted from prompt
      executionInterval = 15,
      autoStart = true,
      createdBy = 'ai-prompt'
    } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query prompt is required'
      });
    }

    console.log(`🤖 Processing AI game creation prompt: "${query}"`);
    
    // Parse the prompt with enhanced AI extraction
    const gameConfig = await groqService.parseGamePrompt(query);
    
    console.log('🧠 AI extracted config:', gameConfig);
    
    // Use extracted values or provided fallbacks
    const finalStartingBalance = gameConfig.startingBalance || startingBalance || 10000;
    
    // FIXED: Handle duration correctly - gameConfig.duration is already in seconds
    const finalDurationSeconds = gameConfig.duration || duration || 300; // 5 minutes default in seconds
    const finalDurationMs = finalDurationSeconds * 1000; // Convert to milliseconds for the round manager
    
    console.log(`⏱️ Duration handling: AI extracted ${gameConfig.duration}s, using ${finalDurationSeconds}s (${finalDurationMs}ms)`);
    
    // Create round configuration with AI-extracted data
    const roundConfig = {
      title: gameConfig.title || `AI Trading Game #${Date.now()}`,
      description: gameConfig.description || gameConfig.title || "AI-generated trading challenge",
      duration: finalDurationMs, // This needs to be in milliseconds for the round manager
      startingBalance: finalStartingBalance,
      maxParticipants,
      minParticipants,
      executionInterval: executionInterval * 1000, // Convert to milliseconds
      allowedTokens: gameConfig.tokens || ["ETH", "WETH", "UNI"],
      autoStart,
      createdBy,
      
      // Add AI-specific metadata for enhanced features
      aiConfig: {
        originalPrompt: query,
        extractedTokens: gameConfig.tokens,
        gameType: gameConfig.gameType,
        riskLevel: gameConfig.riskLevel,
        timeframe: gameConfig.timeframe,
        suggestedStrategy: gameConfig.strategy
      },
      
      // Add profit tracking for enhanced leaderboard
      profitTracking: {
        targetProfitPercent: gameConfig.targetProfitPercent || 5,
        expectedProfitAmount: gameConfig.expectedProfit || 5,
        investmentAmount: gameConfig.investmentAmount || finalStartingBalance
      }
    };

    console.log('🎮 Creating round with config:', {
      title: roundConfig.title,
      durationSeconds: finalDurationSeconds,
      durationMs: finalDurationMs,
      balance: finalStartingBalance,
      tokens: roundConfig.allowedTokens,
      gameType: gameConfig.gameType
    });

    // Create the trading round
    const round = await tradingRoundManager.createRound(roundConfig);
    
    // Prepare response with all extracted data
    const response = {
      success: true,
      round,
      aiConfig: gameConfig,
      suggestedStrategy: gameConfig.strategy,
      extractedData: {
        tokens: gameConfig.tokens,
        investmentAmount: gameConfig.investmentAmount,
        targetProfitPercent: gameConfig.targetProfitPercent,
        expectedProfitAmount: gameConfig.expectedProfit,
        riskLevel: gameConfig.riskLevel,
        gameType: gameConfig.gameType,
        duration: gameConfig.duration, // Keep this in seconds for frontend
        durationMs: finalDurationMs, // Add milliseconds version for clarity
        title: gameConfig.title,
        description: gameConfig.description
      },
      message: 'AI-powered game created successfully',
      debug: {
        extractedDurationSeconds: gameConfig.duration,
        finalDurationSeconds: finalDurationSeconds,
        finalDurationMs: finalDurationMs,
        detectedTokens: gameConfig.tokens
      }
    };

    console.log(`✅ AI game created: ${round.id} - ${gameConfig.title} (${finalDurationSeconds}s)`);

    res.json(response);

  } catch (error) {
    console.error('Enhanced game creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create AI-powered game',
      message: error.message,
      fallbackSuggestion: 'Try: "Create 5-minute ETH trading with $100 targeting 5% profit"'
    });
  }
});

// Note: Make sure you have this import at the top of your game.js file:
// const groqService = require('../services/groqService');

// Enhanced Get Leaderboard with Profit Score
router.post('/get-enhanced-leaderboard', async (req, res) => {
  try {
    const { roundId, limit = 50 } = req.body;
    
    if (!roundId) {
      return res.status(400).json({
        success: false,
        error: 'Round ID is required'
      });
    }
    
    // Get round info for profit tracking
    const round = await tradingRoundManager.getRound(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        error: 'Round not found'
      });
    }
    
    // Get basic leaderboard
    const basicLeaderboard = await tradingRoundManager.getLeaderboard(roundId, limit);
    
    // Enhance with profit scores
    const enhancedLeaderboard = basicLeaderboard.map(entry => {
      const actualProfitPercent = entry.pnlPercentage || 0;
      const expectedProfitPercent = round.profitTracking?.expectedProfitPercent || 5;
      
      // Calculate profit score: actual profit / expected profit
      const profitScore = expectedProfitPercent !== 0 ? 
        (actualProfitPercent / expectedProfitPercent) : 0;
      
      // Calculate letter grade based on score
      let grade = 'F';
      if (profitScore >= 2.0) grade = 'A+';
      else if (profitScore >= 1.5) grade = 'A';
      else if (profitScore >= 1.2) grade = 'B+';
      else if (profitScore >= 1.0) grade = 'B';
      else if (profitScore >= 0.8) grade = 'C+';
      else if (profitScore >= 0.6) grade = 'C';
      else if (profitScore >= 0.4) grade = 'D';
      
      return {
        ...entry,
        profitScore: Math.round(profitScore * 100) / 100, // Round to 2 decimals
        grade,
        expectedProfitPercent,
        actualProfitPercent: Math.round(actualProfitPercent * 100) / 100,
        scoreDescription: `${Math.round(actualProfitPercent * 100) / 100}% / ${expectedProfitPercent}% = ${Math.round(profitScore * 100) / 100}x`
      };
    });
    
    // Sort by profit score (highest first)
    enhancedLeaderboard.sort((a, b) => b.profitScore - a.profitScore);
    
    // Update ranks based on profit score
    enhancedLeaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    res.json({
      success: true,
      roundId,
      leaderboard: enhancedLeaderboard,
      count: enhancedLeaderboard.length,
      roundInfo: {
        expectedProfitPercent: round.profitTracking?.expectedProfitPercent || 5,
        investmentAmount: round.profitTracking?.investmentAmount || round.startingBalance,
        gameType: round.aiConfig?.gameType || 'trading'
      }
    });

  } catch (error) {
    console.error('Enhanced leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enhanced leaderboard',
      message: error.message
    });
  }
});

// Get Trending Tokens for AI (helper for token extraction)
router.post('/get-trending-for-ai', async (req, res) => {
  try {
    const { limit = 3, network = 'base' } = req.body;
    
    let trendingTokens = [];
    
    if (network === 'base') {
      try {
        const baseTokensService = require('../services/baseTokensService');
        const trending = await baseTokensService.getBaseTrendingTokens();
        trendingTokens = trending.slice(0, limit).map(token => token.symbol);
      } catch (error) {
        console.log('BaseTokensService not available, using fallback');
      }
    }
    
    // Fallback if no trending data
    if (trendingTokens.length === 0) {
      trendingTokens = ['TOSHI', 'DEGEN', 'BRETT'].slice(0, limit);
    }
    
    res.json({
      success: true,
      trendingTokens,
      network,
      count: trendingTokens.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get trending tokens error:', error);
    res.json({
      success: true,
      trendingTokens: ['TOSHI', 'DEGEN', 'BRETT'].slice(0, req.body.limit || 3),
      network: 'base',
      fallback: true
    });
  }
});

// Test AI Extraction
router.post('/test-ai-extraction', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const gameConfig = await parseGamePrompt(query);
    
    res.json({
      success: true,
      originalPrompt: query,
      extractedConfig: gameConfig,
      calculations: {
        expectedProfitAmount: (gameConfig.startingBalance * gameConfig.targetProfitPercent) / 100,
        profitTarget: `${gameConfig.targetProfitPercent}% of ${gameConfig.startingBalance} = ${(gameConfig.startingBalance * gameConfig.targetProfitPercent) / 100}`
      }
    });
    
  } catch (error) {
    console.error('Test AI extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test AI extraction',
      message: error.message
    });
  }
});

// Get game templates
router.post('/get-game-templates', (req, res) => {
  const templates = [
    {
      id: 'trending-hunt',
      title: 'Trending Token Hunt',
      prompt: 'Create a 5-minute game to trade trending Base tokens with 10% profit target',
      description: 'Fast-paced trading of trending tokens',
      duration: 300,
      targetProfit: 10,
      riskLevel: 'high'
    },
    {
      id: 'stable-growth',
      title: 'Stable Growth Challenge',
      prompt: 'Create a 30-minute game focusing on ETH and major tokens with 5% profit target',
      description: 'Conservative trading with major tokens',
      duration: 1800,
      targetProfit: 5,
      riskLevel: 'low'
    },
    {
      id: 'defi-momentum',
      title: 'DeFi Momentum Play',
      prompt: 'Create a 15-minute game trading AERO, UNI, COMP with momentum strategy',
      description: 'DeFi token momentum trading',
      duration: 900,
      targetProfit: 7,
      riskLevel: 'medium'
    },
    {
      id: 'meme-madness',
      title: 'Meme Token Madness',
      prompt: 'Create a 10-minute game with TOSHI, DEGEN, BRETT for quick profits',
      description: 'High volatility meme token trading',
      duration: 600,
      targetProfit: 15,
      riskLevel: 'high'
    }
  ];

  res.json({
    success: true,
    templates,
    count: templates.length
  });
});

// Suggest strategy from prompt
router.post('/suggest-strategy-from-prompt', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const strategyPrompt = `
Based on this request, create a simple trading strategy:

Request: "${query}"

Create a strategy that matches the user's intent. Return just the strategy text (2-3 sentences max).
Focus on Base network tokens and clear rules.

Example: "Buy TOSHI when volume increases by 20%, sell when profit reaches 5% or loss hits 2%"
`;

    const strategy = await groqService.makeGroqRequest(async () => {
      const completion = await groqService.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a trading strategy advisor. Provide concise, actionable strategies.'
          },
          {
            role: 'user',
            content: strategyPrompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 200
      });

      return completion.choices[0]?.message?.content;
    });

    res.json({
      success: true,
      strategy: strategy.replace(/"/g, '').trim(),
      prompt: query
    });

  } catch (error) {
    console.error('Strategy suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest strategy',
      fallbackStrategy: "Buy trending tokens when volume increases, sell on 5-10% profit with 2% stop loss"
    });
  }
});

// ========== PARTICIPANT & STRATEGY MANAGEMENT ==========

// Join a trading round with strategy options
router.post('/join-round', async (req, res) => {
  try {
    const { 
      roundId, 
      walletAddress, 
      strategy,           // New strategy text
      username, 
      strategyId,         // Existing strategy ID
      royaltyPercent,     // For new strategies
      licenseStrategyId   // License someone else's strategy
    } = req.body;
    
    if (!roundId || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Round ID and wallet address are required'
      });
    }

    // Must have either strategy text, strategyId, or licenseStrategyId
    if (!strategy && !strategyId && !licenseStrategyId) {
      return res.status(400).json({
        success: false,
        error: 'Must provide either strategy text, strategyId, or licenseStrategyId'
      });
    }

    const participant = await tradingRoundManager.joinRound(roundId, {
      walletAddress,
      strategy,
      username,
      strategyId,
      royaltyPercent,
      licenseStrategyId
    });
    
    res.json({
      success: true,
      participant,
      strategyId: participant.strategy?.id,
      isLicensed: participant.strategy?.isLicensed,
      message: 'Successfully joined the round'
    });

  } catch (error) {
    console.error('Join round error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to join round',
      message: error.message
    });
  }
});

// Register a new strategy
router.post('/register-strategy', async (req, res) => {
  try {
    const { walletAddress, strategy, royaltyPercent, name, description } = req.body;
    
    if (!walletAddress || !strategy) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and strategy text are required'
      });
    }

    const registeredStrategy = await strategyManager.registerStrategy(
      walletAddress,
      strategy,
      royaltyPercent || 20,
      name,
      description
    );
    
    res.json({
      success: true,
      strategy: registeredStrategy,
      message: 'Strategy registered successfully'
    });

  } catch (error) {
    console.error('Register strategy error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to register strategy',
      message: error.message
    });
  }
});

// Get user's strategies
router.post('/get-user-strategies', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }
    
    const strategies = await tradingRoundManager.getUserStrategies(walletAddress);
    
    res.json({
      success: true,
      strategies,
      count: strategies.length
    });

  } catch (error) {
    console.error('Get user strategies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user strategies',
      message: error.message
    });
  }
});

// Get strategy marketplace (top strategies)
router.post('/get-marketplace', async (req, res) => {
  try {
    const { limit = 20 } = req.body;
    
    const strategies = await tradingRoundManager.getAvailableStrategies(parseInt(limit));
    
    res.json({
      success: true,
      strategies,
      count: strategies.length
    });

  } catch (error) {
    console.error('Get marketplace error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get marketplace',
      message: error.message
    });
  }
});

// ========== ROUND INFORMATION & MANAGEMENT ==========

// Start a round manually
router.post('/start-round', async (req, res) => {
  try {
    const { roundId } = req.body;
    
    if (!roundId) {
      return res.status(400).json({
        success: false,
        error: 'Round ID is required'
      });
    }
    
    const round = await tradingRoundManager.startRound(roundId);
    
    res.json({
      success: true,
      round,
      message: 'Round started successfully'
    });

  } catch (error) {
    console.error('Start round error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to start round',
      message: error.message
    });
  }
});

// Get round details
router.post('/get-round', async (req, res) => {
  try {
    const { roundId } = req.body;
    
    if (!roundId) {
      return res.status(400).json({
        success: false,
        error: 'Round ID is required'
      });
    }
    
    const round = await tradingRoundManager.getRound(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        error: 'Round not found'
      });
    }

    const participantAddresses = await redisService.sMembers(`round:${roundId}:participants`);
    round.currentParticipants = participantAddresses.length;

    res.json({
      success: true,
      round
    });

  } catch (error) {
    console.error('Get round error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get round',
      message: error.message
    });
  }
});

// Get round leaderboard (standard)
router.post('/get-leaderboard', async (req, res) => {
  try {
    const { roundId, limit = 50 } = req.body;
    
    if (!roundId) {
      return res.status(400).json({
        success: false,
        error: 'Round ID is required'
      });
    }
    
    const leaderboard = await tradingRoundManager.getLeaderboard(roundId, parseInt(limit));
    
    res.json({
      success: true,
      roundId,
      leaderboard,
      count: leaderboard.length
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard',
      message: error.message
    });
  }
});

// List rounds by status
router.post('/list-rounds', async (req, res) => {
  try {
    const { status = 'active', limit = 20 } = req.body;
    
    const rounds = await tradingRoundManager.listRounds(status);
    
    // Add participant counts
    for (const round of rounds) {
      const participantAddresses = await redisService.sMembers(`round:${round.id}:participants`);
      round.currentParticipants = participantAddresses.length;
    }
    
    res.json({
      success: true,
      status,
      rounds: rounds.slice(0, parseInt(limit)),
      count: rounds.length
    });

  } catch (error) {
    console.error('List rounds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list rounds',
      message: error.message
    });
  }
});

// Check if wallet can join round
router.post('/can-join', async (req, res) => {
  try {
    const { roundId, walletAddress } = req.body;
    
    if (!roundId || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Round ID and wallet address are required'
      });
    }
    
    const round = await tradingRoundManager.getRound(roundId);
    if (!round) {
      return res.json({
        success: false,
        canJoin: false,
        reason: 'Round not found'
      });
    }
    
    if (round.status !== 'waiting') {
      return res.json({
        success: false,
        canJoin: false,
        reason: `Round is ${round.status}`
      });
    }
    
    const participantKey = `round:${roundId}:participant:${walletAddress}`;
    const existingParticipant = await redisService.get(participantKey);
    if (existingParticipant) {
      return res.json({
        success: false,
        canJoin: false,
        reason: 'Wallet already joined this round'
      });
    }
    
    const participantAddresses = await redisService.sMembers(`round:${roundId}:participants`);
    if (participantAddresses.length >= round.maxParticipants) {
      return res.json({
        success: false,
        canJoin: false,
        reason: 'Round is full'
      });
    }
    
    res.json({
      success: true,
      canJoin: true,
      round: {
        id: round.id,
        title: round.title,
        currentParticipants: participantAddresses.length,
        maxParticipants: round.maxParticipants,
        status: round.status
      }
    });
    
  } catch (error) {
    console.error('Can join check error:', error);
    res.status(500).json({
      success: false,
      canJoin: false,
      error: 'Failed to check join eligibility'
    });
  }
});

module.exports = router;