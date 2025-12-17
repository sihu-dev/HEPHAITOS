// ============================================
// Coaching API Route
// Loop 21: 멘토 코칭 정식 런칭
// DB 기반 실시간 멘토 코칭 시스템
// ============================================

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import {
  withApiMiddleware,
  createApiResponse,
  validateQueryParams,
  validateRequestBody,
} from '@/lib/api/middleware'
import { coachingQuerySchema, coachingActionSchema } from '@/lib/validations/coaching'
import { safeLogger } from '@/lib/utils/safe-logger'
import { spendCredits, InsufficientCreditsError, CREDIT_COSTS } from '@/lib/credits/spend-helper'

export const dynamic = 'force-dynamic'

// Service role client for DB operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================
// Specialties Config
// ============================================

const SPECIALTIES = [
  { id: 'stocks', label: '주식', icon: 'trending-up' },
  { id: 'options', label: '옵션', icon: 'layers' },
  { id: 'crypto', label: '암호화폐', icon: 'bitcoin' },
  { id: 'forex', label: '외환', icon: 'dollar-sign' },
  { id: 'futures', label: '선물', icon: 'bar-chart' },
  { id: 'quant', label: '퀀트', icon: 'cpu' },
  { id: 'technical', label: '기술적 분석', icon: 'activity' },
  { id: 'fundamental', label: '펀더멘털 분석', icon: 'file-text' },
  { id: 'risk', label: '리스크 관리', icon: 'shield' },
  { id: 'psychology', label: '트레이딩 심리', icon: 'brain' },
]

// ============================================
// GET Handler
// ============================================

