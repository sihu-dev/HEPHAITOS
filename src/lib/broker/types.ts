// ============================================
// Unified Broker Types
// 증권사 통합 API 타입 정의
// ============================================

/**
 * 지원 증권사 목록
 */
export type BrokerId =
  | 'kis'      // 한국투자증권
  | 'kiwoom'   // 키움증권
  | 'samsung'  // 삼성증권
  | 'mirae'    // 미래에셋
  | 'nh'       // NH투자증권
  | 'alpaca'   // Alpaca (해외)
  | 'binance'  // Binance (암호화폐)
  | 'upbit'    // Upbit (암호화폐)

/**
 * 브로커 지원 상태
 * GPT V1 피드백 P0-4: 키움 "지원" 문구 제거 → "준비중" 명확화
 */
export type BrokerStatus =
  | 'supported'     // 완전 지원 (활성, 사용 가능)
  | 'beta'          // 베타 (사용 가능, 경고 표시)
  | 'coming_soon'   // 준비 중 (버튼 비활성 + "준비중" 배지)
  | 'unavailable'   // 미제공 (숨김 또는 "제공 안 함")

/**
 * 증권사 메타정보
 */
export interface BrokerInfo {
  id: BrokerId
  name: string
  nameKr: string
  logo: string
  status: BrokerStatus  // P0-4: 지원 상태 명확화
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard'
  setupTime: string
  guideUrl: string
  features: string[]
  apiType: 'rest' | 'websocket' | 'ocx' | 'hybrid'
  markets: ('kr_stock' | 'us_stock' | 'crypto')[]
  paperTrading: boolean
}

/**
 * 인증 정보
 */
export interface BrokerCredentials {
  apiKey: string
  apiSecret: string
  accountNumber: string
  accountType?: 'real' | 'paper'  // 실전 / 모의
  certPassword?: string           // 키움증권 공인인증서 비밀번호
  appId?: string                  // 일부 증권사 필요
}

/**
 * 연결 결과
 */
export interface ConnectionResult {
  success: boolean
  message: string
  balance?: Balance
  error?: string
  errorCode?: string
}

/**
 * 계좌 잔고
 */
export interface Balance {
  totalAssets: number       // 총 자산
  cash: number              // 예수금
  stocksValue: number       // 주식/코인 평가금액
  totalProfit: number       // 총 손익
  profitRate: number        // 수익률 (%)
  buyingPower: number       // 매수 가능 금액
  currency: string          // 통화 (KRW, USD, USDT)
}

/**
 * 보유 종목
 */
export interface Holding {
  stockCode: string         // 종목코드
  stockName: string         // 종목명
  market: 'KRX' | 'NASDAQ' | 'NYSE' | 'CRYPTO'
  quantity: number          // 보유수량
  avgPrice: number          // 평균단가
  currentPrice: number      // 현재가
  profit: number            // 평가손익
  profitRate: number        // 수익률 (%)
  value: number             // 평가금액
}

/**
 * 주문 상태
 */
export type OrderStatus =
  | 'pending'     // 대기
  | 'submitted'   // 접수
  | 'partial'     // 부분체결
  | 'filled'      // 전량체결
  | 'cancelled'   // 취소
  | 'rejected'    // 거부

/**
 * 주문 유형
 */
export type OrderType =
  | 'market'      // 시장가
  | 'limit'       // 지정가
  | 'stop'        // 스탑
  | 'stop_limit'  // 스탑 리밋

/**
 * 매매 구분
 */
export type OrderSide = 'buy' | 'sell'

/**
 * 주문
 */
export interface Order {
  orderId: string
  stockCode: string
  stockName: string
  side: OrderSide
  type: OrderType
  quantity: number
  filledQuantity: number
  price: number
  avgFilledPrice?: number
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
}

/**
 * 주문 요청
 */
export interface OrderRequest {
  stockCode: string
  side: OrderSide
  type: OrderType
  quantity: number
  price?: number            // 지정가일 경우 필수
  stopPrice?: number        // 스탑 주문일 경우
}

/**
 * 주문 결과
 */
export interface OrderResult {
  success: boolean
  orderId?: string
  message: string
  error?: string
}

/**
 * 실시간 시세
 */
export interface Quote {
  stockCode: string
  stockName: string
  currentPrice: number
  change: number
  changeRate: number
  high: number
  low: number
  open: number
  volume: number
  timestamp: Date
}

/**
 * 시세 콜백
 */
export type QuoteCallback = (quote: Quote) => void

/**
 * 주문 체결 콜백
 */
export type OrderCallback = (order: Order) => void

/**
 * 통합 브로커 인터페이스
 */
export interface UnifiedBroker {
  readonly brokerId: BrokerId
  readonly brokerName: string

  // 인증
  connect(credentials: BrokerCredentials): Promise<ConnectionResult>
  disconnect(): Promise<void>
  isConnected(): boolean
  refreshToken(): Promise<boolean>

  // 계좌 조회
  getBalance(): Promise<Balance>
  getHoldings(): Promise<Holding[]>
  getOrders(status?: OrderStatus): Promise<Order[]>
  getOrderHistory(days?: number): Promise<Order[]>

  // 주문
  submitOrder(request: OrderRequest): Promise<OrderResult>
  cancelOrder(orderId: string): Promise<OrderResult>
  modifyOrder(orderId: string, newPrice: number, newQuantity?: number): Promise<OrderResult>

  // 편의 메서드
  buy(stockCode: string, quantity: number, price?: number): Promise<OrderResult>
  sell(stockCode: string, quantity: number, price?: number): Promise<OrderResult>
  cancelAllOrders(): Promise<OrderResult[]>
  closeAllPositions(): Promise<OrderResult[]>

  // 실시간
  subscribeQuote(stockCode: string, callback: QuoteCallback): () => void
  subscribeOrders(callback: OrderCallback): () => void

  // 시장 데이터
  getQuote(stockCode: string): Promise<Quote>
  searchStock(keyword: string): Promise<Array<{ code: string; name: string; market: string }>>
}

/**
 * 브로커 팩토리 타입
 */
export type BrokerFactory = (credentials?: BrokerCredentials) => UnifiedBroker
