// ============================================
// 한국투자증권 Open API Provider
// Korea Investment & Securities API Integration
// ============================================

import { requireKISConfig } from '@/lib/config/env'
import { safeLogger } from '@/lib/utils/safe-logger';

// ============================================
// Types
// ============================================

export interface KISConfig {
  appKey: string
  appSecret: string
  accountNumber: string
  accountProductCode: string // 계좌상품코드 (01: 주식, 03: 선물옵션)
  isVirtual?: boolean // 모의투자 여부
}

export interface KISToken {
  accessToken: string
  tokenType: string
  expiresIn: number
  expiresAt: Date
}

export interface StockPrice {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  tradingValue: number
  timestamp: Date
}

export interface StockQuote {
  symbol: string
  bidPrice: number
  askPrice: number
  bidVolume: number
  askVolume: number
  spread: number
  spreadPercent: number
}

export interface OHLCV {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface OrderRequest {
  symbol: string
  side: 'buy' | 'sell'
  orderType: 'market' | 'limit'
  quantity: number
  price?: number // limit 주문시 필수
}

export interface OrderResponse {
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  orderType: string
  quantity: number
  price: number
  status: 'pending' | 'filled' | 'partial' | 'cancelled'
  filledQuantity: number
  filledPrice: number
  orderedAt: Date
}

export interface Position {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
  marketValue: number
}

export interface AccountBalance {
  totalAsset: number
  totalDeposit: number
  totalStock: number
  availableCash: number
  positions: Position[]
}

// ============================================
// KIS API Provider
// ============================================

class KISProvider {
  private config: KISConfig | null = null
  private token: KISToken | null = null
  private baseUrl: string = ''

  // ============================================
  // Configuration
  // ============================================

  configure(config: KISConfig) {
    this.config = config
    this.baseUrl = config.isVirtual
      ? 'https://openapivts.koreainvestment.com:29443' // 모의투자
      : 'https://openapi.koreainvestment.com:9443' // 실전투자
  }

  /**
   * 환경변수에서 자동 설정 (lazy initialization)
   */
  configureFromEnv(): void {
    const envConfig = requireKISConfig()
    this.configure({
      appKey: envConfig.appKey,
      appSecret: envConfig.appSecret,
      accountNumber: envConfig.accountNumber,
      accountProductCode: envConfig.accountProductCode,
      isVirtual: envConfig.isVirtual,
    })
  }

  private ensureConfig(): KISConfig {
    if (!this.config) {
      // 환경변수에서 자동 설정 시도
      try {
        this.configureFromEnv()
      } catch {
        throw new Error('KIS API not configured. Call configure() first or set KIS_APP_KEY and KIS_APP_SECRET.')
      }
    }
    return this.config!
  }

  // ============================================
  // Authentication
  // ============================================

