// Place this file as: ai-betting-bot/utils/messageFormatter.js

const config = require('../config/config');

class MessageFormatter {
  // Format a single market for display
  static formatSingleMarket(market) {
    const betUrl = `${config.websiteUrl}/bet/${market.id}`;
    const endTime = new Date(market.endTime);
    const timeString = endTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format options with odds
    const optionsText = market.options
      .slice(0, 4) // Limit to 4 options to avoid message length issues
      .map((option, index) => 
        `${index + 1}. **${option.name}** - ${option.odds}x`
      ).join('\n');

    const moreOptions = market.options.length > 4 
      ? `\n*...and ${market.options.length - 4} more options*` 
      : '';

    return `🎯 **${market.title}**
${market.description}

📊 **Betting Options:**
${optionsText}${moreOptions}

⏰ **Ends:** ${timeString}
🏷️ **Category:** ${market.category.toUpperCase()}
🤖 **AI Generated**

🎲 **[🚀 START BETTING NOW](${betUrl})**

💡 *Click the link above to place your bet with our strategy builder!*`;
  }

  // Format multiple markets for listing
  static formatMarketsList(markets, title = "Active Markets") {
    if (!markets || markets.length === 0) {
      return config.messages.noMarkets;
    }

    const maxMarkets = Math.min(markets.length, config.maxMarketsPerMessage);
    let message = `🎰 **${title.toUpperCase()}** 🎰\n\n`;
    
    markets.slice(0, maxMarkets).forEach((market, index) => {
      const betUrl = `${config.websiteUrl}/bet/${market.id}`;
      const timeRemaining = this.getTimeRemaining(new Date(market.endTime));
      
      // Truncate description for list view
      const shortDescription = market.description.length > 80 
        ? market.description.substring(0, 80) + '...'
        : market.description;
      
      message += `**${index + 1}. ${market.title}**\n`;
      message += `📝 ${shortDescription}\n`;
      
      // Show top 2 options with odds
      const topOptions = market.options.slice(0, 2);
      topOptions.forEach(option => {
        message += `   • ${option.name}: ${option.odds}x\n`;
      });
      
      if (market.options.length > 2) {
        message += `   • +${market.options.length - 2} more options\n`;
      }
      
      message += `⏰ ${timeRemaining} • 🏷️ ${market.category.toUpperCase()}\n`;
      message += `🎲 **[🚀 PLACE BET](${betUrl})**\n\n`;
    });

    if (markets.length > maxMarkets) {
      message += `*...and ${markets.length - maxMarkets} more markets available!*\n\n`;
    }

    message += `🔄 *Click any "PLACE BET" link to start betting*\n`;
    message += `💡 *Use our strategy builder for automated betting*`;

    return message;
  }

