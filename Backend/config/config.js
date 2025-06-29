/**
 * ================================================================
 * 🤖 Configuration - API Integration Version
 * ---------------------------------------------------------------
 * File: ai-betting-bot/config/config.js
 * 
 * Configuration for AI betting bot with API integration
 * ================================================================
 */
require('dotenv').config();
module.exports = {
  // Telegram Bot Configuration
  botToken: process.env.BOT_TOKEN ,
  botUsername: process.env.BOT_USERNAME ,
  adminChatId: process.env.ADMIN_CHAT_ID || null, // Optional admin notifications

  // Server Configuration
  port: process.env.PORT || 3001,

  // API Configuration
  gameAPI: {
    baseURL: process.env.GAME_API_URL || 'http://localhost:5000',
    endpoints: {
      listRounds: '/api/game/list-rounds'
    }
  },

  // Join URL Configuration
  joinURL: process.env.JOIN_URL || 'http://localhost:3000/game',

  // Round Monitoring Configuration
  monitoring: {
    pollInterval: parseInt(process.env.POLL_INTERVAL) || 5000, // 5 seconds
    maxRoundsToShow: parseInt(process.env.MAX_ROUNDS_SHOW) || 10,
    notificationDelay: parseInt(process.env.NOTIFICATION_DELAY) || 1000 // 1 second delay between notifications
  },

  // Bot Messages
  messages: {
    welcome: `🤖 **Welcome to AI Betting Bot!** 🎯

I'm your personal assistant for real-time betting rounds!

🚀 **What I do:**
• Monitor active rounds every 5 seconds
• Send instant notifications for new rounds
• Provide quick join links
• Track round statistics

🔔 **Get Started:**
• Use /rounds to see active rounds
• Enable /notify on for instant alerts
• Click join buttons to participate

⚡ **Ready to win? Let's go!**`,

    help: `🤖 **AI Betting Bot Help**

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

*Stay ahead of the game with AI-powered alerts!*`,

    noRounds: `🎮 **No Active Rounds**

Currently no betting rounds are active.

🔔 Enable notifications with /notify on to get alerted when new rounds start!

⚡ *New rounds appear frequently - stay tuned!*`,

    error: `❌ **Oops! Something went wrong.**

Please try again in a moment.

If the problem persists, contact support.`,

    notificationsEnabled: `🔔 **Notifications ON**

You'll receive alerts about new rounds!

⚡ *You'll be the first to know when new rounds start!*`,

    notificationsDisabled: `🔕 **Notifications OFF**

You won't receive round alerts.

💡 *Use /notify on to re-enable alerts*`
  },

  // Rate Limiting
  rateLimiting: {
    maxMessagesPerUser: 30, // per minute
    maxNotificationsPerHour: 50,
    cooldownBetweenJoins: 5000 // 5 seconds
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    logDirectory: process.env.LOG_DIRECTORY || './logs'
  },

  // Feature Flags
  features: {
    enableAdminNotifications: process.env.ENABLE_ADMIN_NOTIFICATIONS !== 'false',
    enableRoundStatistics: process.env.ENABLE_ROUND_STATS !== 'false',
    enableUserTracking: process.env.ENABLE_USER_TRACKING !== 'false',
    enableAutoRefresh: process.env.ENABLE_AUTO_REFRESH !== 'false'
  },

  // Error Handling
  errorHandling: {
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 2000,
    enableFallbackMode: process.env.ENABLE_FALLBACK_MODE !== 'false'
  },

  // Timeouts
  timeouts: {
    apiRequest: parseInt(process.env.API_TIMEOUT) || 10000, // 10 seconds
    botResponse: parseInt(process.env.BOT_TIMEOUT) || 5000,  // 5 seconds
    notificationBatch: parseInt(process.env.NOTIFICATION_BATCH_TIMEOUT) || 30000 // 30 seconds
  }
};