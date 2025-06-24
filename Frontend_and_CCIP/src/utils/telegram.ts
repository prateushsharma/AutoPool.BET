// Place this file as: src/utils/telegram.ts

import { BetMarket, BetSelection, TelegramBotConfig, MarketAnalytics } from '../types/betting';

// Configuration - Replace with your actual bot details
const TELEGRAM_BOT_CONFIG: TelegramBotConfig = {
  botUsername: 'pulsepicksai_bot', // Replace with your bot username (without @)
  startParameter: 'bet'
};

// Your website URL where users will be redirected from Telegram
const WEBSITE_URL = 'localhost:3000'; // Replace with your actual domain

/**
 * Generate a direct URL to your betting page for a specific market
 */
export const generateBetPageUrl = (marketId: string, optionId?: string): string => {
  const baseUrl = `${WEBSITE_URL}/bet/${marketId}`;
  
  if (optionId) {
    return `${baseUrl}?option=${optionId}`;
  }
  
  return baseUrl;
};

/**
 * Generate Telegram bot URL with encoded bet data
 */
export const generateTelegramBotUrl = (betSelection?: BetSelection): string => {
  const baseUrl = `https://t.me/${TELEGRAM_BOT_CONFIG.botUsername}`;
  
  if (!betSelection) {
    return `${baseUrl}?start=${TELEGRAM_BOT_CONFIG.startParameter}`;
  }

  // Encode bet selection data for the bot
  const betData = {
    marketId: betSelection.marketId,
    optionId: betSelection.optionId,
    odds: betSelection.odds,
    marketTitle: betSelection.marketTitle,
    optionName: betSelection.optionName,
    strategy: betSelection.strategy,
    strategyType: betSelection.strategyType
  };

  const encodedData = btoa(JSON.stringify(betData));
  return `${baseUrl}?start=${TELEGRAM_BOT_CONFIG.startParameter}_${encodedData}`;
};

/**
 * Open Telegram bot with optional bet selection data
 */
export const openTelegramBot = (betSelection?: BetSelection): void => {
  const url = generateTelegramBotUrl(betSelection);
  
  // Check if user is on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    // On mobile, directly open Telegram app
    window.open(url, '_blank');
  } else {
    // On desktop, open Telegram Web
    window.open(url, '_blank');
  }
};

/**
 * Format a single market for Telegram message display
 */
export const generateTelegramBotMessage = (market: BetMarket): string => {
  const betUrl = generateBetPageUrl(market.id);
  
  // Format end time
  const endTime = new Date(market.endTime);
  const timeString = endTime.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Generate options text
  const optionsText = market.options.map((option, index) => 
    `${index + 1}. ${option.name} - **${option.odds}x** odds`
  ).join('\n');

  return `
🎯 **${market.title}**
${market.description}

📊 **Betting Options:**
${optionsText}

⏰ **Ends:** ${timeString}
🏷️ **Category:** ${market.category.toUpperCase()}
🤖 **AI Generated**

🎲 **Place Your Strategic Bet:**
[🚀 BET NOW](${betUrl})

💡 *Tip: Use our strategy builder for automated betting!*
  `.trim();
};

/**
 * Format multiple markets for Telegram bot display
 */
export const formatMarketsForTelegram = (markets: BetMarket[]): string => {
  if (markets.length === 0) {
    return `
🚫 **No Active Markets**

Our AI is currently generating new betting opportunities. Check back soon!

🤖 *Markets are created automatically based on trending topics and events.*
    `.trim();
  }

  let message = "🎰 **ACTIVE AI BETTING MARKETS** 🎰\n\n";
  
  markets.slice(0, 10).forEach((market, index) => { // Limit to 10 markets to avoid message length limits
    const betUrl = generateBetPageUrl(market.id);
    const endTime = new Date(market.endTime);
    const timeRemaining = getTimeRemaining(endTime);
    
    message += `**${index + 1}. ${market.title}**\n`;
    message += `   📝 ${market.description.substring(0, 80)}${market.description.length > 80 ? '...' : ''}\n`;
    message += `   🎲 [Place Bet](${betUrl}) | ⏰ ${timeRemaining}\n`;
    message += `   🏷️ ${market.category.toUpperCase()} | 🤖 AI Generated\n\n`;
  });

  if (markets.length > 10) {
    message += `*...and ${markets.length - 10} more markets available!*\n\n`;
  }

  message += `🔄 *Markets update automatically every few minutes*\n`;
  message += `💡 *Use our strategy builder for automated betting*`;

  return message;
};

/**
 * Format market categories for Telegram inline keyboard
 */
