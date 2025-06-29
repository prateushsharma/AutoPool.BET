/**
 * ================================================================
 * 🤖 AI Betting Bot Server
 * ---------------------------------------------------------------
 * File: ai-betting-bot/bot.js
 * 
 * - Telegram Bot for sending notifications & confirmations
 * - Express API for frontend → backend betting flow
 * - Clean & minimal, no hardcoded markets logic
 * 
 * Maintained by: [Your Name / Team]
 * ================================================================
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
// === Basic config ===
const config = {
  botToken: process.env.BOT_TOKEN,
  adminChatId: process.env.ADMIN_CHAT_ID,
  botUsername: process.env.BOT_USERNAME,
  port: process.env.PORT 
};

// === Initialize ===
const app = express();
app.use(cors());
app.use(express.json());

const bot = new TelegramBot(config.botToken, { polling: true });

console.log('🚀 AI Betting Bot server is running...');

// === API ===

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * Place a bet
 * Example body: { userId, marketId, optionId, amount, userInfo }
 */
app.post('/api/bets', async (req, res) => {
  const { userId, marketId, optionId, amount, userInfo } = req.body;

  if (!marketId || !optionId || !amount) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // 👉 Save your bet to DB here
  console.log(`🎲 Bet received: ${userId || 'anonymous'} bet ${amount} on option ${optionId}`);

  // 👉 Send Telegram confirmation if you have chat ID
  if (userInfo?.chatId) {
    await bot.sendMessage(
      userInfo.chatId,
      `✅ Your bet of ${amount} has been placed on option ${optionId}.\nMarket ID: ${marketId}`,
      { parse_mode: 'Markdown' }
    ).catch(console.error);
  }

  // 👉 Notify admin (optional)
  if (config.adminChatId) {
    bot.sendMessage(
      config.adminChatId,
      `📢 New bet: ${userId || 'anonymous'} bet ${amount} on option ${optionId} (Market ${marketId})`
    ).catch(console.error);
  }

  res.json({
    success: true,
    message: 'Bet placed successfully'
  });
});

/**
 * Send strategy update
 * Example body: { userId, marketTitle, strategyName, update, userInfo }
 */
app.post('/api/notify/strategy-update', async (req, res) => {
  const { userId, marketTitle, strategyName, update, userInfo } = req.body;

  if (!userInfo?.chatId) {
    return res.status(400).json({ success: false, error: 'Missing user chatId' });
  }

  const message = `📈 *Strategy Update*\nMarket: ${marketTitle}\nStrategy: ${strategyName}\nUpdate: ${update}`;

  await bot.sendMessage(userInfo.chatId, message, { parse_mode: 'Markdown' }).catch(console.error);

  res.json({ success: true, message: 'Strategy update sent' });
});

/**
 * Send bet result
 * Example body: { userId, marketTitle, optionName, betAmount, result, winAmount, userInfo }
 */
app.post('/api/notify/bet-result', async (req, res) => {
  const { marketTitle, optionName, betAmount, result, winAmount, userInfo } = req.body;

  if (!userInfo?.chatId) {
    return res.status(400).json({ success: false, error: 'Missing user chatId' });
  }

  const message = `🎉 *Bet Result*\nMarket: ${marketTitle}\nOption: ${optionName}\nAmount: ${betAmount}\nResult: ${result}\nWinnings: ${winAmount}`;

  await bot.sendMessage(userInfo.chatId, message, { parse_mode: 'Markdown' }).catch(console.error);

  res.json({ success: true, message: 'Bet result notification sent' });
});

/**
 * Broadcast message to all users
 * Example body: { message, chatIds: [] }
 */
app.post('/api/broadcast', async (req, res) => {
  const { message, chatIds } = req.body;

  if (!message || !Array.isArray(chatIds)) {
    return res.status(400).json({ success: false, error: 'Message and chatIds required' });
  }

  let sent = 0;
  for (const chatId of chatIds) {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' }).catch(console.error);
    sent++;
  }

  res.json({ success: true, sentCount: sent });
});

// === Graceful shutdown ===

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  bot.stopPolling();
  process.exit(0);
});

// === Start server ===

app.listen(config.port, () => {
  console.log(`✅ API running on port ${config.port}`);
});
