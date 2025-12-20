// ============================================
// Report API Route
// 시장 분석 리포트 생성
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { aiReportGenerator } from '@/lib/ai'
import {
  withApiMiddleware,
  createApiResponse,
  validateQueryParams,
  validateRequestBody,
} from '@/lib/api/middleware'
import { aiReportQuerySchema, generateReportSchema } from '@/lib/validations/ai'
import { safeLogger } from '@/lib/utils/safe-logger'
import { ensureDisclaimer } from '@/lib/safety/safety-net-v2'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/report
 * Generate daily market report
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = validateQueryParams(request, aiReportQuerySchema)
    if ('error' in validation) return validation.error

    const { mentorId, focusSectors } = validation.data
    const sectors = focusSectors?.split(',')

    safeLogger.info('[Report API] Generating daily report', { mentorId, sectors })

    const report = await aiReportGenerator.generateDailyReport({
      mentorId,
      focusSectors: sectors,
    })

    // P0-4 FIX: AI 응답 면책조항 강제 삽입
    if (report && typeof report === 'object') {
      if ('summary' in report && typeof report.summary === 'string') {
        report.summary = ensureDisclaimer(report.summary, { short: true })
      }
      if ('analysis' in report && typeof report.analysis === 'string') {
        report.analysis = ensureDisclaimer(report.analysis, { short: true })
      }
    }

    safeLogger.info('[Report API] Report generated')

    return createApiResponse({ report })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/ai/report
 * Generate custom report with specific parameters
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, generateReportSchema)
    if ('error' in validation) return validation.error

    const { mentorId, customPrompt, focusSectors, minConfidence } = validation.data

    safeLogger.info('[Report API] Generating custom report', {
      mentorId,
      hasCustomPrompt: !!customPrompt,
      sectors: focusSectors,
    })

    const report = await aiReportGenerator.generateDailyReport({
      mentorId,
      customPrompt,
      focusSectors,
      minConfidence,
    })

    // P0-4 FIX: AI 응답 면책조항 강제 삽입
    if (report && typeof report === 'object') {
      if ('summary' in report && typeof report.summary === 'string') {
        report.summary = ensureDisclaimer(report.summary, { short: true })
      }
      if ('analysis' in report && typeof report.analysis === 'string') {
        report.analysis = ensureDisclaimer(report.analysis, { short: true })
      }
    }

    safeLogger.info('[Report API] Custom report generated')

    return createApiResponse({ report })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