export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'mentors'
    const mentorId = searchParams.get('mentorId')
    const sessionId = searchParams.get('sessionId')
    const specialty = searchParams.get('specialty')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    safeLogger.info('[Coaching API] GET request', { type, mentorId, specialty })

    try {
      switch (type) {
        case 'mentors': {
          // DB 기반 인기 멘토 목록
          const { data, error } = await supabaseAdmin.rpc('get_popular_mentors', {
            p_specialty: specialty || null,
            p_limit: limit,
            p_offset: offset,
          })

          if (error) {
            safeLogger.error('[Coaching API] get_popular_mentors failed', { error })
            throw error
          }

          return createApiResponse({
            type: 'mentors',
            mentors: data || [],
            pagination: { limit, offset },
          })
        }

        case 'mentor': {
          if (!mentorId) {
            return createApiResponse({ error: 'mentorId required' }, 400)
          }

          const { data: mentor, error: mentorError } = await supabaseAdmin
            .from('mentor_profiles')
            .select('*')
            .eq('user_id', mentorId)
            .eq('is_active', true)
            .single()

          if (mentorError || !mentor) {
            return createApiResponse({ error: 'Mentor not found' }, 404)
          }

          // 최근 리뷰
          const { data: reviews } = await supabaseAdmin
            .from('coaching_reviews')
            .select('*')
            .eq('mentor_id', mentorId)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(10)

          return createApiResponse({
            type: 'mentor',
            mentor,
            reviews: reviews || [],
          })
        }

        case 'availability': {
          if (!mentorId) {
            return createApiResponse({ error: 'mentorId required' }, 400)
          }

          let query = supabaseAdmin
            .from('mentor_availability')
            .select('*')
            .eq('mentor_id', mentorId)
            .eq('status', 'available')
            .gte('slot_date', startDate || new Date().toISOString().split('T')[0])
            .order('slot_date')
            .order('slot_start')

          if (endDate) {
            query = query.lte('slot_date', endDate)
          }

          const { data, error } = await query.limit(100)

          if (error) throw error

          // 날짜별 그룹화
          const grouped = (data || []).reduce((acc, slot) => {
            const date = slot.slot_date
            if (!acc[date]) acc[date] = []
            acc[date].push(slot)
            return acc
          }, {} as Record<string, typeof data>)

          return createApiResponse({
            type: 'availability',
            mentorId,
            slots: grouped,
          })
        }

        case 'session': {
          if (!sessionId) {
            return createApiResponse({ error: 'sessionId required' }, 400)
          }

          const { data, error } = await supabaseAdmin
            .from('coaching_sessions')
            .select(`
              *,
              mentor:mentor_profiles!mentor_id(
                display_name,
                title,
                avatar_url,
                specialties
              )
            `)
            .eq('id', sessionId)
            .single()

          if (error || !data) {
            return createApiResponse({ error: 'Session not found' }, 404)
          }

          return createApiResponse({
            type: 'session',
            session: data,
          })
        }

        case 'my_sessions': {
          const userId = searchParams.get('userId')
          const role = searchParams.get('role') || 'student'
          const status = searchParams.get('status')

          if (!userId) {
            return createApiResponse({ error: 'userId required' }, 400)
          }

          let query = supabaseAdmin
            .from('coaching_sessions')
            .select(`
              *,
              mentor:mentor_profiles!mentor_id(
                display_name,
                title,
                avatar_url
              )
            `)
            .order('scheduled_date', { ascending: true })
            .order('scheduled_start', { ascending: true })

          if (role === 'mentor') {
            query = query.eq('mentor_id', userId)
          } else {
            query = query.eq('student_id', userId)
          }

          if (status) {
            query = query.eq('status', status)
          }

          const { data, error } = await query.limit(limit).range(offset, offset + limit - 1)

          if (error) throw error

          return createApiResponse({
            type: 'my_sessions',
            sessions: data || [],
            role,
          })
        }

        case 'mentor_dashboard': {
          if (!mentorId) {
            return createApiResponse({ error: 'mentorId required' }, 400)
          }

          const { data, error } = await supabaseAdmin
            .from('mentor_dashboard_stats')
            .select('*')
            .eq('mentor_id', mentorId)
            .single()

          if (error) throw error

          return createApiResponse({
            type: 'mentor_dashboard',
            stats: data,
          })
        }

        case 'platform_stats': {
          const { data, error } = await supabaseAdmin
            .from('coaching_platform_stats')
            .select('*')
            .single()

          if (error) throw error

          return createApiResponse({
            type: 'platform_stats',
            stats: data,
          })
        }

        case 'reviews': {
          if (!mentorId) {
            return createApiResponse({ error: 'mentorId required' }, 400)
          }

          const { data, error } = await supabaseAdmin
            .from('coaching_reviews')
            .select('*')
            .eq('mentor_id', mentorId)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(limit)

          if (error) throw error

          return createApiResponse({
            type: 'reviews',
            reviews: data || [],
          })
        }

        case 'specialties': {
          return createApiResponse({
            type: 'specialties',
            specialties: SPECIALTIES,
          })
        }

        default:
          return createApiResponse({ error: 'Unknown type' }, 400)
      }
    } catch (error) {
      safeLogger.error('[Coaching API] GET error', { error })
      return createApiResponse({ error: 'Internal server error' }, 500)
    }
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

