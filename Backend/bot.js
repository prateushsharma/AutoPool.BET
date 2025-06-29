/**
 * ================================================================
 * 🤖 AI Betting Bot - API Integration Version
 * ---------------------------------------------------------------
 
 * A full-featured AI-powered prediction market bot using:
 * - Telegram Bot API (via node-telegram-bot-api)
 * - Express API for frontend integration
 * - Real-time rounds data from localhost:5000/api/game/list-rounds
 * - Continuous round monitoring & notifications
 * - Join round functionality via localhost:3000/game/{roundId}
 * 
 * Maintained by: [Your Name / Team]
 * License: MIT
 * ================================================================
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Local config & services
const config = require('./config/config');
const MessageFormatter = require('./utils/messageFormatter');

// Express setup
const app = express();
app.use(cors());
app.use(express.json());

// Telegram Bot setup
const bot = new TelegramBot(config.botToken, { polling: true });

// Track sessions & stats
const userSessions = new Map();
const botStats = {
  startTime: new Date(),
  totalUsers: 0,
  totalMessages: 0,
  totalRounds: 0
};

// Round monitoring
let knownRounds = new Set();
let roundMonitorInterval = null;

// API Configuration
const API_CONFIG = {
  gameAPI: 'http://localhost:5000',
  joinURL: 'http://localhost:3000/game',
  pollInterval: 5000 // Check for new rounds every 5 seconds
};

console.log('🚀 Starting AI Betting Bot with API Integration...');

/* ============================================
 * API FUNCTIONS
 * ============================================
 */

// Fetch active rounds from API
async function fetchActiveRounds() {
  try {
    const response = await axios.post(`${API_CONFIG.gameAPI}/api/game/list-rounds`, {
      status: "active",
      limit: 20
    });

    if (response.data.success) {
      return response.data.rounds;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching rounds:', error.message);
    return [];
  }
}

// Check for new rounds and notify users
async function checkForNewRounds() {
  try {
    const activeRounds = await fetchActiveRounds();
    const newRounds = [];

    activeRounds.forEach(round => {
      if (!knownRounds.has(round.id)) {
        knownRounds.add(round.id);
        newRounds.push(round);
      }
    });

    // Notify users about new rounds
    if (newRounds.length > 0) {
      console.log(`🆕 Found ${newRounds.length} new round(s)`);
      
      for (const round of newRounds) {
        await notifyUsersAboutNewRound(round);
        botStats.totalRounds++;
      }
    }

    // Clean up expired rounds from memory
    const activeRoundIds = new Set(activeRounds.map(r => r.id));
    knownRounds = new Set([...knownRounds].filter(id => activeRoundIds.has(id)));

  } catch (error) {
    console.error('❌ Error checking for new rounds:', error.message);
  }
}

// Notify all active users about new round
async function notifyUsersAboutNewRound(round) {
  const message = MessageFormatter.formatNewRoundNotification(round);
  const keyboard = MessageFormatter.getRoundJoinKeyboard(round.id);

  for (const [chatId, session] of userSessions) {
    if (session.notifications) {
      try {
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (error) {
        console.error(`❌ Failed to notify user ${chatId}:`, error.message);
      }
    }
  }
}

/* ============================================
 * BOT COMMANDS
 * ============================================
 */

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  if (!userSessions.has(chatId)) {
    userSessions.set(chatId, {
      username: user.username,
      firstName: user.first_name,
      joinedAt: new Date(),
      lastActivity: new Date(),
      notifications: true
    });
    botStats.totalUsers++;

    console.log(`👤 New user joined: ${user.username || user.first_name} (${chatId})`);
    
    // Admin notification
    if (config.adminChatId) {
      bot.sendMessage(
        config.adminChatId,
        MessageFormatter.formatAdminNotification('new_user', {
          username: user.username || user.first_name,
          chatId: chatId
        }),
        { parse_mode: 'Markdown' }
      ).catch(console.error);
    }
  }

  updateUserActivity(chatId);

  try {
    await bot.sendMessage(chatId, config.messages.welcome, {
      parse_mode: 'Markdown',
      reply_markup: MessageFormatter.getMainKeyboard()
    });
  } catch (error) {
    console.error('❌ Error sending welcome message:', error.message);
  }

  botStats.totalMessages++;
});

bot.onText(/\/rounds/, async (msg) => {
  const chatId = msg.chat.id;
  updateUserActivity(chatId);

  try {
    const activeRounds = await fetchActiveRounds();
    const message = MessageFormatter.formatActiveRounds(activeRounds);
    const keyboard = MessageFormatter.getRefreshKeyboard();

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('❌ Error sending rounds:', error.message);
    bot.sendMessage(chatId, '❌ Failed to fetch active rounds. Please try again later.');
  }

  botStats.totalMessages++;
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  updateUserActivity(chatId);
  
  const helpMessage = `🤖 **AI Betting Bot Help**

**Available Commands:**
/start - Welcome & main menu
/rounds - View all active rounds
/notify [on/off] - Toggle notifications
/stats - View bot statistics
/help - Show this help

**Features:**
🎯 Real-time round monitoring
🔔 Instant new round notifications
🎲 Quick join functionality
📊 Live round statistics

**How it works:**
1. I monitor active rounds every 5 seconds
2. When new rounds appear, I notify you instantly
3. Click "🚀 JOIN ROUND" to participate
4. Toggle notifications with /notify

*Stay ahead of the game with AI-powered alerts!*`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  botStats.totalMessages++;
});

