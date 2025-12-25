// ============================================
// Korean Stock Data API
// Loop 22: 한국 주식 데이터 연동
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { safeLogger } from '@/lib/utils/safe-logger'
import { createKISClient, type KISConfig } from '@/lib/broker/kis-client'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

export const dynamic = 'force-dynamic'

// ============================================
// GET /api/stocks/kr
// ============================================

async function GETHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'price'
    const symbol = searchParams.get('symbol')
    const indexCode = searchParams.get('indexCode')

    safeLogger.info('[KR Stock API] GET request', { type, symbol })

    // KIS 클라이언트 생성 (환경변수에서 설정)
    const kisConfig: KISConfig = {
      appKey: process.env.KIS_APP_KEY || '',
      appSecret: process.env.KIS_APP_SECRET || '',
      accountNo: process.env.KIS_ACCOUNT_NO || '',
      accountProductCode: process.env.KIS_ACCOUNT_PRODUCT_CODE || '01',
      isPaper: process.env.KIS_IS_PAPER === 'true',
    }

    // API 키 확인
    if (!kisConfig.appKey || !kisConfig.appSecret) {
      return NextResponse.json(
        {
          error: 'KIS API not configured',
          message: 'KIS API 키가 설정되지 않았습니다. 환경변수를 확인하세요.',
        },
        { status: 503 }
      )
    }

    const client = createKISClient(kisConfig)

    switch (type) {
      case 'price': {
        // 주식 현재가 조회
        if (!symbol) {
          return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        }

        const price = await client.getStockPrice(symbol)

        return NextResponse.json({
          type: 'price',
          data: price,
        })
      }

      case 'quote': {
        // 호가 조회
        if (!symbol) {
          return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        }

        const quote = await client.getStockQuote(symbol)

        return NextResponse.json({
          type: 'quote',
          data: quote,
        })
      }

      case 'index': {
        // 지수 조회
        const code = indexCode || '0001' // 기본: KOSPI

        const index = await client.getMarketIndex(code)

        return NextResponse.json({
          type: 'index',
          data: index,
        })
      }

      case 'indices': {
        // 주요 지수 일괄 조회
        const [kospi, kosdaq, kospi200] = await Promise.all([
          client.getMarketIndex('0001'),
          client.getMarketIndex('1001'),
          client.getMarketIndex('2001'),
        ])

        return NextResponse.json({
          type: 'indices',
          data: { kospi, kosdaq, kospi200 },
        })
      }

      case 'search': {
        // 종목 검색
        const keyword = searchParams.get('q')
        if (!keyword) {
          return NextResponse.json({ error: 'q required' }, { status: 400 })
        }

        const results = await client.searchStocks(keyword)

        return NextResponse.json({
          type: 'search',
          data: results,
        })
      }

      case 'popular': {
        // 인기 종목 (데모용 하드코딩)
        const popularStocks = [
          { symbol: '005930', name: '삼성전자', market: 'KOSPI' },
          { symbol: '000660', name: 'SK하이닉스', market: 'KOSPI' },
          { symbol: '373220', name: 'LG에너지솔루션', market: 'KOSPI' },
          { symbol: '207940', name: '삼성바이오로직스', market: 'KOSPI' },
          { symbol: '005380', name: '현대차', market: 'KOSPI' },
          { symbol: '006400', name: '삼성SDI', market: 'KOSPI' },
          { symbol: '035420', name: 'NAVER', market: 'KOSPI' },
          { symbol: '035720', name: '카카오', market: 'KOSPI' },
          { symbol: '051910', name: 'LG화학', market: 'KOSPI' },
          { symbol: '068270', name: '셀트리온', market: 'KOSPI' },
        ]

        // 실시간 가격 조회
        const pricesPromises = popularStocks.map(async (stock) => {
          try {
            const price = await client.getStockPrice(stock.symbol)
            return { ...stock, ...price }
          } catch {
            return { ...stock, currentPrice: 0, change: 0, changePercent: 0 }
          }
        })

        const stocksWithPrices = await Promise.all(pricesPromises)

        return NextResponse.json({
          type: 'popular',
          data: stocksWithPrices,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[KR Stock API] GET error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST /api/stocks/kr
// ============================================

async function POSTHandler(request: NextRequest) {
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

    safeLogger.info('[KR Stock API] POST request', { action, userId: user.id })

    // 사용자별 KIS 인증 정보 조회
    const { data: credentials } = await supabase
      .from('broker_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker', 'kis')
      .single()

    if (!credentials) {
      return NextResponse.json(
        {
          error: 'KIS credentials not found',
          message: '한국투자증권 연동이 필요합니다.',
        },
        { status: 400 }
      )
    }

    const kisConfig: KISConfig = {
      appKey: credentials.app_key,
      appSecret: credentials.app_secret,
      accountNo: credentials.account_no,
      accountProductCode: credentials.account_product_code || '01',
      isPaper: credentials.is_paper || false,
    }

    const client = createKISClient(kisConfig)

    switch (action) {
      case 'balance': {
        // 계좌 잔고 조회
        const balance = await client.getBalance()

        return NextResponse.json({
          success: true,
          action: 'balance',
          data: balance,
        })
      }

      case 'holdings': {
        // 보유 종목 조회
        const holdings = await client.getHoldings()

        return NextResponse.json({
          success: true,
          action: 'holdings',
          data: holdings,
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
          broker: 'kis',
          symbol,
          side: 'buy',
          quantity,
          price,
          order_type: orderType || 'limit',
          order_id: result.orderId,
          status: result.status,
          message: result.message,
        })

        return NextResponse.json({
          success: result.status !== 'rejected',
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
          broker: 'kis',
          symbol,
          side: 'sell',
          quantity,
          price,
          order_type: orderType || 'limit',
          order_id: result.orderId,
          status: result.status,
          message: result.message,
        })

        return NextResponse.json({
          success: result.status !== 'rejected',
          action: 'sell',
          data: result,
        })
      }

      case 'cancel': {
        const { orderId, symbol, quantity } = body

        if (!orderId || !symbol || !quantity) {
          return NextResponse.json(
            { error: 'orderId, symbol, and quantity required' },
            { status: 400 }
          )
        }

        const success = await client.cancelOrder(orderId, symbol, quantity)

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

      case 'order_status': {
        const { orderId } = body

        if (!orderId) {
          return NextResponse.json({ error: 'orderId required' }, { status: 400 })
        }

        const status = await client.getOrderStatus(orderId)

        return NextResponse.json({
          success: !!status,
          action: 'order_status',
          data: status,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[KR Stock API] POST error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
export const POST = withRateLimit(POSTHandler, { category: 'api' })
