// ============================================
// Alpaca API Client
// Loop 23: 해외 주식 연동
// ============================================

import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export interface AlpacaConfig {
  apiKey: string
  apiSecret: string
  isPaper: boolean // Paper trading vs Live trading
}

export interface AlpacaAccount {
  id: string
  accountNumber: string
  status: string
  currency: string
  cash: number
  portfolioValue: number
  patternDayTrader: boolean
  tradingBlocked: boolean
  transfersBlocked: boolean
  accountBlocked: boolean
  createdAt: string
  equity: number
  lastEquity: number
  longMarketValue: number
  shortMarketValue: number
  initialMargin: number
  maintenanceMargin: number
  daytradeCount: number
  buyingPower: number
  regtBuyingPower: number
  daytradingBuyingPower: number
}

export interface AlpacaPosition {
  assetId: string
  symbol: string
  exchange: string
  assetClass: string
  avgEntryPrice: number
  qty: number
  side: 'long' | 'short'
  marketValue: number
  costBasis: number
  unrealizedPl: number
  unrealizedPlpc: number
  unrealizedIntradayPl: number
  unrealizedIntradayPlpc: number
  currentPrice: number
  lastdayPrice: number
  changeToday: number
}

export interface AlpacaOrder {
  id: string
  clientOrderId: string
  createdAt: string
  updatedAt: string
  submittedAt: string
  filledAt: string | null
  expiredAt: string | null
  canceledAt: string | null
  failedAt: string | null
  replacedAt: string | null
  assetId: string
  symbol: string
  assetClass: string
  notional: number | null
  qty: number
  filledQty: number
  filledAvgPrice: number | null
  orderClass: string
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'
  type: string
  side: 'buy' | 'sell'
  timeInForce: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok'
  limitPrice: number | null
  stopPrice: number | null
  status: string
  extendedHours: boolean
  legs: AlpacaOrder[] | null
  trailPercent: number | null
  trailPrice: number | null
  hwm: number | null
}

export interface AlpacaBar {
  t: string // timestamp
  o: number // open
  h: number // high
  l: number // low
  c: number // close
  v: number // volume
  n: number // number of trades
  vw: number // volume weighted average price
}

export interface AlpacaQuote {
  symbol: string
  bidPrice: number
  bidSize: number
  askPrice: number
  askSize: number
  bidExchange: string
  askExchange: string
  timestamp: string
}

export interface AlpacaTrade {
  symbol: string
  price: number
  size: number
  exchange: string
  timestamp: string
  conditions: string[]
  tape: string
}

export interface AlpacaSnapshot {
  latestTrade: AlpacaTrade
  latestQuote: AlpacaQuote
  minuteBar: AlpacaBar
  dailyBar: AlpacaBar
  prevDailyBar: AlpacaBar
}

export interface AlpacaAsset {
  id: string
  class: string
  exchange: string
  symbol: string
  name: string
  status: string
  tradable: boolean
  marginable: boolean
  shortable: boolean
  easyToBorrow: boolean
  fractionable: boolean
}

export interface AlpacaOrderResult {
  success: boolean
  orderId: string
  status: string
  message: string
}

// ============================================
// Alpaca Client
// ============================================

export class AlpacaClient {
  private config: AlpacaConfig
  private tradingBaseUrl: string
  private dataBaseUrl: string

  constructor(config: AlpacaConfig) {
    this.config = config
    // Paper trading uses different URL
    this.tradingBaseUrl = config.isPaper
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets'
    this.dataBaseUrl = 'https://data.alpaca.markets'
  }

  // ============================================
  // HTTP Helpers
  // ============================================

