// Place this file as: ai-betting-bot/bot.js

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// Import our services and utilities
const config = require('./config/config');
const marketData = require('./services/marketData');
const MessageFormatter = require('./utils/messageFormatter');

// Initialize Express app for API endpoints
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Telegram Bot
const bot = new TelegramBot(config.botToken, { polling: true });

// Store user sessions and data
const userSessions = new Map();
const botStats = {
  startTime: new Date(),
  totalUsers: 0,
  totalMessages: 0,
  totalBets: 0
};

console.log('🤖 AI Betting Bot is starting...');

// ==========================================
// BOT COMMAND HANDLERS
// ==========================================

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  // Track new user
  if (!userSessions.has(chatId)) {
    userSessions.set(chatId, {
      username: user.username,
      firstName: user.first_name,
      joinedAt: new Date(),
      lastActivity: new Date(),
      notifications: true
    });
    botStats.totalUsers++;
    
    // Subscribe user for market updates
    marketData.subscribeUser(chatId);
    
    console.log(`👤 New user joined: ${user.username || user.first_name} (${chatId})`);
    
    // Send admin notification if configured
    if (config.adminChatId) {
      const adminMessage = MessageFormatter.formatAdminNotification('new_user', {
        username: user.username || user.first_name,
        chatId: chatId
      });
      
      bot.sendMessage(config.adminChatId, adminMessage, {
        parse_mode: 'Markdown'
      }).catch(err => console.error('Error sending admin notification:', err));
    }
  }

  // Update user activity
  updateUserActivity(chatId);

  // Send welcome message with market categories
  const welcomeMessage = config.messages.welcome;
  const keyboard = MessageFormatter.getCategoryKeyboard();

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  }).catch(err => console.error('Error sending welcome message:', err));
  
  botStats.totalMessages++;
});

// /markets command
bot.onText(/\/markets/, (msg) => {
  const chatId = msg.chat.id;
  updateUserActivity(chatId);
  handleMarketsCommand(chatId);
});

// /sports command
bot.onText(/\/sports/, (msg) => {
  const chatId = msg.chat.id;
  updateUserActivity(chatId);
  handleCategoryCommand(chatId, 'sports');
});

// /crypto command
bot.onText(/\/crypto/, (msg) => {
  const chatId = msg.chat.id;
  updateUserActivity(chatId);
  handleCategoryCommand(chatId, 'crypto');
});

// /politics command
bot.onText(/\/politics/, (msg) => {
  const chatId = msg.chat.id;
  updateUserActivity(chatId);
  handleCategoryCommand(chatId, 'politics');
});

// /entertainment command
bot.onText(/\/entertainment/, (msg) => {
  const chatId = msg.chat.id;
  updateUserActivity(chatId);
  handleCategoryCommand(chatId, 'entertainment');
});

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  updateUserActivity(chatId);
  
  bot.sendMessage(chatId, config.messages.help, {
    parse_mode: 'Markdown'
  }).catch(err => console.error('Error sending help message:', err));
  
  botStats.totalMessages++;
});

// /stats command (admin only)
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  
  // Check if user is admin
  if (config.adminChatId && chatId.toString() === config.adminChatId) {
    const stats = marketData.getMarketStats();
    const uptime = Math.floor((Date.now() - botStats.startTime) / 1000);
    
    const statsMessage = `📊 **Bot Statistics**

⏰ **Uptime:** ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
👥 **Total Users:** ${botStats.totalUsers}
💬 **Messages Sent:** ${botStats.totalMessages}
🎲 **Total Bets:** ${botStats.totalBets}
🔔 **Active Sessions:** ${userSessions.size}

${MessageFormatter.formatMarketStats(stats)}

🌐 **Frontend URL:** ${config.websiteUrl}
🤖 **Bot Username:** @${config.botUsername}`;

    bot.sendMessage(chatId, statsMessage, {
      parse_mode: 'Markdown'
    });
  } else {
    bot.sendMessage(chatId, "❌ This command is only available to administrators.");
  }
});

// /broadcast command (admin only)
bot.onText(/\/broadcast (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const message = match[1];
  
  // Check if user is admin
  if (config.adminChatId && chatId.toString() === config.adminChatId) {
    broadcastMessage(message).then(result => {
      bot.sendMessage(chatId, `📢 **Broadcast Complete**\n\nSent to: ${result.sentCount} users\nErrors: ${result.errorCount}`);
    });
  } else {
    bot.sendMessage(chatId, "❌ This command is only available to administrators.");
  }
});

