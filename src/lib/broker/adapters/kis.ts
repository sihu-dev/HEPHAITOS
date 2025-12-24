// ============================================
// KIS (한국투자증권) Broker Adapter
// REST API + WebSocket 실시간 시세
// https://apiportal.koreainvestment.com
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

/**
 * KIS API 응답 타입
 */
interface KISTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  access_token_token_expired: string
}

interface KISBalanceResponse {
  rt_cd: string
  msg1: string
  output1: Array<{
    pdno: string           // 종목코드
    prdt_name: string      // 종목명
    hldg_qty: string       // 보유수량
    pchs_avg_pric: string  // 평균단가
    prpr: string           // 현재가
    evlu_pfls_amt: string  // 평가손익
    evlu_pfls_rt: string   // 수익률
    evlu_amt: string       // 평가금액
  }>
  output2: Array<{
    dnca_tot_amt: string      // 예수금
    tot_evlu_amt: string      // 총 평가금액
    scts_evlu_amt: string     // 주식 평가금액
    evlu_pfls_smtl_amt: string // 평가손익합계
    evlu_pfls_rt: string      // 수익률
    nass_amt: string          // 순자산
  }>
}

interface KISOrderResponse {
  rt_cd: string
  msg1: string
  output?: {
    ODNO: string    // 주문번호
    ORD_TMD: string // 주문시각
  }
}

interface KISWebSocketApprovalResponse {
  approval_key: string
}

/**
 * 한국투자증권 Unified Broker 구현
 */
export class KISBroker implements UnifiedBroker {
  readonly brokerId: BrokerId = 'kis'
  readonly brokerName = '한국투자증권'

  private baseUrl = 'https://openapi.koreainvestment.com:9443'
  private wsUrl = 'ws://ops.koreainvestment.com:21000'
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null
  private credentials: BrokerCredentials | null = null
  private wsConnection: WebSocket | null = null
  private wsApprovalKey: string | null = null
  private quoteCallbacks = new Map<string, Set<QuoteCallback>>()
  private orderCallbacks = new Set<OrderCallback>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000

  // ============================================
  // Authentication
  // ============================================

