// ============================================
// Trading Agent Prompts
// LLM Prompt Templates for Natural Language Processing
// ============================================

import type { PromptTemplate } from './types'

// ============================================
// System Prompts
// ============================================

export const SYSTEM_PROMPT_INTENT_PARSER = `당신은 암호화폐 트레이딩 전략 파싱 전문가입니다.
사용자의 자연어 입력을 분석하여 트레이딩 의도와 엔티티를 추출합니다.

## 의도 유형 (Intent Types)
- STRATEGY_CREATE: 새로운 트레이딩 전략 생성 요청
- STRATEGY_MODIFY: 기존 전략 수정 요청
- BACKTEST_RUN: 백테스트 실행 요청
- LIVE_START: 실거래 시작 요청
- LIVE_STOP: 실거래 중지 요청
- POSITION_QUERY: 현재 포지션 조회
- MARKET_ANALYSIS: 시장 분석 요청
- RISK_ADJUST: 리스크 설정 조정
- HELP: 도움말 요청
- UNKNOWN: 트레이딩과 무관하거나 이해 불가

## 추출할 엔티티
1. symbols: 거래 심볼 (BTC, ETH, 비트코인 → BTC/USDT)
2. prices: 가격 (5만달러 → 50000 USD)
3. percentages: 퍼센트 값 (5%, 10퍼센트)
4. indicators: 기술적 지표 (RSI, MACD, SMA, EMA, 볼린저밴드)
5. timeframes: 시간프레임 (1시간, 15분, 일봉)
6. conditions: 조건 (이상, 이하, 돌파, 크로스)
7. actions: 액션 (매수, 매도, 청산)

## 지표 파라미터 기본값
- RSI: period=14
- SMA: period=20
- EMA: period=20
- MACD: fast=12, slow=26, signal=9
- Bollinger: period=20, stdDev=2

## 한국어-영어 매핑
- 비트코인/비트/BTC → BTC
- 이더리움/이더/ETH → ETH
- 이평선/이동평균선 → SMA
- 볼린저/볼밴 → Bollinger
- 매수/사다/롱 → buy
- 매도/팔다/숏 → sell
- 손절/스탑로스 → stopLoss
- 익절/목표가 → takeProfit

응답은 반드시 JSON 형식으로만 출력하세요.`

export const SYSTEM_PROMPT_STRATEGY_BUILDER = `당신은 암호화폐 트레이딩 전략 설계 전문가입니다.
파싱된 의도와 엔티티를 기반으로 실행 가능한 트레이딩 전략을 생성합니다.

## 전략 구성 요소
1. 진입 조건 (Entry Conditions)
   - 지표 기반: RSI < 30, SMA 크로스 등
   - 가격 기반: 특정 가격 도달

2. 청산 조건 (Exit Conditions)
   - 지표 기반: RSI > 70 등
   - 리스크 기반: 손절, 익절

3. 포지션 크기 (Position Sizing)
   - 퍼센트: 포트폴리오의 X%
   - 고정금액: $1000

4. 리스크 관리 (Risk Management)
   - 손절 (Stop Loss)
   - 익절 (Take Profit)
   - 최대 낙폭 (Max Drawdown)

## 전략 검증 규칙
- 진입 조건은 최소 1개 필수
- 청산 조건 또는 손절 설정 필수
- 심볼은 유효한 거래쌍이어야 함
- 퍼센트 값은 0-100 범위

## 기본값 적용
- 손절: 미설정 시 5% 권장
- 익절: 미설정 시 경고
- 포지션 크기: 미설정 시 10%
- 타임프레임: 미설정 시 1h

응답은 반드시 JSON 형식으로만 출력하세요.`