// /addmarket command (admin only - for testing)
bot.onText(/\/addmarket/, (msg) => {
  const chatId = msg.chat.id;
  
  if (config.adminChatId && chatId.toString() === config.adminChatId) {
    const newMarket = marketData.generateRandomMarket();
    
    bot.sendMessage(chatId, `✅ **New Market Created**\n\n${MessageFormatter.formatSingleMarket(newMarket)}`, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    
    // Notify all subscribers about the new market
    const subscribers = marketData.getSubscribers();
    const notificationMessage = `🆕 **New AI Market Available!**\n\n${MessageFormatter.formatSingleMarket(newMarket)}`;
    
    subscribers.forEach(subscriberChatId => {
      if (subscriberChatId !== chatId) { // Don't notify admin twice
        bot.sendMessage(subscriberChatId, notificationMessage, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        }).catch(err => console.error(`Error notifying ${subscriberChatId}:`, err));
      }
    });
  }
});

// Handle unknown commands
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Skip if it's a known command or not a command
  if (!text || !text.startsWith('/') || text.match(/^\/(start|markets|sports|crypto|politics|entertainment|help|stats|broadcast|addmarket)/)) {
    return;
  }
  
  updateUserActivity(chatId);
  
  const errorMessage = MessageFormatter.formatUserError('invalid_command');
  bot.sendMessage(chatId, errorMessage, {
    parse_mode: 'Markdown'
  }).catch(err => console.error('Error sending error message:', err));
});

// ==========================================
// CALLBACK QUERY HANDLERS (Inline Buttons)
// ==========================================

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const messageId = query.message.message_id;

  updateUserActivity(chatId);

  // Handle category selections
  if (data.startsWith('category_')) {
    const category = data.replace('category_', '');
    handleCategoryCallback(chatId, messageId, category);
  }
  // Handle refresh markets
  else if (data === 'refresh_markets') {
    handleMarketsRefresh(chatId, messageId);
  }
  // Handle market details (future expansion)
  else if (data.startsWith('market_')) {
    const marketId = data.replace('market_', '');
    handleMarketDetails(chatId, messageId, marketId);
  }

  // Answer callback query to remove loading state
  bot.answerCallbackQuery(query.id, {
    text: '✅ Updated!'
  }).catch(err => console.error('Error answering callback query:', err));
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Handle markets command
function handleMarketsCommand(chatId, messageId = null) {
  const markets = marketData.getAllMarkets();
  const { message, keyboard } = MessageFormatter.formatMarketsListWithButtons(markets, "AI-Generated Markets");

  const options = {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
    disable_web_page_preview: true
  };

  if (messageId) {
    // Edit existing message
    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      ...options
    }).catch(err => {
      // If edit fails, send new message
      console.error('Error editing message, sending new one:', err);
      bot.sendMessage(chatId, message, options);
    });
  } else {
    // Send new message
    bot.sendMessage(chatId, message, options).catch(err => 
      console.error('Error sending markets message:', err)
    );
  }
  
  botStats.totalMessages++;
}

// Also update handleCategoryCommand:

function handleCategoryCommand(chatId, category) {
  const markets = marketData.getMarketsByCategory(category);
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  const categoryEmojis = {
    sports: '⚽',
    crypto: '💰',
    politics: '🏛️',
    entertainment: '🎬'
  };
  
  const { message, keyboard } = MessageFormatter.formatMarketsListWithButtons(
    markets, 
    `${categoryEmojis[category] || '📊'} ${categoryName} Markets`
  );

  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
    disable_web_page_preview: true
  }).catch(err => console.error(`Error sending ${category} markets:`, err));
  
  botStats.totalMessages++;
}

// Handle category-specific commands
function handleCategoryCommand(chatId, category) {
  const markets = marketData.getMarketsByCategory(category);
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  const categoryEmojis = {
    sports: '⚽',
    crypto: '💰',
    politics: '🏛️',
    entertainment: '🎬'
  };
  
  const message = MessageFormatter.formatMarketsList(
    markets, 
    `${categoryEmojis[category] || '📊'} ${categoryName} Markets`
  );
  const keyboard = MessageFormatter.getCategoryKeyboard();

  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
    disable_web_page_preview: true
  }).catch(err => console.error(`Error sending ${category} markets:`, err));
  
  botStats.totalMessages++;
}

