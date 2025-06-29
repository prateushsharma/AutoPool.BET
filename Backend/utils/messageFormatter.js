/**
 * ================================================================
 * 🤖 Message Formatter - API Integration Version
 * ---------------------------------------------------------------
 
 * Formats messages for the AI betting bot with API integration:
 * - Round notifications and displays
 * - Join round functionality
 * - Real-time round status updates
 * 
 * ================================================================
 */

const config = require('../config/config');

class MessageFormatter {
  // Format new round notification
  static formatNewRoundNotification(round) {
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);
    const duration = Math.round((endTime - startTime) / 1000 / 60); // Duration in minutes
    const joinUrl = `http://localhost:3000/game/${round.id}`;

    return `🚨 **NEW ROUND ALERT!** 🚨

🎯 **${round.title}**

👥 **Participants:** ${round.currentParticipants}/${rounds.maxParticipants}
⏱️ **Duration:** ${duration} minutes
🕐 **Starts:** ${this.formatTime(startTime)}
🕕 **Ends:** ${this.formatTime(endTime)}

🎮 **Round ID:** \`${round.id}\`

🚀 **[JOIN NOW](${joinUrl})** 🚀

⚡ *Quick! Limited spots available!*`;
  }

  // Format active rounds list
  static formatActiveRounds(rounds) {
    if (!rounds || rounds.length === 0) {
      return `🎮 **No Active Rounds**

Currently no betting rounds are active.

🔔 Enable notifications with /notify on to get alerted when new rounds start!

⚡ *New rounds appear every few minutes!*`;
    }

    let message = `🎯 **ACTIVE ROUNDS** (${rounds.length})\n\n`;

    rounds.forEach((round, index) => {
      const startTime = new Date(round.startTime);
      const endTime = new Date(round.endTime);
      const timeRemaining = this.getTimeRemaining(endTime);
      const spotsLeft = round.maxParticipants - round.currentParticipants;
      const joinUrl = `http://localhost:3000/game/${round.id}`;

      message += `**${index + 1}. ${round.title}**\n`;
      message += `👥 ${round.currentParticipants}/${round.maxParticipants} players`;
      
      if (spotsLeft > 0) {
        message += ` • ${spotsLeft} spots left ✅\n`;
      } else {
        message += ` • FULL ❌\n`;
      }
      
      message += `⏰ ${timeRemaining}\n`;
      message += `🎮 \`${round.id}\`\n`;
      
      if (spotsLeft > 0) {
        message += `🚀 **[JOIN ROUND](${joinUrl})**\n\n`;
      } else {
        message += `🔒 *Round Full*\n\n`;
      }
    });

    message += `🔄 *Auto-refreshing every 5 seconds*\n`;
    message += `🔔 *Enable /notify on for instant alerts*`;

    return message;
  }

  // Format single round details
  static formatRoundDetails(round) {
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);
    const duration = Math.round((endTime - startTime) / 1000 / 60);
    const timeRemaining = this.getTimeRemaining(endTime);
    const spotsLeft = round.maxParticipants - round.currentParticipants;
    const joinUrl = `http://localhost:3000/game/${round.id}`;

    return `🎯 **ROUND DETAILS**

📋 **Title:** ${round.title}
🆔 **ID:** \`${round.id}\`
📊 **Status:** ${round.status.toUpperCase()}

👥 **Participants:** ${round.currentParticipants}/${round.maxParticipants}
${spotsLeft > 0 ? `✅ **${spotsLeft} spots available**` : '❌ **Round Full**'}

⏰ **Timing:**
• Starts: ${this.formatTime(startTime)}
• Ends: ${this.formatTime(endTime)}
• Duration: ${duration} minutes
• Time Left: ${timeRemaining}

${spotsLeft > 0 ? 
  `🚀 **[🎮 JOIN THIS ROUND](${joinUrl})**\n\n⚡ *Join now before it fills up!*` : 
  `🔒 **Round Full** - Try another round!`
}`;
  }

  // Get main menu keyboard
  static getMainKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '🎯 View Active Rounds', callback_data: 'view_all_rounds' }
        ],
        [
          { text: '🔔 Notifications: ON', callback_data: 'toggle_notifications' },
          { text: '📊 Bot Stats', callback_data: 'show_stats' }
        ],
        [
          { text: '🔄 Refresh', callback_data: 'refresh_rounds' },
          { text: '❓ Help', callback_data: 'show_help' }
        ]
      ]
    };
  }

  // Get round join keyboard
  static getRoundJoinKeyboard(roundId) {
    return {
      inline_keyboard: [
        [
          { text: '🚀 JOIN ROUND', callback_data: `join_round_${roundId}` }
        ],
        [
          { text: '📋 View All Rounds', callback_data: 'view_all_rounds' },
          { text: '🔄 Refresh', callback_data: 'refresh_rounds' }
        ]
      ]
    };
  }

  // Get refresh keyboard
  static getRefreshKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '🔄 Refresh Rounds', callback_data: 'refresh_rounds' }
        ],
        [
          { text: '🔔 Toggle Notifications', callback_data: 'toggle_notifications' },
          { text: '📊 Stats', callback_data: 'show_stats' }
        ]
      ]
    };
  }

  // Format time display
  static formatTime(date) {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  // Calculate time remaining
  static getTimeRemaining(endTime) {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return '⏰ ENDED';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  // Format round status updates
  static formatRoundUpdate(round, updateType) {
    switch (updateType) {
      case 'participant_joined':
        return `👥 **Player Joined!**

🎯 **Round:** ${round.title}
👤 **Participants:** ${round.currentParticipants}/${round.maxParticipants}
${round.currentParticipants === round.maxParticipants ? '🔥 **ROUND FULL!**' : `✅ ${round.maxParticipants - round.currentParticipants} spots left`}

🆔 **Round ID:** \`${round.id}\``;

      case 'round_starting':
        return `🚀 **Round Starting!**

🎯 **${round.title}**
🎮 **Round ID:** \`${round.id}\`
👥 **Final Participants:** ${round.currentParticipants}/${round.maxParticipants}

⏰ **Now Live!** Get ready to play!`;

      case 'round_ending':
        return `⏰ **Round Ending Soon!**

🎯 **${round.title}**
⚠️ **Less than 1 minute remaining!**
👥 **Participants:** ${round.currentParticipants}/${round.maxParticipants}

🏁 **Final moments!**`;

      case 'round_ended':
        return `🏁 **Round Ended**

🎯 **${round.title}**
✅ **Status:** Completed
👥 **Final Participants:** ${round.currentParticipants}

🎊 **Thanks for playing!**`;

      default:
        return `📢 **Round Update**

🎯 **${round.title}**
📊 **Status:** ${round.status}
👥 **Participants:** ${round.currentParticipants}/${round.maxParticipants}`;
    }
  }

  // Format admin notification
  static formatAdminNotification(type, data) {
    switch (type) {
      case 'new_user':
        return `👤 **New User Joined**
User: ${data.username || 'Anonymous'}
Chat ID: ${data.chatId}
Time: ${new Date().toLocaleString()}`;

      case 'round_notification_sent':
        return `📢 **Round Notification Sent**
Round: ${data.roundTitle}
Recipients: ${data.recipientCount}
Time: ${new Date().toLocaleString()}`;

      case 'user_joined_round':
        return `🎮 **User Joined Round**
User: ${data.username || 'Anonymous'}
Round: ${data.roundTitle}
Round ID: ${data.roundId}`;

      case 'high_activity':
        return `🔥 **High Activity Alert**
Active Rounds: ${data.activeRounds}
Online Users: ${data.onlineUsers}
Notifications Sent: ${data.notificationsSent}`;

      default:
        return `ℹ️ **System Notification**
${JSON.stringify(data, null, 2)}`;
    }
  }

  // Format error message for users
  static formatUserError(errorType, details = '') {
    switch (errorType) {
      case 'round_not_found':
        return `❌ **Round Not Found**

The round you're looking for doesn't exist or has ended.

🎯 Check /rounds for active rounds!`;

      case 'round_full':
        return `🔒 **Round Full**

This round has reached maximum participants.

🎮 Try another active round!`;

      case 'api_error':
        return `⚠️ **Service Temporarily Unavailable**

Unable to fetch round data right now.

🔄 Please try again in a moment.`;

      case 'invalid_command':
        return `🤔 **Unknown Command**

I didn't understand that command.

Type /help to see available commands!`;

      default:
        return `❌ **Error**

Something went wrong. Please try again.

${details ? `\n*Details: ${details}*` : ''}`;
    }
  }

  // Format round statistics
  static formatRoundStatistics(stats) {
    return `📊 **Round Statistics**

🎯 **Total Active Rounds:** ${stats.activeRounds}
👥 **Total Participants:** ${stats.totalParticipants}
🔔 **Users with Notifications:** ${stats.notificationUsers}

**Round Status Breakdown:**
${Object.entries(stats.roundsByStatus || {})
  .map(([status, count]) => `• ${status}: ${count}`)
  .join('\n')}

⚡ **Average Round Duration:** ${stats.avgDuration || 'N/A'} minutes
🎮 **Most Popular Round:** ${stats.popularRound || 'N/A'}

🤖 *Real-time monitoring active*`;
  }
}

module.exports = MessageFormatter;