  async getAccessToken(): Promise<string> {
    // 토큰이 유효한 경우 재사용
    if (this.token && new Date() < this.token.expiresAt) {
      return this.token.accessToken
    }

    const config = this.ensureConfig()

    const response = await fetch(`${this.baseUrl}/oauth2/tokenP`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: config.appKey,
        appsecret: config.appSecret,
      }),
    })

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`)
    }

    const data = await response.json()

    this.token = {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000), // 1분 여유
    }

    return this.token.accessToken
  }

  private async getHeaders(trId: string): Promise<Record<string, string>> {
    const config = this.ensureConfig()
    const token = await this.getAccessToken()

    return {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      appkey: config.appKey,
      appsecret: config.appSecret,
      tr_id: trId,
      custtype: 'P', // 개인
    }
  }

  // ============================================
  // Market Data - 시세 조회
  // ============================================

  /**
   * 주식 현재가 조회
   */
  async getCurrentPrice(symbol: string): Promise<StockPrice> {
    const headers = await this.getHeaders('FHKST01010100')

    const response = await fetch(
      `${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`Price request failed: ${response.status}`)
    }

    const data = await response.json()
    const output = data.output

    return {
      symbol,
      name: output.hts_kor_isnm || '',
      currentPrice: Number(output.stck_prpr),
      change: Number(output.prdy_vrss),
      changePercent: Number(output.prdy_ctrt),
      open: Number(output.stck_oprc),
      high: Number(output.stck_hgpr),
      low: Number(output.stck_lwpr),
      volume: Number(output.acml_vol),
      tradingValue: Number(output.acml_tr_pbmn),
      timestamp: new Date(),
    }
  }

  /**
   * 주식 호가 조회
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    const headers = await this.getHeaders('FHKST01010200')

    const response = await fetch(
      `${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`Quote request failed: ${response.status}`)
    }

    const data = await response.json()
    const output = data.output1

    const bidPrice = Number(output.bidp1)
    const askPrice = Number(output.askp1)

    return {
      symbol,
      bidPrice,
      askPrice,
      bidVolume: Number(output.bidp_rsqn1),
      askVolume: Number(output.askp_rsqn1),
      spread: askPrice - bidPrice,
      spreadPercent: ((askPrice - bidPrice) / bidPrice) * 100,
    }
  }

  /**
   * 일봉 데이터 조회
   */
  async getDailyOHLCV(
    symbol: string,
    startDate: string, // YYYYMMDD
    endDate: string // YYYYMMDD
  ): Promise<OHLCV[]> {
    const headers = await this.getHeaders('FHKST01010400')

    const response = await fetch(
      `${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-daily-price?` +
        `FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}&` +
        `FID_PERIOD_DIV_CODE=D&FID_ORG_ADJ_PRC=0`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`OHLCV request failed: ${response.status}`)
    }

    const data = await response.json()

    return data.output.map((item: Record<string, string>) => ({
      date: new Date(
        item.stck_bsop_date.slice(0, 4) +
          '-' +
          item.stck_bsop_date.slice(4, 6) +
          '-' +
          item.stck_bsop_date.slice(6, 8)
      ),
      open: Number(item.stck_oprc),
      high: Number(item.stck_hgpr),
      low: Number(item.stck_lwpr),
      close: Number(item.stck_clpr),
      volume: Number(item.acml_vol),
    }))
  }

  /**
   * 분봉 데이터 조회
   */
  async getMinuteOHLCV(
    symbol: string,
    timeframe: '1' | '3' | '5' | '10' | '15' | '30' | '60' = '1'
  ): Promise<OHLCV[]> {
    const headers = await this.getHeaders('FHKST01010200')

    const response = await fetch(
      `${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice?` +
        `FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}&` +
        `FID_ETC_CLS_CODE=&FID_PW_DATA_INCU_YN=N`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`Minute OHLCV request failed: ${response.status}`)
    }

    const data = await response.json()

    return data.output2.map((item: Record<string, string>) => ({
      date: new Date(
        item.stck_bsop_date.slice(0, 4) +
          '-' +
          item.stck_bsop_date.slice(4, 6) +
          '-' +
          item.stck_bsop_date.slice(6, 8) +
          'T' +
          item.stck_cntg_hour.slice(0, 2) +
          ':' +
          item.stck_cntg_hour.slice(2, 4) +
          ':00'
      ),
      open: Number(item.stck_oprc),
      high: Number(item.stck_hgpr),
      low: Number(item.stck_lwpr),
      close: Number(item.stck_prpr),
      volume: Number(item.cntg_vol),
    }))
  }

  // ============================================
  // Trading - 주문
  // ============================================

  /**
   * 주식 매수 주문
   */
  async placeBuyOrder(request: OrderRequest): Promise<OrderResponse> {
    const config = this.ensureConfig()
    const trId = config.isVirtual ? 'VTTC0802U' : 'TTTC0802U'
    const headers = await this.getHeaders(trId)

    const body = {
      CANO: config.accountNumber,
      ACNT_PRDT_CD: config.accountProductCode,
      PDNO: request.symbol,
      ORD_DVSN: request.orderType === 'market' ? '01' : '00', // 01: 시장가, 00: 지정가
      ORD_QTY: String(request.quantity),
      ORD_UNPR: request.orderType === 'limit' ? String(request.price) : '0',
    }

    const response = await fetch(
      `${this.baseUrl}/uapi/domestic-stock/v1/trading/order-cash`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      throw new Error(`Buy order failed: ${response.status}`)
    }

    const data = await response.json()

    return {
      orderId: data.output.ODNO,
      symbol: request.symbol,
      side: 'buy',
      orderType: request.orderType,
      quantity: request.quantity,
      price: request.price || 0,
      status: 'pending',
      filledQuantity: 0,
      filledPrice: 0,
      orderedAt: new Date(),
    }
  }

  /**
   * 주식 매도 주문
   */
  async placeSellOrder(request: OrderRequest): Promise<OrderResponse> {
    const config = this.ensureConfig()
    const trId = config.isVirtual ? 'VTTC0801U' : 'TTTC0801U'
    const headers = await this.getHeaders(trId)

    const body = {
      CANO: config.accountNumber,
      ACNT_PRDT_CD: config.accountProductCode,
      PDNO: request.symbol,
      ORD_DVSN: request.orderType === 'market' ? '01' : '00',
      ORD_QTY: String(request.quantity),
      ORD_UNPR: request.orderType === 'limit' ? String(request.price) : '0',
    }

    const response = await fetch(
      `${this.baseUrl}/uapi/domestic-stock/v1/trading/order-cash`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      throw new Error(`Sell order failed: ${response.status}`)
    }

    const data = await response.json()

    return {
      orderId: data.output.ODNO,
      symbol: request.symbol,
      side: 'sell',
      orderType: request.orderType,
      quantity: request.quantity,
      price: request.price || 0,
      status: 'pending',
      filledQuantity: 0,
      filledPrice: 0,
      orderedAt: new Date(),
    }
  }

  /**
   * 주문 취소
   */
  async cancelOrder(orderId: string, symbol: string, quantity: number): Promise<boolean> {
    const config = this.ensureConfig()
    const trId = config.isVirtual ? 'VTTC0803U' : 'TTTC0803U'
    const headers = await this.getHeaders(trId)

    const body = {
      CANO: config.accountNumber,
      ACNT_PRDT_CD: config.accountProductCode,
      KRX_FWDG_ORD_ORGNO: '',
      ORGN_ODNO: orderId,
      ORD_DVSN: '00',
      RVSE_CNCL_DVSN_CD: '02', // 02: 취소
      ORD_QTY: String(quantity),
      ORD_UNPR: '0',
      QTY_ALL_ORD_YN: 'Y',
    }

    const response = await fetch(
      `${this.baseUrl}/uapi/domestic-stock/v1/trading/order-rvsecncl`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }
    )

    return response.ok
  }

  // ============================================
  // Account - 계좌 조회
  // ============================================

  /**
   * 계좌 잔고 조회
   */
  async getAccountBalance(): Promise<AccountBalance> {
    const config = this.ensureConfig()
    const trId = config.isVirtual ? 'VTTC8434R' : 'TTTC8434R'
    const headers = await this.getHeaders(trId)

    const response = await fetch(
      `${this.baseUrl}/uapi/domestic-stock/v1/trading/inquire-balance?` +
        `CANO=${config.accountNumber}&ACNT_PRDT_CD=${config.accountProductCode}&` +
        `AFHR_FLPR_YN=N&OFL_YN=N&INQR_DVSN=01&UNPR_DVSN=01&` +
        `FUND_STTL_ICLD_YN=N&FNCG_AMT_AUTO_RDPT_YN=N&PRCS_DVSN=00&CTX_AREA_FK100=&CTX_AREA_NK100=`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`Balance request failed: ${response.status}`)
    }

    const data = await response.json()
    const output1 = data.output1 || []
    const output2 = data.output2?.[0] || {}

    const positions: Position[] = output1.map((item: Record<string, string>) => {
      const avgPrice = Number(item.pchs_avg_pric)
      const currentPrice = Number(item.prpr)
      const quantity = Number(item.hldg_qty)

      return {
        symbol: item.pdno,
        name: item.prdt_name,
        quantity,
        avgPrice,
        currentPrice,
        pnl: (currentPrice - avgPrice) * quantity,
        pnlPercent: ((currentPrice - avgPrice) / avgPrice) * 100,
        marketValue: currentPrice * quantity,
      }
    })

    return {
      totalAsset: Number(output2.tot_evlu_amt || 0),
      totalDeposit: Number(output2.dnca_tot_amt || 0),
      totalStock: Number(output2.scts_evlu_amt || 0),
      availableCash: Number(output2.nrcvb_buy_amt || 0),
      positions,
    }
  }

  /**
   * 체결 내역 조회
   */
  async getOrderHistory(startDate: string, endDate: string): Promise<OrderResponse[]> {
    const config = this.ensureConfig()
    const trId = config.isVirtual ? 'VTTC8001R' : 'TTTC8001R'
    const headers = await this.getHeaders(trId)

    const response = await fetch(
      `${this.baseUrl}/uapi/domestic-stock/v1/trading/inquire-daily-ccld?` +
        `CANO=${config.accountNumber}&ACNT_PRDT_CD=${config.accountProductCode}&` +
        `INQR_STRT_DT=${startDate}&INQR_END_DT=${endDate}&` +
        `SLL_BUY_DVSN_CD=00&INQR_DVSN=00&PDNO=&CCLD_DVSN=00&` +
        `ORD_GNO_BRNO=&ODNO=&INQR_DVSN_3=00&INQR_DVSN_1=&CTX_AREA_FK100=&CTX_AREA_NK100=`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`Order history request failed: ${response.status}`)
    }

    const data = await response.json()

    return (data.output1 || []).map((item: Record<string, string>) => ({
      orderId: item.odno,
      symbol: item.pdno,
      side: item.sll_buy_dvsn_cd === '01' ? 'sell' : 'buy',
      orderType: item.ord_dvsn_cd === '01' ? 'market' : 'limit',
      quantity: Number(item.ord_qty),
      price: Number(item.ord_unpr),
      status: item.ord_qty === item.tot_ccld_qty ? 'filled' : 'partial',
      filledQuantity: Number(item.tot_ccld_qty),
      filledPrice: Number(item.avg_prvs),
      orderedAt: new Date(
        item.ord_dt.slice(0, 4) +
          '-' +
          item.ord_dt.slice(4, 6) +
          '-' +
          item.ord_dt.slice(6, 8)
      ),
    }))
  }

  // ============================================
  // Search - 종목 검색
  // ============================================

  /**
   * 종목 검색 (키워드)
   */
  async searchStocks(keyword: string): Promise<Array<{ symbol: string; name: string; market: string }>> {
    // KIS API는 직접적인 종목 검색 API가 없어서
    // 클라이언트 측에서 종목 마스터 데이터를 캐싱하여 검색해야 함
    // 여기서는 예시로 빈 배열 반환
    safeLogger.warn('Stock search requires local master data cache')
    return []
  }
}

// ============================================
// Singleton Export
// ============================================

export const kisProvider = new KISProvider()
export default kisProvider

// ============================================
// Helper Functions
// ============================================

/**
 * 시장 운영 시간 확인
 */
export function isMarketOpen(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const day = now.getDay()

  // 주말 체크
  if (day === 0 || day === 6) return false

  // 장시간: 09:00 ~ 15:30
  const time = hour * 100 + minute
  return time >= 900 && time <= 1530
}

/**
 * 동시호가 시간 확인
 */
export function isPreMarket(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const day = now.getDay()

  if (day === 0 || day === 6) return false

  const time = hour * 100 + minute
  // 동시호가: 08:30 ~ 09:00, 15:20 ~ 15:30
  return (time >= 830 && time < 900) || (time >= 1520 && time <= 1530)
}

/**
 * 종목 코드 유효성 검사
 */
export function isValidSymbol(symbol: string): boolean {
  // 한국 주식: 6자리 숫자
  return /^\d{6}$/.test(symbol)
}
