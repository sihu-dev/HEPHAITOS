// ============================================
// Coaching API Route
// 라이브 코칭 세션 및 멘토 관리
// Zod Validation + Error Handling 표준화 적용
// P-1 CRITICAL: 크레딧 소비 통합
// GPT V1 피드백: 실제 사용자 인증 적용
// ============================================

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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

// ============================================
// Types
// ============================================

interface Mentor {
  id: string
  name: string
  nameKr: string
  title: string
  specialty: string[]
  rating: number
  students: number
  sessions: number
  hourlyRate: number
  isOnline: boolean
  nextAvailable?: Date
}

interface LiveSession {
  id: string
  mentorId: string
  title: string
  description: string
  startTime: Date
  duration: number
  participants: number
  maxParticipants: number
  topics: string[]
  isLive: boolean
  isPremium: boolean
}

// ============================================
// Mock Data
// ============================================

const MENTORS: Mentor[] = [
  {
    id: 'mentor_1',
    name: 'Kim Trading Pro',
    nameKr: '김트레이딩',
    title: '전업 트레이더 15년차',
    specialty: ['기술적 분석', '스윙 트레이딩', '리스크 관리'],
    rating: 4.9,
    students: 2340,
    sessions: 450,
    hourlyRate: 50000,
    isOnline: true,
  },
  {
    id: 'mentor_2',
    name: 'Value Hunter',
    nameKr: '이가치투자',
    title: '가치투자 전문가',
    specialty: ['기본적 분석', '장기 투자', '배당 전략'],
    rating: 4.8,
    students: 1820,
    sessions: 320,
    hourlyRate: 45000,
    isOnline: true,
  },
  {
    id: 'mentor_3',
    name: 'Quant Master',
    nameKr: '박퀀트',
    title: '알고리즘 트레이딩 전문가',
    specialty: ['퀀트 전략', '백테스팅', 'Python'],
    rating: 4.7,
    students: 980,
    sessions: 180,
    hourlyRate: 60000,
    isOnline: false,
    nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000),
  },
  {
    id: 'mentor_4',
    name: 'Crypto Sage',
    nameKr: '최크립토',
    title: '암호화폐 전문 트레이더',
    specialty: ['암호화폐', 'DeFi', '온체인 분석'],
    rating: 4.6,
    students: 1560,
    sessions: 290,
    hourlyRate: 55000,
    isOnline: true,
  },
]

const SESSIONS: LiveSession[] = [
  {
    id: 'session_1',
    mentorId: 'mentor_1',
    title: '실시간 차트 분석 & Q&A',
    description: '오늘의 시장 동향과 주요 종목 차트 분석',
    startTime: new Date(),
    duration: 60,
    participants: 127,
    maxParticipants: 200,
    topics: ['차트 분석', 'NVDA', 'TSLA'],
    isLive: true,
    isPremium: false,
  },
  {
    id: 'session_2',
    mentorId: 'mentor_2',
    title: '가치주 발굴 비법 공개',
    description: '저평가 우량주 찾는 방법 심층 분석',
    startTime: new Date(Date.now() + 30 * 60 * 1000),
    duration: 90,
    participants: 45,
    maxParticipants: 50,
    topics: ['가치 투자', 'PER', 'PBR'],
    isLive: false,
    isPremium: true,
  },
  {
    id: 'session_3',
    mentorId: 'mentor_4',
    title: '비트코인 사이클 분석',
    description: '반감기 이후 시장 전망과 투자 전략',
    startTime: new Date(Date.now() + 60 * 60 * 1000),
    duration: 60,
    participants: 89,
    maxParticipants: 150,
    topics: ['비트코인', '사이클', '반감기'],
    isLive: false,
    isPremium: false,
  },
]

// ============================================
// API Handlers
// ============================================

