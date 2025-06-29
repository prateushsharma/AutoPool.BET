# Trading Agent Backend - Complete API Documentation

**Version**: 1.0.0  
**Base URL**: `http://localhost:3000`  
**Date**: June 29, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [AI-Powered Game Creation APIs](#ai-powered-game-creation-apis)
4. [Game Management APIs](#game-management-apis)
5. [Strategy Management APIs](#strategy-management-apis)
6. [Trading AI APIs](#trading-ai-apis)
7. [Real-Time Features](#real-time-features)
8. [Error Handling](#error-handling)
9. [Environment Setup](#environment-setup)

---

## Overview

The Trading Agent Backend provides AI-powered trading game creation, real-time multiplayer trading competitions, and comprehensive strategy management. All endpoints use **POST** methods for enhanced security and support complex request payloads.

### Key Features
- 🤖 **AI-Powered Game Creation** - Natural language to game configuration
- 🎮 **Real-Time Trading Competitions** - Multiplayer trading rounds
- 💼 **Strategy Marketplace** - Register and license trading strategies
- 📊 **Enhanced Leaderboards** - AI scoring with performance grades
- 🔄 **Live Updates** - WebSocket support for real-time events

---

## Authentication

Currently, the API uses wallet addresses for user identification. No API keys required for development.

---

## AI-Powered Game Creation APIs

### 1. Create Game from AI Prompt

**Endpoint**: `POST /api/game/create-game-from-prompt`

**Description**: Create a trading game using natural language. AI extracts duration, tokens, investment amounts, and profit targets.

**Request Body**:
```json
{
  "query": "Create a 5-minute game to trade trending Ethereum tokens with 100USD investment and 5% profit target",
  "maxParticipants": 3,
  "minParticipants": 2,
  "executionInterval": 15,
  "autoStart": true
}
```

**Response**:
```json
{
  "success": true,
  "round": {
    "id": "round_1751207742712_yyf87nzwo",
    "number": 4,
    "title": "Ethereum Token Sprint",
    "description": "90-second challenge trading Ethereum's top tokens for quick profits",
    "duration": 90000,
    "startingBalance": 100,
    "maxParticipants": 3,
    "status": "waiting",
    "createdAt": "2025-06-29T14:35:42.712Z",
    "settings": {
      "executionInterval": 15000,
      "allowedTokens": ["ETH", "WETH", "UNI"],
      "autoStart": true,
      "minParticipants": 2
    },
    "stats": {
      "totalParticipants": 0,
      "totalTrades": 0,
      "totalVolume": 0
    }
  },
  "aiConfig": {
    "title": "Ethereum Token Sprint",
    "tokens": ["ETH", "WETH", "UNI"],
    "duration": 90,
    "startingBalance": 100,
    "targetProfitPercent": 5,
    "strategy": "Buy ETH and UNI when volume spikes 25%+, sell at 5% profit or 2% loss.",
    "gameType": "trending",
    "riskLevel": "medium"
  },
  "message": "AI-powered game created successfully"
}
```

### 2. Test AI Extraction

**Endpoint**: `POST /api/game/test-ai-extraction`

**Request Body**:
```json
{
  "query": "I want to create a quick 10-minute momentum trading game with $50 budget targeting 8% returns"
}
```

**Response**:
```json
{
  "success": true,
  "originalPrompt": "I want to create a quick 10-minute momentum trading game with $50 budget targeting 8% returns",
  "extractedConfig": {
    "title": "10m Momentum Play",
    "duration": 600,
    "startingBalance": 50,
    "targetProfitPercent": 8,
    "gameType": "momentum",
    "riskLevel": "medium"
  },
  "calculations": {
    "expectedProfitAmount": 4,
    "profitTarget": "8% of 50 = 4"
  }
}
```

### 3. Get Game Templates

**Endpoint**: `POST /api/game/get-game-templates`

**Request Body**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "templates": [
    {
      "id": "trending-hunt",
      "title": "Trending Token Hunt",
      "prompt": "Create a 5-minute game to trade trending Base tokens with 10% profit target",
      "description": "Fast-paced trading of trending tokens",
      "duration": 300,
      "targetProfit": 10,
      "riskLevel": "high"
    },
    {
      "id": "stable-growth",
      "title": "Stable Growth Challenge",
      "prompt": "Create a 30-minute game focusing on ETH and major tokens with 5% profit target",
      "description": "Conservative trading with major tokens",
      "duration": 1800,
      "targetProfit": 5,
      "riskLevel": "low"
    }
  ],
  "count": 4
}
```

### 4. Get Trending Tokens

**Endpoint**: `POST /api/game/get-trending-tokens`

**Request Body**:
```json
{
  "limit": 3,
  "network": "base"
}
```

**Response**:
```json
{
  "success": true,
  "trendingTokens": ["TOSHI", "DEGEN", "BRETT"],
  "network": "base",
  "count": 3,
  "timestamp": "2025-06-29T12:00:00.000Z"
}
```

### 5. Suggest Strategy from Prompt

**Endpoint**: `POST /api/game/suggest-strategy-from-prompt`

**Request Body**:
```json
{
  "query": "I want to trade meme coins safely with quick profits"
}
```

**Response**:
```json
{
  "success": true,
  "suggestedStrategy": "Focus on TOSHI and DEGEN with 3% profit targets and 1.5% stop losses. Enter on volume spikes above 50% average, exit quickly on momentum reversal.",
  "gameType": "meme",
  "riskLevel": "medium",
  "recommendedDuration": 600
}
```

---

## Game Management APIs

### 1. Join Trading Round

**Endpoint**: `POST /api/game/join-round`

**Request Body**:
```json
{
  "roundId": "round_1751207742712_yyf87nzwo",
  "walletAddress": "0x742d35Cc4Bf4C8dC6dbFC18cc13BF5ccb74fAA58",
  "strategy": "Buy ETH when volume spikes 20%, sell at 5% profit or 2% loss",
  "username": "CryptoTrader1"
}
```

**Response**:
```json
{
  "success": true,
  "participant": {
    "walletAddress": "0x742d35Cc4Bf4C8dC6dbFC18cc13BF5ccb74fAA58",
    "username": "CryptoTrader1",
    "strategy": {
      "original": "Buy ETH when volume spikes 20%, sell at 5% profit or 2% loss",
      "parsed": {
        "strategy_type": "momentum",
        "indicators": ["Volume", "Price"],
        "entry_conditions": "Volume spikes 20%",
        "exit_conditions": "5% profit or 2% loss",
        "confidence": 8
      },
      "enabled": true
    },
    "portfolio": {
      "cash": 100,
      "positions": {},
      "totalValue": 100,
      "pnl": 0,
      "pnlPercentage": 0,
      "trades": 0,
      "winRate": 0
    },
    "joinedAt": "2025-06-29T12:00:00.000Z",
    "isActive": true
  },
  "message": "Successfully joined the round"
}
```

### 2. Check if Can Join

**Endpoint**: `POST /api/game/can-join`

**Request Body**:
```json
{
  "roundId": "round_1751207742712_yyf87nzwo",
  "walletAddress": "0x742d35Cc4Bf4C8dC6dbFC18cc13BF5ccb74fAA58"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "canJoin": true,
  "round": {
    "id": "round_1751207742712_yyf87nzwo",
    "title": "Ethereum Token Sprint",
    "currentParticipants": 1,
    "maxParticipants": 3,
    "status": "waiting"
  }
}
```

**Response (Failed)**:
```json
{
  "success": false,
  "canJoin": false,
  "reason": "Wallet already joined this round"
}
```

### 3. Start Trading Round

**Endpoint**: `POST /api/game/start-round`

**Request Body**:
```json
{
  "roundId": "round_1751207742712_yyf87nzwo"
}
```

**Response**:
```json
{
  "success": true,
  "round": {
    "id": "round_1751207742712_yyf87nzwo",
    "status": "active",
    "startTime": "2025-06-29T12:05:00.000Z",
    "endTime": "2025-06-29T12:35:00.000Z",
    "stats": {
      "totalParticipants": 2
    }
  },
  "message": "Round started successfully"
}
```

### 4. Get Round Details

**Endpoint**: `POST /api/game/get-round`

**Request Body**:
```json
{
  "roundId": "round_1751207742712_yyf87nzwo"
}
```

**Response**:
```json
{
  "success": true,
  "round": {
    "id": "round_1751207742712_yyf87nzwo",
    "title": "Ethereum Token Sprint",
    "status": "active",
    "startingBalance": 100,
    "duration": 90000,
    "startTime": "2025-06-29T12:05:00.000Z",
    "endTime": "2025-06-29T12:06:30.000Z",
    "allowedTokens": ["ETH", "WETH", "UNI"],
    "currentParticipants": 2,
    "maxParticipants": 3,
    "stats": {
      "totalParticipants": 2,
      "totalTrades": 24,
      "totalVolume": 1250.50
    }
  }
}
```

### 5. Get Leaderboard

**Endpoint**: `POST /api/game/get-leaderboard`

**Request Body**:
```json
{
  "roundId": "round_1751207742712_yyf87nzwo",
  "limit": 10
}
```

**Response**:
```json
{
  "success": true,
  "roundId": "round_1751207742712_yyf87nzwo",
  "leaderboard": [
    {
      "rank": 1,
      "walletAddress": "0x742d35Cc4Bf4C8dC6dbFC18cc13BF5ccb74fAA58",
      "username": "CryptoTrader1",
      "pnl": 8.45,
      "pnlPercentage": 8.45,
      "totalValue": 108.45,
      "trades": 5,
      "winRate": 80.0
    },
    {
      "rank": 2,
      "walletAddress": "0x456def789abc123456789def456789abc12345678",
      "username": "QuickFlip",
      "pnl": 3.21,
      "pnlPercentage": 3.21,
      "totalValue": 103.21,
      "trades": 3,
      "winRate": 66.7
    }
  ],
  "count": 2
}
```

### 6. Enhanced Leaderboard with AI Scoring

**Endpoint**: `POST /api/game/get-enhanced-leaderboard`

**Request Body**:
```json
{
  "roundId": "round_1751207742712_yyf87nzwo",
  "limit": 10
}
```

**Response**:
```json
{
  "success": true,
  "roundId": "round_1751207742712_yyf87nzwo",
  "leaderboard": [
    {
      "rank": 1,
      "walletAddress": "0x742d35Cc4Bf4C8dC6dbFC18cc13BF5ccb74fAA58",
      "username": "CryptoTrader1",
      "pnl": 8.45,
      "pnlPercentage": 8.45,
      "totalValue": 108.45,
      "trades": 5,
      "winRate": 80.0,
      "profitScore": 1.69,
      "grade": "A",
      "expectedProfitPercent": 5,
      "actualProfitPercent": 8.45,
      "scoreDescription": "8.45% / 5% = 1.69x"
    }
  ],
  "roundInfo": {
    "expectedProfitPercent": 5,
    "investmentAmount": 100,
    "gameType": "trending"
  }
}
```

### 7. List Rounds by Status

**Endpoint**: `POST /api/game/list-rounds`

**Request Body**:
```json
{
  "status": "active",
  "limit": 20
}
```

**Response**:
```json
{
  "success": true,
  "status": "active",
  "rounds": [
    {
      "id": "round_1751207742712_yyf87nzwo",
      "title": "Ethereum Token Sprint",
      "status": "active",
      "currentParticipants": 2,
      "maxParticipants": 3,
      "startTime": "2025-06-29T12:05:00.000Z",
      "endTime": "2025-06-29T12:06:30.000Z"
    }
  ],
  "count": 1
}
```

**Available Status Values**: `"active"`, `"waiting"`, `"running"`, `"finished"`

---

## Strategy Management APIs

### 1. Register New Strategy

**Endpoint**: `POST /api/game/register-strategy`

**Request Body**:
```json
{
  "walletAddress": "0x742d35Cc4Bf4C8dC6dbFC18cc13BF5ccb74fAA58",
  "strategy": "Buy DEGEN on momentum, sell on 10% profit or 3% loss",
  "royaltyPercent": 25,
  "name": "Momentum Scalper v2",
  "description": "High frequency momentum trading strategy for meme tokens"
}
```

**Response**:
```json
{
  "success": true,
  "strategy": {
    "id": 42,
    "owner": "0x742d35Cc4Bf4C8dC6dbFC18cc13BF5ccb74fAA58",
    "name": "Momentum Scalper v2",
    "description": "High frequency momentum trading strategy for meme tokens",
    "royaltyPercent": 25,
    "originalText": "Buy DEGEN on momentum, sell on 10% profit or 3% loss",
    "parsed": {
      "strategy_type": "momentum",
      "indicators": ["Volume", "Price"],
      "timeframe": "15m",
      "confidence": 8
    },
    "createdAt": "2025-06-29T12:00:00.000Z",
    "stats": {
      "totalUses": 0,
      "totalEarnings": 0,
      "rating": 0
    }
  },
  "message": "Strategy registered successfully"
}
```

### 2. Get User's Strategies

**Endpoint**: `POST /api/game/get-user-strategies`

**Request Body**:
```json
{
  "walletAddress": "0x742d35Cc4Bf4C8dC6dbFC18cc13BF5ccb74fAA58"
}
```

**Response**:
```json
{
  "success": true,
  "strategies": [
    {
      "id": 42,
      "name": "Momentum Scalper v2",
      "royaltyPercent": 25,
      "stats": {
        "totalUses": 15,
        "totalEarnings": 234.56,
        "averagePerformance": 6.7,
        "rating": 4.2
      },
      "createdAt": "2025-06-29T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. Strategy Marketplace

**Endpoint**: `POST /api/game/get-marketplace`

**Request Body**:
```json
{
  "limit": 20
}
```

**Response**:
```json
{
  "success": true,
  "strategies": [
    {
      "id": 42,
      "name": "Momentum Scalper v2",
      "owner": "0x742d35Cc4Bf4C8dC6dbFC18cc13BF5ccb74fAA58",
      "royaltyPercent": 25,
      "description": "High frequency momentum trading strategy",
      "stats": {
        "totalUses": 15,
        "averagePerformance": 6.7,
        "rating": 4.2
      },
      "price": "License for 25% of profits"
    }
  ],
  "count": 1
}
```

---

## Trading AI APIs

### 1. Test Groq Connection

**Endpoint**: `POST /api/trading/test-groq`

**Request Body**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Groq connection working",
  "test_result": {
    "strategy_type": "technical",
    "indicators": ["RSI", "Volume"],
    "confidence": 8
  }
}
```

### 2. Parse Trading Strategy

**Endpoint**: `POST /api/trading/parse-strategy`

**Request Body**:
```json
{
  "strategy": "Buy TOSHI when volume increases by 20%, sell when profit reaches 5% or loss hits 2%"
}
```

**Response**:
```json
{
  "success": true,
  "strategy": {
    "strategy_type": "momentum",
    "indicators": ["Volume", "Price"],
    "entry_conditions": "Volume increases by 20%",
    "exit_conditions": "5% profit or 2% loss",
    "risk_management": "2% stop loss, 5% take profit",
    "timeframe": "15m",
    "assets": ["TOSHI"],
    "confidence": 8,
    "suggested_base_tokens": ["TOSHI", "ETH", "DEGEN"]
  },
  "timestamp": "2025-06-29T12:00:00.000Z"
}
```

### 3. Generate Trading Signal

**Endpoint**: `POST /api/trading/signal`

**Request Body**:
```json
{
  "symbol": "TOSHI",
  "strategy": {
    "strategy_type": "momentum",
    "indicators": ["Volume", "RSI"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "symbol": "TOSHI",
  "signal": {
    "signal": "BUY",
    "confidence": 7,
    "reason": "Volume spike detected with RSI oversold",
    "entry_price": 0.000123,
    "stop_loss": 0.000117,
    "take_profit": 0.000135,
    "risk_reward_ratio": 2.0
  },
  "marketData": {
    "price": 0.000123,
    "volume": 1250000,
    "change_24h": 5.2
  },
  "timestamp": "2025-06-29T12:00:00.000Z"
}
```

### 4. Get Trading Insight

**Endpoint**: `POST /api/trading/insight`

**Request Body**:
```json
{
  "symbol": "ETH",
  "timeframe": "1h"
}
```

**Response**:
```json
{
  "success": true,
  "symbol": "ETH",
  "timeframe": "1h",
  "insight": "ETH showing bullish momentum above $3,200 support. Volume increasing suggests potential breakout above $3,300. Watch for rejection at $3,350 resistance. Risk factors include broader market sentiment and regulatory news.",
  "timestamp": "2025-06-29T12:00:00.000Z"
}
```

### 5. Base Network Token Price

**Endpoint**: `POST /api/trading/base-price`

**Request Body**:
```json
{
  "symbol": "TOSHI"
}
```

**Response**:
```json
{
  "success": true,
  "symbol": "TOSHI",
  "price": 0.000123,
  "network": "base",
  "volume_24h": 1250000,
  "change_24h": 5.2,
  "timestamp": "2025-06-29T12:00:00.000Z"
}
```

### 6. Get Base Network Tokens

**Endpoint**: `POST /api/trading/base-tokens`

**Request Body**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "count": 10,
  "tokens": [
    {
      "symbol": "TOSHI",
      "name": "Toshi",
      "network": "base",
      "category": "meme"
    },
    {
      "symbol": "DEGEN",
      "name": "Degen",
      "network": "base",
      "category": "meme"
    }
  ]
}
```

---

## Real-Time Features (WebSocket)

### Connection Setup

```javascript
const socket = io('http://localhost:3000');

// Join specific round for updates
socket.emit('join_round', 'round_1751207742712_yyf87nzwo');

// Listen for events
socket.on('round_created', (data) => {
  console.log('New round created:', data);
});

socket.on('participant_joined', (data) => {
  console.log('Player joined:', data.participant.username);
});

socket.on('round_started', (data) => {
  console.log('Round started:', data.roundId);
});

socket.on('round_ended', (data) => {
  console.log('Round finished:', data.roundId);
});
```

### Server Events

| Event | Description | Data |
|-------|-------------|------|
| `round_created` | New round created | `{ roundId, round }` |
| `participant_joined` | Player joined round | `{ roundId, participant }` |
| `round_started` | Round began trading | `{ roundId, round }` |
| `round_ended` | Round finished | `{ roundId, results }` |

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `ROUND_NOT_FOUND` | 404 | Round ID doesn't exist |
| `ROUND_FULL` | 400 | Maximum participants reached |
| `ALREADY_JOINED` | 400 | Wallet already in round |
| `GROQ_ERROR` | 500 | AI service unavailable |
| `REDIS_ERROR` | 500 | Database connection issue |

---

## Environment Setup

### Required Environment Variables

```bash
# .env file
GROQ_API_KEY=your_groq_api_key_here
REDIS_URL=your_redis_connection_string
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
BASE_RPC_URL=https://mainnet.base.org
```

### Installation

```bash
npm install
npm start
# or for development
npm run dev
```

### Health Check

**Endpoint**: `POST /health`

**Response**:
```json
{
  "status": "Trading Agent Backend Running",
  "redis": "connected",
  "timestamp": "2025-06-29T12:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## Complete Usage Example

```javascript
// 1. Create AI-powered game
const createResponse = await fetch('/api/game/create-game-from-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Create a 10-minute ETH trading challenge with $500 targeting 7% profits"
  })
});
const { round } = await createResponse.json();

// 2. Join the game
const joinResponse = await fetch('/api/game/join-round', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roundId: round.id,
    walletAddress: "0x742d35Cc4Bf4C8dC6dbFC18cc13BF5ccb74fAA58",
    strategy: "Buy ETH on momentum, sell at 7% profit",
    username: "ETHTrader"
  })
});

// 3. Start the round
await fetch('/api/game/start-round', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ roundId: round.id })
});

// 4. Monitor leaderboard
setInterval(async () => {
  const leaderboardResponse = await fetch('/api/game/get-enhanced-leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roundId: round.id })
  });
  const { leaderboard } = await leaderboardResponse.json();
  console.log('Current rankings:', leaderboard);
}, 10000);
```

---

## Support

For technical support or questions about the API:
- Check the debug information in API responses
- Verify Redis connection status via `/health` endpoint
- Ensure Groq API key is properly configured
- Review WebSocket connection for real-time features

**API Version**: 1.0.0  
**Last Updated**: June 29, 2025