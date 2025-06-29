// Backend/services/groqService.js - Complete Fixed Groq AI service

class GroqService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.rateLimitDelay = 2000; // 2 seconds between requests
    this.lastRequestTime = 0;
  }

  async initialize() {
  try {
    const GroqModule = await import('groq-sdk');  // ✅ dynamic ESM import
    const Groq = GroqModule.default;               // ✅ use .default!

    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    this.isInitialized = true;
    console.log('✅ Groq service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Groq:', error);
    throw error;
  }
}
  // Rate-limited request wrapper
  async makeGroqRequest(requestFunction) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFunction, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { requestFunction, resolve, reject } = this.requestQueue.shift();

      try {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
          await new Promise((r) => setTimeout(r, this.rateLimitDelay - timeSinceLastRequest));
        }

        const result = await requestFunction();
        this.lastRequestTime = Date.now();
        resolve(result);
      } catch (error) {
        console.error('Groq request error:', error.message);

        if (error.message.includes('rate limit') || error.status === 429) {
          console.log('⏱️ Rate limit hit, waiting 10 seconds...');
          await new Promise((r) => setTimeout(r, 10000));
          this.requestQueue.unshift({ requestFunction, resolve, reject });
        } else {
          reject(error);
        }
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    this.isProcessingQueue = false;
  }

  async parseStrategy(strategyText) {
    if (!this.isInitialized) throw new Error('Groq service not initialized');

    const prompt = `
Parse this trading strategy and return ONLY valid JSON:

Strategy: "${strategyText}"

Return this exact format:
{
  "strategy_type": "technical",
  "indicators": ["RSI", "Volume"],
  "entry_conditions": "conditions here",
  "exit_conditions": "conditions here",
  "risk_management": "rules here",
  "timeframe": "15m",
  "assets": ["ETH", "TOSHI"],
  "base_ecosystem_focus": true,
  "confidence": 8,
  "actionable": true,
  "suggested_base_tokens": ["ETH", "TOSHI", "DEGEN"]
}

Replace values based on the strategy. No markdown, no extra text.
`;

    return await this.makeGroqRequest(async () => {
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a trading strategy expert. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 800,
      });

      const response = completion.choices[0]?.message?.content;
      return this.cleanAndParseJSON(response);
    });
  }

  // Enhanced parseGamePrompt function - NOW INSIDE THE CLASS
 // Backend/services/groqService.js - Fixed parseGamePrompt method
// Replace the parseGamePrompt method in your GroqService class with this corrected version