/**
 * GET /api/coaching
 * Get mentors and sessions
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = validateQueryParams(request, coachingQuerySchema)
    if ('error' in validation) return validation.error

    const { type, filter } = validation.data

    safeLogger.info('[Coaching API] Getting coaching data', { type, filter })

    if (type === 'mentors') {
      return createApiResponse({ mentors: MENTORS })
    }

    if (type === 'sessions') {
      let sessions = [...SESSIONS]

      if (filter === 'live') {
        sessions = sessions.filter((s) => s.isLive)
      } else if (filter === 'upcoming') {
        sessions = sessions.filter((s) => !s.isLive)
      }

      safeLogger.info('[Coaching API] Sessions retrieved', {
        count: sessions.length,
        filter,
      })

      return createApiResponse({ sessions })
    }

    // Default: return all
    safeLogger.info('[Coaching API] All coaching data retrieved')

    return createApiResponse({
      mentors: MENTORS,
      sessions: SESSIONS,
    })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/coaching
 * Book a session or join live session
 */
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

    const validation = await validateRequestBody(request, coachingActionSchema)
    if ('error' in validation) return validation.error

    const data = validation.data

    if (data.action === 'join') {
      const { sessionId } = data

      safeLogger.info('[Coaching API] Joining session', { sessionId, userId })

      // P-1 CRITICAL: 라이브 세션 참여 크레딧 소비 (5 크레딧)
      try {
        await spendCredits({
          userId,
          feature: 'realtime_alert_1d', // 세션 참여는 1일 알림과 동일 비용
          amount: 5,
          metadata: {
            action: 'join',
            sessionId,
          },
        })
      } catch (error) {
        if (error instanceof InsufficientCreditsError) {
          safeLogger.warn('[Coaching API] Insufficient credits for join', {
            userId,
            required: error.required,
            current: error.current,
          })
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
        safeLogger.error('[Coaching API] Credit spend failed', { error })
        return createApiResponse(
          { error: '크레딧 처리 중 오류가 발생했습니다' },
          500
        )
      }

      // Join a live session
      const session = SESSIONS.find((s) => s.id === sessionId)
      if (!session) {
        safeLogger.warn('[Coaching API] Session not found', { sessionId })
        return createApiResponse({ error: 'Session not found' }, 404)
      }

      if (session.participants >= session.maxParticipants) {
        safeLogger.warn('[Coaching API] Session is full', { sessionId })
        return createApiResponse({ error: 'Session is full' }, 400)
      }

      safeLogger.info('[Coaching API] User joined session', { sessionId, userId })

      // In real implementation, add user to session
      return createApiResponse({
        message: '세션에 참여했습니다',
        session,
        streamUrl: `wss://coaching.hephaitos.com/stream/${sessionId}`,
      })
    }

    if (data.action === 'book') {
      const { mentorId, scheduledAt, duration } = data
      const bookingDuration = duration || 60

      safeLogger.info('[Coaching API] Booking mentor session', { mentorId, userId, duration: bookingDuration })

      // P-1 CRITICAL: 멘토 예약 크레딧 소비 (30분=20크레딧, 60분=35크레딧)
      const creditAmount = bookingDuration <= 30 ? CREDIT_COSTS.live_coaching_30m : CREDIT_COSTS.live_coaching_60m
      const creditFeature = bookingDuration <= 30 ? 'live_coaching_30m' : 'live_coaching_60m'

      try {
        await spendCredits({
          userId,
          feature: creditFeature,
          amount: creditAmount,
          metadata: {
            action: 'book',
            mentorId,
            duration: bookingDuration,
            scheduledAt,
          },
        })
      } catch (error) {
        if (error instanceof InsufficientCreditsError) {
          safeLogger.warn('[Coaching API] Insufficient credits for booking', {
            userId,
            required: error.required,
            current: error.current,
          })
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
        safeLogger.error('[Coaching API] Credit spend failed', { error })
        return createApiResponse(
          { error: '크레딧 처리 중 오류가 발생했습니다' },
          500
        )
      }

      // Book a mentor session
      const mentor = MENTORS.find((m) => m.id === mentorId)
      if (!mentor) {
        safeLogger.warn('[Coaching API] Mentor not found', { mentorId })
        return createApiResponse({ error: 'Mentor not found' }, 404)
      }

      // In real implementation, create booking
      const booking = {
        id: `booking_${Date.now()}`,
        mentorId,
        userId,
        scheduledAt: scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: duration || 60,
        status: 'confirmed',
      }

      safeLogger.info('[Coaching API] Booking created', {
        bookingId: booking.id,
        mentorId,
        userId,
      })

      return createApiResponse({
        message: '예약이 완료되었습니다',
        booking,
      })
    }

    return createApiResponse({ error: 'Invalid action' }, 400)
  },
  {
    rateLimit: { category: 'ai' },
    errorHandler: { logErrors: true },
  }
)