bot.onText(/\/notify\s*(on|off)?/, (msg, match) => {
  const chatId = msg.chat.id;
  const action = match[1];
  
  updateUserActivity(chatId);
  
  if (!userSessions.has(chatId)) {
    bot.sendMessage(chatId, '❌ Please use /start first to initialize your session.');
    return;
  }

  const session = userSessions.get(chatId);
  
  if (action === 'on') {
    session.notifications = true;
    bot.sendMessage(chatId, '🔔 **Notifications ON**\n\nYou\'ll receive alerts about new rounds!', { parse_mode: 'Markdown' });
  } else if (action === 'off') {
    session.notifications = false;
    bot.sendMessage(chatId, '🔕 **Notifications OFF**\n\nYou won\'t receive round alerts.', { parse_mode: 'Markdown' });
  } else {
    const status = session.notifications ? 'ON 🔔' : 'OFF 🔕';
    bot.sendMessage(chatId, 
      `📱 **Notification Status:** ${status}\n\nUse:\n/notify on - Enable alerts\n/notify off - Disable alerts`, 
      { parse_mode: 'Markdown' }
    );
  }
  
  botStats.totalMessages++;
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  updateUserActivity(chatId);

  try {
    const activeRounds = await fetchActiveRounds();
    const uptime = Math.floor(process.uptime());
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const statsMessage = `📊 **Bot Statistics**

👥 **Total Users:** ${botStats.totalUsers}
📝 **Total Messages:** ${botStats.totalMessages}
🎯 **Rounds Detected:** ${botStats.totalRounds}
🎮 **Active Rounds:** ${activeRounds.length}
🔔 **Active Notifications:** ${Array.from(userSessions.values()).filter(s => s.notifications).length}

⏱️ **Uptime:** ${hours}h ${minutes}m
🚀 **Started:** ${botStats.startTime.toLocaleString()}

🤖 *Monitoring rounds every ${API_CONFIG.pollInterval/1000} seconds*`;

    await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('❌ Error sending stats:', error.message);
  }

  botStats.totalMessages++;
});

/* ============================================
 * CALLBACK QUERIES
 * ============================================
 */

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  updateUserActivity(chatId);

  try {
    if (data.startsWith('join_round_')) {
      const roundId = data.replace('join_round_', '');
      const joinUrl = `${API_CONFIG.joinURL}/${roundId}`;
      
      await bot.answerCallbackQuery(query.id, { 
        text: '🚀 Opening round...', 
        url: joinUrl 
      });

      // Also send a message with the link
      await bot.sendMessage(chatId, 
        `🎯 **Joining Round!**\n\n🚀 **[CLICK HERE TO JOIN ROUND](${joinUrl})**\n\n*The round will open in your browser.*`,
        { parse_mode: 'Markdown' }
      );

    } else if (data === 'refresh_rounds') {
      const activeRounds = await fetchActiveRounds();
      const message = MessageFormatter.formatActiveRounds(activeRounds);
      const keyboard = MessageFormatter.getRefreshKeyboard();

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

      await bot.answerCallbackQuery(query.id, { text: '✅ Rounds refreshed!' });

    } else if (data === 'view_all_rounds') {
      const activeRounds = await fetchActiveRounds();
      const message = MessageFormatter.formatActiveRounds(activeRounds);
      const keyboard = MessageFormatter.getRefreshKeyboard();

      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

      await bot.answerCallbackQuery(query.id, { text: '📋 All rounds displayed!' });
    }

  } catch (error) {
    console.error('❌ Callback query error:', error.message);
    await bot.answerCallbackQuery(query.id, { text: '❌ Error occurred!' });
  }
});

/* ============================================
 * EXPRESS API ROUTES
 * ============================================
 */

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    botStats: {
      ...botStats,
      activeUsers: userSessions.size,
      knownRounds: knownRounds.size
    },
    apiConfig: API_CONFIG
  });
});

// Get bot statistics
app.get('/api/bot/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      ...botStats,
      activeUsers: userSessions.size,
      knownRounds: knownRounds.size,
      notificationUsers: Array.from(userSessions.values()).filter(s => s.notifications).length
    }
  });
});

// Manual round check endpoint
app.post('/api/bot/check-rounds', async (req, res) => {
  try {
    await checkForNewRounds();
    res.json({ success: true, message: 'Round check completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active rounds (proxy)
app.get('/api/rounds', async (req, res) => {
  try {
    const rounds = await fetchActiveRounds();
    res.json({ success: true, data: rounds });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
 * HELPERS & UTILITIES
 * ============================================
 */

function updateUserActivity(chatId) {
  if (userSessions.has(chatId)) {
    const session = userSessions.get(chatId);
    session.lastActivity = new Date();
  }
}

// Start round monitoring
function startRoundMonitoring() {
  console.log(`🔄 Starting round monitoring (${API_CONFIG.pollInterval}ms interval)`);
  
  roundMonitorInterval = setInterval(async () => {
    await checkForNewRounds();
  }, API_CONFIG.pollInterval);

  // Initial check
  checkForNewRounds();
}

// Stop round monitoring
function stopRoundMonitoring() {
  if (roundMonitorInterval) {
    clearInterval(roundMonitorInterval);
    roundMonitorInterval = null;
    console.log('⏹️ Round monitoring stopped');
  }
}

/* ============================================
 * START SERVER & MONITORING
 * ============================================
 */

app.listen(config.port, () => {
  console.log(`✅ API running on port ${config.port}`);
  console.log(`🤖 Bot username: @${config.botUsername}`);
  console.log(`🔗 Game API: ${API_CONFIG.gameAPI}`);
  console.log(`🎮 Join URL: ${API_CONFIG.joinURL}`);
  console.log('Ready to monitor rounds!');
  
  // Start monitoring rounds
  startRoundMonitoring();
});

/* ============================================
 * ERRORS & CLEANUP
 * ============================================
 */

process.on('SIGINT', () => {
  console.log('\n🛑 Graceful shutdown...');
  stopRoundMonitoring();
  bot.stopPolling();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});