export const SYSTEM_PROMPT_RESPONSE_GENERATOR = `당신은 HEPHAITOS 트레이딩 교육 어시스턴트입니다.

## ⚠️ 법률 준수 원칙 (절대 위반 금지)

**투자 조언 절대 금지:**
- ❌ "~하세요", "~사세요", "~팔세요" (권유형 표현)
- ❌ "수익 보장", "확실한 수익", "100% 성공"
- ❌ 구체적 종목 추천 ("~을/를 사세요")
- ❌ 미래 가격 예측 ("내일 오를 것", "곧 급등")

**허용 표현:**
- ✅ "~할 수 있습니다" (가능성 설명)
- ✅ "과거 성과는 미래를 보장하지 않습니다"
- ✅ "교육 목적으로만 제공됩니다"
- ✅ "투자 결정은 본인 책임입니다"
- ✅ "다음 전략을 참고할 수 있습니다" (참고용)

## 응답 필수 요소

모든 응답에 면책조항 포함:
"⚠️ 본 서비스는 투자 교육 및 도구 제공 목적이며, 투자 조언이 아닙니다. 투자 결정은 본인 책임입니다."

## 위험 요소 경고

다음 경우 명확히 경고:
- 손절가 미설정 → "⚠️ 손절가 없는 전략은 고위험입니다"
- 높은 레버리지 (>5x) → "⚠️ 레버리지 5배 이상은 매우 위험합니다"
- 손절 > 10% → "⚠️ 손절가 10% 초과는 고위험입니다"
- 단일 지표 의존 → "⚠️ 2개 이상 지표 사용을 권장합니다"
- 포지션 > 20% → "⚠️ 분산 투자를 권장합니다"

## 응답 스타일
- 한국어로 응답
- 전문 용어는 쉽게 풀어서 설명
- 핵심 내용을 먼저, 상세 내용은 나중에
- 위험 요소는 명확히 경고
- 다음 단계 제안 포함
- 항상 교육적이고 안전한 톤 유지

## 응답 구조
1. 요약: 무엇을 했는지 한 문장 (설명형)
2. 상세: 전략 내용 설명
3. ⚠️ 주의: 리스크 경고 (필수)
4. 제안: 다음 단계 or 개선점
5. 면책조항: 투자 교육 목적 명시 (필수)`

// ============================================
// Prompt Templates
// ============================================

export const INTENT_PARSER_TEMPLATE: PromptTemplate = {
  name: 'intent_parser',
  systemPrompt: SYSTEM_PROMPT_INTENT_PARSER,
  userPromptTemplate: `다음 사용자 입력을 분석하세요:

입력: "{input}"

JSON 형식으로 응답:`,
  outputSchema: {
    type: 'object',
    properties: {
      intent: { type: 'string', enum: ['STRATEGY_CREATE', 'STRATEGY_MODIFY', 'BACKTEST_RUN', 'LIVE_START', 'LIVE_STOP', 'POSITION_QUERY', 'MARKET_ANALYSIS', 'RISK_ADJUST', 'HELP', 'UNKNOWN'] },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      entities: {
        type: 'object',
        properties: {
          symbols: { type: 'array', items: { type: 'object' } },
          prices: { type: 'array', items: { type: 'object' } },
          percentages: { type: 'array', items: { type: 'object' } },
          indicators: { type: 'array', items: { type: 'object' } },
          timeframes: { type: 'array', items: { type: 'object' } },
          conditions: { type: 'array', items: { type: 'object' } },
          actions: { type: 'array', items: { type: 'object' } },
        }
      }
    },
    required: ['intent', 'confidence', 'entities']
  }
}

export const STRATEGY_BUILDER_TEMPLATE: PromptTemplate = {
  name: 'strategy_builder',
  systemPrompt: SYSTEM_PROMPT_STRATEGY_BUILDER,
  userPromptTemplate: `다음 파싱된 의도를 기반으로 전략을 생성하세요:

의도 유형: {intentType}
추출된 엔티티:
{entities}

원본 입력: "{originalInput}"

JSON 형식으로 전략 생성:`,
  outputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      symbol: { type: 'string' },
      timeframe: { type: 'string' },
      entryConditions: { type: 'array' },
      exitConditions: { type: 'array' },
      riskManagement: { type: 'object' },
      positionSize: { type: 'object' },
      validation: { type: 'object' }
    }
  }
}

// ============================================
// Example Prompts for Few-Shot Learning
// ============================================

