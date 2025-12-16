// ============================================
// App Configuration
// 앱 전역 설정 중앙화
// ============================================

// 환경 변수
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const

// API 설정
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
} as const

// 인증 설정
export const AUTH_CONFIG = {
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7일
  REFRESH_THRESHOLD: 60 * 60 * 1000, // 1시간 전 갱신
} as const

// 결제 설정
export const PAYMENT_CONFIG = {
  PROVIDER: 'toss' as const,
  CURRENCY: 'KRW' as const,
  TAX_RATE: 0.1, // 10% VAT
  REFUND_PERIOD_DAYS: 7,
} as const

// 가격 정책 (헌법 기반)
export const PRICING = {
  FREE: {
    id: 'free',
    name: 'Free',
    nameKr: '무료',
    monthlyPrice: 0,
    yearlyPrice: 0,
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    nameKr: '스타터',
    monthlyPrice: 9900,
    yearlyPrice: 99000,
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    nameKr: '프로',
    monthlyPrice: 29900,
    yearlyPrice: 299000,
  },
  TEAM: {
    id: 'team',
    name: 'Team',
    nameKr: '팀',
    monthlyPrice: 199000,
    yearlyPrice: 1990000,
  },
} as const

// 기능 제한
export const LIMITS = {
  FREE: {
    backtestPerMonth: 5,
    liveStrategies: 1,
    celebrities: 3,
    dataAccess: 'basic' as const,
  },
  STARTER: {
    backtestPerMonth: 50,
    liveStrategies: 5,
    celebrities: 10,
    dataAccess: 'realtime' as const,
  },
  PRO: {
    backtestPerMonth: 'unlimited' as const,
    liveStrategies: 20,
    celebrities: 'unlimited' as const,
    dataAccess: 'premium' as const,
  },
  TEAM: {
    backtestPerMonth: 'unlimited' as const,
    liveStrategies: 'unlimited' as const,
    celebrities: 'unlimited' as const,
    dataAccess: 'premium' as const,
  },
} as const

// UI 설정
export const UI_CONFIG = {
  TOAST_DURATION: 5000,
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  PAGINATION_SIZE: 20,
} as const

// 외부 서비스 설정
export const EXTERNAL_SERVICES = {
  SUPABASE: {
    URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  ANTHROPIC: {
    MODEL: 'claude-sonnet-4-20250514',
    MAX_TOKENS: 4096,
  },
  TOSS: {
    CLIENT_KEY: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
    SECRET_KEY: process.env.TOSS_SECRET_KEY,
    API_URL: 'https://api.tosspayments.com/v1',
  },
} as const

// 면책조항 (헌법 필수)
export const DISCLAIMER = {
  SHORT: 'HEPHAITOS는 투자 교육 플랫폼입니다. 투자 조언을 제공하지 않습니다.',
  FULL: `HEPHAITOS는 투자 교육 및 도구 플랫폼입니다. 투자 조언을 제공하지 않으며,
모든 투자 결정은 사용자 본인의 판단과 책임 하에 이루어져야 합니다.
과거 성과가 미래 수익을 보장하지 않습니다.`,
  LEGAL: `본 서비스는 금융투자업에 관한 법률에 따른 투자자문업 또는 투자일임업 등록을 하지 않았으며,
투자에 관한 조언을 제공하지 않습니다. 제공되는 정보는 투자 판단의 참고자료로만 활용하시기 바랍니다.`,
} as const

// 지원 셀럽 목록
export const SUPPORTED_CELEBRITIES = [
  { id: 'nancy-pelosi', name: 'Nancy Pelosi', nameKr: '낸시 펠로시' },
  { id: 'warren-buffett', name: 'Warren Buffett', nameKr: '워런 버핏' },
  { id: 'cathie-wood', name: 'Cathie Wood', nameKr: '캐시 우드' },
  { id: 'ray-dalio', name: 'Ray Dalio', nameKr: '레이 달리오' },
  { id: 'michael-burry', name: 'Michael Burry', nameKr: '마이클 버리' },
] as const

// 지원 거래소
export const SUPPORTED_EXCHANGES = [
  { id: 'binance', name: 'Binance', type: 'crypto' as const },
  { id: 'upbit', name: 'Upbit', type: 'crypto' as const },
  { id: 'kis', name: '한국투자증권', type: 'stock' as const },
  { id: 'alpaca', name: 'Alpaca', type: 'stock' as const },
] as const

// 투자 스타일
export const INVESTMENT_STYLES = [
  { id: 'conservative', name: '안정형', risk: 'low' as const },
  { id: 'moderate', name: '중립형', risk: 'medium' as const },
  { id: 'aggressive', name: '공격형', risk: 'high' as const },
] as const

export type InvestmentStyleId = typeof INVESTMENT_STYLES[number]['id']
export type ExchangeId = typeof SUPPORTED_EXCHANGES[number]['id']
export type CelebrityId = typeof SUPPORTED_CELEBRITIES[number]['id']
export type PlanId = keyof typeof PRICING
