// ============================================
// Kiwoom (키움증권) Broker Adapter
// REST API + WebSocket 실시간 시세
// https://openapi.kiwoom.com
// ============================================

import { safeLogger } from '@/lib/utils/safe-logger'
import type {
  UnifiedBroker,
  BrokerId,
  BrokerCredentials,
  ConnectionResult,
  Balance,
  Holding,
  Order,
  OrderRequest,
  OrderResult,
  OrderStatus,
  Quote,
  QuoteCallback,
  OrderCallback,
} from '../types'

// ============================================
// Kiwoom API Response Types
// ============================================

interface KiwoomTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

interface KiwoomBalanceResponse {
  rsp_cd: string
  rsp_msg: string
  output: {
    dnca_tot_amt: string      // 예수금총액
    nrcvb_buy_amt: string     // 미수매수금액
    tot_evlu_amt: string      // 총평가금액
    asst_icdc_amt: string     // 자산증감금액
    evlu_pfls_amt: string     // 평가손익금액
    pchs_amt: string          // 매입금액
    evlu_pfls_rt: string      // 평가손익률
  }
}

interface KiwoomHoldingsResponse {
  rsp_cd: string
  rsp_msg: string
  output: Array<{
    pdno: string           // 종목코드
    prdt_name: string      // 종목명
    hldg_qty: string       // 보유수량
    pchs_avg_pric: string  // 매입평균가
    prpr: string           // 현재가
    evlu_amt: string       // 평가금액
    evlu_pfls_amt: string  // 평가손익금액
    evlu_pfls_rt: string   // 평가손익률
    fltt_rt: string        // 등락률
  }>
}

interface KiwoomOrderResponse {
  rsp_cd: string
  rsp_msg: string
  output?: {
    odno: string           // 주문번호
    ord_tmd: string        // 주문시각
  }
}

interface KiwoomOrderListResponse {
  rsp_cd: string
  rsp_msg: string
  output: Array<{
    odno: string           // 주문번호
    pdno: string           // 종목코드
    prdt_name: string      // 종목명
    ord_qty: string        // 주문수량
    ord_pric: string       // 주문가격
    ccld_qty: string       // 체결수량
    avg_prvs: string       // 평균가
    ord_tmd: string        // 주문시각
    ord_gno_brno: string   // 주문구분
    sll_buy_dvsn_cd: string // 매도매수구분
    ord_dvsn_name: string  // 주문구분명
    tot_ccld_amt: string   // 총체결금액
    rjct_qty: string       // 거부수량
  }>
}

interface KiwoomQuoteResponse {
  rsp_cd: string
  rsp_msg: string
  output: {
    stck_prpr: string      // 현재가
    prdy_vrss: string      // 전일대비
    prdy_ctrt: string      // 전일대비율
    stck_oprc: string      // 시가
    stck_hgpr: string      // 고가
    stck_lwpr: string      // 저가
    acml_vol: string       // 누적거래량
    acml_tr_pbmn: string   // 누적거래대금
  }
}

// ============================================
// Kiwoom Broker Implementation
// ============================================

export class KiwoomBroker implements UnifiedBroker {
  readonly brokerId: BrokerId = 'kiwoom'
  readonly brokerName = '키움증권'

  private baseUrl = 'https://openapi.kiwoom.com:9443'
  private wsUrl = 'wss://openapi.kiwoom.com:9443/ws'
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null
  private credentials: BrokerCredentials | null = null
  private wsConnection: WebSocket | null = null
  private quoteCallbacks = new Map<string, Set<QuoteCallback>>()
  private orderCallbacks = new Set<OrderCallback>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private heartbeatInterval: NodeJS.Timeout | null = null

  // ============================================
  // Authentication
  // ============================================

