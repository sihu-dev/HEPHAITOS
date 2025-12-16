'use client'

import { useState, useEffect, useCallback } from 'react'

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

interface CoachingData {
  mentors: Mentor[]
  sessions: LiveSession[]
}

interface UseCoachingReturn {
  data: CoachingData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  joinSession: (sessionId: string) => Promise<{ streamUrl: string }>
  bookMentor: (mentorId: string, scheduledAt: Date, duration: number) => Promise<void>
}

/**
 * Hook for coaching functionality
 */
export function useCoaching(): UseCoachingReturn {
  const [data, setData] = useState<CoachingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCoachingData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/coaching')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch coaching data')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCoachingData()
  }, [fetchCoachingData])

  const joinSession = useCallback(async (sessionId: string) => {
    const response = await fetch('/api/coaching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        sessionId,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to join session')
    }

    return { streamUrl: result.data.streamUrl }
  }, [])

  const bookMentor = useCallback(async (mentorId: string, scheduledAt: Date, duration: number) => {
    const response = await fetch('/api/coaching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'book',
        mentorId,
        scheduledAt: scheduledAt.toISOString(),
        duration,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to book mentor')
    }
  }, [])

  return { data, loading, error, refetch: fetchCoachingData, joinSession, bookMentor }
}