// Handle category callback from inline buttons
function handleCategoryCallback(chatId, messageId, category) {
  const markets = marketData.getMarketsByCategory(category);
  const categoryName = category === 'all' ? 'All' : 
                      category.charAt(0).toUpperCase() + category.slice(1);
  
  const categoryEmojis = {
    all: '📊',
    sports: '⚽',
    crypto: '💰',
    politics: '🏛️',
    entertainment: '🎬'
  };

  const message = MessageFormatter.formatMarketsList(
    markets, 
    `${categoryEmojis[category] || '📊'} ${categoryName} Markets`
  );
  const keyboard = MessageFormatter.getCategoryKeyboard();

  bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: keyboard,
    disable_web_page_preview: true
  }).catch(err => {
    console.error('Error editing category message:', err);
    // Fallback: send new message
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
  });
}

// Handle markets refresh
function handleMarketsRefresh(chatId, messageId) {
  // Close expired markets
  const closedMarkets = marketData.closeExpiredMarkets();
  if (closedMarkets.length > 0) {
    console.log(`🔄 Closed ${closedMarkets.length} expired markets`);
  }

  // Show updated markets
  handleMarketsCommand(chatId, messageId);
}

// Handle market details view
function handleMarketDetails(chatId, messageId, marketId) {
  const market = marketData.getMarketById(marketId);
  
  if (!market) {
    const errorMessage = MessageFormatter.formatUserError('market_not_found');
    bot.editMessageText(errorMessage, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown'
    }).catch(err => console.error('Error sending market not found:', err));
    return;
  }

  const message = MessageFormatter.formatSingleMarket(market);
  const backButton = {
    inline_keyboard: [[
      { text: '← Back to Markets', callback_data: 'category_all' }
    ]]
  };

  bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: backButton,
    disable_web_page_preview: true
  }).catch(err => console.error('Error showing market details:', err));
}

// Update user activity
function updateUserActivity(chatId) {
  if (userSessions.has(chatId)) {
    const session = userSessions.get(chatId);
    session.lastActivity = new Date();
    userSessions.set(chatId, session);
  }
}

