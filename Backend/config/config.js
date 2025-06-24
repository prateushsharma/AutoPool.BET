// Place this file as: ai-betting-bot/config/config.js

require('dotenv').config();

const config = {
  // Telegram Bot Configuration
  botToken: process.env.BOT_TOKEN,
  botUsername: process.env.BOT_USERNAME || 'YourBotUsername',
  
  // Frontend Integration
  websiteUrl: process.env.WEBSITE_URL || 'https://yourdomain.com',
  
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Optional Configuration
  webhookUrl: process.env.WEBHOOK_URL,
  adminChatId: process.env.ADMIN_CHAT_ID,
  
  // Bot Settings
  maxMarketsPerMessage: 8,
  updateInterval: 300000, // 5 minutes in milliseconds
  
  // Message Templates
  messages: {
    welcome: `🎰 **Welcome to AI BetHub!** 🤖

Your intelligent betting companion powered by advanced AI analysis.

🎯 **What I can do:**
• Show you AI-generated betting markets
• Direct you to strategic betting options
• Send real-time market updates
• Notify you of bet results

📊 **Available Categories:**
⚽ Sports • 💰 Crypto & Tech • 🏛️ Politics • 🎬 Entertainment

🚀 **Get Started:**
Use the buttons below or type /markets to see active opportunities!`,

    help: `ℹ️ **AI BetHub Bot Help**

**Commands:**
/start - Show welcome message and markets
/markets - View all active betting markets  
/sports - Sports betting opportunities
/crypto - Crypto & tech predictions
/politics - Political event betting
/help - Show this help message

**How it works:**
1️⃣ Browse AI-generated markets here
2️⃣ Click market links to visit our website
3️⃣ Place bets with custom strategies
4️⃣ Get real-time updates on results

**Tips:**
🤖 All markets are AI-analyzed for trends
💡 Use our strategy builder for automated betting
📱 Seamless experience between bot and website

Need more help? Contact our support team!`,

    noMarkets: `🚫 **No Active Markets**

Our AI is currently analyzing market conditions and generating new betting opportunities.

🤖 **What's happening:**
• Scanning trending topics and events
• Analyzing social media sentiment  
• Processing financial market data
• Identifying profitable opportunities

⏰ **Check back soon!** New markets are created throughout the day.

🔔 Want notifications? Use /start to stay updated!`,

    error: `❌ **Oops! Something went wrong**

We're experiencing a temporary issue. Please try again in a moment.

If the problem persists:
• Use /help for available commands
• Contact our support team
• Check our website directly

🤖 Our AI is working to resolve this quickly!`
  }
};

// Validation
if (!config.botToken) {
  console.error('❌ BOT_TOKEN is required in environment variables');
  process.exit(1);
}

module.exports = config;