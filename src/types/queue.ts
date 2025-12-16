/**
 * Queue System Types for BullMQ
 * Loop 11: Backtest Queue System
 */

export interface BacktestParams {
  symbol: string;
  startDate: string; // ISO 8601 format
  endDate: string;
  initialCapital: number;
  commission: number;
  slippage: number;
}

export interface BacktestJob {
  userId: string;
  strategyId: string;
  backtestParams: BacktestParams;
  priority: number; // 0 (Free) | 1 (Basic) | 2 (Pro)
  createdAt: number; // timestamp
}

export interface BacktestResult {
  backtestId: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  cagr: number;
}

export interface BacktestJobResult {
  jobId: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: BacktestResult;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

export interface ProgressUpdate {
  jobId: string;
  progress: number;
  status: 'active' | 'completed' | 'failed';
  message?: string;
  timestamp: number;
}