  async connect(credentials: BrokerCredentials): Promise<ConnectionResult> {
    try {
      this.credentials = credentials

      // 1. OAuth 토큰 발급
      const tokenRes = await fetch(`${this.baseUrl}/oauth2/tokenP`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          appkey: credentials.apiKey,
          appsecret: credentials.apiSecret,
        }),
      })

      if (!tokenRes.ok) {
        const error = await tokenRes.text()
        return {
          success: false,
          message: '토큰 발급 실패',
          error: error,
        }
      }

      const tokenData: KISTokenResponse = await tokenRes.json()
      this.accessToken = tokenData.access_token
      this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000)

      // 2. WebSocket 승인키 발급
      await this.getWebSocketApprovalKey()

      // 3. 연결 확인 (잔고 조회)
      const balance = await this.getBalance()

      return {
        success: true,
        message: '한국투자증권 연결 성공',
        balance,
      }
    } catch (error) {
      safeLogger.error('[KISBroker] Connect failed', { error })
      return {
        success: false,
        message: '연결 실패',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = null
    this.tokenExpiry = null
    this.credentials = null
    this.wsApprovalKey = null
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = null
    }
    this.quoteCallbacks.clear()
    this.orderCallbacks.clear()
  }

  isConnected(): boolean {
    return this.accessToken !== null && this.tokenExpiry !== null && new Date() < this.tokenExpiry
  }

  async refreshToken(): Promise<boolean> {
    if (!this.credentials) return false
    const result = await this.connect(this.credentials)
    return result.success
  }

  // ============================================
  // WebSocket 실시간 시세
  // ============================================

  private async getWebSocketApprovalKey(): Promise<void> {
    if (!this.credentials) return

    try {
      const res = await fetch(`${this.baseUrl}/oauth2/Approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          appkey: this.credentials.apiKey,
          secretkey: this.credentials.apiSecret,
        }),
      })

      if (res.ok) {
        const data: KISWebSocketApprovalResponse = await res.json()
        this.wsApprovalKey = data.approval_key
        safeLogger.info('[KISBroker] WebSocket approval key acquired')
      }
    } catch (error) {
      safeLogger.error('[KISBroker] Failed to get WebSocket approval key', { error })
    }
  }

  private initWebSocket(): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) return
    if (!this.wsApprovalKey) {
      safeLogger.warn('[KISBroker] WebSocket approval key not available')
      return
    }

    try {
      this.wsConnection = new WebSocket(this.wsUrl)

      this.wsConnection.onopen = () => {
        safeLogger.info('[KISBroker] WebSocket connected')
        this.reconnectAttempts = 0

        // 기존 구독 복구
        this.quoteCallbacks.forEach((_, stockCode) => {
          this.sendSubscription(stockCode, true)
        })
      }

      this.wsConnection.onmessage = (event) => {
        this.handleWebSocketMessage(event.data)
      }

      this.wsConnection.onerror = (error) => {
        safeLogger.error('[KISBroker] WebSocket error', { error })
      }

      this.wsConnection.onclose = () => {
        safeLogger.info('[KISBroker] WebSocket disconnected')
        this.handleReconnect()
      }
    } catch (error) {
      safeLogger.error('[KISBroker] Failed to init WebSocket', { error })
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      safeLogger.error('[KISBroker] Max reconnect attempts reached', {
        attempts: this.maxReconnectAttempts,
      })
      return
    }

    this.reconnectAttempts++
    safeLogger.info('[KISBroker] Reconnecting...', { attempt: this.reconnectAttempts })

    setTimeout(() => {
      if (this.quoteCallbacks.size > 0 || this.orderCallbacks.size > 0) {
        this.initWebSocket()
      }
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  private sendSubscription(stockCode: string, subscribe: boolean): void {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) return
    if (!this.wsApprovalKey) return

    // KIS WebSocket 실시간 체결가 구독 메시지
    const message = JSON.stringify({
      header: {
        approval_key: this.wsApprovalKey,
        custtype: 'P',
        tr_type: subscribe ? '1' : '2', // 1: 구독, 2: 해제
        content_type: 'utf-8',
      },
      body: {
        input: {
          tr_id: 'H0STCNT0', // 실시간 체결가
          tr_key: stockCode,
        },
      },
    })

    this.wsConnection.send(message)
    safeLogger.debug('[KISBroker] Subscription updated', {
      stockCode,
      action: subscribe ? 'subscribed' : 'unsubscribed',
    })
  }

  private handleWebSocketMessage(data: string): void {
    try {
      // KIS WebSocket 메시지 파싱
      // 메시지 형식: "0|H0STCNT0|001|005930^..."
      if (data.startsWith('0|') || data.startsWith('1|')) {
        const parts = data.split('|')
        if (parts.length >= 4) {
          const trId = parts[1]
          const dataCount = parseInt(parts[2], 10)
          const payload = parts[3]

          if (trId === 'H0STCNT0' && dataCount > 0) {
            this.parseRealtimePrice(payload)
          } else if (trId === 'H0STCNI0') {
            this.parseOrderExecution(payload)
          }
        }
      } else {
        // JSON 응답 (구독 확인 등)
        const json = JSON.parse(data)
        if (json.header?.tr_id === 'PINGPONG') {
          // PONG 응답
          this.wsConnection?.send(data)
        }
      }
    } catch (error) {
      // 파싱 실패 무시 (하트비트 등)
    }
  }

  private parseRealtimePrice(payload: string): void {
    // KIS 실시간 체결가 데이터 파싱
    // 종목코드^현재가^전일대비^전일대비율^...
    const fields = payload.split('^')
    if (fields.length < 10) return

    const stockCode = fields[0]
    const quote: Quote = {
      stockCode,
      stockName: '', // 실시간 데이터에는 종목명 없음
      currentPrice: parseFloat(fields[2]) || 0,
      change: parseFloat(fields[4]) || 0,
      changeRate: parseFloat(fields[5]) || 0,
      open: parseFloat(fields[7]) || 0,
      high: parseFloat(fields[8]) || 0,
      low: parseFloat(fields[9]) || 0,
      volume: parseFloat(fields[13]) || 0,
      timestamp: new Date(),
    }

    // 콜백 실행
    const callbacks = this.quoteCallbacks.get(stockCode)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(quote)
        } catch (e) {
          safeLogger.error('[KISBroker] Quote callback error', { error: e, stockCode })
        }
      })
    }
  }

  private parseOrderExecution(payload: string): void {
    // KIS 실시간 체결 알림 파싱
    const fields = payload.split('^')
    if (fields.length < 20) return

    const order: Partial<Order> = {
      orderId: fields[1],
      stockCode: fields[2],
      side: fields[4] === '02' ? 'buy' : 'sell',
      quantity: parseFloat(fields[7]) || 0,
      filledQuantity: parseFloat(fields[8]) || 0,
      price: parseFloat(fields[9]) || 0,
      status: 'filled',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // 콜백 실행
    this.orderCallbacks.forEach((callback) => {
      try {
        callback(order as Order)
      } catch (e) {
        safeLogger.error('[KISBroker] Order callback error', { error: e, orderId: order.orderId })
      }
    })
  }

  // ============================================
  // Account Queries
  // ============================================

  async getBalance(): Promise<Balance> {
    const [accountNo, productCode] = this.getAccountParts()

    const res = await this.request<KISBalanceResponse>(
      '/uapi/domestic-stock/v1/trading/inquire-balance',
      {
        CANO: accountNo,
        ACNT_PRDT_CD: productCode,
        AFHR_FLPR_YN: 'N',
        OFL_YN: 'N',
        INQR_DVSN: '01',
        UNPR_DVSN: '01',
        FUND_STTL_ICLD_YN: 'N',
        FNCG_AMT_AUTO_RDPT_YN: 'N',
        PRCS_DVSN: '00',
        CTX_AREA_FK100: '',
        CTX_AREA_NK100: '',
      },
      'GET',
      'TTTC8434R' // 잔고 조회 TR
    )

    const output = res.output2[0]
    const totalAssets = parseFloat(output.tot_evlu_amt) || 0
    const cash = parseFloat(output.dnca_tot_amt) || 0
    const stocksValue = parseFloat(output.scts_evlu_amt) || 0
    const totalProfit = parseFloat(output.evlu_pfls_smtl_amt) || 0

    return {
      totalAssets,
      cash,
      stocksValue,
      totalProfit,
      profitRate: totalAssets > 0 ? (totalProfit / (totalAssets - totalProfit)) * 100 : 0,
      buyingPower: cash,
      currency: 'KRW',
    }
  }

  async getHoldings(): Promise<Holding[]> {
    const [accountNo, productCode] = this.getAccountParts()

    const res = await this.request<KISBalanceResponse>(
      '/uapi/domestic-stock/v1/trading/inquire-balance',
      {
        CANO: accountNo,
        ACNT_PRDT_CD: productCode,
        AFHR_FLPR_YN: 'N',
        OFL_YN: 'N',
        INQR_DVSN: '01',
        UNPR_DVSN: '01',
        FUND_STTL_ICLD_YN: 'N',
        FNCG_AMT_AUTO_RDPT_YN: 'N',
        PRCS_DVSN: '00',
        CTX_AREA_FK100: '',
        CTX_AREA_NK100: '',
      },
      'GET',
      'TTTC8434R'
    )

    return res.output1.map((item) => ({
      stockCode: item.pdno,
      stockName: item.prdt_name,
      market: 'KRX' as const,
      quantity: parseFloat(item.hldg_qty) || 0,
      avgPrice: parseFloat(item.pchs_avg_pric) || 0,
      currentPrice: parseFloat(item.prpr) || 0,
      profit: parseFloat(item.evlu_pfls_amt) || 0,
      profitRate: parseFloat(item.evlu_pfls_rt) || 0,
      value: parseFloat(item.evlu_amt) || 0,
    }))
  }

  async getOrders(status?: OrderStatus): Promise<Order[]> {
    const [accountNo, productCode] = this.getAccountParts()
    const isRealTrading = this.credentials?.accountType !== 'paper'

    // TR 코드: 미체결 주문 조회
    const trId = isRealTrading ? 'TTTC8001R' : 'VTTC8001R'

    interface KISUnfilledResponse {
      rt_cd: string
      msg1: string
      output: Array<{
        odno: string           // 주문번호
        pdno: string           // 종목코드
        prdt_name: string      // 종목명
        sll_buy_dvsn_cd: string // 01:매도, 02:매수
        ord_qty: string        // 주문수량
        tot_ccld_qty: string   // 총체결수량
        rmn_qty: string        // 잔량
        ord_unpr: string       // 주문단가
        ord_tmd: string        // 주문시간 (HHMMSS)
        ord_dt: string         // 주문일자 (YYYYMMDD)
        ord_gno_brno: string   // 주문채번지점번호
        orgn_odno: string      // 원주문번호
      }>
    }

    try {
      const res = await this.request<KISUnfilledResponse>(
        '/uapi/domestic-stock/v1/trading/inquire-psbl-rvsecncl',
        {
          CANO: accountNo,
          ACNT_PRDT_CD: productCode,
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: '',
          INQR_DVSN_1: '0', // 0:전체, 1:매도, 2:매수
          INQR_DVSN_2: '0', // 0:전체
        },
        'GET',
        trId
      )

      if (res.rt_cd !== '0') {
        safeLogger.error('[KISBroker] getOrders failed', { message: res.msg1 })
        return []
      }

      const orders: Order[] = res.output.map((item) => {
        const orderQty = parseFloat(item.ord_qty) || 0
        const filledQty = parseFloat(item.tot_ccld_qty) || 0
        const remainQty = parseFloat(item.rmn_qty) || 0

        let orderStatus: OrderStatus = 'pending'
        if (filledQty >= orderQty) orderStatus = 'filled'
        else if (filledQty > 0) orderStatus = 'partial'
        else if (remainQty === 0) orderStatus = 'cancelled'

        return {
          orderId: item.odno,
          stockCode: item.pdno,
          stockName: item.prdt_name,
          side: item.sll_buy_dvsn_cd === '02' ? 'buy' : 'sell',
          type: 'limit' as const,
          quantity: orderQty,
          filledQuantity: filledQty,
          price: parseFloat(item.ord_unpr) || 0,
          status: orderStatus,
          createdAt: this.parseKISDateTime(item.ord_dt, item.ord_tmd),
          updatedAt: new Date(),
        }
      })

      // 상태 필터링
      if (status) {
        return orders.filter((o) => o.status === status)
      }
      return orders
    } catch (error) {
      safeLogger.error('[KISBroker] getOrders error', { error })
      return []
    }
  }

  async getOrderHistory(days: number = 7): Promise<Order[]> {
    const [accountNo, productCode] = this.getAccountParts()
    const isRealTrading = this.credentials?.accountType !== 'paper'

    // TR 코드: 주문 체결 내역 조회
    const trId = isRealTrading ? 'TTTC8001R' : 'VTTC8001R'

    // 날짜 계산
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

    interface KISOrderHistoryResponse {
      rt_cd: string
      msg1: string
      output1: Array<{
        odno: string           // 주문번호
        pdno: string           // 종목코드
        prdt_name: string      // 종목명
        sll_buy_dvsn_cd: string // 01:매도, 02:매수
        ord_qty: string        // 주문수량
        tot_ccld_qty: string   // 총체결수량
        avg_prvs: string       // 평균가
        ord_unpr: string       // 주문단가
        ord_tmd: string        // 주문시간
        ord_dt: string         // 주문일자
        ccld_yn: string        // 체결여부 Y/N
        cncl_yn: string        // 취소여부 Y/N
      }>
    }

    try {
      const res = await this.request<KISOrderHistoryResponse>(
        '/uapi/domestic-stock/v1/trading/inquire-daily-ccld',
        {
          CANO: accountNo,
          ACNT_PRDT_CD: productCode,
          INQR_STRT_DT: formatDate(startDate),
          INQR_END_DT: formatDate(endDate),
          SLL_BUY_DVSN_CD: '00', // 00:전체
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
        'GET',
        trId
      )

      if (res.rt_cd !== '0') {
        safeLogger.error('[KISBroker] getOrderHistory failed', { message: res.msg1 })
        return []
      }

      return res.output1.map((item) => {
        let orderStatus: OrderStatus = 'pending'
        if (item.ccld_yn === 'Y') orderStatus = 'filled'
        else if (item.cncl_yn === 'Y') orderStatus = 'cancelled'

        return {
          orderId: item.odno,
          stockCode: item.pdno,
          stockName: item.prdt_name,
          side: item.sll_buy_dvsn_cd === '02' ? 'buy' : 'sell',
          type: 'limit' as const,
          quantity: parseFloat(item.ord_qty) || 0,
          filledQuantity: parseFloat(item.tot_ccld_qty) || 0,
          price: parseFloat(item.ord_unpr) || 0,
          avgPrice: parseFloat(item.avg_prvs) || 0,
          status: orderStatus,
          createdAt: this.parseKISDateTime(item.ord_dt, item.ord_tmd),
          updatedAt: new Date(),
        }
      })
    } catch (error) {
      safeLogger.error('[KISBroker] getOrderHistory error', { error, days })
      return []
    }
  }

  private parseKISDateTime(date: string, time: string): Date {
    // date: YYYYMMDD, time: HHMMSS
    const year = parseInt(date.slice(0, 4), 10)
    const month = parseInt(date.slice(4, 6), 10) - 1
    const day = parseInt(date.slice(6, 8), 10)
    const hour = parseInt(time.slice(0, 2), 10) || 0
    const min = parseInt(time.slice(2, 4), 10) || 0
    const sec = parseInt(time.slice(4, 6), 10) || 0
    return new Date(year, month, day, hour, min, sec)
  }

  // ============================================
  // Order Execution
  // ============================================

  async submitOrder(request: OrderRequest): Promise<OrderResult> {
    const [accountNo, productCode] = this.getAccountParts()
    const isRealTrading = this.credentials?.accountType !== 'paper'

    // TR 코드 결정
    const trId = request.side === 'buy'
      ? (isRealTrading ? 'TTTC0802U' : 'VTTC0802U')  // 매수
      : (isRealTrading ? 'TTTC0801U' : 'VTTC0801U')  // 매도

    // 주문 유형 (00: 지정가, 01: 시장가)
    const orderType = request.type === 'market' ? '01' : '00'

    const res = await this.request<KISOrderResponse>(
      '/uapi/domestic-stock/v1/trading/order-cash',
      {
        CANO: accountNo,
        ACNT_PRDT_CD: productCode,
        PDNO: request.stockCode,
        ORD_DVSN: orderType,
        ORD_QTY: request.quantity.toString(),
        ORD_UNPR: (request.price || 0).toString(),
      },
      'POST',
      trId
    )

    if (res.rt_cd !== '0') {
      return {
        success: false,
        message: res.msg1,
        error: res.msg1,
      }
    }

    return {
      success: true,
      orderId: res.output?.ODNO,
      message: `${request.side === 'buy' ? '매수' : '매도'} 주문 접수 완료`,
    }
  }

  async cancelOrder(orderId: string, stockCode?: string, quantity?: number): Promise<OrderResult> {
    const [accountNo, productCode] = this.getAccountParts()
    const isRealTrading = this.credentials?.accountType !== 'paper'

    // 주문 정보가 없으면 미체결 목록에서 조회
    let orderInfo = { stockCode: stockCode || '', quantity: quantity || 0 }
    if (!stockCode || !quantity) {
      const orders = await this.getOrders('pending')
      const order = orders.find((o) => o.orderId === orderId)
      if (order) {
        orderInfo = { stockCode: order.stockCode, quantity: order.quantity - order.filledQuantity }
      }
    }

    if (!orderInfo.stockCode) {
      return {
        success: false,
        message: '주문 정보를 찾을 수 없습니다',
        error: 'Order not found',
      }
    }

    // TR 코드: 주문 취소
    const trId = isRealTrading ? 'TTTC0803U' : 'VTTC0803U'

    try {
      const res = await this.request<KISOrderResponse>(
        '/uapi/domestic-stock/v1/trading/order-rvsecncl',
        {
          CANO: accountNo,
          ACNT_PRDT_CD: productCode,
          KRX_FWDG_ORD_ORGNO: '', // 주문채번지점번호 (빈값이면 자동조회)
          ORGN_ODNO: orderId,
          ORD_DVSN: '00',
          RVSE_CNCL_DVSN_CD: '02', // 01:정정, 02:취소
          ORD_QTY: orderInfo.quantity.toString(),
          ORD_UNPR: '0',
          QTY_ALL_ORD_YN: 'Y', // Y:잔량전부, N:일부
        },
        'POST',
        trId
      )

      if (res.rt_cd !== '0') {
        return {
          success: false,
          message: res.msg1,
          error: res.msg1,
        }
      }

      return {
        success: true,
        orderId: res.output?.ODNO,
        message: '주문 취소 완료',
      }
    } catch (error) {
      safeLogger.error('[KISBroker] cancelOrder error', { error, orderId })
      return {
        success: false,
        message: '주문 취소 실패',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async modifyOrder(orderId: string, newPrice: number, newQuantity?: number): Promise<OrderResult> {
    const [accountNo, productCode] = this.getAccountParts()
    const isRealTrading = this.credentials?.accountType !== 'paper'

    // 미체결 목록에서 주문 조회
    const orders = await this.getOrders('pending')
    const order = orders.find((o) => o.orderId === orderId)

    if (!order) {
      return {
        success: false,
        message: '주문 정보를 찾을 수 없습니다',
        error: 'Order not found',
      }
    }

    const modifyQty = newQuantity || (order.quantity - order.filledQuantity)

    // TR 코드: 주문 정정
    const trId = isRealTrading ? 'TTTC0803U' : 'VTTC0803U'

    try {
      const res = await this.request<KISOrderResponse>(
        '/uapi/domestic-stock/v1/trading/order-rvsecncl',
        {
          CANO: accountNo,
          ACNT_PRDT_CD: productCode,
          KRX_FWDG_ORD_ORGNO: '',
          ORGN_ODNO: orderId,
          ORD_DVSN: '00', // 지정가
          RVSE_CNCL_DVSN_CD: '01', // 01:정정, 02:취소
          ORD_QTY: modifyQty.toString(),
          ORD_UNPR: newPrice.toString(),
          QTY_ALL_ORD_YN: newQuantity ? 'N' : 'Y',
        },
        'POST',
        trId
      )

      if (res.rt_cd !== '0') {
        return {
          success: false,
          message: res.msg1,
          error: res.msg1,
        }
      }

      return {
        success: true,
        orderId: res.output?.ODNO,
        message: `주문 정정 완료 (가격: ${newPrice.toLocaleString()}원)`,
      }
    } catch (error) {
      safeLogger.error('[KISBroker] modifyOrder error', { error, orderId, newPrice, newQuantity })
      return {
        success: false,
        message: '주문 정정 실패',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ============================================
  // Convenience Methods
  // ============================================

  async buy(stockCode: string, quantity: number, price?: number): Promise<OrderResult> {
    return this.submitOrder({
      stockCode,
      side: 'buy',
      type: price ? 'limit' : 'market',
      quantity,
      price,
    })
  }

  async sell(stockCode: string, quantity: number, price?: number): Promise<OrderResult> {
    return this.submitOrder({
      stockCode,
      side: 'sell',
      type: price ? 'limit' : 'market',
      quantity,
      price,
    })
  }

  async cancelAllOrders(): Promise<OrderResult[]> {
    const orders = await this.getOrders('pending')
    return Promise.all(orders.map((order) => this.cancelOrder(order.orderId)))
  }

  async closeAllPositions(): Promise<OrderResult[]> {
    const holdings = await this.getHoldings()
    return Promise.all(
      holdings
        .filter((h) => h.quantity > 0)
        .map((h) => this.sell(h.stockCode, h.quantity))
    )
  }

  // ============================================
  // Real-time Data Subscriptions
  // ============================================

  subscribeQuote(stockCode: string, callback: QuoteCallback): () => void {
    // 콜백 등록
    if (!this.quoteCallbacks.has(stockCode)) {
      this.quoteCallbacks.set(stockCode, new Set())
    }
    this.quoteCallbacks.get(stockCode)!.add(callback)

    // WebSocket 연결 및 구독
    this.initWebSocket()
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.sendSubscription(stockCode, true)
    }

    // 구독 해제 함수 반환
    return () => {
      const callbacks = this.quoteCallbacks.get(stockCode)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.quoteCallbacks.delete(stockCode)
          this.sendSubscription(stockCode, false)
        }
      }
    }
  }

  subscribeOrders(callback: OrderCallback): () => void {
    this.orderCallbacks.add(callback)

    // WebSocket 연결
    this.initWebSocket()

    // 체결 알림 구독 (H0STCNI0)
    if (this.wsConnection?.readyState === WebSocket.OPEN && this.wsApprovalKey) {
      const message = JSON.stringify({
        header: {
          approval_key: this.wsApprovalKey,
          custtype: 'P',
          tr_type: '1',
          content_type: 'utf-8',
        },
        body: {
          input: {
            tr_id: 'H0STCNI0', // 실시간 체결 알림
            tr_key: this.credentials?.accountNumber?.replace('-', '') || '',
          },
        },
      })
      this.wsConnection.send(message)
    }

    return () => {
      this.orderCallbacks.delete(callback)
    }
  }

  // ============================================
  // Market Data
  // ============================================

  async getQuote(stockCode: string): Promise<Quote> {
    interface KISQuoteResponse {
      output: {
        stck_prpr: string      // 현재가
        prdy_vrss: string      // 전일대비
        prdy_ctrt: string      // 전일대비율
        stck_oprc: string      // 시가
        stck_hgpr: string      // 고가
        stck_lwpr: string      // 저가
        acml_vol: string       // 누적거래량
        hts_kor_isnm: string   // 종목명
      }
    }

    const res = await this.request<KISQuoteResponse>(
      '/uapi/domestic-stock/v1/quotations/inquire-price',
      {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: stockCode,
      },
      'GET',
      'FHKST01010100'
    )

    return {
      stockCode,
      stockName: res.output.hts_kor_isnm,
      currentPrice: parseFloat(res.output.stck_prpr) || 0,
      change: parseFloat(res.output.prdy_vrss) || 0,
      changeRate: parseFloat(res.output.prdy_ctrt) || 0,
      open: parseFloat(res.output.stck_oprc) || 0,
      high: parseFloat(res.output.stck_hgpr) || 0,
      low: parseFloat(res.output.stck_lwpr) || 0,
      volume: parseFloat(res.output.acml_vol) || 0,
      timestamp: new Date(),
    }
  }

  async searchStock(keyword: string): Promise<Array<{ code: string; name: string; market: string }>> {
    interface KISSearchResponse {
      rt_cd: string
      msg1: string
      output: Array<{
        pdno: string       // 종목코드
        prdt_name: string  // 종목명
        mket_id_cd: string // 시장구분 (KOSPI/KOSDAQ)
      }>
    }

    try {
      // 국내 주식 종목 검색 API
      const res = await this.request<KISSearchResponse>(
        '/uapi/domestic-stock/v1/quotations/search-stock-info',
        {
          PDNO: '',
          PRDT_TYPE_CD: '300', // 300:주식
        },
        'GET',
        'CTPF1002R'
      )

      if (res.rt_cd !== '0') {
        safeLogger.error('[KISBroker] searchStock failed', { message: res.msg1, keyword })
        return this.searchStockFallback(keyword)
      }

      // 키워드로 필터링
      return res.output
        .filter((item) =>
          item.pdno.includes(keyword) ||
          item.prdt_name.toLowerCase().includes(keyword.toLowerCase())
        )
        .slice(0, 20) // 최대 20개
        .map((item) => ({
          code: item.pdno,
          name: item.prdt_name,
          market: item.mket_id_cd === '1' ? 'KOSPI' : 'KOSDAQ',
        }))
    } catch (error) {
      safeLogger.error('[KISBroker] searchStock error', { error, keyword })
      return this.searchStockFallback(keyword)
    }
  }

  private searchStockFallback(keyword: string): Array<{ code: string; name: string; market: string }> {
    // API 실패 시 주요 종목 fallback
    const majorStocks = [
      { code: '005930', name: '삼성전자', market: 'KOSPI' },
      { code: '000660', name: 'SK하이닉스', market: 'KOSPI' },
      { code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' },
      { code: '006400', name: '삼성SDI', market: 'KOSPI' },
      { code: '035420', name: 'NAVER', market: 'KOSPI' },
      { code: '035720', name: '카카오', market: 'KOSPI' },
      { code: '051910', name: 'LG화학', market: 'KOSPI' },
      { code: '207940', name: '삼성바이오로직스', market: 'KOSPI' },
      { code: '005380', name: '현대차', market: 'KOSPI' },
      { code: '000270', name: '기아', market: 'KOSPI' },
      { code: '068270', name: '셀트리온', market: 'KOSPI' },
      { code: '028260', name: '삼성물산', market: 'KOSPI' },
      { code: '105560', name: 'KB금융', market: 'KOSPI' },
      { code: '055550', name: '신한지주', market: 'KOSPI' },
      { code: '012330', name: '현대모비스', market: 'KOSPI' },
      { code: '066570', name: 'LG전자', market: 'KOSPI' },
      { code: '003550', name: 'LG', market: 'KOSPI' },
      { code: '096770', name: 'SK이노베이션', market: 'KOSPI' },
      { code: '017670', name: 'SK텔레콤', market: 'KOSPI' },
      { code: '030200', name: 'KT', market: 'KOSPI' },
      // KOSDAQ
      { code: '247540', name: '에코프로비엠', market: 'KOSDAQ' },
      { code: '086520', name: '에코프로', market: 'KOSDAQ' },
      { code: '091990', name: '셀트리온헬스케어', market: 'KOSDAQ' },
      { code: '357780', name: '솔브레인', market: 'KOSDAQ' },
      { code: '293490', name: '카카오게임즈', market: 'KOSDAQ' },
    ]

    return majorStocks.filter(
      (s) => s.code.includes(keyword) || s.name.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  // ============================================
  // Private Helpers
  // ============================================

  private getAccountParts(): [string, string] {
    if (!this.credentials?.accountNumber) {
      throw new Error('계좌번호가 설정되지 않았습니다')
    }
    const parts = this.credentials.accountNumber.split('-')
    return [parts[0], parts[1] || '01']
  }

  private async request<T>(
    path: string,
    params: Record<string, string>,
    method: 'GET' | 'POST' = 'GET',
    trId: string
  ): Promise<T> {
    if (!this.isConnected()) {
      throw new Error('증권사 연결이 필요합니다')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${this.accessToken}`,
      appkey: this.credentials!.apiKey,
      appsecret: this.credentials!.apiSecret,
      tr_id: trId,
    }

    let url = `${this.baseUrl}${path}`
    let body: string | undefined

    if (method === 'GET') {
      url += '?' + new URLSearchParams(params).toString()
    } else {
      body = JSON.stringify(params)
    }

    const res = await fetch(url, { method, headers, body })

    if (!res.ok) {
      throw new Error(`KIS API Error: ${res.status}`)
    }

    return res.json()
  }
}

/**
 * KIS Broker 팩토리 함수
 */
export function createKISBroker(): KISBroker {
  return new KISBroker()
}
