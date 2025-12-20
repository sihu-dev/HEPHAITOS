// ============================================
// Enhanced Refund Management API
// Loop 14: 환불 정책 고도화
// P0 FIX: Admin 인증 추가
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger'
import { requireAdminAuth, createErrorResponse } from '@/lib/api/middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RefundRequest {
  id: string
  user_id: string
  order_id: string
  reason: string
  credits_used: number
  credits_total: number
  usage_rate: number
  refund_amount: number
  refund_rate: number
  days_since_purchase: number
  policy_rule: string
  auto_approved: boolean
  abuse_flag: boolean
  abuse_score: number
  status: string
  admin_note?: string
  created_at: string
  reviewed_at?: string
}

/**
 * GET /api/admin/refunds
 * 환불 요청 목록 및 통계 조회
 */
export async function GET(request: NextRequest) {
  // P0 FIX: Admin 인증 필수
  const authResult = await requireAdminAuth(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'list'
    const status = searchParams.get('status')
    const days = parseInt(searchParams.get('days') || '30', 10)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    if (type === 'stats') {
      // 통계 조회
      const { data, error } = await supabase
        .from('refund_stats_v2')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) {
        safeLogger.error('[Refund API] Stats query error', { error })
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
      }

      // 요약 계산
      const summary = {
        total_requests: data?.reduce((sum, d) => sum + (d.total_requests || 0), 0) || 0,
        total_approved: data?.reduce((sum, d) => sum + (d.approved || 0), 0) || 0,
        total_refunded: data?.reduce((sum, d) => sum + (d.total_refunded || 0), 0) || 0,
        avg_refund_rate: data?.length
          ? data.reduce((sum, d) => sum + (d.avg_refund_rate || 0), 0) / data.length
          : 0,
        abuse_flagged: data?.reduce((sum, d) => sum + (d.abuse_flagged || 0), 0) || 0,
      }

      return NextResponse.json({
        type: 'stats',
        period_days: days,
        data: data || [],
        summary,
      })
    }

    if (type === 'policies') {
      // 정책 규칙 조회
      const { data, error } = await supabase
        .from('refund_policy_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (error) {
        safeLogger.error('[Refund API] Policies query error', { error })
        return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'policies',
        data: data || [],
      })
    }

    if (type === 'abuse') {
      // 어뷰징 의심 사용자 조회
      const { data, error } = await supabase
        .from('refund_abuse_candidates')
        .select('*')
        .limit(50)

      if (error) {
        safeLogger.error('[Refund API] Abuse query error', { error })
        return NextResponse.json({ error: 'Failed to fetch abuse data' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'abuse',
        data: data || [],
      })
    }

    // 기본: 환불 요청 목록
    let query = supabase
      .from('refund_requests')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      safeLogger.error('[Refund API] List query error', { error })
      return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 })
    }

    // 상태별 카운트
    const statusCounts = {
      pending: data?.filter(r => r.status === 'pending').length || 0,
      approved: data?.filter(r => r.status === 'approved').length || 0,
      rejected: data?.filter(r => r.status === 'rejected').length || 0,
      completed: data?.filter(r => r.status === 'completed').length || 0,
    }

    return NextResponse.json({
      type: 'list',
      data: data || [],
      counts: statusCounts,
      total: data?.length || 0,
    })

  } catch (error) {
    safeLogger.error('[Refund API] Unexpected error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/refunds
 * 환불 요청 처리 (승인/거절/완료)
 */
export async function POST(request: NextRequest) {
  // P0 FIX: Admin 인증 필수
  const authResult = await requireAdminAuth(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const body = await request.json()
    const { action, requestId, adminNote } = body

    if (!requestId) {
      return NextResponse.json({ error: 'requestId required' }, { status: 400 })
    }

    // 환불 요청 조회
    const { data: refundRequest, error: fetchError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !refundRequest) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // 승인
      const { error } = await supabase
        .from('refund_requests')
        .update({
          status: 'approved',
          admin_note: adminNote,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) {
        return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        status: 'approved',
        message: '환불 요청이 승인되었습니다.',
      })
    }

    if (action === 'reject') {
      // 거절
      const { reason } = body

      const { error } = await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          admin_note: adminNote || reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) {
        return NextResponse.json({ error: 'Failed to reject' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        status: 'rejected',
        message: '환불 요청이 거절되었습니다.',
      })
    }

    if (action === 'complete') {
      // 완료 처리 (실제 환불 실행)
      const { error: processError } = await supabase.rpc('process_refund', {
        p_order_id: refundRequest.order_id,
        p_user_id: refundRequest.user_id,
        p_unused_credits: refundRequest.credits_total - refundRequest.credits_used,
        p_refund_amount: refundRequest.refund_amount,
        p_reason: refundRequest.reason,
        p_toss_response: { processed_at: new Date().toISOString() },
      })

      if (processError) {
        safeLogger.error('[Refund API] Process refund error', { error: processError })
        return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
      }

      // 요청 상태 업데이트
      await supabase
        .from('refund_requests')
        .update({
          status: 'completed',
          admin_note: adminNote,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      return NextResponse.json({
        success: true,
        status: 'completed',
        refund_amount: refundRequest.refund_amount,
        message: `${refundRequest.refund_amount.toLocaleString()}원 환불이 완료되었습니다.`,
      })
    }

    if (action === 'calculate') {
      // 환불액 계산
      const { orderId, userId } = body

      const { data, error } = await supabase.rpc('calculate_refund_v2', {
        p_order_id: orderId,
        p_user_id: userId,
      })

      if (error) {
        return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        calculation: data,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    safeLogger.error('[Refund API] Post error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
