// ============================================
// Portfolio API Route
// Supabase 연동 + Mock 데이터 폴백
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Portfolio, ApiResponse } from '@/types'
import { mockPortfolio } from '@/lib/mock-data'
import { withApiMiddleware, validateQueryParams, createApiResponse } from '@/lib/api/middleware'
import { portfolioQuerySchema } from '@/lib/validations/portfolio'
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

// GET /api/portfolio
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    // Validate query parameters
    const validation = validateQueryParams(request, portfolioQuerySchema)
    if ('error' in validation) return validation.error

    const { timeframe, includeHistory } = validation.data

    safeLogger.info('[Portfolio API] Fetching portfolio', { timeframe, includeHistory })

    const supabase = await getSupabaseClient()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Return mock data for non-authenticated users
      return createApiResponse(mockPortfolio)
    }

    // Try to fetch real portfolio data from Supabase
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (portfolioError || !portfolioData) {
      // Fallback to mock data if no portfolio exists
      safeLogger.warn('[Portfolio API] No portfolio found, using mock', { userId: user.id })
      return createApiResponse(mockPortfolio)
    }

    // Fetch positions for this portfolio
    const { data: positions } = await supabase
      .from('positions')
      .select('*')
      .eq('portfolio_id', portfolioData.id)

    // Transform to Portfolio type
    const portfolio: Portfolio = {
      totalValue: portfolioData.total_value || mockPortfolio.totalValue,
      cashBalance: portfolioData.cash_balance || mockPortfolio.cashBalance,
      investedValue: portfolioData.invested_value || mockPortfolio.investedValue,
      totalPnl: portfolioData.total_pnl || mockPortfolio.totalPnl,
      totalPnlPercent: portfolioData.total_pnl_percent || mockPortfolio.totalPnlPercent,
      positions: positions?.map(p => ({
        symbol: p.symbol,
        amount: p.amount,
        avgPrice: p.avg_price,
        currentPrice: p.current_price,
        value: p.value,
        pnl: p.pnl,
        pnlPercent: p.pnl_percent,
      })) || mockPortfolio.positions,
    }

    return createApiResponse(portfolio)
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)
