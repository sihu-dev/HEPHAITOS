// ============================================
// Simulation Account Manager
// 가상 계좌 기반 시뮬레이션 트레이딩
// ============================================

import { generateId } from '@/lib/utils'
import { safeLogger } from '@/lib/utils/safe-logger';

// ============================================
// Types
// ============================================

export interface SimulationAccount {
  id: string
  userId: string
  name: string
  initialBalance: number
  currentBalance: number
  positions: SimulationPosition[]
  trades: SimulationTrade[]
  performance: AccountPerformance
  createdAt: Date
  updatedAt: Date
}

export interface SimulationPosition {
  id: string
  symbol: string
  side: 'long' | 'short'
  quantity: number
  entryPrice: number
  currentPrice: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  openedAt: Date
}

export interface SimulationTrade {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  total: number
  commission: number
  pnl?: number
  pnlPercent?: number
  timestamp: Date
  reason?: string
}

export interface AccountPerformance {
  totalReturn: number
  totalReturnPercent: number
  winRate: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  avgWin: number
  avgLoss: number
  sharpeRatio: number
  maxDrawdown: number
  maxDrawdownPercent: number
}

export interface TradeRequest {
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  reason?: string
}

// ============================================
// Simulation Account Manager
// ============================================

export class SimulationAccountManager {
  private accounts: Map<string, SimulationAccount> = new Map()
  private readonly COMMISSION_RATE = 0.001 // 0.1%
  private readonly INITIAL_BALANCE = 10000000 // 1,000만원

