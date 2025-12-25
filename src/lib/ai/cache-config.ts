// ============================================
// Claude Prompt Caching Configuration
// 90% 비용 절감을 위한 캐시 가능 프롬프트
// ============================================

/**
 * Cache Control Block for Claude API
 * TTL: 5분 (자동 갱신)
 */
export interface CacheControlBlock {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral' }
}

// ============================================
// System Prompts (캐시 우선순위 P0)
// ============================================

/**
 * AI 멘토 시스템 프롬프트 (Learn 모드)
 * 토큰 수: ~1,000
 * 재사용률: 매우 높음 (교육 콘텐츠)
 */
export const AI_MENTOR_SYSTEM_PROMPT: CacheControlBlock = {
  type: 'text',
  text: `당신은 HEPHAITOS의 AI 투자 교육 멘토입니다.

## 역할 (Role)
- 투자 교육 전문가로서 사용자의 투자 학습을 돕습니다
- 복잡한 금융 개념을 쉽게 설명합니다
- 위험 요소를 명확히 경고합니다

## 중요 원칙 (Critical Rules)

### ⚠️ 법률 준수 (절대 위반 금지)
- ❌ 투자 조언 금지: "~하세요", "사세요", "팔세요" 같은 권유형 표현
- ❌ 수익 보장 표현 금지: "확실한 수익", "100% 성공", "무조건 수익"
- ❌ 구체적 종목 추천 금지
- ❌ 미래 가격 예측 금지: "내일 오를 것", "곧 급등"

### ✅ 허용되는 표현
- "~할 수 있습니다" (가능성 설명)
- "과거 성과는 미래를 보장하지 않습니다"
- "교육 목적으로만 제공됩니다"
- "투자 결정은 본인 책임입니다"
- "다음 전략을 참고할 수 있습니다" (참고용)

### 📝 응답 필수 요소
모든 응답에 면책조항 포함:
"⚠️ 본 서비스는 투자 교육 및 도구 제공 목적이며, 투자 조언이 아닙니다. 투자 결정은 본인 책임입니다."

## 응답 스타일
- 한국어로 응답
- 전문 용어는 쉽게 풀어서 설명
- 핵심 내용을 먼저, 상세 내용은 나중에
- 위험 요소는 명확히 경고
- 항상 교육적이고 안전한 톤 유지`,
  cache_control: { type: 'ephemeral' },
}

/**
 * 기술 지표 가이드 (Learn 모드)
 * 토큰 수: ~2,000
 * 재사용률: 높음
 */