  private getHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.config.apiKey,
      'APCA-API-SECRET-KEY': this.config.apiSecret,
      'Content-Type': 'application/json',
    }
  }

  private async tradingRequest<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.tradingBaseUrl}${endpoint}`

    safeLogger.debug('[Alpaca] Trading API request', { method, endpoint })

    const response = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      safeLogger.error('[Alpaca] Trading API error', {
        status: response.status,
        error: errorText,
      })
      throw new Error(`Alpaca Trading API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  private async dataRequest<T>(
    method: string,
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${this.dataBaseUrl}${endpoint}`

    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    safeLogger.debug('[Alpaca] Data API request', { method, endpoint })

    const response = await fetch(url, {
      method,
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      safeLogger.error('[Alpaca] Data API error', {
        status: response.status,
        error: errorText,
      })
      throw new Error(`Alpaca Data API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // ============================================
  // Account Methods
  // ============================================

  async getAccount(): Promise<AlpacaAccount> {
    interface RawAccount {
      id: string
      account_number: string
      status: string
      currency: string
      cash: string
      portfolio_value: string
      pattern_day_trader: boolean
      trading_blocked: boolean
      transfers_blocked: boolean
      account_blocked: boolean
      created_at: string
      equity: string
      last_equity: string
      long_market_value: string
      short_market_value: string
      initial_margin: string
      maintenance_margin: string
      daytrade_count: number
      buying_power: string
      regt_buying_power: string
      daytrading_buying_power: string
    }

    const raw = await this.tradingRequest<RawAccount>('GET', '/v2/account')

    return {
      id: raw.id,
      accountNumber: raw.account_number,
      status: raw.status,
      currency: raw.currency,
      cash: parseFloat(raw.cash),
      portfolioValue: parseFloat(raw.portfolio_value),
      patternDayTrader: raw.pattern_day_trader,
      tradingBlocked: raw.trading_blocked,
      transfersBlocked: raw.transfers_blocked,
      accountBlocked: raw.account_blocked,
      createdAt: raw.created_at,
      equity: parseFloat(raw.equity),
      lastEquity: parseFloat(raw.last_equity),
      longMarketValue: parseFloat(raw.long_market_value),
      shortMarketValue: parseFloat(raw.short_market_value),
      initialMargin: parseFloat(raw.initial_margin),
      maintenanceMargin: parseFloat(raw.maintenance_margin),
      daytradeCount: raw.daytrade_count,
      buyingPower: parseFloat(raw.buying_power),
      regtBuyingPower: parseFloat(raw.regt_buying_power),
      daytradingBuyingPower: parseFloat(raw.daytrading_buying_power),
    }
  }

  // ============================================
  // Position Methods
  // ============================================

  async getPositions(): Promise<AlpacaPosition[]> {
    interface RawPosition {
      asset_id: string
      symbol: string
      exchange: string
      asset_class: string
      avg_entry_price: string
      qty: string
      side: 'long' | 'short'
      market_value: string
      cost_basis: string
      unrealized_pl: string
      unrealized_plpc: string
      unrealized_intraday_pl: string
      unrealized_intraday_plpc: string
      current_price: string
      lastday_price: string
      change_today: string
    }

    const raw = await this.tradingRequest<RawPosition[]>('GET', '/v2/positions')

    return raw.map((pos) => ({
      assetId: pos.asset_id,
      symbol: pos.symbol,
      exchange: pos.exchange,
      assetClass: pos.asset_class,
      avgEntryPrice: parseFloat(pos.avg_entry_price),
      qty: parseFloat(pos.qty),
      side: pos.side,
      marketValue: parseFloat(pos.market_value),
      costBasis: parseFloat(pos.cost_basis),
      unrealizedPl: parseFloat(pos.unrealized_pl),
      unrealizedPlpc: parseFloat(pos.unrealized_plpc),
      unrealizedIntradayPl: parseFloat(pos.unrealized_intraday_pl),
      unrealizedIntradayPlpc: parseFloat(pos.unrealized_intraday_plpc),
      currentPrice: parseFloat(pos.current_price),
      lastdayPrice: parseFloat(pos.lastday_price),
      changeToday: parseFloat(pos.change_today),
    }))
  }

  async getPosition(symbol: string): Promise<AlpacaPosition | null> {
    try {
      interface RawPosition {
        asset_id: string
        symbol: string
        exchange: string
        asset_class: string
        avg_entry_price: string
        qty: string
        side: 'long' | 'short'
        market_value: string
        cost_basis: string
        unrealized_pl: string
        unrealized_plpc: string
        unrealized_intraday_pl: string
        unrealized_intraday_plpc: string
        current_price: string
        lastday_price: string
        change_today: string
      }

      const pos = await this.tradingRequest<RawPosition>('GET', `/v2/positions/${symbol}`)

      return {
        assetId: pos.asset_id,
        symbol: pos.symbol,
        exchange: pos.exchange,
        assetClass: pos.asset_class,
        avgEntryPrice: parseFloat(pos.avg_entry_price),
        qty: parseFloat(pos.qty),
        side: pos.side,
        marketValue: parseFloat(pos.market_value),
        costBasis: parseFloat(pos.cost_basis),
        unrealizedPl: parseFloat(pos.unrealized_pl),
        unrealizedPlpc: parseFloat(pos.unrealized_plpc),
        unrealizedIntradayPl: parseFloat(pos.unrealized_intraday_pl),
        unrealizedIntradayPlpc: parseFloat(pos.unrealized_intraday_plpc),
        currentPrice: parseFloat(pos.current_price),
        lastdayPrice: parseFloat(pos.lastday_price),
        changeToday: parseFloat(pos.change_today),
      }
    } catch {
      return null
    }
  }

  // ============================================
  // Order Methods
  // ============================================

  async getOrders(status?: string): Promise<AlpacaOrder[]> {
    const endpoint = status ? `/v2/orders?status=${status}` : '/v2/orders'
    return this.tradingRequest<AlpacaOrder[]>('GET', endpoint)
  }

  async getOrder(orderId: string): Promise<AlpacaOrder | null> {
    try {
      return await this.tradingRequest<AlpacaOrder>('GET', `/v2/orders/${orderId}`)
    } catch {
      return null
    }
  }

  async submitOrder(params: {
    symbol: string
    qty?: number
    notional?: number
    side: 'buy' | 'sell'
    type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'
    timeInForce: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok'
    limitPrice?: number
    stopPrice?: number
    trailPercent?: number
    trailPrice?: number
    extendedHours?: boolean
    clientOrderId?: string
  }): Promise<AlpacaOrderResult> {
    try {
      const body: Record<string, unknown> = {
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        time_in_force: params.timeInForce,
      }

      if (params.qty !== undefined) body.qty = params.qty.toString()
      if (params.notional !== undefined) body.notional = params.notional.toString()
      if (params.limitPrice !== undefined) body.limit_price = params.limitPrice.toString()
      if (params.stopPrice !== undefined) body.stop_price = params.stopPrice.toString()
      if (params.trailPercent !== undefined) body.trail_percent = params.trailPercent.toString()
      if (params.trailPrice !== undefined) body.trail_price = params.trailPrice.toString()
      if (params.extendedHours !== undefined) body.extended_hours = params.extendedHours
      if (params.clientOrderId) body.client_order_id = params.clientOrderId

      const order = await this.tradingRequest<AlpacaOrder>('POST', '/v2/orders', body)

      return {
        success: true,
        orderId: order.id,
        status: order.status,
        message: `Order submitted: ${order.symbol} ${order.side} ${order.qty || order.notional}`,
      }
    } catch (error) {
      return {
        success: false,
        orderId: '',
        status: 'rejected',
        message: error instanceof Error ? error.message : 'Order submission failed',
      }
    }
  }

  async buy(
    symbol: string,
    quantity: number,
    price?: number,
    orderType: 'market' | 'limit' = 'market'
  ): Promise<AlpacaOrderResult> {
    return this.submitOrder({
      symbol,
      qty: quantity,
      side: 'buy',
      type: orderType,
      timeInForce: 'day',
      limitPrice: price,
    })
  }

  async sell(
    symbol: string,
    quantity: number,
    price?: number,
    orderType: 'market' | 'limit' = 'market'
  ): Promise<AlpacaOrderResult> {
    return this.submitOrder({
      symbol,
      qty: quantity,
      side: 'sell',
      type: orderType,
      timeInForce: 'day',
      limitPrice: price,
    })
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.tradingRequest('DELETE', `/v2/orders/${orderId}`)
      return true
    } catch {
      return false
    }
  }

  async cancelAllOrders(): Promise<{ cancelled: number }> {
    interface CancelResult {
      id: string
      status: number
      body: unknown
    }

    const result = await this.tradingRequest<CancelResult[]>('DELETE', '/v2/orders')
    return { cancelled: result.length }
  }

  // ============================================
  // Market Data Methods
  // ============================================

  async getSnapshot(symbol: string): Promise<AlpacaSnapshot | null> {
    try {
      interface SnapshotResponse {
        [symbol: string]: {
          latestTrade: {
            t: string
            x: string
            p: number
            s: number
            c: string[]
            z: string
          }
          latestQuote: {
            t: string
            ax: string
            ap: number
            as: number
            bx: string
            bp: number
            bs: number
          }
          minuteBar: AlpacaBar
          dailyBar: AlpacaBar
          prevDailyBar: AlpacaBar
        }
      }

      const response = await this.dataRequest<SnapshotResponse>(
        'GET',
        `/v2/stocks/${symbol}/snapshot`
      )

      const data = response[symbol]
      if (!data) return null

      return {
        latestTrade: {
          symbol,
          price: data.latestTrade.p,
          size: data.latestTrade.s,
          exchange: data.latestTrade.x,
          timestamp: data.latestTrade.t,
          conditions: data.latestTrade.c,
          tape: data.latestTrade.z,
        },
        latestQuote: {
          symbol,
          bidPrice: data.latestQuote.bp,
          bidSize: data.latestQuote.bs,
          askPrice: data.latestQuote.ap,
          askSize: data.latestQuote.as,
          bidExchange: data.latestQuote.bx,
          askExchange: data.latestQuote.ax,
          timestamp: data.latestQuote.t,
        },
        minuteBar: data.minuteBar,
        dailyBar: data.dailyBar,
        prevDailyBar: data.prevDailyBar,
      }
    } catch {
      return null
    }
  }

  async getSnapshots(symbols: string[]): Promise<Record<string, AlpacaSnapshot>> {
    const symbolsParam = symbols.join(',')

    interface SnapshotResponse {
      [symbol: string]: {
        latestTrade: {
          t: string
          x: string
          p: number
          s: number
          c: string[]
          z: string
        }
        latestQuote: {
          t: string
          ax: string
          ap: number
          as: number
          bx: string
          bp: number
          bs: number
        }
        minuteBar: AlpacaBar
        dailyBar: AlpacaBar
        prevDailyBar: AlpacaBar
      }
    }

    const response = await this.dataRequest<SnapshotResponse>(
      'GET',
      '/v2/stocks/snapshots',
      { symbols: symbolsParam }
    )

    const result: Record<string, AlpacaSnapshot> = {}

    for (const [symbol, data] of Object.entries(response)) {
      result[symbol] = {
        latestTrade: {
          symbol,
          price: data.latestTrade.p,
          size: data.latestTrade.s,
          exchange: data.latestTrade.x,
          timestamp: data.latestTrade.t,
          conditions: data.latestTrade.c,
          tape: data.latestTrade.z,
        },
        latestQuote: {
          symbol,
          bidPrice: data.latestQuote.bp,
          bidSize: data.latestQuote.bs,
          askPrice: data.latestQuote.ap,
          askSize: data.latestQuote.as,
          bidExchange: data.latestQuote.bx,
          askExchange: data.latestQuote.ax,
          timestamp: data.latestQuote.t,
        },
        minuteBar: data.minuteBar,
        dailyBar: data.dailyBar,
        prevDailyBar: data.prevDailyBar,
      }
    }

    return result
  }

  async getBars(
    symbol: string,
    timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day' | '1Week' | '1Month',
    start?: string,
    end?: string,
    limit?: number
  ): Promise<AlpacaBar[]> {
    const params: Record<string, string> = {
      timeframe,
    }

    if (start) params.start = start
    if (end) params.end = end
    if (limit) params.limit = limit.toString()

    interface BarsResponse {
      bars: AlpacaBar[]
      symbol: string
      next_page_token: string | null
    }

    const response = await this.dataRequest<BarsResponse>(
      'GET',
      `/v2/stocks/${symbol}/bars`,
      params
    )

    return response.bars || []
  }

  async getLatestTrade(symbol: string): Promise<AlpacaTrade | null> {
    try {
      interface TradeResponse {
        trade: {
          t: string
          x: string
          p: number
          s: number
          c: string[]
          z: string
        }
        symbol: string
      }

      const response = await this.dataRequest<TradeResponse>(
        'GET',
        `/v2/stocks/${symbol}/trades/latest`
      )

      return {
        symbol,
        price: response.trade.p,
        size: response.trade.s,
        exchange: response.trade.x,
        timestamp: response.trade.t,
        conditions: response.trade.c,
        tape: response.trade.z,
      }
    } catch {
      return null
    }
  }

  async getLatestQuote(symbol: string): Promise<AlpacaQuote | null> {
    try {
      interface QuoteResponse {
        quote: {
          t: string
          ax: string
          ap: number
          as: number
          bx: string
          bp: number
          bs: number
        }
        symbol: string
      }

      const response = await this.dataRequest<QuoteResponse>(
        'GET',
        `/v2/stocks/${symbol}/quotes/latest`
      )

      return {
        symbol,
        bidPrice: response.quote.bp,
        bidSize: response.quote.bs,
        askPrice: response.quote.ap,
        askSize: response.quote.as,
        bidExchange: response.quote.bx,
        askExchange: response.quote.ax,
        timestamp: response.quote.t,
      }
    } catch {
      return null
    }
  }

  // ============================================
  // Asset Methods
  // ============================================

  async getAsset(symbol: string): Promise<AlpacaAsset | null> {
    try {
      return await this.tradingRequest<AlpacaAsset>('GET', `/v2/assets/${symbol}`)
    } catch {
      return null
    }
  }

  async searchAssets(query: string): Promise<AlpacaAsset[]> {
    const assets = await this.tradingRequest<AlpacaAsset[]>(
      'GET',
      '/v2/assets?status=active&asset_class=us_equity'
    )

    const lowerQuery = query.toLowerCase()

    return assets.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(lowerQuery) ||
        asset.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 20)
  }

  // ============================================
  // Market Clock & Calendar
  // ============================================

  async getClock(): Promise<{
    timestamp: string
    isOpen: boolean
    nextOpen: string
    nextClose: string
  }> {
    interface ClockResponse {
      timestamp: string
      is_open: boolean
      next_open: string
      next_close: string
    }

    const raw = await this.tradingRequest<ClockResponse>('GET', '/v2/clock')

    return {
      timestamp: raw.timestamp,
      isOpen: raw.is_open,
      nextOpen: raw.next_open,
      nextClose: raw.next_close,
    }
  }

  async getCalendar(
    start?: string,
    end?: string
  ): Promise<Array<{ date: string; open: string; close: string }>> {
    let endpoint = '/v2/calendar'
    const params: string[] = []

    if (start) params.push(`start=${start}`)
    if (end) params.push(`end=${end}`)

    if (params.length > 0) {
      endpoint += `?${params.join('&')}`
    }

    return this.tradingRequest<Array<{ date: string; open: string; close: string }>>(
      'GET',
      endpoint
    )
  }
}

// ============================================
// Factory Function
// ============================================

export function createAlpacaClient(config: AlpacaConfig): AlpacaClient {
  return new AlpacaClient(config)
}