// Broadcast message to all subscribers
async function broadcastMessage(message) {
  const subscribers = marketData.getSubscribers();
  let sentCount = 0;
  let errorCount = 0;

  for (const chatId of subscribers) {
    try {
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
      });
      sentCount++;
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error sending to ${chatId}:`, error);
      errorCount++;
    }
  }

  return { sentCount, errorCount, totalSubscribers: subscribers.length };
}

// ==========================================
// EXPRESS API ENDPOINTS
// ==========================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    botStats: {
      ...botStats,
      activeUsers: userSessions.size,
      activeMarkets: marketData.getAllMarkets().length
    },
    config: {
      botUsername: config.botUsername,
      websiteUrl: config.websiteUrl,
      nodeEnv: config.nodeEnv
    }
  });
});

// Get all markets (for frontend integration)
app.get('/api/markets', (req, res) => {
  try {
    const category = req.query.category;
    const markets = category && category !== 'all' ? 
      marketData.getMarketsByCategory(category) : 
      marketData.getAllMarkets();
    
    res.json({
      success: true,
      data: markets,
      count: markets.length,
      categories: ['sports', 'crypto', 'politics', 'entertainment']
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch markets',
      details: error.message
    });
  }
});

// Get specific market
app.get('/api/markets/:id', (req, res) => {
  try {
    const market = marketData.getMarketById(req.params.id);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }
    
    res.json({
      success: true,
      data: market
    });
  } catch (error) {
    console.error('Error fetching market:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market',
      details: error.message
    });
  }
});

// Get market statistics
app.get('/api/stats', (req, res) => {
  try {
    const marketStats = marketData.getMarketStats();
    
    res.json({
      success: true,
      data: {
        bot: {
          ...botStats,
          activeUsers: userSessions.size,
          uptime: process.uptime()
        },
        markets: marketStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Handle bet submission from frontend
app.post('/api/bets', async (req, res) => {
  try {
    const { userId, marketId, optionId, amount, strategy, userInfo } = req.body;
    
    // Validate required fields
    if (!marketId || !optionId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: marketId, optionId, amount'
      });
    }

    // Validate market exists
    const market = marketData.getMarketById(marketId);
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }

    if (!market.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Market is no longer active'
      });
    }

    // Find the option
    const option = market.options.find(opt => opt.id === optionId);
    if (!option) {
      return res.status(404).json({
        success: false,
        error: 'Betting option not found'
      });
    }

    // Process bet (in real implementation, save to database)
    const bet = {
      id: generateBetId(),
      userId: userId || 'anonymous',
      marketId,
      optionId,
      amount: parseFloat(amount),
      strategy,
      timestamp: new Date(),
      status: 'pending',
      odds: option.odds
    };

    console.log('📊 New bet placed:', {
      id: bet.id,
      market: market.title,
      option: option.name,
      amount: bet.amount,
      strategy: !!strategy,
      user: userInfo?.username || 'anonymous'
    });

    // Send confirmation to user via Telegram (if we have their chat ID)
    const userChatId = findUserChatId(userId);
    if (userChatId) {
      const confirmationMessage = MessageFormatter.formatBetConfirmation(
        userInfo || { username: 'Anonymous' },
        market.title,
        option.name,
        bet.amount,
        !!strategy
      );

      bot.sendMessage(userChatId, confirmationMessage, {
        parse_mode: 'Markdown'
      }).catch(err => console.error('Error sending bet confirmation:', err));
    }

    // Send admin notification if configured
    if (config.adminChatId) {
      const adminMessage = MessageFormatter.formatAdminNotification('bet_placed', {
        username: userInfo?.username || 'Anonymous',
        marketTitle: market.title,
        amount: bet.amount,
        isStrategy: !!strategy
      });
      
      bot.sendMessage(config.adminChatId, adminMessage, {
        parse_mode: 'Markdown'
      }).catch(err => console.error('Error sending admin notification:', err));
    }

    // Update stats
    botStats.totalBets++;

    res.json({
      success: true,
      data: {
        betId: bet.id,
        message: 'Bet placed successfully',
        market: market.title,
        option: option.name,
        amount: bet.amount,
        potentialWin: (bet.amount * option.odds).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error processing bet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bet',
      details: error.message
    });
  }
});

// Send strategy update notification
app.post('/api/notify/strategy-update', async (req, res) => {
  try {
    const { userId, marketTitle, strategyName, update } = req.body;
    
    if (!userId || !marketTitle || !strategyName || !update) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const userChatId = findUserChatId(userId);
    if (!userChatId) {
      return res.status(404).json({
        success: false,
        error: 'User not found or not registered with bot'
      });
    }

    const message = MessageFormatter.formatStrategyUpdate(marketTitle, strategyName, update);
    
    await bot.sendMessage(userChatId, message, {
      parse_mode: 'Markdown'
    });

    res.json({
      success: true,
      message: 'Strategy update sent successfully'
    });

  } catch (error) {
    console.error('Error sending strategy update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send strategy update',
      details: error.message
    });
  }
});

// Send bet result notification
app.post('/api/notify/bet-result', async (req, res) => {
  try {
    const { userId, marketTitle, optionName, betAmount, result, winAmount } = req.body;
    
    if (!userId || !marketTitle || !optionName || !betAmount || !result) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const userChatId = findUserChatId(userId);
    if (!userChatId) {
      return res.status(404).json({
        success: false,
        error: 'User not found or not registered with bot'
      });
    }

    const message = MessageFormatter.formatBetResult(
      marketTitle, 
      optionName, 
      betAmount, 
      result, 
      winAmount || 0
    );
    
    await bot.sendMessage(userChatId, message, {
      parse_mode: 'Markdown'
    });

    res.json({
      success: true,
      message: 'Bet result notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending bet result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bet result notification',
      details: error.message
    });
  }
});

// Broadcast message to all users
app.post('/api/broadcast', async (req, res) => {
  try {
    const { message, targetCategory } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const result = await broadcastMessage(message);

    res.json({
      success: true,
      ...result,
      message: 'Broadcast completed successfully'
    });

  } catch (error) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast message',
      details: error.message
    });
  }
});

// Create new market (for AI integration)
app.post('/api/markets', (req, res) => {
  try {
    const marketData_new = req.body;
    
    if (!marketData_new.title || !marketData_new.description || !marketData_new.options) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, options'
      });
    }

    const newMarket = marketData.addMarket(marketData_new);
    
    console.log('🆕 New market created:', newMarket.title);

    res.json({
      success: true,
      data: newMarket,
      message: 'Market created successfully'
    });

  } catch (error) {
    console.error('Error creating market:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create market',
      details: error.message
    });
  }
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function generateBetId() {
  return 'bet_' + Math.random().toString(36).substr(2, 9);
}

function findUserChatId(userId) {
  // In a real implementation, you'd look this up in a database
  // For now, we'll return null since we don't have user ID mapping
  // You could implement a registration system where users link their accounts
  
  // Example: If userId matches a session username, return chatId
  for (const [chatId, session] of userSessions.entries()) {
    if (session.username === userId || session.firstName === userId) {
      return chatId;
    }
  }
  
  return null;
}

// ==========================================
// ERROR HANDLING
// ==========================================

// Handle bot polling errors
bot.on('polling_error', (error) => {
  console.error('Bot polling error:', error.code, error.message);
  
  // Try to restart polling after a delay
  if (error.code === 'EFATAL') {
    console.log('🔄 Attempting to restart bot polling in 5 seconds...');
    setTimeout(() => {
      console.log('🤖 Restarting bot...');
      process.exit(1); // Let process manager restart the bot
    }, 5000);
  }
});

// Handle general bot errors
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  
  // Close bot polling
  bot.stopPolling();
  
  // Close Express server
  process.exit(0);
});

// ==========================================
// PERIODIC TASKS
// ==========================================

// Update markets and notify users every 5 minutes
setInterval(() => {
  try {
    // Close expired markets
    const closedMarkets = marketData.closeExpiredMarkets();
    
    if (closedMarkets.length > 0) {
      console.log(`🔄 Closed ${closedMarkets.length} expired markets`);
      
      // Optionally notify admin about closed markets
      if (config.adminChatId) {
        const message = `🔔 **Markets Update**\n\nClosed ${closedMarkets.length} expired markets:\n${closedMarkets.map(m => `• ${m.title}`).join('\n')}`;
        
        bot.sendMessage(config.adminChatId, message, {
          parse_mode: 'Markdown'
        }).catch(err => console.error('Error sending admin notification:', err));
      }
    }
    
    // Generate new random market occasionally (for demo purposes)
    if (Math.random() < 0.1) { // 10% chance every 5 minutes
      const newMarket = marketData.generateRandomMarket();
      console.log('🤖 AI generated new market:', newMarket.title);
      
      // Notify admin about new market
      if (config.adminChatId) {
        const message = `🆕 **AI Generated New Market**\n\n${MessageFormatter.formatSingleMarket(newMarket)}`;
        
        bot.sendMessage(config.adminChatId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        }).catch(err => console.error('Error sending admin notification:', err));
      }
    }
    
  } catch (error) {
    console.error('Error in periodic update:', error);
  }
}, config.updateInterval);

// Clean up inactive user sessions daily
setInterval(() => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let cleanedCount = 0;
  
  for (const [chatId, session] of userSessions.entries()) {
    if (session.lastActivity < oneDayAgo) {
      userSessions.delete(chatId);
      marketData.unsubscribeUser(chatId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} inactive user sessions`);
  }
}, 24 * 60 * 60 * 1000); // Daily

// ==========================================
// START SERVER
// ==========================================

app.listen(config.port, () => {
  console.log(`🚀 Bot API server running on port ${config.port}`);
  console.log(`🌐 Frontend URL: ${config.websiteUrl}`);
  console.log(`🤖 Bot username: @${config.botUsername}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`📡 API endpoints: http://localhost:${config.port}/api/`);
  
  if (config.adminChatId) {
    console.log(`👨‍💼 Admin notifications enabled`);
  }
  
  console.log('\n✅ AI Betting Bot is ready to serve!');
  console.log('📱 Users can now interact with your bot on Telegram');
  console.log('🔗 Bot integrates seamlessly with your React frontend');
});