export const generateCategoryKeyboard = (): string => {
  const categories = [
    { text: '⚽ Sports', callback_data: 'category_sports' },
    { text: '💰 Crypto', callback_data: 'category_crypto' },
    { text: '🏛️ Politics', callback_data: 'category_politics' },
    { text: '🎬 Entertainment', callback_data: 'category_entertainment' },
    { text: '📊 All Markets', callback_data: 'category_all' }
  ];

  // Return as JSON string for Telegram bot API
  return JSON.stringify({
    inline_keyboard: [
      categories.slice(0, 2),
      categories.slice(2, 4),
      [categories[4]]
    ]
  });
};

/**
 * Format strategy execution updates for Telegram
 */
export const formatStrategyUpdateMessage = (
  marketTitle: string,
  strategyName: string,
  update: {
    betsPlaced: number;
    currentProfit: number;
    winRate: number;
    status: string;
  }
): string => {
  const profitEmoji = update.currentProfit >= 0 ? '📈' : '📉';
  const statusEmoji = update.status === 'running' ? '🟢' : update.status === 'completed' ? '✅' : '⏸️';
  
  return `
${statusEmoji} **Strategy Update**

🎯 **Market:** ${marketTitle}
🤖 **Strategy:** ${strategyName}

📊 **Performance:**
• Bets Placed: ${update.betsPlaced}
• Win Rate: ${(update.winRate * 100).toFixed(1)}%
• Current P&L: ${profitEmoji} $${update.currentProfit.toFixed(2)}

📈 **Status:** ${update.status.toUpperCase()}

*Your automated strategy is working 24/7!*
  `.trim();
};

/**
 * Format bet result notification for Telegram
 */
export const formatBetResultMessage = (
  marketTitle: string,
  optionName: string,
  betAmount: number,
  result: 'won' | 'lost',
  winAmount?: number
): string => {
  if (result === 'won') {
    return `
🎉 **BET WON!** 🎉

🎯 **Market:** ${marketTitle}
✅ **Winning Option:** ${optionName}
💰 **Bet Amount:** $${betAmount}
🏆 **Winnings:** $${winAmount?.toFixed(2) || '0.00'}

*Congratulations! Your bet was successful!* 🚀
    `.trim();
  } else {
    return `
😔 **Bet Result**

🎯 **Market:** ${marketTitle}
❌ **Option:** ${optionName}
💸 **Amount:** $${betAmount}

*Better luck next time! Keep refining your strategy.* 💪
    `.trim();
  }
};

/**
 * Validate Telegram bot username format
 */
export const validateBotUsername = (username: string): boolean => {
  // Telegram bot username rules: 5-32 characters, alphanumeric + underscore, must end with 'bot'
  const botUsernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
  return botUsernameRegex.test(username) && username.toLowerCase().endsWith('bot');
};

/**
 * Decode bet data from Telegram bot start parameter
 */
export const decodeBetDataFromTelegram = (startParam: string): BetSelection | null => {
  try {
    // Remove the 'bet_' prefix if present
    const encodedData = startParam.replace(/^bet_/, '');
    const decodedString = atob(encodedData);
    const betData = JSON.parse(decodedString);
    
    // Validate required fields
    if (betData.marketId && betData.optionId && betData.odds) {
      return betData as BetSelection;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to decode bet data from Telegram:', error);
    return null;
  }
};

/**
 * Generate shareable market link for social sharing
 */
export const generateShareableMarketLink = (market: BetMarket): string => {
  const betUrl = generateBetPageUrl(market.id);
  const shareText = encodeURIComponent(`Check out this AI-generated betting market: ${market.title}`);
  
  return `https://t.me/share/url?url=${encodeURIComponent(betUrl)}&text=${shareText}`;
};

/**
 * Helper function to calculate time remaining
 */
const getTimeRemaining = (endTime: Date): string => {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Format market analytics for Telegram admin dashboard
 */
export const formatMarketAnalyticsMessage = (analytics: MarketAnalytics): string => {
  return `
📊 **Market Analytics**

🎯 **Market ID:** ${analytics.marketId}
💰 **Total Volume:** $${analytics.totalVolume.toLocaleString()}
🎲 **Total Bets:** ${analytics.betCount}
🏆 **Most Popular:** ${analytics.popularOption}

📈 **Recent Activity:**
${analytics.oddsHistory.slice(-3).map(entry => 
  `• ${new Date(entry.timestamp).toLocaleTimeString()}: ${entry.odds}x`
).join('\n')}

*Real-time market performance tracking*
  `.trim();
};

// Export configuration for external use
export const getTelegramConfig = (): TelegramBotConfig => {
  return { ...TELEGRAM_BOT_CONFIG };
};

// Export website URL for external use
export const getWebsiteUrl = (): string => {
  return WEBSITE_URL;
};