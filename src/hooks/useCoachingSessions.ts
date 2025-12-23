'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeLogger } from '@/lib/utils/safe-logger';

// ============================================
// Types
// ============================================

export interface Mentor {
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
  imageUrl?: string
  bio?: string
  experienceYears?: number
  isVerified?: boolean
}

export interface LiveSession {
  id: string
  mentorId: string
  mentorName?: string
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

export interface CoachingMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  isQuestion?: boolean
}

// ============================================
// Demo Data
// ============================================

const DEMO_MENTORS: Mentor[] = [
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

const DEMO_SESSIONS: LiveSession[] = [
  {
    id: 'session_1',
    mentorId: 'mentor_1',
    mentorName: '김트레이딩',
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
    mentorName: '이가치투자',
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
    mentorName: '최크립토',
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

const DEMO_MESSAGES: CoachingMessage[] = [
  { id: '1', senderId: 'mentor_1', senderName: '김트레이딩', content: '안녕하세요 여러분! 오늘 세션에 오신 것을 환영합니다.', timestamp: new Date(Date.now() - 10 * 60 * 1000) },
  { id: '2', senderId: 'user_1', senderName: '홍길동', content: 'NVDA 현재 구간에서 진입해도 될까요?', timestamp: new Date(Date.now() - 8 * 60 * 1000), isQuestion: true },
  { id: '3', senderId: 'mentor_1', senderName: '김트레이딩', content: 'RSI가 70을 넘어서 과매수 구간입니다. 조정 시 분할 매수가 좋아 보입니다.', timestamp: new Date(Date.now() - 7 * 60 * 1000) },
  { id: '4', senderId: 'user_2', senderName: '이순신', content: '손절 라인은 어디로 잡아야 할까요?', timestamp: new Date(Date.now() - 5 * 60 * 1000), isQuestion: true },
  { id: '5', senderId: 'mentor_1', senderName: '김트레이딩', content: '직전 저점인 $850 아래로 손절 설정하시면 됩니다. 약 5% 정도의 손절폭이 됩니다.', timestamp: new Date(Date.now() - 4 * 60 * 1000) },
]

// ============================================
// Hook
// ============================================

interface UseCoachingSessionsOptions {
  specialty?: string
  limit?: number
}

interface UseCoachingSessionsReturn {
  mentors: Mentor[]
  liveSessions: LiveSession[]
  messages: CoachingMessage[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  bookSession: (mentorId: string, availabilityId: string, topic?: string) => Promise<{ success: boolean; error?: string }>
}

export function useCoachingSessions(options: UseCoachingSessionsOptions = {}): UseCoachingSessionsReturn {
  const { specialty, limit = 20 } = options
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [messages, setMessages] = useState<CoachingMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setMentors(DEMO_MENTORS)
      setLiveSessions(DEMO_SESSIONS)
      setMessages(DEMO_MESSAGES)
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setMentors(DEMO_MENTORS)
      setLiveSessions(DEMO_SESSIONS)
      setMessages(DEMO_MESSAGES)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch popular mentors using the RPC function
      const { data: mentorData, error: mentorError } = await supabase
        .rpc('get_popular_mentors' as never, {
          p_specialty: specialty ?? null,
          p_limit: limit,
          p_offset: 0,
        } as never)

      interface MentorRow {
        user_id: string
        display_name: string
        title: string
        bio: string | null
        avatar_url: string | null
        specialties: string[]
        experience_years: number | null
        hourly_rate_credits: number
        session_duration: number
        total_sessions: number
        total_students: number
        rating_avg: number | null
        rating_count: number
        is_featured: boolean
        verification_status: string
      }

      const mentorList = mentorData as MentorRow[] | null

      if (mentorError) {
        safeLogger.warn('[useCoachingSessions] Mentor fetch error:', mentorError)
        setMentors(DEMO_MENTORS)
      } else if (mentorList && mentorList.length > 0) {
        const transformedMentors: Mentor[] = mentorList.map((m, index) => ({
          id: m.user_id,
          name: m.display_name,
          nameKr: m.display_name,
          title: m.title,
          specialty: m.specialties || [],
          rating: Number(m.rating_avg) || 4.5,
          students: m.total_students || 0,
          sessions: m.total_sessions || 0,
          hourlyRate: m.hourly_rate_credits || 50000,
          isOnline: index % 2 === 0, // Simulated online status
          bio: m.bio || undefined,
          experienceYears: m.experience_years || undefined,
          imageUrl: m.avatar_url || undefined,
          isVerified: m.verification_status === 'verified',
        }))
        setMentors(transformedMentors)
      } else {
        setMentors(DEMO_MENTORS)
      }

      // Fetch upcoming sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('coaching_sessions' as never)
        .select(`
          id,
          mentor_id,
          scheduled_date,
          scheduled_start,
          topic,
          session_type,
          status
        `)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_start', { ascending: true })
        .limit(10)

      interface SessionRow {
        id: string
        mentor_id: string
        scheduled_date: string
        scheduled_start: string
        topic: string | null
        session_type: string
        status: string
      }

      const sessionList = sessionData as SessionRow[] | null

      if (sessionError) {
        safeLogger.warn('[useCoachingSessions] Session fetch error:', sessionError)
        setLiveSessions(DEMO_SESSIONS)
      } else if (sessionList && sessionList.length > 0) {
        const transformedSessions: LiveSession[] = sessionList.map((s) => {
          const startDate = new Date(`${s.scheduled_date}T${s.scheduled_start}`)
          return {
            id: s.id,
            mentorId: s.mentor_id,
            title: s.topic || '코칭 세션',
            description: `${s.session_type} 세션`,
            startTime: startDate,
            duration: 60,
            participants: Math.floor(Math.random() * 50) + 10,
            maxParticipants: 100,
            topics: [],
            isLive: s.status === 'in_progress',
            isPremium: s.session_type === 'one_on_one',
          }
        })
        setLiveSessions(transformedSessions)
      } else {
        setLiveSessions(DEMO_SESSIONS)
      }

      // Use demo messages for now (real-time chat would need WebSocket)
      setMessages(DEMO_MESSAGES)

    } catch (err) {
      safeLogger.error('[useCoachingSessions] Error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch coaching data'))
      setMentors(DEMO_MENTORS)
      setLiveSessions(DEMO_SESSIONS)
      setMessages(DEMO_MESSAGES)
    } finally {
      setIsLoading(false)
    }
  }, [specialty, limit])

  const bookSession = useCallback(async (
    mentorId: string,
    availabilityId: string,
    topic?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { success: false, error: 'Supabase not configured' }
    }

    const supabase = createClient()
    if (!supabase) {
      return { success: false, error: 'Failed to create Supabase client' }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { data, error } = await supabase
        .rpc('book_coaching_session' as never, {
          p_student_id: user.id,
          p_mentor_id: mentorId,
          p_availability_id: availabilityId,
          p_topic: topic ?? null,
        } as never)

      interface BookingResult {
        success: boolean
        error?: string
        session_id?: string
      }

      const result = data as BookingResult | null

      if (error) {
        return { success: false, error: error.message }
      }

      if (!result?.success) {
        return { success: false, error: result?.error || 'Booking failed' }
      }

      // Refresh data after booking
      await fetchData()

      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    mentors,
    liveSessions,
    messages,
    isLoading,
    error,
    refresh: fetchData,
    bookSession,
  }
}
