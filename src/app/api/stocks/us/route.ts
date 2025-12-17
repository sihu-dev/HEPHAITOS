// ============================================
// US Stock Data API (Alpaca)
// Loop 23: 해외 주식 연동
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { safeLogger } from '@/lib/utils/safe-logger'
import { createAlpacaClient, type AlpacaConfig } from '@/lib/broker/alpaca-client'

export const dynamic = 'force-dynamic'

// Popular US Stocks (Demo)
const POPULAR_US_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financial' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financial' },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Defensive' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financial' },
]

// ============================================
// GET /api/stocks/us
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'snapshot'
    const symbol = searchParams.get('symbol')

    safeLogger.info('[US Stock API] GET request', { type, symbol })

    // Alpaca 클라이언트 생성 (환경변수에서 설정)
    const alpacaConfig: AlpacaConfig = {
      apiKey: process.env.ALPACA_API_KEY || '',
      apiSecret: process.env.ALPACA_API_SECRET || '',
      isPaper: process.env.ALPACA_IS_PAPER !== 'false', // 기본값: Paper Trading
    }

    // API 키 확인
    if (!alpacaConfig.apiKey || !alpacaConfig.apiSecret) {
      return NextResponse.json(
        {
          error: 'Alpaca API not configured',
          message: 'Alpaca API 키가 설정되지 않았습니다. 환경변수를 확인하세요.',
        },
        { status: 503 }
      )
    }

    const client = createAlpacaClient(alpacaConfig)

    switch (type) {
      case 'snapshot': {
        // 주식 스냅샷 (현재가 + 호가 + 일별 데이터)
        if (!symbol) {
          return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        }

        const snapshot = await client.getSnapshot(symbol)

        if (!snapshot) {
          return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
        }

        return NextResponse.json({
          type: 'snapshot',
          data: snapshot,
        })
      }

      case 'quote': {
        // 최신 호가
        if (!symbol) {
          return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        }

        const quote = await client.getLatestQuote(symbol)

        return NextResponse.json({
          type: 'quote',
          data: quote,
        })
      }

      case 'trade': {
        // 최신 체결
        if (!symbol) {
          return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        }

        const trade = await client.getLatestTrade(symbol)

        return NextResponse.json({
          type: 'trade',
          data: trade,
        })
      }

      case 'bars': {
        // 봉 데이터
        if (!symbol) {
          return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        }

        const timeframe = (searchParams.get('timeframe') || '1Day') as
          | '1Min'
          | '5Min'
          | '15Min'
          | '1Hour'
          | '1Day'
          | '1Week'
          | '1Month'
        const start = searchParams.get('start') || undefined
        const end = searchParams.get('end') || undefined
        const limit = searchParams.get('limit')
          ? parseInt(searchParams.get('limit')!)
          : 100

        const bars = await client.getBars(symbol, timeframe, start, end, limit)

        return NextResponse.json({
          type: 'bars',
          data: bars,
        })
      }

      case 'clock': {
        // 마켓 상태
        const clock = await client.getClock()

        return NextResponse.json({
          type: 'clock',
          data: clock,
        })
      }

      case 'calendar': {
        // 마켓 캘린더
        const start = searchParams.get('start') || undefined
        const end = searchParams.get('end') || undefined

        const calendar = await client.getCalendar(start, end)

        return NextResponse.json({
          type: 'calendar',
          data: calendar,
        })
      }

      case 'asset': {
        // 자산 정보
        if (!symbol) {
          return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        }

        const asset = await client.getAsset(symbol)

        return NextResponse.json({
          type: 'asset',
          data: asset,
        })
      }

      case 'search': {
        // 종목 검색
        const query = searchParams.get('q')
        if (!query) {
          return NextResponse.json({ error: 'q required' }, { status: 400 })
        }

        const results = await client.searchAssets(query)

        return NextResponse.json({
          type: 'search',
          data: results,
        })
      }

      case 'popular': {
        // 인기 종목 + 스냅샷
        const symbols = POPULAR_US_STOCKS.map((s) => s.symbol)
        const snapshots = await client.getSnapshots(symbols)

        const stocksWithData = POPULAR_US_STOCKS.map((stock) => {
          const snapshot = snapshots[stock.symbol]
          if (snapshot) {
            const change = snapshot.dailyBar.c - snapshot.prevDailyBar.c
            const changePercent = (change / snapshot.prevDailyBar.c) * 100

            return {
              ...stock,
              price: snapshot.dailyBar.c,
              change,
              changePercent,
              volume: snapshot.dailyBar.v,
              high: snapshot.dailyBar.h,
              low: snapshot.dailyBar.l,
              open: snapshot.dailyBar.o,
            }
          }
          return {
            ...stock,
            price: 0,
            change: 0,
            changePercent: 0,
            volume: 0,
          }
        })

        return NextResponse.json({
          type: 'popular',
          data: stocksWithData,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[US Stock API] GET error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST /api/stocks/us
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 사용자 인증
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    safeLogger.info('[US Stock API] POST request', { action, userId: user.id })

    // 사용자별 Alpaca 인증 정보 조회
    const { data: credentials } = await supabase
      .from('broker_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker', 'alpaca')
      .single()

    if (!credentials) {
      return NextResponse.json(
        {
          error: 'Alpaca credentials not found',
          message: 'Alpaca 연동이 필요합니다.',
        },
        { status: 400 }
      )
    }

    const alpacaConfig: AlpacaConfig = {
      apiKey: credentials.app_key,
      apiSecret: credentials.app_secret,
      isPaper: credentials.is_paper ?? true,
    }

    const client = createAlpacaClient(alpacaConfig)

    switch (action) {
      case 'account': {
        // 계좌 정보
        const account = await client.getAccount()

        return NextResponse.json({
          success: true,
          action: 'account',
          data: account,
        })
      }

      case 'positions': {
        // 보유 포지션
        const positions = await client.getPositions()

        return NextResponse.json({
          success: true,
          action: 'positions',
          data: positions,
        })
      }

      case 'position': {
        // 특정 종목 포지션
        const { symbol } = body

        if (!symbol) {
          return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        }

        const position = await client.getPosition(symbol)

        return NextResponse.json({
          success: true,
          action: 'position',
          data: position,
        })
      }

      case 'orders': {
        // 주문 목록
        const { status } = body
        const orders = await client.getOrders(status)

        return NextResponse.json({
          success: true,
          action: 'orders',
          data: orders,
        })
      }

      case 'order': {
        // 특정 주문 조회
        const { orderId } = body

        if (!orderId) {
          return NextResponse.json({ error: 'orderId required' }, { status: 400 })
        }

        const order = await client.getOrder(orderId)

        return NextResponse.json({
          success: true,
          action: 'order',
          data: order,
        })
      }

      case 'buy': {
        const { symbol, quantity, price, orderType } = body

        if (!symbol || !quantity) {
          return NextResponse.json(
            { error: 'symbol and quantity required' },
            { status: 400 }
          )
        }

        const result = await client.buy(symbol, quantity, price, orderType)

        // 주문 로그 저장
        await supabase.from('order_logs').insert({
          user_id: user.id,
          broker: 'alpaca',
          symbol,
          side: 'buy',
          quantity,
          price,
          order_type: orderType || 'market',
          order_id: result.orderId,
          status: result.status,
          message: result.message,
        })

        return NextResponse.json({
          success: result.success,
          action: 'buy',
          data: result,
        })
      }

      case 'sell': {
        const { symbol, quantity, price, orderType } = body

        if (!symbol || !quantity) {
          return NextResponse.json(
            { error: 'symbol and quantity required' },
            { status: 400 }
          )
        }

        const result = await client.sell(symbol, quantity, price, orderType)

        // 주문 로그 저장
        await supabase.from('order_logs').insert({
          user_id: user.id,
          broker: 'alpaca',
          symbol,
          side: 'sell',
          quantity,
          price,
          order_type: orderType || 'market',
          order_id: result.orderId,
          status: result.status,
          message: result.message,
        })

        return NextResponse.json({
          success: result.success,
          action: 'sell',
          data: result,
        })
      }

      case 'submit_order': {
        // 고급 주문 제출
        const {
          symbol,
          qty,
          notional,
          side,
          type,
          timeInForce,
          limitPrice,
          stopPrice,
          trailPercent,
          trailPrice,
          extendedHours,
        } = body

        if (!symbol || !side || !type || !timeInForce) {
          return NextResponse.json(
            { error: 'symbol, side, type, and timeInForce required' },
            { status: 400 }
          )
        }

        const result = await client.submitOrder({
          symbol,
          qty,
          notional,
          side,
          type,
          timeInForce,
          limitPrice,
          stopPrice,
          trailPercent,
          trailPrice,
          extendedHours,
        })

        // 주문 로그 저장
        await supabase.from('order_logs').insert({
          user_id: user.id,
          broker: 'alpaca',
          symbol,
          side,
          quantity: qty || 0,
          price: limitPrice || stopPrice,
          order_type: type,
          order_id: result.orderId,
          status: result.status,
          message: result.message,
        })

        return NextResponse.json({
          success: result.success,
          action: 'submit_order',
          data: result,
        })
      }

      case 'cancel': {
        const { orderId } = body

        if (!orderId) {
          return NextResponse.json({ error: 'orderId required' }, { status: 400 })
        }

        const success = await client.cancelOrder(orderId)

        // 주문 로그 업데이트
        if (success) {
          await supabase
            .from('order_logs')
            .update({ status: 'cancelled' })
            .eq('order_id', orderId)
            .eq('user_id', user.id)
        }

        return NextResponse.json({
          success,
          action: 'cancel',
        })
      }

      case 'cancel_all': {
        const result = await client.cancelAllOrders()

        return NextResponse.json({
          success: true,
          action: 'cancel_all',
          data: result,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[US Stock API] POST error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
