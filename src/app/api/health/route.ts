// ============================================
// Health Check API
// GET: 서버 상태 확인
// ============================================

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
}