  /**
   * Create new simulation account
   */
  createAccount(userId: string, name?: string): SimulationAccount {
    const account: SimulationAccount = {
      id: generateId('sim'),
      userId,
      name: name || '가상 계좌',
      initialBalance: this.INITIAL_BALANCE,
      currentBalance: this.INITIAL_BALANCE,
      positions: [],
      trades: [],
      performance: this.initPerformance(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.accounts.set(account.id, account)
    return account
  }

  /**
   * Get account by ID
   */
  getAccount(accountId: string): SimulationAccount | null {
    return this.accounts.get(accountId) || null
  }

  /**
   * Get all accounts for user
   */
  getUserAccounts(userId: string): SimulationAccount[] {
    return Array.from(this.accounts.values()).filter((a) => a.userId === userId)
  }

  /**
   * Execute buy order
   */
  buy(accountId: string, request: TradeRequest): SimulationTrade | null {
    const account = this.accounts.get(accountId)
    if (!account) return null

    const { symbol, quantity, price, reason } = request
    const total = quantity * price
    const commission = total * this.COMMISSION_RATE
    const totalWithCommission = total + commission

    // Check balance
    if (account.currentBalance < totalWithCommission) {
      safeLogger.warn('[SimulationAccount] Insufficient balance')
      return null
    }

    // Create trade
    const trade: SimulationTrade = {
      id: generateId('trade'),
      symbol,
      side: 'buy',
      quantity,
      price,
      total,
      commission,
      timestamp: new Date(),
      reason,
    }

    // Update balance
    account.currentBalance -= totalWithCommission

    // Update or create position
    const existingPosition = account.positions.find(
      (p) => p.symbol === symbol && p.side === 'long'
    )

    if (existingPosition) {
      // Average down/up
      const totalQuantity = existingPosition.quantity + quantity
      const avgPrice =
        (existingPosition.entryPrice * existingPosition.quantity + price * quantity) /
        totalQuantity
      existingPosition.quantity = totalQuantity
      existingPosition.entryPrice = avgPrice
    } else {
      // New position
      account.positions.push({
        id: generateId('pos'),
        symbol,
        side: 'long',
        quantity,
        entryPrice: price,
        currentPrice: price,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,
        openedAt: new Date(),
      })
    }

    // Add trade
    account.trades.push(trade)
    account.updatedAt = new Date()

    // Update performance
    this.updatePerformance(account)

    return trade
  }

  /**
   * Execute sell order
   */
  sell(accountId: string, request: TradeRequest): SimulationTrade | null {
    const account = this.accounts.get(accountId)
    if (!account) return null

    const { symbol, quantity, price, reason } = request

    // Find position
    const position = account.positions.find(
      (p) => p.symbol === symbol && p.side === 'long'
    )
    if (!position || position.quantity < quantity) {
      safeLogger.warn('[SimulationAccount] Insufficient position')
      return null
    }

    const total = quantity * price
    const commission = total * this.COMMISSION_RATE
    const entryValue = position.entryPrice * quantity
    const pnl = total - entryValue - commission
    const pnlPercent = (pnl / entryValue) * 100

    // Create trade
    const trade: SimulationTrade = {
      id: generateId('trade'),
      symbol,
      side: 'sell',
      quantity,
      price,
      total,
      commission,
      pnl,
      pnlPercent,
      timestamp: new Date(),
      reason,
    }

    // Update balance
    account.currentBalance += total - commission

    // Update position
    position.quantity -= quantity
    if (position.quantity <= 0) {
      account.positions = account.positions.filter((p) => p.id !== position.id)
    }

    // Add trade
    account.trades.push(trade)
    account.updatedAt = new Date()

    // Update performance
    this.updatePerformance(account)

    return trade
  }

  /**
   * Update position prices
   */
  updatePrices(accountId: string, prices: Record<string, number>): void {
    const account = this.accounts.get(accountId)
    if (!account) return

    for (const position of account.positions) {
      const newPrice = prices[position.symbol]
      if (newPrice !== undefined) {
        position.currentPrice = newPrice
        const entryValue = position.entryPrice * position.quantity
        const currentValue = newPrice * position.quantity
        position.unrealizedPnl = currentValue - entryValue
        position.unrealizedPnlPercent = (position.unrealizedPnl / entryValue) * 100
      }
    }

    account.updatedAt = new Date()
    this.updatePerformance(account)
  }

  /**
   * Close all positions
   */
  closeAllPositions(
    accountId: string,
    prices: Record<string, number>
  ): SimulationTrade[] {
    const account = this.accounts.get(accountId)
    if (!account) return []

    const trades: SimulationTrade[] = []

    for (const position of [...account.positions]) {
      const price = prices[position.symbol] || position.currentPrice
      const trade = this.sell(accountId, {
        symbol: position.symbol,
        side: 'sell',
        quantity: position.quantity,
        price,
        reason: 'Close all positions',
      })
      if (trade) trades.push(trade)
    }

    return trades
  }

  /**
   * Reset account to initial state
   */
  resetAccount(accountId: string): void {
    const account = this.accounts.get(accountId)
    if (!account) return

    account.currentBalance = account.initialBalance
    account.positions = []
    account.trades = []
    account.performance = this.initPerformance()
    account.updatedAt = new Date()
  }

  /**
   * Delete account
   */
  deleteAccount(accountId: string): boolean {
    return this.accounts.delete(accountId)
  }

  /**
   * Get account summary
   */
  getAccountSummary(accountId: string): {
    totalValue: number
    cash: number
    positionsValue: number
    unrealizedPnl: number
    totalReturn: number
    totalReturnPercent: number
  } | null {
    const account = this.accounts.get(accountId)
    if (!account) return null

    const positionsValue = account.positions.reduce(
      (sum, p) => sum + p.currentPrice * p.quantity,
      0
    )
    const unrealizedPnl = account.positions.reduce(
      (sum, p) => sum + p.unrealizedPnl,
      0
    )
    const totalValue = account.currentBalance + positionsValue
    const totalReturn = totalValue - account.initialBalance
    const totalReturnPercent = (totalReturn / account.initialBalance) * 100

    return {
      totalValue,
      cash: account.currentBalance,
      positionsValue,
      unrealizedPnl,
      totalReturn,
      totalReturnPercent,
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private initPerformance(): AccountPerformance {
    return {
      totalReturn: 0,
      totalReturnPercent: 0,
      winRate: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      avgWin: 0,
      avgLoss: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
    }
  }

  private updatePerformance(account: SimulationAccount): void {
    const closedTrades = account.trades.filter((t) => t.side === 'sell' && t.pnl !== undefined)

    if (closedTrades.length === 0) {
      account.performance = this.initPerformance()
      return
    }

    const wins = closedTrades.filter((t) => (t.pnl || 0) > 0)
    const losses = closedTrades.filter((t) => (t.pnl || 0) < 0)

    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const unrealizedPnl = account.positions.reduce((sum, p) => sum + p.unrealizedPnl, 0)

    const totalReturn = totalPnl + unrealizedPnl
    const totalReturnPercent = (totalReturn / account.initialBalance) * 100

    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length) : 0

    // Calculate max drawdown (simplified)
    let peak = account.initialBalance
    let maxDrawdown = 0
    let runningBalance = account.initialBalance

    for (const trade of account.trades) {
      if (trade.side === 'sell') {
        runningBalance += trade.pnl || 0
      }
      if (runningBalance > peak) peak = runningBalance
      const drawdown = peak - runningBalance
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }

    account.performance = {
      totalReturn,
      totalReturnPercent,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      totalTrades: closedTrades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      avgWin,
      avgLoss,
      sharpeRatio: this.calculateSharpeRatio(closedTrades),
      maxDrawdown,
      maxDrawdownPercent: peak > 0 ? (maxDrawdown / peak) * 100 : 0,
    }
  }

  private calculateSharpeRatio(trades: SimulationTrade[]): number {
    if (trades.length < 2) return 0

    const returns = trades.map((t) => t.pnlPercent || 0)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) return 0

    // Annualized (assuming daily trades)
    const annualizedReturn = avgReturn * 252
    const annualizedStdDev = stdDev * Math.sqrt(252)
    const riskFreeRate = 0.03 // 3% annual

    return (annualizedReturn - riskFreeRate) / annualizedStdDev
  }
}

// ============================================
// Singleton Instance
// ============================================

export const simulationAccountManager = new SimulationAccountManager()

// ============================================
// Factory Function
// ============================================

export function createSimulationAccount(userId: string, name?: string): SimulationAccount {
  return simulationAccountManager.createAccount(userId, name)
}