export const TECHNICAL_INDICATORS_GUIDE: CacheControlBlock = {
  type: 'text',
  text: `# 기술 지표 설명 가이드

## 1. RSI (Relative Strength Index)
- **의미**: 과매수/과매도 지표
- **범위**: 0-100
- **기간**: 일반적으로 14일
- **해석**:
  - 30 이하: 과매도 (매수 고려 구간)
  - 70 이상: 과매수 (매도 고려 구간)
  - 50: 중립
- **주의**: RSI만으로 판단하지 말고 다른 지표와 함께 사용

## 2. MACD (Moving Average Convergence Divergence)
- **의미**: 이동평균 수렴/확산 지표
- **구성**:
  - MACD 선: 12일 EMA - 26일 EMA
  - Signal 선: MACD의 9일 EMA
  - Histogram: MACD - Signal
- **해석**:
  - MACD가 Signal을 상향 돌파: 매수 신호 (골든크로스)
  - MACD가 Signal을 하향 돌파: 매도 신호 (데드크로스)
- **주의**: 횡보장에서는 잘못된 신호 가능

## 3. SMA (Simple Moving Average)
- **의미**: 단순 이동평균선
- **기간**: 20일, 60일, 120일이 일반적
- **해석**:
  - 가격이 이평선 위: 상승 추세
  - 가격이 이평선 아래: 하락 추세
  - 단기선이 장기선 돌파: 추세 전환 신호
- **주의**: 후행 지표이므로 타점 포착에 한계

## 4. EMA (Exponential Moving Average)
- **의미**: 지수 이동평균선
- **SMA와 차이**: 최근 데이터에 더 큰 가중치
- **장점**: SMA보다 빠른 반응
- **단점**: 변동성이 크면 잘못된 신호 증가

## 5. Bollinger Bands (볼린저밴드)
- **구성**:
  - 중심선: 20일 SMA
  - 상단선: SMA + (2 × 표준편차)
  - 하단선: SMA - (2 × 표준편차)
- **해석**:
  - 가격이 하단 접촉: 과매도 (반등 가능)
  - 가격이 상단 접촉: 과매수 (조정 가능)
  - 밴드 폭 좁아짐: 변동성 축소, 큰 움직임 임박
- **주의**: 강한 추세에서는 밴드를 따라 움직임

## 6. Stochastic Oscillator (스토캐스틱)
- **의미**: 일정 기간의 가격 범위 내 현재 위치
- **범위**: 0-100
- **구성**: %K선, %D선
- **해석**:
  - 20 이하: 과매도
  - 80 이상: 과매수
  - %K가 %D를 상향 돌파: 매수 신호
- **주의**: RSI와 유사하나 더 민감

## 7. ATR (Average True Range)
- **의미**: 평균 변동성 측정
- **용도**: 손절가/익절가 설정
- **해석**: ATR이 클수록 변동성 높음
- **활용**: ATR의 1.5~2배를 손절 폭으로 설정

## 8. Volume (거래량)
- **의미**: 매매 강도
- **해석**:
  - 거래량 급증 + 상승: 상승 추세 강화
  - 거래량 급증 + 하락: 하락 추세 강화
  - 거래량 감소: 추세 약화 가능
- **주의**: 거래량만으로는 방향 판단 불가

## 9. OBV (On-Balance Volume)
- **의미**: 누적 거래량 지표
- **계산**: 상승일 거래량 더하고, 하락일 거래량 뺌
- **해석**: 가격과 OBV의 괴리(Divergence)로 추세 전환 예측

## ⚠️ 지표 사용 시 주의사항
1. **단일 지표 의존 금지**: 최소 2-3개 지표 조합
2. **백테스트 필수**: 과거 데이터로 검증
3. **과최적화 주의**: 과거에만 맞는 전략은 실패
4. **시장 환경 고려**: 추세장/횡보장에 따라 효과 다름
5. **리스크 관리**: 지표가 아무리 좋아도 손절은 필수`,
  cache_control: { type: 'ephemeral' },
}

/**
 * 법률 준수 가이드라인 (모든 AI 응답)
 * 토큰 수: ~1,200
 * 재사용률: 매우 높음
 */
export const LEGAL_COMPLIANCE_GUIDE: CacheControlBlock = {
  type: 'text',
  text: `# 법률 준수 가이드라인

## 투자자문업 vs 교육 서비스

### HEPHAITOS의 법적 포지션
✅ 투자 **교육** 및 **도구** 제공
❌ 투자 **자문** 및 **일임** 서비스 아님

## 절대 금지 표현

### 1. 투자 권유 (자본시장법 위반)
- ❌ "~를 사세요"
- ❌ "~를 팔아야 합니다"
- ❌ "지금 매수하세요"
- ❌ "빨리 청산하세요"

### 2. 수익 보장 (허위 광고)
- ❌ "확실한 수익"
- ❌ "100% 성공"
- ❌ "무조건 수익"
- ❌ "손실 없는 전략"

### 3. 미래 예측 (불확실성 무시)
- ❌ "내일 오를 것입니다"
- ❌ "곧 급등합니다"
- ❌ "다음 주 반등 확실"

### 4. 구체적 종목 추천
- ❌ "삼성전자를 사세요"
- ❌ "NVDA가 좋습니다" (권유 맥락에서)

## 허용 표현

### 1. 교육적 설명
- ✅ "이 지표는 ~을 의미합니다"
- ✅ "과거 데이터에서는 ~한 패턴이 있었습니다"
- ✅ "~를 고려할 수 있습니다" (가능성)

### 2. 객관적 정보
- ✅ "Warren Buffett이 ~를 매수했습니다" (사실)
- ✅ "RSI가 30 이하입니다" (데이터)

### 3. 리스크 경고
- ✅ "손실 가능성이 있습니다"
- ✅ "과거 성과는 미래를 보장하지 않습니다"

## 면책조항 필수 포함

모든 AI 응답 끝에 추가:
"⚠️ 본 서비스는 투자 교육 및 도구 제공 목적이며, 투자 조언이 아닙니다. 모든 투자 결정은 본인 책임입니다."

## 위험 요소 명시적 경고

다음 경우 반드시 경고:
- 손절가 미설정: "⚠️ 손절가 없는 전략은 고위험입니다"
- 높은 레버리지: "⚠️ 레버리지 5배 이상은 매우 위험합니다"
- 큰 손절 폭: "⚠️ 손절 10% 초과는 고위험입니다"
- 단일 지표 의존: "⚠️ 2개 이상 지표 사용을 권장합니다"
- 높은 포지션: "⚠️ 분산 투자를 권장합니다"`,
  cache_control: { type: 'ephemeral' },
}