async parseGamePrompt(query) {
  const prompt = `
You are a trading game configuration expert. Parse this request and extract EXACT values:

User Request: "${query}"

IMPORTANT INSTRUCTIONS:
1. If user mentions "trending Base tokens" or "Base tokens" → use tokens: ["TOSHI", "DEGEN", "BRETT"]
2. If user mentions "Ethereum tokens" or "ETH tokens" → use tokens: ["ETH", "WETH", "UNI"]
3. If user mentions "DeFi tokens" → use tokens: ["UNI", "AAVE", "COMP"]
4. If user mentions "meme tokens" → use tokens: ["DOGE", "SHIB", "PEPE"]
5. If user mentions specific tokens → use those exact tokens
6. Generate a SHORT, catchy title (max 4-5 words) based on the game type and tokens
7. Create a brief description (1-2 sentences) that matches the actual tokens
8. Extract EXACT numbers for duration, balance, profit targets
9. Generate a specific trading strategy matching the token type

Return ONLY this JSON format:
{
  "title": "ETH Token Sprint",
  "description": "5-minute challenge trading Ethereum's top tokens for quick profits",
  "tokens": ["ETH", "WETH", "UNI"],
  "duration": 300,
  "startingBalance": 100,
  "targetProfitPercent": 5,
  "expectedProfit": 5,
  "investmentAmount": 100,
  "strategy": "Buy ETH and UNI when volume spikes 25%+, sell at 5% profit or 2% loss. Focus on Ethereum ecosystem momentum.",
  "gameType": "trending",
  "riskLevel": "medium",
  "timeframe": "5m"
}

EXTRACTION RULES:
- "5 minutes" = duration: 300 (always in seconds)
- "10 minutes" = duration: 600 (always in seconds)  
- "15 minutes" = duration: 900 (always in seconds)
- "30 minutes" = duration: 1800 (always in seconds)
- "100USD", "$100", "100 investment" = startingBalance: 100, investmentAmount: 100  
- "5% profit target" = targetProfitPercent: 5, expectedProfit: 5
- "trending Base tokens" = tokens: ["TOSHI", "DEGEN", "BRETT"], description mentions "Base"
- "trending Ethereum tokens" = tokens: ["ETH", "WETH", "UNI"], description mentions "Ethereum"

TOKEN SELECTION LOGIC:
- "Base" or "Base tokens" → ["TOSHI", "DEGEN", "BRETT"]
- "Ethereum" or "ETH tokens" → ["ETH", "WETH", "UNI"] 
- "DeFi" → ["UNI", "AAVE", "COMP"]
- "meme" → ["DOGE", "SHIB", "PEPE"]
- Specific tokens mentioned → use exact tokens

Default fallbacks if not mentioned:
- startingBalance: 10000
- targetProfitPercent: 5
- tokens: ["ETH", "WETH", "UNI"] (Ethereum as default)
- duration: 300 (5 minutes in seconds)
`;

  try {
    const response = await this.makeGroqRequest(async () => {
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a trading game expert. Extract exact values and create engaging game configurations. Always respond with valid JSON only. Pay attention to token ecosystems (Base vs Ethereum vs DeFi). Duration must be in SECONDS.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.2, // Lower temperature for more accurate extraction
        max_tokens: 1000
      });

      return completion.choices[0]?.message?.content;
    });

    let parsed = this.cleanAndParseJSON(response);
    
    // Enhanced post-processing to ensure quality
    if (!parsed.title || parsed.title === query || parsed.title.length > 50) {
      parsed.title = this.generateGameTitle(parsed);
    }
    
    if (!parsed.description || parsed.description === query) {
      parsed.description = this.generateGameDescription(parsed);
    }
    
    if (!parsed.strategy || parsed.strategy === "suggested trading strategy") {
      parsed.strategy = this.generateStrategy(parsed);
    }
    
    // Enhanced token detection and fallback
    parsed = this.enhanceTokenDetection(query, parsed);
    
    // Ensure duration is always in SECONDS (not milliseconds)
    parsed.duration = typeof parsed.duration === 'string' ? parseInt(parsed.duration) : (parsed.duration || 300);
    
    // Ensure we have the required fields with proper types
    parsed.investmentAmount = parsed.investmentAmount || parsed.startingBalance || 10000;
    parsed.expectedProfit = parsed.expectedProfit || parsed.targetProfitPercent || 5;
    parsed.targetProfitPercent = parsed.targetProfitPercent || parsed.expectedProfit || 5;
    parsed.startingBalance = typeof parsed.startingBalance === 'string' ? parseFloat(parsed.startingBalance) : (parsed.startingBalance || 10000);
    
    return parsed;
    
  } catch (error) {
    console.error('Enhanced prompt parsing error:', error);
    
    // Intelligent fallback based on query analysis
    return this.createFallbackConfig(query);
  }
}

// NEW: Enhanced token detection method
enhanceTokenDetection(query, parsed) {
  const lowerQuery = query.toLowerCase();
  
  // Override AI detection with pattern matching for accuracy
  if (lowerQuery.includes('ethereum') || lowerQuery.includes('eth token')) {
    parsed.tokens = ["ETH", "WETH", "UNI"];
    parsed.title = parsed.title.replace(/base/gi, 'ETH').replace(/toshi|degen|brett/gi, 'ETH');
    parsed.description = parsed.description.replace(/base/gi, 'Ethereum').replace(/toshi|degen|brett/gi, 'ETH & UNI');
    parsed.strategy = parsed.strategy.replace(/TOSHI|DEGEN|BRETT/g, 'ETH').replace(/Base/g, 'Ethereum');
  } else if (lowerQuery.includes('base') || lowerQuery.includes('base token')) {
    parsed.tokens = ["TOSHI", "DEGEN", "BRETT"];
    parsed.title = parsed.title.replace(/eth/gi, 'Base');
    parsed.description = parsed.description.replace(/ethereum/gi, 'Base');
    parsed.strategy = parsed.strategy.replace(/ETH|WETH|UNI/g, 'TOSHI').replace(/Ethereum/g, 'Base');
  } else if (lowerQuery.includes('defi')) {
    parsed.tokens = ["UNI", "AAVE", "COMP"];
    parsed.title = `${Math.floor((parsed.duration || 300) / 60)}m DeFi Hunt`;
    parsed.description = `${Math.floor((parsed.duration || 300) / 60)}-minute DeFi token challenge. Target ${parsed.targetProfitPercent || 5}% profits with blue-chip protocols.`;
    parsed.strategy = `Trade UNI and AAVE on protocol updates and volume. Enter on DeFi momentum, exit at ${parsed.targetProfitPercent || 5}% profit or 2% loss.`;
  } else if (lowerQuery.includes('meme')) {
    parsed.tokens = ["DOGE", "SHIB", "PEPE"];
    parsed.title = `${Math.floor((parsed.duration || 300) / 60)}m Meme Madness`;
    parsed.description = `${Math.floor((parsed.duration || 300) / 60)}-minute meme token trading frenzy. Ride the hype waves for ${parsed.targetProfitPercent || 5}% profits.`;
    parsed.strategy = `Ride DOGE and SHIB social momentum. Buy on hype spikes, sell at ${parsed.targetProfitPercent || 5}% profit or when buzz fades.`;
  }
  
  // Fix any remaining Base token contamination in Ethereum queries
  if (lowerQuery.includes('ethereum') && (parsed.tokens.includes('TOSHI') || parsed.tokens.includes('DEGEN'))) {
    parsed.tokens = ["ETH", "WETH", "UNI"];
  }
  
  return parsed;
}