export const PARSING_EXAMPLES = [
  {
    input: "비트코인 RSI가 30 아래로 내려가면 10% 매수해줘",
    output: {
      intent: "STRATEGY_CREATE",
      confidence: 0.95,
      entities: {
        symbols: [{ value: "BTC/USDT", original: "비트코인", confidence: 0.98 }],
        percentages: [{ value: 10, original: "10%", context: "position_size", confidence: 0.95 }],
        indicators: [{ type: "rsi", params: { period: 14 }, original: "RSI", confidence: 0.98 }],
        conditions: [{ type: "entry", operator: "less_than", value: 30, original: "30 아래로", confidence: 0.95 }],
        actions: [{ type: "buy", size: 10, sizeType: "percent", original: "매수", confidence: 0.98 }]
      }
    }
  },
  {
    input: "이더리움 20일 이평선 돌파하면 매수, 손절 5%",
    output: {
      intent: "STRATEGY_CREATE",
      confidence: 0.92,
      entities: {
        symbols: [{ value: "ETH/USDT", original: "이더리움", confidence: 0.98 }],
        percentages: [{ value: 5, original: "5%", context: "stop_loss", confidence: 0.95 }],
        indicators: [{ type: "sma", params: { period: 20 }, original: "20일 이평선", confidence: 0.95 }],
        conditions: [{ type: "entry", operator: "crosses_above", value: "sma_20", original: "돌파", confidence: 0.90 }],
        actions: [{ type: "buy", original: "매수", confidence: 0.98 }]
      }
    }
  },
  {
    input: "지금 내 포지션 어때?",
    output: {
      intent: "POSITION_QUERY",
      confidence: 0.98,
      entities: {
        symbols: [],
        prices: [],
        percentages: [],
        indicators: [],
        conditions: [],
        actions: []
      }
    }
  },
  {
    input: "이 전략으로 최근 3개월 백테스트 돌려줘",
    output: {
      intent: "BACKTEST_RUN",
      confidence: 0.95,
      entities: {
        timeframes: [{ value: "3M", original: "3개월", confidence: 0.95 }]
      }
    }
  }
]

// ============================================
// Response Templates
// ============================================

export const RESPONSE_TEMPLATES = {
  STRATEGY_CREATED: `✅ **전략이 생성되었습니다**

📊 **{strategyName}**
- 심볼: {symbol}
- 타임프레임: {timeframe}

**진입 조건:**
{entryConditions}

**청산 조건:**
{exitConditions}

**리스크 관리:**
- 손절: {stopLoss}%
- 익절: {takeProfit}%

{warnings}

💡 **다음 단계:** "{nextStep}"`,

  BACKTEST_RESULT: `📈 **백테스트 결과**

**기간:** {startDate} ~ {endDate}
**초기 자본:** {initialCapital}

**성과 지표:**
- 총 수익률: {totalReturn}%
- 승률: {winRate}%
- 샤프 비율: {sharpeRatio}
- 최대 낙폭: {maxDrawdown}%
- 총 거래: {totalTrades}회

**평가:** {recommendation}

{suggestions}`,

  LIVE_STARTED: `🚀 **실거래가 시작되었습니다**

**전략:** {strategyName}
**심볼:** {symbol}
**모드:** {mode}

⚠️ **주의:** 실제 자금이 투입됩니다. 시장 상황을 주시하세요.

**명령어:**
- "거래 중단해줘" - 실거래 중지
- "포지션 확인해줘" - 현재 포지션 조회`,

  POSITION_STATUS: `💼 **현재 포지션**

{positions}

**총 자산:** {totalValue}
**미실현 손익:** {unrealizedPnl} ({unrealizedPnlPercent}%)`,

  ERROR: `❌ **오류가 발생했습니다**

{errorMessage}

💡 **해결 방법:** {suggestion}`,

  HELP: `🤖 **HEPHAITOS 트레이딩 어시스턴트**

**사용 예시:**
- "비트코인 RSI 30 이하면 매수해줘"
- "이더리움 50일 이평선 돌파하면 10% 매수, 손절 3%"
- "이 전략으로 백테스트 돌려줘"
- "실전 투입해줘"
- "지금 내 포지션 어때?"
- "거래 중단하고 전부 청산해"

**지원 지표:** RSI, SMA, EMA, MACD, 볼린저밴드, 스토캐스틱
**지원 거래소:** Binance, Upbit`
}

// ============================================
// Utility Functions
// ============================================

export function formatPrompt(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value)
  }
  return result
}

export function buildFewShotPrompt(examples: typeof PARSING_EXAMPLES, input: string): string {
  let prompt = '다음은 입력과 파싱 결과의 예시입니다:\n\n'

  for (const example of examples.slice(0, 3)) {
    prompt += `입력: "${example.input}"\n`
    prompt += `결과: ${JSON.stringify(example.output, null, 2)}\n\n`
  }

  prompt += `이제 다음 입력을 파싱하세요:\n입력: "${input}"\n결과:`

  return prompt
}
