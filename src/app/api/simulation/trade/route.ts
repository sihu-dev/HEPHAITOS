// ============================================
// Simulation Trade API Route
// 가상 계좌 거래
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { simulationAccountManager } from '@/lib/simulation'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { createSimulationTradeSchema } from '@/lib/validations/simulation'
import { safeLogger } from '@/lib/utils/safe-logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/simulation/trade
 * Execute trade on simulation account
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, createSimulationTradeSchema)
    if ('error' in validation) return validation.error

    const { accountId, symbol, side, quantity, price, reason } = validation.data

    safeLogger.info('[Simulation Trade API] Executing trade', { accountId, symbol, side, quantity })

    const trade =
      side === 'buy'
        ? simulationAccountManager.buy(accountId, { symbol, side, quantity, price, reason })
        : simulationAccountManager.sell(accountId, { symbol, side, quantity, price, reason })

    if (!trade) {
      safeLogger.warn('[Simulation Trade API] Trade failed', {
        accountId,
        side,
        error: side === 'buy' ? 'Insufficient balance' : 'Insufficient position',
      })
      return createApiResponse(
        { error: side === 'buy' ? 'Insufficient balance' : 'Insufficient position' },
        { status: 400 }
      )
    }

    const summary = simulationAccountManager.getAccountSummary(accountId)

    safeLogger.info('[Simulation Trade API] Trade executed', { accountId, tradeId: trade.id })

    return createApiResponse({ trade, summary })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)

/**
 * DELETE /api/simulation/trade?accountId=xxx
 * Close all positions
 */
export const DELETE = withApiMiddleware(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return createApiResponse({ error: 'accountId is required' }, { status: 400 })
    }

    safeLogger.info('[Simulation Trade API] Closing all positions', { accountId })

    // Get current prices from positions (in real app, fetch from exchange)
    const account = simulationAccountManager.getAccount(accountId)
    if (!account) {
      safeLogger.warn('[Simulation Trade API] Account not found', { accountId })
      return createApiResponse({ error: 'Account not found' }, { status: 404 })
    }

    const prices: Record<string, number> = {}
    account.positions.forEach((p) => {
      prices[p.symbol] = p.currentPrice
    })

    const trades = simulationAccountManager.closeAllPositions(accountId, prices)
    const summary = simulationAccountManager.getAccountSummary(accountId)

    safeLogger.info('[Simulation Trade API] All positions closed', {
      accountId,
      closedTrades: trades.length,
    })

    return createApiResponse({ trades, summary })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
