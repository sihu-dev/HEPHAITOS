import { NextRequest } from 'next/server'
import { jsonSuccess, internalError } from '@/lib/api-response'
import { fetchCoinGeckoPrices, fetchCoinGeckoMarkets } from '@/lib/market/coingecko'
import { safeLogger } from '@/lib/utils/safe-logger';
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Default symbols to return
const DEFAULT_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX']

// GET /api/market
// Query params:
//   - symbols: comma-separated list of symbols (e.g., BTC,ETH,SOL)
//   - detailed: if true, fetch detailed market data with high/low prices
async function GETHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    const detailed = searchParams.get('detailed') === 'true'

    // Parse symbols or use defaults
    const symbols = symbolsParam
      ? symbolsParam.split(',').map(s => s.trim().toUpperCase())
      : DEFAULT_SYMBOLS

    // Fetch market data from CoinGecko
    // Use detailed endpoint for high/low prices, simple endpoint for basic prices
    const data = detailed
      ? await fetchCoinGeckoMarkets(symbols)
      : await fetchCoinGeckoPrices(symbols)

    return jsonSuccess(data)
  } catch (error) {
    safeLogger.error('[API/market] Error:', error)
    return internalError('시장 데이터 조회에 실패했습니다.')
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