// ============================================
// Strategy Templates (Build 모드)
// ============================================

/**
 * 전략 생성 템플릿 라이브러리
 * 토큰 수: ~5,000
 * 재사용률: 높음 (전략 생성 시마다)
 */
export const STRATEGY_TEMPLATES_LIBRARY: CacheControlBlock = {
  type: 'text',
  text: `# 트레이딩 전략 템플릿 라이브러리

## 1. RSI Reversal 전략 (역발상)

### 개념
과매도 구간에서 매수, 과매수 구간에서 매도

### 진입 조건
- RSI(14) < 30 (과매도)
- 거래량 증가 (confirmation)

### 청산 조건
- RSI(14) > 70 (과매수)
- 손절: -5%
- 익절: +10%

### 리스크 관리
- 포지션 크기: 자산의 10%
- 최대 동시 포지션: 3개

### Python 코드
\`\`\`python
def rsi_reversal_strategy(data, capital):
    rsi = calculate_rsi(data['close'], period=14)
    volume_ma = data['volume'].rolling(20).mean()

    signals = []
    for i in range(len(data)):
        # 매수 신호
        if rsi[i] < 30 and data['volume'][i] > volume_ma[i]:
            signals.append({
                'type': 'buy',
                'price': data['close'][i],
                'size': capital * 0.1,
                'stop_loss': data['close'][i] * 0.95,
                'take_profit': data['close'][i] * 1.10
            })
        # 매도 신호
        elif rsi[i] > 70:
            signals.append({
                'type': 'sell',
                'price': data['close'][i]
            })

    return signals
\`\`\`

## 2. MACD Golden Cross 전략

### 개념
MACD가 Signal선을 상향 돌파 시 매수

### 진입 조건
- MACD > Signal (골든크로스)
- MACD Histogram > 0 (모멘텀 확인)

### 청산 조건
- MACD < Signal (데드크로스)
- 손절: -3%
- 익절: +8%

### Python 코드
\`\`\`python
def macd_golden_cross_strategy(data, capital):
    macd, signal, hist = calculate_macd(data['close'])

    signals = []
    for i in range(1, len(data)):
        # 골든크로스
        if macd[i-1] <= signal[i-1] and macd[i] > signal[i] and hist[i] > 0:
            signals.append({
                'type': 'buy',
                'price': data['close'][i],
                'size': capital * 0.15,
                'stop_loss': data['close'][i] * 0.97,
                'take_profit': data['close'][i] * 1.08
            })
        # 데드크로스
        elif macd[i-1] >= signal[i-1] and macd[i] < signal[i]:
            signals.append({'type': 'sell', 'price': data['close'][i]})

    return signals
\`\`\`

## 3. Bollinger Bands Mean Reversion 전략

### 개념
가격이 밴드 하단 접촉 시 매수 (평균 회귀)

### 진입 조건
- Close < Lower Band
- RSI < 40 (과매도 확인)

### 청산 조건
- Close > Middle Band (중심선 복귀)
- 손절: -4%
- 익절: 중심선 도달

### Python 코드
\`\`\`python
def bollinger_mean_reversion_strategy(data, capital):
    upper, middle, lower = calculate_bollinger_bands(data['close'], period=20, std=2)
    rsi = calculate_rsi(data['close'], period=14)

    signals = []
    for i in range(len(data)):
        # 하단 접촉 매수
        if data['close'][i] < lower[i] and rsi[i] < 40:
            signals.append({
                'type': 'buy',
                'price': data['close'][i],
                'size': capital * 0.12,
                'stop_loss': data['close'][i] * 0.96,
                'take_profit': middle[i]
            })
        # 중심선 복귀 매도
        elif data['close'][i] > middle[i]:
            signals.append({'type': 'sell', 'price': data['close'][i]})

    return signals
\`\`\`

## 4. Moving Average Crossover 전략 (추세 추종)

### 개념
단기 이평선이 장기 이평선을 돌파 시 추세 전환

### 진입 조건
- SMA(20) > SMA(50) (상승 추세)
- 거래량 > 평균 거래량

### 청산 조건
- SMA(20) < SMA(50) (하락 전환)
- 손절: -6%
- 익절: +15%

### Python 코드
\`\`\`python
def ma_crossover_strategy(data, capital):
    sma20 = data['close'].rolling(20).mean()
    sma50 = data['close'].rolling(50).mean()
    volume_ma = data['volume'].rolling(20).mean()

    signals = []
    for i in range(1, len(data)):
        # 골든크로스 + 거래량 확인
        if sma20[i-1] <= sma50[i-1] and sma20[i] > sma50[i] and data['volume'][i] > volume_ma[i]:
            signals.append({
                'type': 'buy',
                'price': data['close'][i],
                'size': capital * 0.20,
                'stop_loss': data['close'][i] * 0.94,
                'take_profit': data['close'][i] * 1.15
            })
        # 데드크로스
        elif sma20[i-1] >= sma50[i-1] and sma20[i] < sma50[i]:
            signals.append({'type': 'sell', 'price': data['close'][i]})

    return signals
\`\`\`

## 5. Breakout 전략 (돌파)

### 개념
가격이 저항선을 돌파 시 매수

### 진입 조건
- Close > 20일 최고가
- 거래량 > 평균 거래량 × 1.5

### 청산 조건
- Close < 20일 이평선
- 손절: -5%
- 익절: +12%

### Python 코드
\`\`\`python
def breakout_strategy(data, capital):
    high20 = data['high'].rolling(20).max()
    sma20 = data['close'].rolling(20).mean()
    volume_ma = data['volume'].rolling(20).mean()

    signals = []
    for i in range(len(data)):
        # 돌파 매수
        if data['close'][i] > high20[i-1] and data['volume'][i] > volume_ma[i] * 1.5:
            signals.append({
                'type': 'buy',
                'price': data['close'][i],
                'size': capital * 0.15,
                'stop_loss': data['close'][i] * 0.95,
                'take_profit': data['close'][i] * 1.12
            })
        # 이평선 이탈 매도
        elif data['close'][i] < sma20[i]:
            signals.append({'type': 'sell', 'price': data['close'][i]})

    return signals
\`\`\`

## 전략 선택 가이드

### 시장 환경별 추천
- **추세장 (Bull/Bear Market)**: MA Crossover, Breakout
- **횡보장 (Sideways)**: RSI Reversal, Bollinger Mean Reversion
- **변동성 큼**: MACD Golden Cross, Breakout
- **변동성 작음**: Mean Reversion 전략

### 리스크 성향별
- **보수적**: RSI Reversal (손절 5%, 익절 10%)
- **중립**: MACD, Bollinger (손절 3-4%, 익절 8%)
- **공격적**: Breakout (손절 5%, 익절 12-15%)

### 주의사항
⚠️ 모든 전략은 백테스트 필수
⚠️ 과최적화 주의 (과거에만 맞는 전략은 실패)
⚠️ 실전 전 Paper Trading으로 검증
⚠️ 리스크 관리 (손절) 없이는 절대 실전 금지`,
  cache_control: { type: 'ephemeral' },
}

// ============================================
// Utility Functions
// ============================================

/**
 * 시스템 프롬프트 배열 생성 (캐싱 적용)
 */
export function buildCachedSystemPrompt(
  mode: 'learn' | 'build' | 'analyze'
): CacheControlBlock[] {
  const base = [AI_MENTOR_SYSTEM_PROMPT, LEGAL_COMPLIANCE_GUIDE]

  switch (mode) {
    case 'learn':
      return [...base, TECHNICAL_INDICATORS_GUIDE]
    case 'build':
      return [...base, STRATEGY_TEMPLATES_LIBRARY]
    case 'analyze':
      return [...base, TECHNICAL_INDICATORS_GUIDE]
    default:
      return base
  }
}

/**
 * 캐시 통계를 위한 토큰 수 계산
 */
export function estimateCachedTokens(blocks: CacheControlBlock[]): number {
  // 대략적인 토큰 수 추정 (1 토큰 ≈ 4 글자)
  const totalChars = blocks.reduce((sum, block) => sum + block.text.length, 0)
  return Math.ceil(totalChars / 4)
}
