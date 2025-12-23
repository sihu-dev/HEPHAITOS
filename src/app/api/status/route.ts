// ============================================
// Status Page API
// Loop 18: Status Page 구축
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/status
 * 시스템 상태 조회 (Public)
 */
async function GETHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'

    if (type === 'overview') {
      // 전체 시스템 상태
      const { data, error } = await supabase.rpc('get_system_status')

      if (error) {
        safeLogger.error('[Status API] Overview query error', { error })
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'overview',
        ...data,
      })
    }

    if (type === 'services') {
      // 서비스 목록
      const { data, error } = await supabase
        .from('current_service_status')
        .select('*')

      if (error) {
        safeLogger.error('[Status API] Services query error', { error })
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'services',
        data: data || [],
      })
    }

    if (type === 'history') {
      // 상태 히스토리
      const serviceId = searchParams.get('service')
      const hours = parseInt(searchParams.get('hours') || '24', 10)

      let query = supabase
        .from('status_checks')
        .select('*')
        .gte('checked_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('checked_at', { ascending: false })
        .limit(500)

      if (serviceId) {
        query = query.eq('service_id', serviceId)
      }

      const { data, error } = await query

      if (error) {
        safeLogger.error('[Status API] History query error', { error })
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'history',
        data: data || [],
      })
    }

    if (type === 'uptime') {
      // Uptime 계산
      const serviceId = searchParams.get('service')
      const days = parseInt(searchParams.get('days') || '30', 10)

      if (!serviceId) {
        return NextResponse.json({ error: 'Service ID required' }, { status: 400 })
      }

      const { data, error } = await supabase.rpc('calculate_uptime', {
        p_service_id: serviceId,
        p_days: days,
      })

      if (error) {
        safeLogger.error('[Status API] Uptime query error', { error })
        return NextResponse.json({ error: 'Failed to calculate uptime' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'uptime',
        data,
      })
    }

    if (type === 'incidents') {
      // 인시던트 목록
      const status = searchParams.get('status')
      const days = parseInt(searchParams.get('days') || '30', 10)

      let query = supabase
        .from('status_incidents')
        .select(`
          *,
          status_incident_updates (*)
        `)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        safeLogger.error('[Status API] Incidents query error', { error })
        return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'incidents',
        data: data || [],
      })
    }

    if (type === 'maintenance') {
      // 유지보수 일정
      const { data, error } = await supabase
        .from('status_maintenance')
        .select('*')
        .in('status', ['scheduled', 'in_progress'])
        .gte('scheduled_end', new Date().toISOString())
        .order('scheduled_start', { ascending: true })

      if (error) {
        safeLogger.error('[Status API] Maintenance query error', { error })
        return NextResponse.json({ error: 'Failed to fetch maintenance' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'maintenance',
        data: data || [],
      })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  } catch (error) {
    safeLogger.error('[Status API] Unexpected error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/status
 * 상태 관리 (Admin only)
 */
async function POSTHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'record_check') {
      // 상태 체크 기록
      const { serviceId, status, latencyMs, message } = body

      const { data, error } = await supabase.rpc('record_service_status', {
        p_service_id: serviceId,
        p_status: status,
        p_latency_ms: latencyMs,
        p_message: message,
      })

      if (error) {
        safeLogger.error('[Status API] Record check error', { error })
        return NextResponse.json({ error: 'Failed to record check' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        check_id: data,
      })
    }

    if (action === 'create_incident') {
      // 인시던트 생성
      const { title, impact, affectedServices, message } = body

      const { data: incident, error: incidentError } = await supabase
        .from('status_incidents')
        .insert({
          title,
          status: 'investigating',
          impact: impact || 'minor',
          affected_services: affectedServices || [],
        })
        .select()
        .single()

      if (incidentError) {
        safeLogger.error('[Status API] Create incident error', { error: incidentError })
        return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 })
      }

      // 초기 업데이트 추가
      if (message) {
        await supabase.from('status_incident_updates').insert({
          incident_id: incident.id,
          status: 'investigating',
          message,
        })
      }

      return NextResponse.json({
        success: true,
        incident,
      })
    }

    if (action === 'update_incident') {
      // 인시던트 업데이트
      const { incidentId, status, message, userId } = body

      const { data, error } = await supabase.rpc('update_incident', {
        p_incident_id: incidentId,
        p_status: status,
        p_message: message,
        p_user_id: userId,
      })

      if (error) {
        safeLogger.error('[Status API] Update incident error', { error })
        return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        update_id: data,
      })
    }

    if (action === 'schedule_maintenance') {
      // 유지보수 예약
      const { title, description, affectedServices, scheduledStart, scheduledEnd } = body

      const { data, error } = await supabase
        .from('status_maintenance')
        .insert({
          title,
          description,
          affected_services: affectedServices || [],
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          status: 'scheduled',
        })
        .select()
        .single()

      if (error) {
        safeLogger.error('[Status API] Schedule maintenance error', { error })
        return NextResponse.json({ error: 'Failed to schedule maintenance' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        maintenance: data,
      })
    }

    if (action === 'subscribe') {
      // 상태 알림 구독
      const { email, webhookUrl, services, notifyOn } = body

      const verificationToken = crypto.randomUUID()

      const { data, error } = await supabase
        .from('status_subscribers')
        .upsert({
          email,
          webhook_url: webhookUrl,
          services: services || [],
          notify_on: notifyOn || ['major_outage', 'maintenance'],
          verification_token: verificationToken,
        }, {
          onConflict: 'email',
        })
        .select()
        .single()

      if (error) {
        safeLogger.error('[Status API] Subscribe error', { error })
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription created. Please verify your email.',
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    safeLogger.error('[Status API] Post error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
export const POST = withRateLimit(POSTHandler, { category: 'api' })
