// ============================================
// Trade Analysis API (Streaming)
// 셀럽 거래 '왜?' 분석 - Server-Sent Events
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { validateRequestBody } from '@/lib/api/middleware'
import { tradeAnalysisSchema } from '@/lib/validations/ai'
import { safeLogger } from '@/lib/utils/safe-logger'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

// ============================================
// Types
// ============================================

interface TradeAnalysisRequest {
  celebrity: string
  ticker: string
  company: string
  action: 'buy' | 'sell'
  amount: string
  date: string
  currentPrice?: number
  recentNews?: string[]
  portfolioContext?: {
    previousHoldings?: number
    newHoldings?: number
    portfolioWeight?: number
  }
}

// ============================================
// Streaming Response Helper
// ============================================

function createStreamResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ============================================
// Analysis Prompt
// ============================================

const ANALYSIS_SYSTEM_PROMPT = `당신은 기관/유명인 투자 분석 전문가입니다.
객관적이고 교육적인 분석만 제공합니다.

⚠️ 중요 규칙:
1. 이것은 투자 조언이 아닙니다
2. 교육 목적의 분석만 제공합니다
3. 모든 투자 결정은 사용자 본인의 책임입니다
4. 과거 성과가 미래를 보장하지 않습니다

분석 스타일:
- 한국어로 작성
- 마크다운 형식 사용
- 이모지로 섹션 구분
- 간결하고 핵심적인 내용
- 객관적 사실 중심`

function buildAnalysisPrompt(data: TradeAnalysisRequest): string {
  const actionKr = data.action === 'buy' ? '매수' : '매도'
  const portfolioInfo = data.portfolioContext
    ? `\n포트폴리오 변화:
- 이전 보유: ${data.portfolioContext.previousHoldings?.toLocaleString() || 'N/A'}주
- 현재 보유: ${data.portfolioContext.newHoldings?.toLocaleString() || 'N/A'}주
- 포트폴리오 비중: ${data.portfolioContext.portfolioWeight?.toFixed(1) || 'N/A'}%`
    : ''

  return `다음 거래를 분석해주세요:

## 거래 정보
- **투자자**: ${data.celebrity}
- **종목**: ${data.company} (${data.ticker})
- **거래 유형**: ${actionKr}
- **거래 규모**: ${data.amount}
- **거래일**: ${data.date}
${data.currentPrice ? `- **현재가**: $${data.currentPrice.toLocaleString()}` : ''}
${portfolioInfo}

${data.recentNews?.length ? `## 관련 뉴스
${data.recentNews.map((n, i) => `${i + 1}. ${n}`).join('\n')}` : ''}

## 분석 요청
다음 섹션으로 분석해주세요:

### 🎯 거래 배경 추론
왜 이 시점에 이 종목을 ${actionKr}했을까요?

### 📰 시장 컨텍스트
관련된 시장 동향, 뉴스, 이벤트 연결

### 📊 투자자 스타일 분석
${data.celebrity}의 투자 철학과 패턴

### ⚠️ 리스크 요소
따라 투자 시 고려해야 할 위험 요소

### 💡 학습 포인트
이 거래에서 배울 수 있는 투자 인사이트

마지막에 반드시 면책조항을 포함하세요.`
}

// ============================================
// POST Handler - Streaming Analysis
// ============================================

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      safeLogger.error('[Trade Analysis API] API key not configured')
      return Response.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      )
    }

    const validation = await validateRequestBody(request, tradeAnalysisSchema)
    if ('error' in validation) return validation.error

    const body = validation.data

    safeLogger.info('[Trade Analysis API] Analyzing trade', {
      celebrity: body.celebrity,
      ticker: body.ticker,
      action: body.action,
    })

    // Create streaming request to Claude
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 2048,
        temperature: 0.7,
        stream: true,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildAnalysisPrompt(body),
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const error = await claudeResponse.json()
      return Response.json(
        { success: false, error: error.error?.message || 'Claude API error' },
        { status: claudeResponse.status }
      )
    }

    // Transform Claude's SSE stream to our format
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              continue
            }

            try {
              const parsed = JSON.parse(data)

              // Handle different event types
              if (parsed.type === 'content_block_delta') {
                const text = parsed.delta?.text
                if (text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
                  )
                }
              } else if (parsed.type === 'message_stop') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      },
    })

    const readableStream = claudeResponse.body?.pipeThrough(transformStream)

    if (!readableStream) {
      return Response.json(
        { success: false, error: 'Failed to create stream' },
        { status: 500 }
      )
    }

    safeLogger.info('[Trade Analysis API] Streaming analysis started')

    return createStreamResponse(readableStream)
  } catch (error) {
    safeLogger.error('[Trade Analysis API] Error', { error })
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// GET Handler - Non-streaming (fallback)
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const celebrity = searchParams.get('celebrity')
  const ticker = searchParams.get('ticker')

  if (!celebrity || !ticker) {
    return Response.json(
      {
        success: false,
        error: 'Missing celebrity or ticker parameter',
        usage: 'GET /api/ai/trade-analysis?celebrity=NAME&ticker=SYMBOL'
      },
      { status: 400 }
    )
  }

  // Return cached/mock analysis for GET requests
  return Response.json({
    success: true,
    data: {
      celebrity,
      ticker,
      cached: true,
      message: 'Use POST for real-time analysis',
      disclaimer: '⚠️ 이 정보는 교육 목적으로만 제공됩니다. 투자 조언이 아닙니다.',
    },
  })
}
