/**
 * Mixture-of-Agents (MoA) Full Engine
 *
 * 4-Persona Implementation:
 * - Technical Analyst (기술적 분석)
 * - Risk Manager (리스크 관리)
 * - Pattern Recognition (패턴 인식)
 * - Fundamental Analyst (펀더멘털 분석)
 *
 * Layer 1: 4개 Perspective 병렬 생성 (Open-source LLMs)
 * Layer 2: Claude Sonnet Aggregation
 * Layer 3: Safety Net Validation
 */

import { generateText, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { safeLogger } from '@/lib/utils/safe-logger';

// Together AI 모델 설정 (환경변수로 제어)
const USE_TOGETHER_AI = process.env.NEXT_PUBLIC_USE_TOGETHER_AI === 'true';
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

interface PerspectiveConfig {
  id: string;
  name: string;
  icon: string;
  systemPrompt: string;
  model: string; // 'claude' | 'together/llama' | 'together/mixtral' | 'together/qwen'
  costPerCall: number; // USD
}

interface PerspectiveOutput {
  perspectiveId: string;
  name: string;
  icon: string;
  output: string;
  tokensUsed: number;
  latency: number;
  confidence: number; // 0-100
  model: string;
}

interface MoAEngineResult {
  tier: 'draft' | 'refined' | 'comprehensive';
  perspectives: PerspectiveOutput[];
  aggregated: string;
  validated: boolean;
  validationIssues?: string[];
  totalCost: number;
  totalLatency: number;
  metadata: {
    requestId: string;
    timestamp: string;
    userPrompt: string;
  };
}

/**
 * 4-Persona Configuration
 */
const PERSPECTIVES: PerspectiveConfig[] = [
  {
    id: 'technical',
    name: '기술적 분석가',
    icon: '📈',
    systemPrompt: `You are a TECHNICAL ANALYSIS expert specializing in algorithmic trading strategies.

Your expertise:
- Moving Averages: SMA, EMA, WMA, VWAP
- Momentum: RSI, MACD, Stochastic, CCI
- Volatility: Bollinger Bands, ATR, Keltner Channels
- Volume: OBV, VWAP, Volume Profile
- Trend: ADX, Parabolic SAR, Ichimoku Cloud

RULES:
1. Focus ONLY on quantifiable technical indicators
2. Provide EXACT parameter values (e.g., "RSI(14) < 30 AND MACD(12,26,9) crossover")
3. Include BOTH entry AND exit conditions
4. Specify timeframe (1m, 5m, 15m, 1h, 4h, 1d)
5. Provide confidence level (0-100%) based on historical win rate

OUTPUT FORMAT:
### Entry Signal
- Condition 1: [indicator + threshold]
- Condition 2: [indicator + threshold]
- Condition 3 (optional): [confirmation signal]

### Exit Signal
- Take Profit: [indicator-based or % target]
- Stop Loss: [indicator-based or % limit]

### Timeframe
- Recommended: [timeframe]
- Backtest Period: [duration]

### Confidence
- Win Rate (historical): [%]
- Confidence: [0-100]`,
    model: USE_TOGETHER_AI ? 'together/llama-3.1-70b' : 'claude',
    costPerCall: USE_TOGETHER_AI ? 0.0008 : 0.018,
  },
  {
    id: 'risk',
    name: '리스크 관리자',
    icon: '🛡️',
    systemPrompt: `You are a RISK MANAGEMENT specialist for institutional trading.

Your expertise:
- Position Sizing (Kelly Criterion, Fixed Fractional)
- Stop Loss / Take Profit optimization
- Risk-Reward Ratio analysis
- Maximum Drawdown limits
- Portfolio Heat management

RULES:
1. ALWAYS include stop-loss (maximum loss per trade: 2-3%)
2. ALWAYS include take-profit (minimum R:R ratio: 1.5:1)
3. Calculate position size based on account balance and volatility
4. Consider correlation risk (if multiple positions)
5. Set maximum daily loss limit (5% of account)

OUTPUT FORMAT:
### Position Sizing
- Formula: [Kelly / Fixed % / ATR-based]
- Recommended %: [% of account per trade]

### Stop Loss
- Method: [ATR / % / Support level]
- Value: [specific % or price]

### Take Profit
- Target 1: [% or price] (partial exit)
- Target 2: [% or price] (full exit)

### Risk Limits
- Risk per trade: [%]
- Max daily loss: [%]
- Risk-Reward: [ratio]

### Confidence
- Survival probability: [%]
- Max drawdown tolerance: [%]`,
    model: USE_TOGETHER_AI ? 'together/mixtral-8x7b' : 'claude',
    costPerCall: USE_TOGETHER_AI ? 0.0006 : 0.018,
  },
  {
    id: 'pattern',
    name: '패턴 인식 전문가',
    icon: '🔍',
    systemPrompt: `You are a PATTERN RECOGNITION expert for chart analysis.

Your expertise:
- Candlestick Patterns: Hammer, Doji, Engulfing, Morning Star, etc.
- Chart Patterns: Head & Shoulders, Double Top/Bottom, Triangles, Flags
- Price Action: Support/Resistance, Trendlines, Channels
- Volume Patterns: Climax volume, Volume divergence

RULES:
1. Identify specific patterns that trigger the strategy
2. Provide visual description (for manual verification)
3. Include confirmation signals (volume, breakout, etc.)
4. Specify pattern timeframe and reliability
5. List false signal filters

OUTPUT FORMAT:
### Primary Pattern
- Pattern: [name and description]
- Confirmation: [volume / breakout / retest]
- Reliability: [high / medium / low]

### Entry Trigger
- Pattern completion: [specific candle formation]
- Volume requirement: [above/below average by X%]
- Price action: [breakout / retest / rejection]

### Invalidation
- Pattern fails if: [specific condition]

### Confidence
- Pattern success rate: [%]
- Timeframe: [best suited for this pattern]`,
    model: USE_TOGETHER_AI ? 'together/qwen-2.5-72b' : 'claude',
    costPerCall: USE_TOGETHER_AI ? 0.0005 : 0.018,
  },
  {
    id: 'fundamental',
    name: '펀더멘털 분석가',
    icon: '💼',
    systemPrompt: `You are a FUNDAMENTAL ANALYSIS expert for stock valuation.

Your expertise:
- Financial Ratios: P/E, P/B, PEG, ROE, ROA, Debt/Equity
- Growth Metrics: Revenue growth, EPS growth, Free Cash Flow
- Valuation Models: DCF, Comparables, Graham Formula
- Quality Indicators: Profit margin, Current ratio, Quick ratio

RULES:
1. Focus on quantifiable financial metrics
2. Provide specific thresholds (e.g., "P/E < 15 AND ROE > 15%")
3. Consider sector averages for comparison
4. Include growth trajectory (YoY, QoQ)
5. Flag accounting red flags (high debt, negative cash flow)

OUTPUT FORMAT:
### Valuation Criteria
- P/E Ratio: [target range]
- P/B Ratio: [target range]
- PEG Ratio: [< 1 is ideal]

### Quality Filters
- ROE: [minimum %]
- Debt/Equity: [maximum ratio]
- Current Ratio: [minimum value]

### Growth Requirements
- Revenue Growth (YoY): [minimum %]
- EPS Growth (YoY): [minimum %]
- Free Cash Flow: [positive / negative]

### Fair Value Estimation
- DCF Target Price: [estimated range]
- Margin of Safety: [%]

### Confidence
- Valuation confidence: [%]
- Time horizon: [short / medium / long term]`,
    model: USE_TOGETHER_AI ? 'together/llama-3.1-70b' : 'claude',
    costPerCall: USE_TOGETHER_AI ? 0.0008 : 0.018,
  },
];

/**
 * MoA Engine Class
 */
export class MoAEngine {
  private requestId: string;

  constructor() {
    this.requestId = `moa_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Layer 1: Generate Perspectives (병렬 실행)
   */
  private async generatePerspectives(
    userPrompt: string,
    tier: 'draft' | 'refined' | 'comprehensive'
  ): Promise<PerspectiveOutput[]> {
    // Tier에 따라 사용할 Perspective 결정
    const perspectivesToUse =
      tier === 'draft'
        ? [PERSPECTIVES[0]] // Technical만
        : tier === 'refined'
          ? PERSPECTIVES.slice(0, 2) // Technical + Risk
          : PERSPECTIVES; // 전체 4개

    const results = await Promise.all(
      perspectivesToUse.map(async (config) => {
        const startTime = Date.now();

        try {
          // Together AI 또는 Claude 선택
          const result = await this.callLLM(config, userPrompt);

          return {
            perspectiveId: config.id,
            name: config.name,
            icon: config.icon,
            output: result.text,
            tokensUsed: result.tokensUsed,
            latency: Date.now() - startTime,
            confidence: this.calculateConfidence(result.text),
            model: config.model,
          };
        } catch (error) {
          safeLogger.error(`[MoA] ${config.name} 생성 실패:`, error);
          return {
            perspectiveId: config.id,
            name: config.name,
            icon: config.icon,
            output: `[생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}]`,
            tokensUsed: 0,
            latency: Date.now() - startTime,
            confidence: 0,
            model: config.model,
          };
        }
      })
    );

    return results;
  }

  /**
   * LLM 호출 (Together AI 또는 Claude)
   */
  private async callLLM(
    config: PerspectiveConfig,
    userPrompt: string
  ): Promise<{ text: string; tokensUsed: number }> {
    if (config.model.startsWith('together/')) {
      // Together AI 호출 (향후 구현)
      // 현재는 Claude로 fallback
      return this.callClaude(config, userPrompt);
    } else {
      return this.callClaude(config, userPrompt);
    }
  }

  /**
   * Claude API 호출
   */
  private async callClaude(
    config: PerspectiveConfig,
    userPrompt: string
  ): Promise<{ text: string; tokensUsed: number }> {
    const result = await generateText({
      model: anthropic('claude-4-sonnet-20250514'),
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return {
      text: result.text,
      tokensUsed: result.usage?.totalTokens ?? 0,
    };
  }

  /**
   * Layer 2: Aggregate and Refine
   */
  private async aggregateAndRefine(
    perspectives: PerspectiveOutput[],
    userPrompt: string
  ): Promise<{ text: string; tokensUsed: number }> {
    const perspectiveSummary = perspectives
      .map(
        (p) => `
### ${p.icon} ${p.name} (신뢰도: ${p.confidence}%)
${p.output}
`
      )
      .join('\n');

    const result = await generateText({
      model: anthropic('claude-4-sonnet-20250514'),
      messages: [
        {
          role: 'user',
          content: `You are an AI Strategy Synthesizer. You will receive inputs from multiple expert perspectives and must create ONE unified, executable trading strategy.

[원본 사용자 요청]
${userPrompt}

[전문가 의견]
${perspectiveSummary}

TASK:
1. Synthesize all perspectives into a coherent strategy
2. Resolve conflicts (if entry/exit signals differ, choose the most conservative)
3. Ensure all risk management rules are applied
4. Create a clear, step-by-step execution plan

OUTPUT FORMAT (Korean):
# 전략 이름
[Creative name reflecting the strategy essence]

## 📊 전략 개요
[1-2 sentence summary]

## 🎯 진입 조건
- 조건 1: [specific indicator/pattern]
- 조건 2: [confirmation signal]
- 타이밍: [timeframe and exact trigger]

## 🚪 청산 조건
### Take Profit
- 목표 1: [% or price] (부분 익절)
- 목표 2: [% or price] (전체 익절)

### Stop Loss
- 손절가: [% or price]
- 트레일링 스탑: [optional, if applicable]

## 💰 리스크 관리
- 포지션 크기: [% of account]
- 리스크/보상 비율: [1:X]
- 최대 일일 손실: [%]

## 📈 백테스팅 권장사항
- 타임프레임: [1m/5m/1h/1d]
- 테스트 기간: [최소 권장 기간]
- 예상 승률: [%]

## ⚠️ 주의사항
- [중요한 리스크나 엣지케이스]
- [이 전략이 실패할 수 있는 시장 상황]

## 🔍 종합 평가
- 종합 신뢰도: [0-100%]
- 적합한 트레이더: [초보/중급/고급]
- 권장 자본: [최소 금액]

---
**면책조항**: 본 전략은 교육 목적이며 투자 조언이 아닙니다. 모든 투자 결정은 본인의 책임입니다.`,
        },
      ],
    });

    return {
      text: result.text,
      tokensUsed: result.usage?.totalTokens ?? 0,
    };
  }

  /**
   * Layer 3: Safety Net Validation
   */
  private async validateStrategy(aggregatedStrategy: string): Promise<{
    validated: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // 필수 요소 체크
    const requiredElements = [
      { keyword: '진입 조건', label: '진입 조건' },
      { keyword: 'Take Profit', label: 'Take Profit' },
      { keyword: 'Stop Loss', label: 'Stop Loss' },
      { keyword: '리스크', label: '리스크 관리' },
    ];

    for (const element of requiredElements) {
      if (!aggregatedStrategy.includes(element.keyword)) {
        issues.push(`필수 요소 누락: ${element.label}`);
      }
    }

    // 투자 조언 금지 표현 체크
    const forbiddenPhrases = [
      '수익 보장',
      '확실한 수익',
      '반드시',
      '틀림없이',
      '~하세요',
      '추천합니다',
      '사세요',
      '파세요',
    ];

    for (const phrase of forbiddenPhrases) {
      if (aggregatedStrategy.includes(phrase)) {
        issues.push(`금지 표현 포함: "${phrase}"`);
      }
    }

    // 면책조항 체크
    if (!aggregatedStrategy.includes('면책조항') && !aggregatedStrategy.includes('투자 조언이 아닙니다')) {
      issues.push('면책조항 누락');
    }

    return {
      validated: issues.length === 0,
      issues,
    };
  }

  /**
   * Confidence 계산 (출력 텍스트 기반)
   */
  private calculateConfidence(output: string): number {
    // 간단한 휴리스틱: 구체적인 숫자/조건이 많을수록 높은 신뢰도
    const numberMatches = output.match(/\d+\.?\d*%?/g) || [];
    const conditionMatches = output.match(/(if|when|AND|OR|>|<|>=|<=)/gi) || [];

    const score = Math.min(
      100,
      30 + numberMatches.length * 5 + conditionMatches.length * 3
    );

    return Math.round(score);
  }

  /**
   * 비용 계산
   */
  private calculateTotalCost(
    perspectives: PerspectiveOutput[],
    aggregationTokens: number
  ): number {
    const perspectiveCost = perspectives.reduce((sum, p) => {
      const config = PERSPECTIVES.find((c) => c.id === p.perspectiveId);
      return sum + (config?.costPerCall || 0.018);
    }, 0);

    // Aggregation 비용 (Claude Sonnet: $3 input + $15 output per 1M tokens)
    const aggregationCost = (aggregationTokens / 1_000_000) * 9; // 평균 $9

    return perspectiveCost + aggregationCost;
  }

  /**
   * Main Entry Point
   */
  async generateStrategy(
    userPrompt: string,
    tier: 'draft' | 'refined' | 'comprehensive' = 'refined'
  ): Promise<MoAEngineResult> {
    const startTime = Date.now();

    // Layer 1: Perspectives
    const perspectives = await this.generatePerspectives(userPrompt, tier);

    // Layer 2: Aggregation
    const aggregated = await this.aggregateAndRefine(perspectives, userPrompt);

    // Layer 3: Validation
    const validation = await this.validateStrategy(aggregated.text);

    // 비용 계산
    const totalCost = this.calculateTotalCost(perspectives, aggregated.tokensUsed);
    const totalLatency = Date.now() - startTime;

    return {
      tier,
      perspectives,
      aggregated: aggregated.text,
      validated: validation.validated,
      validationIssues: validation.issues,
      totalCost,
      totalLatency,
      metadata: {
        requestId: this.requestId,
        timestamp: new Date().toISOString(),
        userPrompt,
      },
    };
  }

  /**
   * Streaming version (for UI progressive loading)
   */
  async *generateStrategyStream(
    userPrompt: string,
    tier: 'draft' | 'refined' | 'comprehensive' = 'refined'
  ): AsyncGenerator<{
    type: 'perspective' | 'aggregation' | 'validation' | 'complete';
    data: any;
  }> {
    // Layer 1: Perspectives (순차적으로 스트리밍)
    const perspectivesToUse =
      tier === 'draft'
        ? [PERSPECTIVES[0]]
        : tier === 'refined'
          ? PERSPECTIVES.slice(0, 2)
          : PERSPECTIVES;

    const perspectives: PerspectiveOutput[] = [];

    for (const config of perspectivesToUse) {
      const startTime = Date.now();
      const result = await this.callLLM(config, userPrompt);

      const output: PerspectiveOutput = {
        perspectiveId: config.id,
        name: config.name,
        icon: config.icon,
        output: result.text,
        tokensUsed: result.tokensUsed,
        latency: Date.now() - startTime,
        confidence: this.calculateConfidence(result.text),
        model: config.model,
      };

      perspectives.push(output);

      yield {
        type: 'perspective',
        data: output,
      };
    }

    // Layer 2: Aggregation
    yield {
      type: 'aggregation',
      data: { status: 'started' },
    };

    const aggregated = await this.aggregateAndRefine(perspectives, userPrompt);

    yield {
      type: 'aggregation',
      data: { text: aggregated.text, tokensUsed: aggregated.tokensUsed },
    };

    // Layer 3: Validation
    const validation = await this.validateStrategy(aggregated.text);

    yield {
      type: 'validation',
      data: validation,
    };

    // Complete
    yield {
      type: 'complete',
      data: {
        totalCost: this.calculateTotalCost(perspectives, aggregated.tokensUsed),
        totalLatency: Date.now(),
      },
    };
  }
}
