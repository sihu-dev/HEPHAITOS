// ============================================
// Strategy Generation API
// POST: 시스템으로 전략 생성
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'

const generateStrategySchema = z.object({
  prompt: z.string().min(10).max(1000),
  type: z.enum(['momentum', 'value', 'trend', 'custom']).optional(),
})

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, generateStrategySchema)
    if ('error' in validation) return validation.error

    const { prompt, type } = validation.data

    safeLogger.info('[Generate Strategy API] Generating strategy', { prompt, type })

    // TODO: 실제 전략 생성 로직 구현
    // 현재는 플레이스홀더 응답
    const strategy = {
      id: 'demo-strategy',
      name: '생성된 전략',
      description: prompt,
      rules: [],
      status: 'draft',
    }

    safeLogger.info('[Generate Strategy API] Strategy generated', { strategyId: strategy.id })

    return createApiResponse({
      message: '전략 생성 기능 준비 중입니다',
      strategy,
    })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