// Updated helper methods for better token-specific generation

generateGameTitle(config) {
  const tokens = config.tokens || ["ETH"];
  const duration = Math.floor((config.duration || 300) / 60);
  
  // Token-specific titles
  if (tokens.includes('TOSHI') || tokens.includes('DEGEN')) {
    const titles = ["Base Hunt", "Base Sprint", "Base Rush"];
    return `${duration}m ${titles[Math.floor(Math.random() * titles.length)]}`;
  } else if (tokens.includes('ETH') || tokens.includes('WETH')) {
    const titles = ["ETH Hunt", "ETH Sprint", "ETH Rush"];
    return `${duration}m ${titles[Math.floor(Math.random() * titles.length)]}`;
  } else if (tokens.includes('UNI') || tokens.includes('AAVE')) {
    return `${duration}m DeFi Hunt`;
  } else if (tokens.includes('DOGE') || tokens.includes('SHIB')) {
    return `${duration}m Meme Madness`;
  }
  
  // Fallback
  const gameTypes = {
    trending: ["Trending Hunt", "Token Sprint", "Momentum Rush"],
    momentum: ["Momentum Play", "Speed Trade", "Quick Strike"],
    scalping: ["Scalp Master", "Quick Flip", "Fast Profits"]
  };
  
  const type = config.gameType || "trending";
  const titles = gameTypes[type] || gameTypes.trending;
  return `${duration}m ${titles[Math.floor(Math.random() * titles.length)]}`;
}

generateGameDescription(config) {
  const duration = Math.floor((config.duration || 300) / 60);
  const profit = config.targetProfitPercent || 5;
  const tokens = config.tokens || ["ETH"];
  
  // Token-specific descriptions
  if (tokens.includes('TOSHI') || tokens.includes('DEGEN')) {
    return `${duration}-minute challenge trading Base's hottest tokens. Target ${profit}% profits with TOSHI & DEGEN momentum.`;
  } else if (tokens.includes('ETH') || tokens.includes('WETH')) {
    return `${duration}-minute challenge trading Ethereum's top tokens. Target ${profit}% profits with ETH & UNI momentum.`;
  } else if (tokens.includes('UNI') || tokens.includes('AAVE')) {
    return `${duration}-minute DeFi protocol trading challenge. Target ${profit}% profits with blue-chip DeFi tokens.`;
  } else if (tokens.includes('DOGE') || tokens.includes('SHIB')) {
    return `${duration}-minute meme token trading frenzy. Ride the hype for ${profit}% profits.`;
  }
  
  // Fallback
  const tokenText = tokens.length > 2 ? "trending tokens" : tokens.join(" & ");
  return `${duration}-minute ${config.gameType || "trading"} challenge with ${tokenText}. Target ${profit}% profits with smart risk management.`;
}

