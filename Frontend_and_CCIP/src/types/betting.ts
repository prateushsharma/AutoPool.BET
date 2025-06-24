// Place this file as: src/types/betting.ts

export interface BetOption {
  id: string;
  name: string;
  odds: number;
  description?: string;
}

export interface BetMarket {
  id: string;
  title: string;
  description: string;
  options: BetOption[];
  category: 'sports' | 'crypto' | 'politics' | 'entertainment';
  endTime: Date;
  isActive: boolean;
  aiGenerated: boolean;
  createdAt: Date;
}

export interface UserBet {
  id: string;
  marketId: string;
  optionId: string;
  amount: number;
  odds: number;
  strategy?: string;
  strategyType: 'manual' | 'automated';
  userId: string;
  placedAt: Date;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
}

export interface BettingStrategy {
  code: string;
  description: string;
  parameters?: {
    maxBetAmount?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    stopLoss?: number;
    takeProfit?: number;
  };
}

export interface StrategyExecution {
  id: string;
  strategyId: string;
  marketId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  results?: {
    totalBets: number;
    winRate: number;
    profit: number;
    loss: number;
  };
}

export interface TelegramBotConfig {
  botUsername: string;
  startParameter?: string;
}

export interface BetSelection {
  marketId: string;
  optionId: string;
  odds: number;
  marketTitle: string;
  optionName: string;
  strategy?: string;
  strategyType?: 'manual' | 'auto';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MarketsResponse {
  markets: BetMarket[];
  total: number;
  page: number;
  limit: number;
}

export interface BetSubmissionResponse {
  betId: string;
  message: string;
  estimatedExecutionTime?: string;
}

// User & Account Types
export interface User {
  id: string;
  username: string;
  email?: string;
  telegramId?: string;
  balance: number;
  createdAt: Date;
  isActive: boolean;
}

export interface UserProfile {
  user: User;
  totalBets: number;
  winRate: number;
  totalProfit: number;
  activeStrategies: number;
}

// Market Analytics
export interface MarketAnalytics {
  marketId: string;
  totalVolume: number;
  betCount: number;
  popularOption: string;
  oddsHistory: Array<{
    optionId: string;
    odds: number;
    timestamp: Date;
  }>;
}

// Real-time Updates
export interface MarketUpdate {
  type: 'odds_change' | 'market_close' | 'new_market' | 'bet_result';
  marketId: string;
  data: any;
  timestamp: Date;
}

// Strategy Templates
export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  category: 'conservative' | 'aggressive' | 'balanced';
  estimatedRisk: 'low' | 'medium' | 'high';
  recommendedBalance: number;
}

// Payment & Transactions
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type: 'bet_result' | 'strategy_update' | 'market_alert' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: any;
}

// Error Types
export interface BettingError {
  code: string;
  message: string;
  details?: any;
}