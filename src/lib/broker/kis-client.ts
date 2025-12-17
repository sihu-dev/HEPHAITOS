// ============================================
// KIS (Korea Investment & Securities) API Client
// Loop 22: 한국 주식 데이터 연동
// ============================================

import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export interface KISConfig {
  appKey: string
  appSecret: string
  accountNo: string
  accountProductCode: string
  isPaper?: boolean // 모의투자 여부
}

export interface KISToken {
  accessToken: string
  tokenType: string
  expiresAt: Date
}

export interface KISStockPrice {
  symbol: string
  name: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  tradingValue: number
  marketCap: number
  per: number | null
  pbr: number | null
  eps: number | null
  timestamp: Date
}

export interface KISStockQuote {
  symbol: string
  bidPrice: number
  askPrice: number
  bidQuantity: number
  askQuantity: number
  bidPrices: number[]
  askPrices: number[]
  bidQuantities: number[]
  askQuantities: number[]
}

export interface KISOrderResult {
  orderId: string
  symbol: string
  orderType: 'buy' | 'sell'
  quantity: number
  price: number
  status: 'submitted' | 'filled' | 'partial' | 'cancelled' | 'rejected'
  filledQuantity: number
  filledPrice: number
  message: string
  timestamp: Date
}

export interface KISBalance {
  totalAssets: number
  totalDeposit: number
  availableCash: number
  totalPurchase: number
  totalEvaluation: number
  profitLoss: number
  profitLossRate: number
}

export interface KISHolding {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  evaluation: number
  profitLoss: number
  profitLossRate: number
  purchaseAmount: number
}

export interface KISMarketIndex {
  name: string
  code: string
  currentValue: number
  previousClose: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
  timestamp: Date
}

// ============================================
// KIS API Client
// ============================================

export class KISClient {
  private config: KISConfig
  private token: KISToken | null = null
  private baseUrl: string

  constructor(config: KISConfig) {
    this.config = config
    this.baseUrl = config.isPaper
      ? 'https://openapivts.koreainvestment.com:29443'
      : 'https://openapi.koreainvestment.com:9443'
  }

  // ============================================
  // Authentication
  // ============================================

  async getAccessToken(): Promise<string> {
    // 토큰이 유효하면 재사용
    if (this.token && this.token.expiresAt > new Date()) {
      return this.token.accessToken
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth2/tokenP`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          appkey: this.config.appKey,
          appsecret: this.config.appSecret,
        }),
      })

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`)
      }

      const data = await response.json()

