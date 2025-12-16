// ============================================
// Onboarding Hook
// 온보딩 상태 관리 훅 + API 연동
// ============================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface UserProfile {
  nickname: string
  investmentStyle: 'conservative' | 'moderate' | 'aggressive'
  interests: string[]
  experience: 'beginner' | 'intermediate' | 'advanced'
  painPoints?: string[]
}

export interface OnboardingData extends UserProfile {
  acceptedDisclaimer?: boolean
}

export function useOnboarding() {
  const router = useRouter()
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // 온보딩 상태 확인 (로컬 + API)
  const checkOnboardingStatus = useCallback(async () => {
    try {
      // 로컬 스토리지 먼저 확인 (빠른 응답)
      const completed = localStorage.getItem('onboarding_completed')
      const profile = localStorage.getItem('user_profile')
      const savedStep = localStorage.getItem('onboarding_step')

      if (completed === 'true') {
        setIsOnboardingComplete(true)
        if (profile) {
          setUserProfile(JSON.parse(profile))
        }
        setIsLoading(false)
        return true
      }

      // 저장된 진행 상태 복원
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10))
      }

      // API 호출
      const response = await fetch('/api/user/onboarding', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.status === 401) {
        // 미인증 상태 - 로컬만 사용
        setIsOnboardingComplete(completed === 'true')
        if (profile) {
          setUserProfile(JSON.parse(profile))
        }
        setIsLoading(false)
        return completed === 'true'
      }

      if (response.ok) {
        const result = await response.json()
        const apiCompleted = result.data?.onboardingCompleted ?? false
        const apiStep = result.data?.onboardingStep ?? 0

        setIsOnboardingComplete(apiCompleted)
        setCurrentStep(apiStep)

        if (result.data?.profile) {
          setUserProfile(result.data.profile)
          localStorage.setItem('user_profile', JSON.stringify(result.data.profile))
        }

        if (apiCompleted) {
          localStorage.setItem('onboarding_completed', 'true')
        }

        setIsLoading(false)
        return apiCompleted
      }
    } catch (err) {
      console.error('[useOnboarding] checkOnboardingStatus error:', err)
    }

    // 에러 시 로컬 스토리지 값 사용
    const completed = localStorage.getItem('onboarding_completed')
    setIsOnboardingComplete(completed === 'true')
    setIsLoading(false)
    return completed === 'true'
  }, [])

  // 초기 로드
  useEffect(() => {
    checkOnboardingStatus()
  }, [checkOnboardingStatus])

  // 온보딩이 필요한 경우 리다이렉트
  const requireOnboarding = useCallback(() => {
    if (isOnboardingComplete === false) {
      router.push('/onboarding')
      return true
    }
    return false
  }, [isOnboardingComplete, router])

  // 온보딩 완료 처리 (API 연동)
  const completeOnboarding = useCallback(async (profile: OnboardingData): Promise<boolean> => {
    try {
      setError(null)

      // 로컬 스토리지에 먼저 저장 (빠른 응답)
      localStorage.setItem('onboarding_completed', 'true')
      localStorage.setItem('user_profile', JSON.stringify(profile))
      setIsOnboardingComplete(true)
      setUserProfile(profile)

      // API 호출
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: profile.nickname,
          investmentStyle: profile.investmentStyle,
          experience: profile.experience,
          interests: profile.interests,
          painPoints: profile.painPoints ?? [],
        }),
      })

      if (!response.ok && response.status !== 401) {
        console.warn('[useOnboarding] API save failed, using local storage')
      }

      return true
    } catch (err) {
      console.error('[useOnboarding] completeOnboarding error:', err)
      // 에러가 발생해도 로컬에 저장되어 있으므로 true 반환
      return true
    }
  }, [])

  // 진행 상태 저장 (자동 저장)
  const saveProgress = useCallback(async (step: number, data: Partial<OnboardingData>) => {
    try {
      // 로컬에 먼저 저장
      localStorage.setItem('onboarding_step', String(step))
      const existingProgress = localStorage.getItem('onboarding_progress')
      const merged = existingProgress
        ? { ...JSON.parse(existingProgress), ...data }
        : data
      localStorage.setItem('onboarding_progress', JSON.stringify(merged))
      setCurrentStep(step)

      // 백그라운드로 API 호출
      fetch('/api/user/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data }),
      }).catch(err => {
        console.warn('[useOnboarding] saveProgress API error:', err)
      })
    } catch (err) {
      console.error('[useOnboarding] saveProgress error:', err)
    }
  }, [])

  // 진행 상태 불러오기
  const loadProgress = useCallback((): Partial<OnboardingData> | null => {
    try {
      const progress = localStorage.getItem('onboarding_progress')
      return progress ? JSON.parse(progress) : null
    } catch {
      return null
    }
  }, [])

  // 온보딩 건너뛰기
  const skipOnboarding = useCallback(() => {
    localStorage.setItem('onboarding_completed', 'true')
    setIsOnboardingComplete(true)
  }, [])

  // 온보딩 초기화 (테스트용)
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('onboarding_completed')
    localStorage.removeItem('user_profile')
    localStorage.removeItem('onboarding_step')
    localStorage.removeItem('onboarding_progress')
    setIsOnboardingComplete(false)
    setUserProfile(null)
    setCurrentStep(0)
  }, [])

  return {
    isOnboardingComplete,
    userProfile,
    isLoading,
    currentStep,
    error,
    requireOnboarding,
    completeOnboarding,
    saveProgress,
    loadProgress,
    skipOnboarding,
    resetOnboarding,
    checkOnboardingStatus,
  }
}

export default useOnboarding
