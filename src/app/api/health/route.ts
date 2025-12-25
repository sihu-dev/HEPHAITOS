// ============================================
// Health Check API
// GET: 서버 상태 확인
// ============================================

import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

async function GETHandler() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
