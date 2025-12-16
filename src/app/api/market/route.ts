import { NextRequest } from 'next/server'
import type { MarketData } from '@/types'
import { jsonSuccess, internalError } from '@/lib/api-response'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Mock market data for MVP
const mockMarketData: MarketData[] = [
  {
    symbol: 'BTC',
    price: 97245.50,
    change24h: 2.34,
    volume24h: 32400000000,
    high24h: 98123.00,
    low24h: 94567.00,
    marketCap: 1920000000000,
  },
  {
    symbol: 'ETH',
    price: 3842.20,
    change24h: -0.82,
    volume24h: 18700000000,
    high24h: 3912.50,
    low24h: 3798.00,
    marketCap: 462000000000,
  },
  {
    symbol: 'SOL',
    price: 224.85,
    change24h: 5.67,
    volume24h: 4200000000,
    high24h: 228.50,
    low24h: 212.30,
    marketCap: 105000000000,
  },
  {
    symbol: 'XRP',
    price: 2.34,
    change24h: 1.23,
    volume24h: 8900000000,
    high24h: 2.42,
    low24h: 2.28,
    marketCap: 134000000000,
  },
  {
    symbol: 'BNB',
    price: 712.45,
    change24h: 0.45,
    volume24h: 2100000000,
    high24h: 718.90,
    low24h: 705.20,
    marketCap: 109000000000,
  },
  {
    symbol: 'ADA',
    price: 1.12,
    change24h: 3.21,
    volume24h: 1800000000,
    high24h: 1.15,
    low24h: 1.08,
    marketCap: 40000000000,
  },
  {
    symbol: 'DOGE',
    price: 0.42,
    change24h: -1.45,
    volume24h: 2500000000,
    high24h: 0.44,
    low24h: 0.41,
    marketCap: 62000000000,
  },
  {
    symbol: 'AVAX',
    price: 52.30,
    change24h: 4.12,
    volume24h: 890000000,
    high24h: 53.80,
    low24h: 49.50,
    marketCap: 21000000000,
  },
]

// GET /api/market
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbols = searchParams.get('symbols')?.split(',')

    let data = [...mockMarketData]

    // Filter by symbols if provided
    if (symbols && symbols.length > 0) {
      data = data.filter((m) => symbols.includes(m.symbol))
    }

    // Add some randomness to simulate real-time data
    data = data.map((item) => ({
      ...item,
      price: item.price * (1 + (Math.random() - 0.5) * 0.001),
      change24h: item.change24h + (Math.random() - 0.5) * 0.1,
    }))

    return jsonSuccess(data)
  } catch {
    return internalError('시장 데이터 조회에 실패했습니다.')
  }
}