// ============================================
// POST Handler
// ============================================

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    // 사용자 인증
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createApiResponse(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = user.id

    let body
    try {
      body = await request.json()
    } catch {
      return createApiResponse({ error: 'Invalid request body' }, 400)
    }

    const { action } = body

    safeLogger.info('[Coaching API] POST request', { action, userId })

    try {
      switch (action) {
        case 'book_session': {
          const { mentorId, availabilityId, topic, questions } = body

          if (!mentorId || !availabilityId) {
            return createApiResponse(
              { error: 'mentorId and availabilityId required' },
              400
            )
          }

          // 크레딧 차감은 RPC 함수 내에서 처리
          const { data, error } = await supabaseAdmin.rpc('book_coaching_session', {
            p_student_id: userId,
            p_mentor_id: mentorId,
            p_availability_id: availabilityId,
            p_topic: topic || null,
            p_questions: questions || null,
          })

          if (error) throw error

          if (!data.success) {
            return createApiResponse({ error: data.error }, 400)
          }

          safeLogger.info('[Coaching API] Session booked', {
            sessionId: data.session_id,
            userId,
            mentorId,
          })

          return createApiResponse({
            success: true,
            action: 'book_session',
            result: data,
          })
        }

        case 'cancel_session': {
          const { sessionId, reason } = body

          if (!sessionId) {
            return createApiResponse({ error: 'sessionId required' }, 400)
          }

          const { data, error } = await supabaseAdmin.rpc('cancel_coaching_session', {
            p_session_id: sessionId,
            p_cancelled_by: userId,
            p_reason: reason || null,
          })

          if (error) throw error

          if (!data.success) {
            return createApiResponse({ error: data.error }, 400)
          }

          safeLogger.info('[Coaching API] Session cancelled', {
            sessionId,
            userId,
            refund: data.refund_amount,
          })

          return createApiResponse({
            success: true,
            action: 'cancel_session',
            result: data,
          })
        }

        case 'complete_session': {
          const { sessionId, actualDuration } = body

          if (!sessionId) {
            return createApiResponse({ error: 'sessionId required' }, 400)
          }

          const { data, error } = await supabaseAdmin.rpc('complete_coaching_session', {
            p_session_id: sessionId,
            p_actual_duration: actualDuration || null,
          })

          if (error) throw error

          if (!data.success) {
            return createApiResponse({ error: data.error }, 400)
          }

          return createApiResponse({
            success: true,
            action: 'complete_session',
            result: data,
          })
        }

        case 'start_session': {
          const { sessionId } = body

          if (!sessionId) {
            return createApiResponse({ error: 'sessionId required' }, 400)
          }

          const { error } = await supabaseAdmin
            .from('coaching_sessions')
            .update({
              status: 'in_progress',
              actual_start: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId)

          if (error) throw error

          return createApiResponse({
            success: true,
            action: 'start_session',
          })
        }

        case 'create_review': {
          const {
            sessionId,
            ratingOverall,
            ratingKnowledge,
            ratingCommunication,
            ratingHelpfulness,
            comment,
            highlights,
          } = body

          if (!sessionId || !ratingOverall) {
            return createApiResponse(
              { error: 'sessionId and ratingOverall required' },
              400
            )
          }

          const { data, error } = await supabaseAdmin.rpc('create_coaching_review', {
            p_session_id: sessionId,
            p_student_id: userId,
            p_rating_overall: ratingOverall,
            p_rating_knowledge: ratingKnowledge || null,
            p_rating_communication: ratingCommunication || null,
            p_rating_helpfulness: ratingHelpfulness || null,
            p_comment: comment || null,
            p_highlights: highlights || [],
          })

          if (error) throw error

          if (!data.success) {
            return createApiResponse({ error: data.error }, 400)
          }

          return createApiResponse({
            success: true,
            action: 'create_review',
            result: data,
          })
        }

        case 'add_note': {
          const { sessionId, content, isPrivate } = body

          if (!sessionId || !content) {
            return createApiResponse(
              { error: 'sessionId and content required' },
              400
            )
          }

          const { data, error } = await supabaseAdmin
            .from('session_notes')
            .insert({
              session_id: sessionId,
              author_id: userId,
              content,
              is_private: isPrivate || false,
            })
            .select()
            .single()

          if (error) throw error

          return createApiResponse({
            success: true,
            action: 'add_note',
            note: data,
          })
        }

        case 'generate_availability': {
          const { startDate, endDate } = body

          if (!startDate || !endDate) {
            return createApiResponse(
              { error: 'startDate and endDate required' },
              400
            )
          }

          const { data, error } = await supabaseAdmin.rpc('generate_mentor_availability', {
            p_mentor_id: userId,
            p_start_date: startDate,
            p_end_date: endDate,
          })

          if (error) throw error

          return createApiResponse({
            success: true,
            action: 'generate_availability',
            slots_created: data,
          })
        }

        case 'update_profile': {
          const {
            displayName,
            title,
            bio,
            specialties,
            experienceYears,
            hourlyRateCredits,
            sessionDuration,
            availableDays,
            availableHoursStart,
            availableHoursEnd,
          } = body

          const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          }

          if (displayName) updates.display_name = displayName
          if (title) updates.title = title
          if (bio !== undefined) updates.bio = bio
          if (specialties) updates.specialties = specialties
          if (experienceYears) updates.experience_years = experienceYears
          if (hourlyRateCredits) updates.hourly_rate_credits = hourlyRateCredits
          if (sessionDuration) updates.session_duration = sessionDuration
          if (availableDays) updates.available_days = availableDays
          if (availableHoursStart !== undefined) updates.available_hours_start = availableHoursStart
          if (availableHoursEnd !== undefined) updates.available_hours_end = availableHoursEnd

          const { error } = await supabaseAdmin
            .from('mentor_profiles')
            .upsert({
              user_id: userId,
              ...updates,
            })

          if (error) throw error

          return createApiResponse({
            success: true,
            action: 'update_profile',
          })
        }

        case 'apply_mentor': {
          const { displayName, title, bio, specialties, experienceYears, certifications } = body

          if (!displayName || !title) {
            return createApiResponse(
              { error: 'displayName and title required' },
              400
            )
          }

          const { data, error } = await supabaseAdmin
            .from('mentor_profiles')
            .insert({
              user_id: userId,
              display_name: displayName,
              title,
              bio,
              specialties: specialties || [],
              experience_years: experienceYears,
              certifications: certifications || [],
              verification_status: 'pending',
              is_active: false,
            })
            .select()
            .single()

          if (error) throw error

          safeLogger.info('[Coaching API] Mentor application submitted', {
            userId,
            displayName,
          })

          return createApiResponse({
            success: true,
            action: 'apply_mentor',
            profile: data,
          })
        }

        // Legacy actions (backward compatibility)
        case 'join': {
          const { sessionId } = body

          safeLogger.info('[Coaching API] Legacy join action', { sessionId, userId })

          try {
            await spendCredits({
              userId,
              feature: 'realtime_alert_1d',
              amount: 5,
              metadata: { action: 'join', sessionId },
            })
          } catch (error) {
            if (error instanceof InsufficientCreditsError) {
              return createApiResponse(
                {
                  error: 'INSUFFICIENT_CREDITS',
                  message: '크레딧이 부족합니다',
                  required: error.required,
                  current: error.current,
                },
                402
              )
            }
            throw error
          }

          return createApiResponse({
            message: '세션에 참여했습니다',
            streamUrl: `wss://coaching.hephaitos.com/stream/${sessionId}`,
          })
        }

        case 'book': {
          const { mentorId, scheduledAt, duration } = body
          const bookingDuration = duration || 60

          safeLogger.info('[Coaching API] Legacy book action', { mentorId, userId, duration: bookingDuration })

          const creditAmount = bookingDuration <= 30 ? CREDIT_COSTS.live_coaching_30m : CREDIT_COSTS.live_coaching_60m
          const creditFeature = bookingDuration <= 30 ? 'live_coaching_30m' : 'live_coaching_60m'

          try {
            await spendCredits({
              userId,
              feature: creditFeature,
              amount: creditAmount,
              metadata: { action: 'book', mentorId, duration: bookingDuration, scheduledAt },
            })
          } catch (error) {
            if (error instanceof InsufficientCreditsError) {
              return createApiResponse(
                {
                  error: 'INSUFFICIENT_CREDITS',
                  message: '크레딧이 부족합니다',
                  required: error.required,
                  current: error.current,
                },
                402
              )
            }
            throw error
          }

          const booking = {
            id: `booking_${Date.now()}`,
            mentorId,
            userId,
            scheduledAt: scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            duration: bookingDuration,
            status: 'confirmed',
          }

          return createApiResponse({
            message: '예약이 완료되었습니다',
            booking,
          })
        }

        default:
          return createApiResponse({ error: 'Unknown action' }, 400)
      }
    } catch (error) {
      safeLogger.error('[Coaching API] POST error', { error, action })
      return createApiResponse({ error: 'Internal server error' }, 500)
    }
  },
  {
    rateLimit: { category: 'ai' },
    errorHandler: { logErrors: true },
  }
)
