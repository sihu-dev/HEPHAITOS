// ============================================
// Trades API Route
// Supabase 연동 + Mock 데이터 폴백
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Trade, PaginatedResponse } from '@/types'
import { mockTrades } from '@/lib/mock-data'
import { withApiMiddleware, validateQueryParams, validateRequestBody, createApiResponse } from '@/lib/api/middleware'
import { tradesQuerySchema, createTradeSchema } from '@/lib/validations/trades'
import { safeLogger } from '@/lib/utils/safe-logger'

export const dynamic = 'force-dynamic'

// Create Supabase client for API route
async function getSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors in server component
          }
        },
      },
    }
  )
}

// GET /api/trades
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    // Validate query parameters
    const validation = validateQueryParams(request, tradesQuerySchema)
    if ('error' in validation) return validation.error

    const { page, limit, strategyId, symbol, status, sortBy, sortOrder } = validation.data

    safeLogger.info('[Trades API] Fetching trades', {
      page,
      limit,
      strategyId,
      symbol,
      status,
    })

    const supabase = await getSupabaseClient()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Return mock data for non-authenticated users
      return returnMockTrades(page, limit, strategyId, symbol)
    }

    // Try to fetch real trades from Supabase
    let query = supabase
      .from('trades')
      .select('*, strategies!inner(user_id)', { count: 'exact' })
      .eq('strategies.user_id', user.id)
      .order('created_at', { ascending: false })

    // Filter by strategy
    if (strategyId) {
      query = query.eq('strategy_id', strategyId)
    }

    // Filter by symbol
    if (symbol) {
      query = query.ilike('symbol', `%${symbol}%`)
    }

    // Pagination
    const startIndex = (page - 1) * limit
    query = query.range(startIndex, startIndex + limit - 1)

    const { data: trades, error, count } = await query

    if (error || !trades?.length) {
      // Fallback to mock data
      return returnMockTrades(page, limit, strategyId, symbol)
    }

    // Transform to Trade type
    const transformedTrades: Trade[] = trades.map(t => ({
      id: t.id,
      strategyId: t.strategy_id,
      symbol: t.symbol,
      type: t.type as 'buy' | 'sell',
      status: t.status as 'pending' | 'filled' | 'cancelled' | 'failed',
      price: t.price,
      amount: t.amount,
      total: t.total,
      fee: t.fee,
      pnl: t.pnl,
      pnlPercent: t.pnl_percent,
      executedAt: t.executed_at ? new Date(t.executed_at) : undefined,
      createdAt: new Date(t.created_at),
    }))

    const total = count || transformedTrades.length
    const totalPages = Math.ceil(total / limit)

    return createApiResponse({
      data: transformedTrades,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

// Helper function to return mock trades with pagination
function returnMockTrades(
  page: number,
  limit: number,
  strategyId: string | null,
  symbol: string | null
) {
  let filteredTrades = [...mockTrades]

  // Filter by strategy
  if (strategyId) {
    filteredTrades = filteredTrades.filter((t) => t.strategyId === strategyId)
  }

  // Filter by symbol
  if (symbol) {
    filteredTrades = filteredTrades.filter((t) =>
      t.symbol.toLowerCase().includes(symbol.toLowerCase())
    )
  }

  // Sort by createdAt descending
  filteredTrades.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  // Pagination
  const total = filteredTrades.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + limit)

  const response: PaginatedResponse<Trade> & { success: boolean } = {
    success: true,
    data: paginatedTrades,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }

  return NextResponse.json(response)
}

// POST /api/trades - Create a new trade
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    // Validate request body
    const validation = await validateRequestBody(request, createTradeSchema)
    if ('error' in validation) return validation.error

    const { strategyId, symbol, type, amount, price } = validation.data

    safeLogger.info('[Trades API] Creating trade', { strategyId, symbol, type })

    const supabase = await getSupabaseClient()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return createApiResponse(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify strategy belongs to user
    const { data: strategy } = await supabase
      .from('strategies')
      .select('id')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single()

    if (!strategy) {
      return createApiResponse(
        { error: 'Strategy not found or access denied' },
        { status: 403 }
      )
    }

    // Create trade
    const tradeData = {
      strategy_id: strategyId,
      symbol: symbol,
      type: type,
      status: 'pending',
      price: price || 0,
      amount: amount,
      total: (price || 0) * amount,
    }

    const { data: newTrade, error } = await supabase
      .from('trades')
      .insert(tradeData)
      .select()
      .single()

    if (error) {
      safeLogger.error('[Trades API] Failed to create trade', { error })
      throw error
    }

    return createApiResponse({
      id: newTrade.id,
      strategyId: newTrade.strategy_id,
      symbol: newTrade.symbol,
      type: newTrade.type,
      status: newTrade.status,
      price: newTrade.price,
      amount: newTrade.amount,
      total: newTrade.total,
      createdAt: new Date(newTrade.created_at),
    })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