  // Format market categories for inline keyboard
  static getCategoryKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '⚽ Sports', callback_data: 'category_sports' },
          { text: '💰 Crypto', callback_data: 'category_crypto' }
        ],
        [
          { text: '🏛️ Politics', callback_data: 'category_politics' },
          { text: '🎬 Entertainment', callback_data: 'category_entertainment' }
        ],
        [
          { text: '📊 All Markets', callback_data: 'category_all' },
          { text: '🔄 Refresh', callback_data: 'refresh_markets' }
        ]
      ]
    };
  }

  // Format bet confirmation message
  static formatBetConfirmation(userInfo, marketTitle, optionName, amount, isStrategy = false) {
    const betType = isStrategy ? 'Automated Strategy' : 'Manual Bet';
    const emoji = isStrategy ? '🤖' : '🎲';
    
    return `${emoji} **${betType} Confirmed!**

👤 **User:** ${userInfo.username || 'Anonymous'}
🎯 **Market:** ${marketTitle}
✅ **Option:** ${optionName}
💰 **Amount:** $${amount}

${isStrategy ? 
  '🤖 Your automated strategy is now running!\n📊 You\'ll receive updates as it executes.' :
  '🎲 Your bet has been placed successfully!\n🍀 Good luck!'
}

*Visit our website to track your bets and manage strategies.*`;
  }

  // Format strategy execution update
  static formatStrategyUpdate(marketTitle, strategyName, update) {
    const profitEmoji = update.currentProfit >= 0 ? '📈' : '📉';
    const statusEmoji = update.status === 'running' ? '🟢' : 
                       update.status === 'completed' ? '✅' : '⏸️';
    
    return `${statusEmoji} **Strategy Update**

🎯 **Market:** ${marketTitle}
🤖 **Strategy:** ${strategyName}

📊 **Performance:**
• Bets Placed: ${update.betsPlaced}
• Win Rate: ${(update.winRate * 100).toFixed(1)}%
• Current P&L: ${profitEmoji} $${update.currentProfit.toFixed(2)}

📈 **Status:** ${update.status.toUpperCase()}

*Your automated strategy is working 24/7!*`;
  }

  // Format bet result notification
  static formatBetResult(marketTitle, optionName, betAmount, result, winAmount = 0) {
    if (result === 'won') {
      return `🎉 **BET WON!** 🎉

🎯 **Market:** ${marketTitle}
✅ **Winning Option:** ${optionName}
💰 **Bet Amount:** $${betAmount}
🏆 **Winnings:** $${winAmount.toFixed(2)}

*Congratulations! Your AI-guided bet was successful!* 🚀`;
    } else {
      return `😔 **Bet Result**

🎯 **Market:** ${marketTitle}
❌ **Option:** ${optionName}
💸 **Amount:** $${betAmount}

*Better luck next time! Keep refining your strategy.* 💪
*Our AI is constantly improving predictions.*`;
    }
  }

  // Format market statistics
  static formatMarketStats(stats) {
    return `📊 **Market Statistics**

🎯 **Active Markets:** ${stats.total}
📈 **Total Options:** ${stats.totalOptions}

**Categories:**
${Object.entries(stats.categories)
  .map(([category, count]) => `• ${category}: ${count} markets`)
  .join('\n')}

${stats.newestMarket ? 
  `🆕 **Latest:** ${stats.newestMarket.title}` : 
  ''}

🤖 *All markets powered by advanced AI analysis*`;
  }

  // Calculate time remaining
  static getTimeRemaining(endTime) {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // Format admin notification
  static formatAdminNotification(type, data) {
    switch (type) {
      case 'new_user':
        return `👤 **New User Joined**
User: ${data.username || 'Anonymous'}
Chat ID: ${data.chatId}
Time: ${new Date().toLocaleString()}`;

      case 'bet_placed':
        return `🎲 **New Bet Placed**
User: ${data.username || 'Anonymous'}
Market: ${data.marketTitle}
Amount: $${data.amount}
Strategy: ${data.isStrategy ? 'Yes' : 'No'}`;

      case 'market_popular':
        return `🔥 **Popular Market Alert**
Market: ${data.marketTitle}
Bets: ${data.betCount}
Volume: $${data.volume}`;

      default:
        return `ℹ️ **System Notification**
${JSON.stringify(data, null, 2)}`;
    }
  }

  // Format error message for users
  static formatUserError(errorType, details = '') {
    const baseMessage = config.messages.error;
    
    switch (errorType) {
      case 'market_not_found':
        return `❌ **Market Not Found**

The betting market you're looking for doesn't exist or has ended.

🤖 Try browsing our active markets instead!`;

      case 'market_expired':
        return `⏰ **Market Expired**

This betting market has already ended. 

📊 Check out our other active opportunities!`;

      case 'invalid_command':
        return `🤔 **Unknown Command**

I didn't understand that command. 

Type /help to see what I can do!`;

      default:
        return baseMessage + (details ? `\n\n*Details: ${details}*` : '');
    }
  }
}

module.exports = MessageFormatter;