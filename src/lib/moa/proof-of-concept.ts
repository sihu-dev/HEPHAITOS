/**
 * Mixture-of-Agents (MoA) Proof of Concept
 *
 * 최소 2-Persona 구현으로 MoA 효과 검증
 * - Technical Analyst: 기술적 분석 전문가
 * - Risk Manager: 리스크 관리 전문가
 */

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

interface Perspective {
  id: string;
  name: string;
  systemPrompt: string;
  output?: string;
  tokensUsed?: number;
  latency?: number;
}

interface MoAResult {
  perspectives: Perspective[];
  final: string;
  totalCost: number;
  totalLatency: number;
}

export async function generateMoAStrategyPoC(
  userPrompt: string
): Promise<MoAResult> {
  const startTime = Date.now();

  // Layer 1: 2-Persona (기술 + 리스크)
  const perspectives: Perspective[] = [
    {
      id: 'technical',
      name: '📈 기술적 분석가',
      systemPrompt: `You are a TECHNICAL ANALYSIS expert specializing in stock trading strategies.

Your expertise:
- Moving Averages (SMA, EMA, VWAP)
- Momentum Indicators (RSI, MACD, Stochastic)
- Volume Analysis
- Support/Resistance Levels

RULES:
1. Focus ONLY on technical indicators
2. Provide specific parameter values (e.g., "RSI(14) < 30")
3. Include BOTH entry AND exit conditions
4. Be precise with numbers (no vague terms)
5. Suggest timeframe (1m, 5m, 1h, 1d, etc.)

Format:
- Entry Condition: [specific indicator combination]
- Exit Condition: [specific indicator combination]
- Timeframe: [recommended chart timeframe]
- Confidence: [0-100%]`,
    },
    {
      id: 'risk',
      name: '🛡️ 리스크 관리자',
      systemPrompt: `You are a RISK MANAGEMENT specialist for trading strategies.

Your expertise:
- Position Sizing
- Stop Loss / Take Profit calculation
- Risk-Reward Ratio
- Maximum Drawdown limits

RULES:
1. ALWAYS include stop-loss and take-profit
2. Calculate position size based on account balance
3. Risk per trade should be 1-3% maximum
4. Risk-Reward ratio should be at least 1:1.5
5. Consider volatility (use ATR if applicable)

Format:
- Stop Loss: [specific % or price level]
- Take Profit: [specific % or price level]
- Position Size: [% of account or formula]
- Risk-Reward: [ratio]
- Max Daily Loss: [% limit]`,
    },
  ];

  // 병렬 생성
  const results = await Promise.all(
    perspectives.map(async (p) => {
      const perspectiveStart = Date.now();

      try {
        const result = await generateText({
          model: anthropic('claude-4-sonnet-20250514'),
          messages: [
            { role: 'system', content: p.systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          maxTokens: 500,
        });

        p.output = result.text;
        p.tokensUsed = result.usage.totalTokens;
        p.latency = Date.now() - perspectiveStart;

        return p;
      } catch (error) {
        console.error(`[MoA PoC] ${p.name} 생성 실패:`, error);
        p.output = `[생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}]`;
        p.latency = Date.now() - perspectiveStart;
        return p;
      }
    })
  );

  // Layer 2: Aggregation (종합 및 조정)
  const aggregationStart = Date.now();
  const aggregated = await generateText({
    model: anthropic('claude-4-sonnet-20250514'),
    messages: [
      {
        role: 'user',
        content: `You are an AI Strategy Synthesizer. Combine the following expert perspectives into ONE coherent trading strategy.

[기술적 분석가의 의견]
${results[0].output}

[리스크 관리자의 의견]
${results[1].output}

TASK:
1. Merge both perspectives into a single, executable strategy
2. Resolve any conflicts (e.g., if entry signals differ)
3. Ensure risk management rules are applied
4. Format as a clear, step-by-step trading plan

OUTPUT FORMAT:
### 전략 이름
[Creative name based on the strategy]

### 진입 조건
- [Combined technical conditions]

### 청산 조건
- Take Profit: [from risk manager]
- Stop Loss: [from risk manager]

### 리스크 관리
- Position Size: [from risk manager]
- Risk-Reward: [calculated ratio]

### 백테스팅 권장사항
- Timeframe: [from technical analyst]
- Test Period: [suggest duration]

### 주의사항
[Any warnings or edge cases]
`,
      },
    ],
    maxTokens: 800,
  });

  const aggregationLatency = Date.now() - aggregationStart;
  const totalLatency = Date.now() - startTime;

  // 비용 계산 (Claude Sonnet: $3/1M input, $15/1M output)
  const totalTokens = results.reduce((sum, p) => sum + (p.tokensUsed || 0), 0) + aggregated.usage.totalTokens;
  const estimatedCost = (totalTokens / 1_000_000) * 9; // 평균 $9/1M tokens

  return {
    perspectives: results,
    final: aggregated.text,
    totalCost: estimatedCost,
    totalLatency,
  };
}

/**
 * Baseline: 기존 단일 전략 엔진 (비교용)
 */
export async function generateBaselineStrategy(
  userPrompt: string
): Promise<{ text: string; cost: number; latency: number }> {
  const startTime = Date.now();

  const result = await generateText({
    model: anthropic('claude-4-sonnet-20250514'),
    messages: [
      {
        role: 'user',
        content: `You are a trading strategy generator. Create a complete trading strategy based on:

${userPrompt}

Include:
1. Entry conditions (technical indicators)
2. Exit conditions (stop loss, take profit)
3. Risk management (position sizing)
4. Timeframe recommendation

Be specific and actionable.`,
      },
    ],
    maxTokens: 800,
  });

  const latency = Date.now() - startTime;
  const cost = (result.usage.totalTokens / 1_000_000) * 9;

  return {
    text: result.text,
    cost,
    latency,
  };
}