generateStrategy(config) {
  const tokens = config.tokens || ["ETH"];
  const profit = config.targetProfitPercent || 5;
  const type = config.gameType || "trending";
  
  // Token-specific strategies
  if (tokens.includes('TOSHI') || tokens.includes('DEGEN')) {
    return `Buy TOSHI and DEGEN when volume increases 25%+. Sell at ${profit}% profit or 2% loss. Focus on Base ecosystem momentum.`;
  } else if (tokens.includes('ETH') || tokens.includes('WETH')) {
    return `Trade ETH and UNI on volume spikes and breakouts. Exit at ${profit}% profit or 2% loss. Focus on Ethereum ecosystem strength.`;
  } else if (tokens.includes('UNI') || tokens.includes('AAVE')) {
    return `Trade UNI and AAVE on protocol updates and TVL changes. Target ${profit}% profits with DeFi momentum signals.`;
  } else if (tokens.includes('DOGE') || tokens.includes('SHIB')) {
    return `Ride DOGE and SHIB social momentum waves. Buy on hype, sell at ${profit}% profit or when buzz fades.`;
  }
  
  // Fallback strategies
  const strategies = {
    trending: `Buy ${tokens[0]} and ${tokens[1] || tokens[0]} when volume increases 25%+. Sell at ${profit}% profit or 2% loss.`,
    momentum: `Trade ${tokens[0]} momentum with RSI and volume. Enter on breakouts, exit at ${profit}% profit.`,
    scalping: `Quick scalp ${tokens.join(", ")} with tight 2-3% profit targets. Use volume spikes.`
  };
  
  return strategies[type] || strategies.trending;
}

  // Helper function to generate game titles - NOW INSIDE THE CLASS
  generateGameTitle(config) {
    const gameTypes = {
      trending: ["Trending Hunt", "Token Sprint", "Momentum Rush"],
      momentum: ["Momentum Play", "Speed Trade", "Quick Strike"],
      scalping: ["Scalp Master", "Quick Flip", "Fast Profits"],
      arbitrage: ["Arb Hunter", "Price Gap", "Cross Trade"],
      meme: ["Meme Madness", "Viral Tokens", "Hype Train"]
    };
    
    const type = config.gameType || "trending";
    const titles = gameTypes[type] || gameTypes.trending;
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    
    // Add time context
    const duration = config.duration || 300;
    const minutes = Math.floor(duration / 60);
    
    return `${minutes}m ${randomTitle}`;
  }

  // Helper function to generate descriptions - NOW INSIDE THE CLASS
  generateGameDescription(config) {
    const duration = Math.floor((config.duration || 300) / 60);
    const profit = config.targetProfitPercent || 5;
    const tokens = config.tokens || ["TOSHI", "DEGEN"];
    const tokenText = tokens.length > 2 ? "trending tokens" : tokens.join(" & ");
    
    return `${duration}-minute ${config.gameType || "trading"} challenge with ${tokenText}. Target ${profit}% profits with smart risk management.`;
  }

  // Helper function to generate strategies - NOW INSIDE THE CLASS
  generateStrategy(config) {
    const tokens = config.tokens || ["TOSHI", "DEGEN"];
    const profit = config.targetProfitPercent || 5;
    const type = config.gameType || "trending";
    
    const strategies = {
      trending: `Buy ${tokens[0]} and ${tokens[1] || "DEGEN"} when volume increases 25%+. Sell at ${profit}% profit or 2% loss. Focus on momentum signals.`,
      momentum: `Trade ${tokens[0]} momentum with RSI and volume. Enter on breakouts, exit at ${profit}% profit or when momentum reverses.`,
      scalping: `Quick scalp ${tokens.join(", ")} with tight 2-3% profit targets. Use volume spikes and fast execution.`,
      meme: `Ride ${tokens[0]} hype waves. Buy on social momentum, sell at ${profit}% or when buzz fades. Quick in/out strategy.`
    };
    
    return strategies[type] || strategies.trending;
  }

  // Intelligent fallback config based on query analysis - NOW INSIDE THE CLASS
  createFallbackConfig(query) {
    const lowerQuery = query.toLowerCase();
    
    // Extract duration
    let duration = 300; // 5 minutes default
    if (lowerQuery.includes("10 min")) duration = 600;
    if (lowerQuery.includes("15 min")) duration = 900;
    if (lowerQuery.includes("30 min")) duration = 1800;
    
    // Extract investment amount
    let startingBalance = 10000;
    const investment = lowerQuery.match(/(\$?(\d+)(k|usd)?)/);
    if (investment) {
      const amount = parseInt(investment[2]);
      if (investment[3] === 'k') {
        startingBalance = amount * 1000;
      } else {
        startingBalance = amount;
      }
    }
    
    // Extract profit target
    let targetProfitPercent = 5;
    const profitMatch = lowerQuery.match(/(\d+)%/);
    if (profitMatch) {
      targetProfitPercent = parseInt(profitMatch[1]);
    }
    
    // Determine game type and tokens
    let gameType = "trending";
    let tokens = ["TOSHI", "DEGEN", "BRETT"];
    
    if (lowerQuery.includes("meme")) {
      gameType = "meme";
      tokens = ["TOSHI", "DEGEN", "PEPE"];
    } else if (lowerQuery.includes("eth")) {
      gameType = "momentum";
      tokens = ["ETH", "WETH"];
    } else if (lowerQuery.includes("defi")) {
      gameType = "defi";
      tokens = ["UNI", "AAVE", "COMP"];
    }
    
    return {
      title: this.generateGameTitle({ gameType, duration }),
      description: this.generateGameDescription({ gameType, duration, targetProfitPercent, tokens }),
      tokens,
      duration,
      startingBalance,
      targetProfitPercent,
      expectedProfit: targetProfitPercent,
      investmentAmount: startingBalance,
      strategy: this.generateStrategy({ tokens, targetProfitPercent, gameType }),
      gameType,
      riskLevel: targetProfitPercent > 8 ? "high" : targetProfitPercent > 5 ? "medium" : "low",
      timeframe: `${Math.floor(duration / 60)}m`
    };
  }

  cleanAndParseJSON(response) {
    try {
      let cleanResponse = response;

      if (response.includes('```json')) {
        cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      }
      if (response.includes('```')) {
        cleanResponse = cleanResponse.replace(/```/g, '');
      }

      const firstBrace = cleanResponse.indexOf('{');
      const lastBrace = cleanResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
      }

      cleanResponse = cleanResponse
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/"\s*,\s*"/g, '", "')
        .replace(/:\s*,/g, ': null,')
        .replace(/:\s*}/g, ': null}')
        .trim();

      return JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Raw response:', response);
      return this.extractBasicJSON(response);
    }
  }

  extractBasicJSON(response) {
    console.log('🔧 Attempting basic JSON extraction...');

    if (response.includes('strategy_type') || response.includes('indicators')) {
      return {
        strategy_type: 'technical',
        indicators: ['Volume', 'Price'],
        entry_conditions: 'Based on strategy analysis',
        exit_conditions: 'Profit target reached',
        risk_management: 'Standard risk management',
        timeframe: '15m',
        assets: ['ETH', 'TOSHI', 'DEGEN'],
        base_ecosystem_focus: true,
        confidence: 7,
        actionable: true,
        suggested_base_tokens: ['ETH', 'TOSHI', 'DEGEN'],
      };
    }

    if (response.includes('signal') || response.includes('BUY') || response.includes('SELL')) {
      const signals = ['BUY', 'SELL', 'HOLD'];
      let detectedSignal = 'HOLD';
      for (const signal of signals) {
        if (response.toUpperCase().includes(signal)) {
          detectedSignal = signal;
          break;
        }
      }

      return {
        signal: detectedSignal,
        confidence: Math.floor(Math.random() * 5) + 4,
        reason: 'Analysis based on market conditions',
        entry_price: 1,
        stop_loss: detectedSignal === 'BUY' ? 0.95 : 1.05,
        take_profit: detectedSignal === 'BUY' ? 1.10 : 0.90,
        risk_reward_ratio: 2.0,
      };
    }

    throw new Error('Unable to extract valid JSON from Groq response');
  }

  async analyzeMarketConditions(marketData, strategy) {
    if (!this.isInitialized) throw new Error('Groq service not initialized');

    const prompt = `
Analyze market data and generate a trading signal. 

Market Data: ${JSON.stringify(marketData)}
Strategy: ${JSON.stringify(strategy)}

Return ONLY this exact JSON format with actual numbers:
{
  "signal": "BUY",
  "confidence": 7,
  "reason": "explanation here",
  "entry_price": ${marketData.price || 1},
  "stop_loss": ${(marketData.price || 1) * 0.95},
  "take_profit": ${(marketData.price || 1) * 1.10},
  "risk_reward_ratio": 2.0
}

Replace values based on analysis. Use BUY, SELL, or HOLD. No markdown, no extra text.
`;

    return await this.makeGroqRequest(async () => {
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a trading signal generator. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        max_tokens: 600,
      });

      const response = completion.choices[0]?.message?.content;
      const parsed = this.cleanAndParseJSON(response);

      const price = marketData.price || 1;

      parsed.stop_loss = typeof parsed.stop_loss === 'string' ? price * 0.95 : parsed.stop_loss || price * 0.95;
      parsed.take_profit = typeof parsed.take_profit === 'string' ? price * 1.10 : parsed.take_profit || price * 1.10;
      parsed.risk_reward_ratio = typeof parsed.risk_reward_ratio === 'string' ? 2.0 : parsed.risk_reward_ratio || 2.0;
      parsed.entry_price = parsed.entry_price || price;

      return parsed;
    });
  }

  async generateTradingInsight(symbol, timeframe = '1h') {
    const prompt = `
Generate a brief trading insight for ${symbol} on ${timeframe} timeframe.
Include:
- Current market sentiment
- Key levels to watch
- Potential opportunities
- Risk factors

Keep it concise and actionable for crypto traders.
`;

    return await this.makeGroqRequest(async () => {
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 250,
      });

      return completion.choices[0]?.message?.content;
    });
  }
}

module.exports = new GroqService();