      this.token = {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000), // 1분 여유
      }

      safeLogger.info('[KIS] Access token obtained', {
        expiresAt: this.token.expiresAt,
      })

      return this.token.accessToken
    } catch (error) {
      safeLogger.error('[KIS] Failed to get access token', { error })
      throw error
    }
  }

  private async request<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST'
      headers?: Record<string, string>
      body?: unknown
      trId: string
    }
  ): Promise<T> {
    const accessToken = await this.getAccessToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: `Bearer ${accessToken}`,
      appkey: this.config.appKey,
      appsecret: this.config.appSecret,
      tr_id: options.trId,
      ...options.headers,
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`KIS API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // ============================================
  // Market Data
  // ============================================

  /**
   * 주식 현재가 조회
   */
  async getStockPrice(symbol: string): Promise<KISStockPrice> {
    const trId = this.config.isPaper ? 'VTTC8001R' : 'FHKST01010100'

    interface KISPriceResponse {
      output: {
        stck_prpr: string
        prdy_vrss: string
        prdy_ctrt: string
        stck_oprc: string
        stck_hgpr: string
        stck_lwpr: string
        acml_vol: string
        acml_tr_pbmn: string
        hts_avls: string
        per: string
        pbr: string
        eps: string
        prdy_clpr: string
      }
      rt_cd: string
      msg1: string
    }

    const response = await this.request<KISPriceResponse>(
      `/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`,
      { trId }
    )

    if (response.rt_cd !== '0') {
      throw new Error(`KIS API error: ${response.msg1}`)
    }

    const o = response.output

    return {
      symbol,
      name: '', // 별도 조회 필요
      currentPrice: parseFloat(o.stck_prpr),
      previousClose: parseFloat(o.prdy_clpr),
      change: parseFloat(o.prdy_vrss),
      changePercent: parseFloat(o.prdy_ctrt),
      open: parseFloat(o.stck_oprc),
      high: parseFloat(o.stck_hgpr),
      low: parseFloat(o.stck_lwpr),
      volume: parseInt(o.acml_vol),
      tradingValue: parseFloat(o.acml_tr_pbmn),
      marketCap: parseFloat(o.hts_avls) * 100000000, // 억 -> 원
      per: o.per ? parseFloat(o.per) : null,
      pbr: o.pbr ? parseFloat(o.pbr) : null,
      eps: o.eps ? parseFloat(o.eps) : null,
      timestamp: new Date(),
    }
  }

  /**
   * 주식 호가 조회
   */
  async getStockQuote(symbol: string): Promise<KISStockQuote> {
    const trId = this.config.isPaper ? 'VTTC8002R' : 'FHKST01010200'

    interface KISQuoteResponse {
      output1: {
        askp1: string
        askp2: string
        askp3: string
        askp4: string
        askp5: string
        bidp1: string
        bidp2: string
        bidp3: string
        bidp4: string
        bidp5: string
        askp_rsqn1: string
        askp_rsqn2: string
        askp_rsqn3: string
        askp_rsqn4: string
        askp_rsqn5: string
        bidp_rsqn1: string
        bidp_rsqn2: string
        bidp_rsqn3: string
        bidp_rsqn4: string
        bidp_rsqn5: string
      }
      rt_cd: string
      msg1: string
    }

    const response = await this.request<KISQuoteResponse>(
      `/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`,
      { trId }
    )

    if (response.rt_cd !== '0') {
      throw new Error(`KIS API error: ${response.msg1}`)
    }

    const o = response.output1

    return {
      symbol,
      bidPrice: parseFloat(o.bidp1),
      askPrice: parseFloat(o.askp1),
      bidQuantity: parseInt(o.bidp_rsqn1),
      askQuantity: parseInt(o.askp_rsqn1),
      bidPrices: [o.bidp1, o.bidp2, o.bidp3, o.bidp4, o.bidp5].map(parseFloat),
      askPrices: [o.askp1, o.askp2, o.askp3, o.askp4, o.askp5].map(parseFloat),
      bidQuantities: [o.bidp_rsqn1, o.bidp_rsqn2, o.bidp_rsqn3, o.bidp_rsqn4, o.bidp_rsqn5].map((v) => parseInt(v)),
      askQuantities: [o.askp_rsqn1, o.askp_rsqn2, o.askp_rsqn3, o.askp_rsqn4, o.askp_rsqn5].map((v) => parseInt(v)),
    }
  }

  /**
   * 주요 지수 조회 (KOSPI, KOSDAQ)
   */
  async getMarketIndex(indexCode: string): Promise<KISMarketIndex> {
    const trId = 'FHPUP02100000'

    interface KISIndexResponse {
      output: {
        bstp_nmix_prpr: string
        bstp_nmix_prdy_vrss: string
        bstp_nmix_prdy_ctrt: string
        bstp_nmix_oprc: string
        bstp_nmix_hgpr: string
        bstp_nmix_lwpr: string
        acml_vol: string
      }
      rt_cd: string
      msg1: string
    }

    const response = await this.request<KISIndexResponse>(
      `/uapi/domestic-stock/v1/quotations/inquire-index-price?FID_COND_MRKT_DIV_CODE=U&FID_INPUT_ISCD=${indexCode}`,
      { trId }
    )

    if (response.rt_cd !== '0') {
      throw new Error(`KIS API error: ${response.msg1}`)
    }

    const o = response.output
    const indexNames: Record<string, string> = {
      '0001': 'KOSPI',
      '1001': 'KOSDAQ',
      '2001': 'KOSPI200',
    }

    return {
      name: indexNames[indexCode] || indexCode,
      code: indexCode,
      currentValue: parseFloat(o.bstp_nmix_prpr),
      previousClose: parseFloat(o.bstp_nmix_prpr) - parseFloat(o.bstp_nmix_prdy_vrss),
      change: parseFloat(o.bstp_nmix_prdy_vrss),
      changePercent: parseFloat(o.bstp_nmix_prdy_ctrt),
      high: parseFloat(o.bstp_nmix_hgpr),
      low: parseFloat(o.bstp_nmix_lwpr),
      volume: parseInt(o.acml_vol),
      timestamp: new Date(),
    }
  }

  /**
   * 종목 검색
   */
  async searchStocks(keyword: string): Promise<Array<{ symbol: string; name: string; market: string }>> {
    // KIS API는 종목 검색 API가 제한적이므로
    // 실제로는 종목 마스터 데이터를 캐싱해서 사용해야 함
    safeLogger.info('[KIS] Stock search', { keyword })

    // 임시 구현 - 실제로는 DB 조회 또는 캐시 사용
    return []
  }

  // ============================================
  // Account
  // ============================================

  /**
   * 계좌 잔고 조회
   */
  async getBalance(): Promise<KISBalance> {
    const trId = this.config.isPaper ? 'VTTC8434R' : 'TTTC8434R'

    interface KISBalanceResponse {
      output2: Array<{
        dnca_tot_amt: string
        nxdy_excc_amt: string
        prvs_rcdl_excc_amt: string
        cma_evlu_amt: string
        bfdy_buy_amt: string
        thdt_buy_amt: string
        nass_amt: string
        pchs_amt_smtl_amt: string
        evlu_amt_smtl_amt: string
        evlu_pfls_smtl_amt: string
        tot_evlu_pfls_amt: string
      }>
      rt_cd: string
      msg1: string
    }

    const response = await this.request<KISBalanceResponse>(
      `/uapi/domestic-stock/v1/trading/inquire-balance?CANO=${this.config.accountNo}&ACNT_PRDT_CD=${this.config.accountProductCode}&AFHR_FLPR_YN=N&OFL_YN=&INQR_DVSN=02&UNPR_DVSN=01&FUND_STTL_ICLD_YN=N&FNCG_AMT_AUTO_RDPT_YN=N&PRCS_DVSN=00&CTX_AREA_FK100=&CTX_AREA_NK100=`,
      { trId }
    )

    if (response.rt_cd !== '0') {
      throw new Error(`KIS API error: ${response.msg1}`)
    }

    const o = response.output2[0]

    return {
      totalAssets: parseFloat(o.nass_amt),
      totalDeposit: parseFloat(o.dnca_tot_amt),
      availableCash: parseFloat(o.nxdy_excc_amt),
      totalPurchase: parseFloat(o.pchs_amt_smtl_amt),
      totalEvaluation: parseFloat(o.evlu_amt_smtl_amt),
      profitLoss: parseFloat(o.evlu_pfls_smtl_amt),
      profitLossRate:
        parseFloat(o.pchs_amt_smtl_amt) > 0
          ? (parseFloat(o.evlu_pfls_smtl_amt) / parseFloat(o.pchs_amt_smtl_amt)) * 100
          : 0,
    }
  }

  /**
   * 보유 종목 조회
   */
  async getHoldings(): Promise<KISHolding[]> {
    const trId = this.config.isPaper ? 'VTTC8434R' : 'TTTC8434R'

    interface KISHoldingsResponse {
      output1: Array<{
        pdno: string
        prdt_name: string
        hldg_qty: string
        pchs_avg_pric: string
        prpr: string
        evlu_amt: string
        evlu_pfls_amt: string
        evlu_pfls_rt: string
        pchs_amt: string
      }>
      rt_cd: string
      msg1: string
    }

    const response = await this.request<KISHoldingsResponse>(
      `/uapi/domestic-stock/v1/trading/inquire-balance?CANO=${this.config.accountNo}&ACNT_PRDT_CD=${this.config.accountProductCode}&AFHR_FLPR_YN=N&OFL_YN=&INQR_DVSN=02&UNPR_DVSN=01&FUND_STTL_ICLD_YN=N&FNCG_AMT_AUTO_RDPT_YN=N&PRCS_DVSN=00&CTX_AREA_FK100=&CTX_AREA_NK100=`,
      { trId }
    )

    if (response.rt_cd !== '0') {
      throw new Error(`KIS API error: ${response.msg1}`)
    }

    return response.output1
      .filter((h) => parseInt(h.hldg_qty) > 0)
      .map((h) => ({
        symbol: h.pdno,
        name: h.prdt_name,
        quantity: parseInt(h.hldg_qty),
        avgPrice: parseFloat(h.pchs_avg_pric),
        currentPrice: parseFloat(h.prpr),
        evaluation: parseFloat(h.evlu_amt),
        profitLoss: parseFloat(h.evlu_pfls_amt),
        profitLossRate: parseFloat(h.evlu_pfls_rt),
        purchaseAmount: parseFloat(h.pchs_amt),
      }))
  }

  // ============================================
  // Trading
  // ============================================

  /**
   * 매수 주문
   */
  async buy(
    symbol: string,
    quantity: number,
    price?: number,
    orderType: 'limit' | 'market' = 'limit'
  ): Promise<KISOrderResult> {
    return this.placeOrder(symbol, 'buy', quantity, price, orderType)
  }

  /**
   * 매도 주문
   */
  async sell(
    symbol: string,
    quantity: number,
    price?: number,
    orderType: 'limit' | 'market' = 'limit'
  ): Promise<KISOrderResult> {
    return this.placeOrder(symbol, 'sell', quantity, price, orderType)
  }

  private async placeOrder(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    price?: number,
    orderType: 'limit' | 'market' = 'limit'
  ): Promise<KISOrderResult> {
    const trId = this.config.isPaper
      ? side === 'buy'
        ? 'VTTC0802U'
        : 'VTTC0801U'
      : side === 'buy'
        ? 'TTTC0802U'
        : 'TTTC0801U'

    // 주문 유형
    // 00: 지정가, 01: 시장가, 02: 조건부지정가, 03: 최유리지정가
    const ordDvsn = orderType === 'market' ? '01' : '00'
    const ordUnpr = orderType === 'market' ? '0' : String(price || 0)

    interface KISOrderResponse {
      output: {
        KRX_FWDG_ORD_ORGNO: string
        ODNO: string
        ORD_TMD: string
      }
      rt_cd: string
      msg1: string
    }

    const response = await this.request<KISOrderResponse>('/uapi/domestic-stock/v1/trading/order-cash', {
      method: 'POST',
      trId,
      body: {
        CANO: this.config.accountNo,
        ACNT_PRDT_CD: this.config.accountProductCode,
        PDNO: symbol,
        ORD_DVSN: ordDvsn,
        ORD_QTY: String(quantity),
        ORD_UNPR: ordUnpr,
      },
    })

    if (response.rt_cd !== '0') {
      return {
        orderId: '',
        symbol,
        orderType: side,
        quantity,
        price: price || 0,
        status: 'rejected',
        filledQuantity: 0,
        filledPrice: 0,
        message: response.msg1,
        timestamp: new Date(),
      }
    }

    return {
      orderId: response.output.ODNO,
      symbol,
      orderType: side,
      quantity,
      price: price || 0,
      status: 'submitted',
      filledQuantity: 0,
      filledPrice: 0,
      message: response.msg1,
      timestamp: new Date(),
    }
  }

  /**
   * 주문 취소
   */
  async cancelOrder(orderId: string, symbol: string, quantity: number): Promise<boolean> {
    const trId = this.config.isPaper ? 'VTTC0803U' : 'TTTC0803U'

    interface KISCancelResponse {
      rt_cd: string
      msg1: string
    }

    const response = await this.request<KISCancelResponse>('/uapi/domestic-stock/v1/trading/order-rvsecncl', {
      method: 'POST',
      trId,
      body: {
        CANO: this.config.accountNo,
        ACNT_PRDT_CD: this.config.accountProductCode,
        KRX_FWDG_ORD_ORGNO: '',
        ORGN_ODNO: orderId,
        ORD_DVSN: '00',
        RVSE_CNCL_DVSN_CD: '02', // 02: 취소
        ORD_QTY: String(quantity),
        ORD_UNPR: '0',
        QTY_ALL_ORD_YN: 'Y',
      },
    })

    return response.rt_cd === '0'
  }

  /**
   * 주문 체결 조회
   */
  async getOrderStatus(orderId: string): Promise<KISOrderResult | null> {
    const trId = this.config.isPaper ? 'VTTC8001R' : 'TTTC8001R'

    interface KISOrderStatusResponse {
      output: Array<{
        odno: string
        pdno: string
        sll_buy_dvsn_cd: string
        ord_qty: string
        ord_unpr: string
        tot_ccld_qty: string
        avg_prvs: string
        ord_dt: string
        ord_tmd: string
        ord_gno_brno: string
      }>
      rt_cd: string
      msg1: string
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')

    const response = await this.request<KISOrderStatusResponse>(
      `/uapi/domestic-stock/v1/trading/inquire-daily-ccld?CANO=${this.config.accountNo}&ACNT_PRDT_CD=${this.config.accountProductCode}&INQR_STRT_DT=${today}&INQR_END_DT=${today}&SLL_BUY_DVSN_CD=00&INQR_DVSN=00&PDNO=&CCLD_DVSN=00&ORD_GNO_BRNO=&ODNO=${orderId}&INQR_DVSN_3=00&INQR_DVSN_1=&CTX_AREA_FK100=&CTX_AREA_NK100=`,
      { trId }
    )

    if (response.rt_cd !== '0') {
      return null
    }

    const order = response.output.find((o) => o.odno === orderId)
    if (!order) return null

    const filledQty = parseInt(order.tot_ccld_qty)
    const ordQty = parseInt(order.ord_qty)

    return {
      orderId: order.odno,
      symbol: order.pdno,
      orderType: order.sll_buy_dvsn_cd === '02' ? 'buy' : 'sell',
      quantity: ordQty,
      price: parseFloat(order.ord_unpr),
      status: filledQty === ordQty ? 'filled' : filledQty > 0 ? 'partial' : 'submitted',
      filledQuantity: filledQty,
      filledPrice: parseFloat(order.avg_prvs),
      message: '',
      timestamp: new Date(`${order.ord_dt.slice(0, 4)}-${order.ord_dt.slice(4, 6)}-${order.ord_dt.slice(6, 8)}`),
    }
  }
}

// ============================================
// Factory
// ============================================

let kisClient: KISClient | null = null

export function getKISClient(config?: KISConfig): KISClient {
  if (!kisClient && config) {
    kisClient = new KISClient(config)
  }

  if (!kisClient) {
    throw new Error('KIS client not initialized')
  }

  return kisClient
}

export function createKISClient(config: KISConfig): KISClient {
  return new KISClient(config)
}