  async connect(credentials: BrokerCredentials): Promise<ConnectionResult> {
    try {
      this.credentials = credentials

      // 1. OAuth 토큰 발급
      const tokenRes = await fetch(`${this.baseUrl}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          appkey: credentials.apiKey,
          secretkey: credentials.apiSecret,
        }),
      })

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text()
        throw new Error(`토큰 발급 실패: ${errorText}`)
      }

      const tokenData: KiwoomTokenResponse = await tokenRes.json()
      this.accessToken = tokenData.access_token
      this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000)

      // 2. WebSocket 연결 (실시간 시세용)
      await this.connectWebSocket()

      // 3. 잔고 조회로 연결 확인
      const balance = await this.getBalance()

      return {
        success: true,
        message: '키움증권 연결 성공',
        balance,
      }
    } catch (error) {
      safeLogger.error('[KiwoomBroker] Connect error:', error)
      return {
        success: false,
        message: '연결 실패',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = null
    this.credentials = null
    this.tokenExpiry = null
    this.disconnectWebSocket()
  }

  isConnected(): boolean {
    if (!this.accessToken || !this.tokenExpiry) return false
    return this.tokenExpiry > new Date()
  }

  async refreshToken(): Promise<boolean> {
    if (!this.credentials) return false

    try {
      const result = await this.connect(this.credentials)
      return result.success
    } catch {
      return false
    }
  }

  // ============================================
  // API Request Helper
  // ============================================

  private async apiRequest<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST'
      trId: string
      body?: Record<string, unknown>
      query?: Record<string, string>
    }
  ): Promise<T> {
    if (!this.isConnected()) {
      await this.refreshToken()
    }

    const url = new URL(`${this.baseUrl}${path}`)
    if (options.query) {
      Object.entries(options.query).forEach(([k, v]) => url.searchParams.set(k, v))
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'authorization': `Bearer ${this.accessToken}`,
      'appkey': this.credentials?.apiKey || '',
      'appsecret': this.credentials?.apiSecret || '',
      'tr_id': options.trId,
    }

    const res = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`API 오류 (${res.status}): ${errorText}`)
    }

    return res.json()
  }

  // ============================================
  // Account Methods
  // ============================================

  async getBalance(): Promise<Balance> {
    const accountNo = this.credentials?.accountNumber || ''

    const data = await this.apiRequest<KiwoomBalanceResponse>(
      '/uapi/domestic-stock/v1/trading/inquire-balance',
      {
        trId: 'CTRP6548R',
        query: {
          CANO: accountNo.substring(0, 8),
          ACNT_PRDT_CD: accountNo.substring(8, 10) || '01',
          AFHR_FLPR_YN: 'N',
          INQR_DVSN: '01',
          UNPR_DVSN: '01',
          FUND_STTL_ICLD_YN: 'N',
          FNCG_AMT_AUTO_RDPT_YN: 'N',
          PRCS_DVSN: '01',
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: '',
        },
      }
    )

    if (data.rsp_cd !== '0') {
      throw new Error(`잔고 조회 실패: ${data.rsp_msg}`)
    }

    const output = data.output
    const totalAssets = parseFloat(output.tot_evlu_amt) || 0
    const cash = parseFloat(output.dnca_tot_amt) || 0
    const stocksValue = totalAssets - cash
    const totalProfit = parseFloat(output.evlu_pfls_amt) || 0
    const profitRate = parseFloat(output.evlu_pfls_rt) || 0

    return {
      totalAssets,
      cash,
      stocksValue,
      totalProfit,
      profitRate,
      buyingPower: cash - parseFloat(output.nrcvb_buy_amt || '0'),
      currency: 'KRW',
    }
  }

  async getHoldings(): Promise<Holding[]> {
    const accountNo = this.credentials?.accountNumber || ''

    const data = await this.apiRequest<KiwoomHoldingsResponse>(
      '/uapi/domestic-stock/v1/trading/inquire-balance',
      {
        trId: 'CTRP6548R',
        query: {
          CANO: accountNo.substring(0, 8),
          ACNT_PRDT_CD: accountNo.substring(8, 10) || '01',
          AFHR_FLPR_YN: 'N',
          INQR_DVSN: '02',
          UNPR_DVSN: '01',
          FUND_STTL_ICLD_YN: 'N',
          FNCG_AMT_AUTO_RDPT_YN: 'N',
          PRCS_DVSN: '01',
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: '',
        },
      }
    )

    if (data.rsp_cd !== '0') {
      throw new Error(`보유종목 조회 실패: ${data.rsp_msg}`)
    }

    return data.output.map((item) => ({
      stockCode: item.pdno,
      stockName: item.prdt_name,
      market: 'KRX' as const,
      quantity: parseInt(item.hldg_qty, 10),
      avgPrice: parseFloat(item.pchs_avg_pric),
      currentPrice: parseFloat(item.prpr),
      profit: parseFloat(item.evlu_pfls_amt),
      profitRate: parseFloat(item.evlu_pfls_rt),
      value: parseFloat(item.evlu_amt),
    }))
  }

  async getOrders(status?: OrderStatus): Promise<Order[]> {
    const accountNo = this.credentials?.accountNumber || ''

    const data = await this.apiRequest<KiwoomOrderListResponse>(
      '/uapi/domestic-stock/v1/trading/inquire-psbl-rvsecncl',
      {
        trId: 'CTRP6501R',
        query: {
          CANO: accountNo.substring(0, 8),
          ACNT_PRDT_CD: accountNo.substring(8, 10) || '01',
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: '',
          INQR_DVSN_1: '0',
          INQR_DVSN_2: '0',
        },
      }
    )

    if (data.rsp_cd !== '0') {
      throw new Error(`주문 조회 실패: ${data.rsp_msg}`)
    }

    const orders = data.output.map((item) => ({
      orderId: item.odno,
      stockCode: item.pdno,
      stockName: item.prdt_name,
      side: item.sll_buy_dvsn_cd === '01' ? ('sell' as const) : ('buy' as const),
      type: 'limit' as const,
      quantity: parseInt(item.ord_qty, 10),
      filledQuantity: parseInt(item.ccld_qty, 10),
      price: parseFloat(item.ord_pric),
      avgFilledPrice: parseFloat(item.avg_prvs) || undefined,
      status: this.mapOrderStatus(item),
      createdAt: this.parseKiwoomDateTime(item.ord_tmd),
      updatedAt: new Date(),
    }))

    if (status) {
      return orders.filter((o) => o.status === status)
    }

    return orders
  }

  async getOrderHistory(days: number = 7): Promise<Order[]> {
    const accountNo = this.credentials?.accountNumber || ''
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const formatDate = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

    const data = await this.apiRequest<KiwoomOrderListResponse>(
      '/uapi/domestic-stock/v1/trading/inquire-daily-ccld',
      {
        trId: 'CTRP6044R',
        query: {
          CANO: accountNo.substring(0, 8),
          ACNT_PRDT_CD: accountNo.substring(8, 10) || '01',
          INQR_STRT_DT: formatDate(startDate),
          INQR_END_DT: formatDate(endDate),
          SLL_BUY_DVSN_CD: '00',
          INQR_DVSN: '00',
          PDNO: '',
          CCLD_DVSN: '00',
          ORD_GNO_BRNO: '',
          ODNO: '',
          INQR_DVSN_3: '00',
          INQR_DVSN_1: '',
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: '',
        },
      }
    )

    if (data.rsp_cd !== '0') {
      throw new Error(`주문 이력 조회 실패: ${data.rsp_msg}`)
    }

    return data.output.map((item) => ({
      orderId: item.odno,
      stockCode: item.pdno,
      stockName: item.prdt_name,
      side: item.sll_buy_dvsn_cd === '01' ? ('sell' as const) : ('buy' as const),
      type: 'limit' as const,
      quantity: parseInt(item.ord_qty, 10),
      filledQuantity: parseInt(item.ccld_qty, 10),
      price: parseFloat(item.ord_pric),
      avgFilledPrice: parseFloat(item.avg_prvs) || undefined,
      status: this.mapOrderStatus(item),
      createdAt: this.parseKiwoomDateTime(item.ord_tmd),
      updatedAt: new Date(),
    }))
  }

  // ============================================
  // Order Methods
  // ============================================

  async submitOrder(request: OrderRequest): Promise<OrderResult> {
    const accountNo = this.credentials?.accountNumber || ''
    const trId = request.side === 'buy' ? 'CTRP6601U' : 'CTRP6602U'

    const orderDvsn = request.type === 'market' ? '01' : '00'

    const data = await this.apiRequest<KiwoomOrderResponse>(
      '/uapi/domestic-stock/v1/trading/order-cash',
      {
        method: 'POST',
        trId,
        body: {
          CANO: accountNo.substring(0, 8),
          ACNT_PRDT_CD: accountNo.substring(8, 10) || '01',
          PDNO: request.stockCode,
          ORD_DVSN: orderDvsn,
          ORD_QTY: String(request.quantity),
          ORD_UNPR: String(request.price || 0),
        },
      }
    )

    if (data.rsp_cd !== '0') {
      return {
        success: false,
        message: data.rsp_msg,
        error: data.rsp_msg,
      }
    }

    return {
      success: true,
      orderId: data.output?.odno,
      message: '주문이 접수되었습니다',
    }
  }

  async cancelOrder(orderId: string): Promise<OrderResult> {
    const accountNo = this.credentials?.accountNumber || ''

    // 먼저 주문 정보 조회
    const orders = await this.getOrders('pending')
    const order = orders.find((o) => o.orderId === orderId)

    if (!order) {
      return {
        success: false,
        message: '주문을 찾을 수 없습니다',
      }
    }

    const trId = order.side === 'buy' ? 'CTRP6611U' : 'CTRP6612U'

    const data = await this.apiRequest<KiwoomOrderResponse>(
      '/uapi/domestic-stock/v1/trading/order-rvsecncl',
      {
        method: 'POST',
        trId,
        body: {
          CANO: accountNo.substring(0, 8),
          ACNT_PRDT_CD: accountNo.substring(8, 10) || '01',
          KRX_FWDG_ORD_ORGNO: '',
          ORGN_ODNO: orderId,
          ORD_DVSN: '00',
          RVSE_CNCL_DVSN_CD: '02', // 취소
          ORD_QTY: '0',
          ORD_UNPR: '0',
          QTY_ALL_ORD_YN: 'Y',
        },
      }
    )

    if (data.rsp_cd !== '0') {
      return {
        success: false,
        message: data.rsp_msg,
        error: data.rsp_msg,
      }
    }

    return {
      success: true,
      orderId: data.output?.odno,
      message: '주문이 취소되었습니다',
    }
  }

  async modifyOrder(
    orderId: string,
    newPrice: number,
    newQuantity?: number
  ): Promise<OrderResult> {
    const accountNo = this.credentials?.accountNumber || ''

    const orders = await this.getOrders('pending')
    const order = orders.find((o) => o.orderId === orderId)

    if (!order) {
      return {
        success: false,
        message: '주문을 찾을 수 없습니다',
      }
    }

    const trId = order.side === 'buy' ? 'CTRP6611U' : 'CTRP6612U'

    const data = await this.apiRequest<KiwoomOrderResponse>(
      '/uapi/domestic-stock/v1/trading/order-rvsecncl',
      {
        method: 'POST',
        trId,
        body: {
          CANO: accountNo.substring(0, 8),
          ACNT_PRDT_CD: accountNo.substring(8, 10) || '01',
          KRX_FWDG_ORD_ORGNO: '',
          ORGN_ODNO: orderId,
          ORD_DVSN: '00',
          RVSE_CNCL_DVSN_CD: '01', // 정정
          ORD_QTY: String(newQuantity || order.quantity),
          ORD_UNPR: String(newPrice),
          QTY_ALL_ORD_YN: 'N',
        },
      }
    )

    if (data.rsp_cd !== '0') {
      return {
        success: false,
        message: data.rsp_msg,
        error: data.rsp_msg,
      }
    }

    return {
      success: true,
      orderId: data.output?.odno,
      message: '주문이 정정되었습니다',
    }
  }

  // ============================================
  // Convenience Methods
  // ============================================

  async buy(
    stockCode: string,
    quantity: number,
    price?: number
  ): Promise<OrderResult> {
    return this.submitOrder({
      stockCode,
      side: 'buy',
      type: price ? 'limit' : 'market',
      quantity,
      price,
    })
  }

  async sell(
    stockCode: string,
    quantity: number,
    price?: number
  ): Promise<OrderResult> {
    return this.submitOrder({
      stockCode,
      side: 'sell',
      type: price ? 'limit' : 'market',
      quantity,
      price,
    })
  }

  async cancelAllOrders(): Promise<OrderResult[]> {
    const pendingOrders = await this.getOrders('pending')
    return Promise.all(pendingOrders.map((order) => this.cancelOrder(order.orderId)))
  }

  async closeAllPositions(): Promise<OrderResult[]> {
    const holdings = await this.getHoldings()
    return Promise.all(
      holdings.map((holding) =>
        this.sell(holding.stockCode, holding.quantity)
      )
    )
  }

  // ============================================
  // Real-time Data
  // ============================================

  subscribeQuote(stockCode: string, callback: QuoteCallback): () => void {
    if (!this.quoteCallbacks.has(stockCode)) {
      this.quoteCallbacks.set(stockCode, new Set())
      this.sendWsSubscribe(stockCode)
    }

    this.quoteCallbacks.get(stockCode)!.add(callback)

    return () => {
      const callbacks = this.quoteCallbacks.get(stockCode)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.quoteCallbacks.delete(stockCode)
          this.sendWsUnsubscribe(stockCode)
        }
      }
    }
  }

  subscribeOrders(callback: OrderCallback): () => void {
    this.orderCallbacks.add(callback)
    return () => {
      this.orderCallbacks.delete(callback)
    }
  }

  // ============================================
  // Market Data
  // ============================================

  async getQuote(stockCode: string): Promise<Quote> {
    const data = await this.apiRequest<KiwoomQuoteResponse>(
      '/uapi/domestic-stock/v1/quotations/inquire-price',
      {
        trId: 'FHKST01010100',
        query: {
          FID_COND_MRKT_DIV_CODE: 'J',
          FID_INPUT_ISCD: stockCode,
        },
      }
    )

    if (data.rsp_cd !== '0') {
      throw new Error(`시세 조회 실패: ${data.rsp_msg}`)
    }

    const output = data.output
    return {
      stockCode,
      stockName: stockCode, // 별도 조회 필요
      currentPrice: parseFloat(output.stck_prpr),
      change: parseFloat(output.prdy_vrss),
      changeRate: parseFloat(output.prdy_ctrt),
      high: parseFloat(output.stck_hgpr),
      low: parseFloat(output.stck_lwpr),
      open: parseFloat(output.stck_oprc),
      volume: parseFloat(output.acml_vol),
      timestamp: new Date(),
    }
  }

  async searchStock(
    keyword: string
  ): Promise<Array<{ code: string; name: string; market: string }>> {
    // 키움 OpenAPI에는 종목 검색 API가 제한적
    // 실제 구현시에는 별도 종목 마스터 데이터 사용 권장
    safeLogger.warn('[KiwoomBroker] 종목 검색은 별도 종목 마스터 데이터 필요')
    return []
  }

  // ============================================
  // WebSocket Management
  // ============================================

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wsConnection = new WebSocket(this.wsUrl)

        this.wsConnection.onopen = () => {
          safeLogger.info('[KiwoomBroker] WebSocket connected')
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        this.wsConnection.onclose = (event) => {
          safeLogger.info('[KiwoomBroker] WebSocket closed:', event.code)
          this.stopHeartbeat()

          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            setTimeout(() => this.connectWebSocket(), this.reconnectDelay)
          }
        }

        this.wsConnection.onerror = (error) => {
          safeLogger.error('[KiwoomBroker] WebSocket error:', error)
          reject(error)
        }

        this.wsConnection.onmessage = (event) => {
          this.handleWsMessage(event.data)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private disconnectWebSocket(): void {
    this.stopHeartbeat()
    if (this.wsConnection) {
      this.wsConnection.close(1000, 'Client disconnect')
      this.wsConnection = null
    }
    this.quoteCallbacks.clear()
    this.orderCallbacks.clear()
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private sendWsSubscribe(stockCode: string): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(
        JSON.stringify({
          header: {
            approval_key: this.accessToken,
            tr_type: '1', // 등록
          },
          body: {
            tr_id: 'H0STASP0',
            tr_key: stockCode,
          },
        })
      )
    }
  }

  private sendWsUnsubscribe(stockCode: string): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(
        JSON.stringify({
          header: {
            approval_key: this.accessToken,
            tr_type: '2', // 해제
          },
          body: {
            tr_id: 'H0STASP0',
            tr_key: stockCode,
          },
        })
      )
    }
  }

  private handleWsMessage(data: string): void {
    try {
      const message = JSON.parse(data)

      // 실시간 시세 처리
      if (message.header?.tr_id === 'H0STASP0') {
        const stockCode = message.body?.tr_key
        const callbacks = this.quoteCallbacks.get(stockCode)

        if (callbacks && message.body) {
          const quote: Quote = {
            stockCode,
            stockName: stockCode,
            currentPrice: parseFloat(message.body.stck_prpr || '0'),
            change: parseFloat(message.body.prdy_vrss || '0'),
            changeRate: parseFloat(message.body.prdy_ctrt || '0'),
            high: parseFloat(message.body.stck_hgpr || '0'),
            low: parseFloat(message.body.stck_lwpr || '0'),
            open: parseFloat(message.body.stck_oprc || '0'),
            volume: parseFloat(message.body.acml_vol || '0'),
            timestamp: new Date(),
          }

          callbacks.forEach((cb) => cb(quote))
        }
      }

      // 체결 통보 처리
      if (message.header?.tr_id === 'H0STCNT0') {
        const order: Order = {
          orderId: message.body?.odno || '',
          stockCode: message.body?.pdno || '',
          stockName: message.body?.prdt_name || '',
          side: message.body?.sll_buy_dvsn_cd === '01' ? 'sell' : 'buy',
          type: 'limit',
          quantity: parseInt(message.body?.ord_qty || '0', 10),
          filledQuantity: parseInt(message.body?.tot_ccld_qty || '0', 10),
          price: parseFloat(message.body?.ord_unpr || '0'),
          avgFilledPrice: parseFloat(message.body?.avg_prvs || '0'),
          status: 'filled',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        this.orderCallbacks.forEach((cb) => cb(order))
      }
    } catch (error) {
      safeLogger.error('[KiwoomBroker] WS message parse error:', error)
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  private mapOrderStatus(item: {
    ccld_qty: string
    ord_qty: string
    rjct_qty: string
  }): OrderStatus {
    const filled = parseInt(item.ccld_qty, 10)
    const total = parseInt(item.ord_qty, 10)
    const rejected = parseInt(item.rjct_qty || '0', 10)

    if (rejected > 0) return 'rejected'
    if (filled === 0) return 'pending'
    if (filled < total) return 'partial'
    return 'filled'
  }

  private parseKiwoomDateTime(timeStr: string): Date {
    // 형식: HHMMSS 또는 YYYYMMDDHHMMSS
    const now = new Date()
    if (timeStr.length === 6) {
      const h = parseInt(timeStr.substring(0, 2), 10)
      const m = parseInt(timeStr.substring(2, 4), 10)
      const s = parseInt(timeStr.substring(4, 6), 10)
      now.setHours(h, m, s, 0)
      return now
    }
    // YYYYMMDDHHMMSS
    const y = parseInt(timeStr.substring(0, 4), 10)
    const mo = parseInt(timeStr.substring(4, 6), 10) - 1
    const d = parseInt(timeStr.substring(6, 8), 10)
    const h = parseInt(timeStr.substring(8, 10), 10)
    const mi = parseInt(timeStr.substring(10, 12), 10)
    const s = parseInt(timeStr.substring(12, 14), 10)
    return new Date(y, mo, d, h, mi, s)
  }
}

// ============================================
// Factory Function
// ============================================

export function createKiwoomBroker(): KiwoomBroker {
  return new KiwoomBroker()
}
