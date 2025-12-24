'use client'


// ============================================
// Onboarding Page
// 온보딩 전용 페이지 + API 연동
// ============================================

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { useOnboarding, OnboardingData } from '@/hooks/use-onboarding'

// Force dynamic rendering

export function OnboardingContent() {
  const router = useRouter()
  const {
    isOnboardingComplete,
    isLoading,
    currentStep,
    completeOnboarding,
    saveProgress,
    loadProgress,
    skipOnboarding,
  } = useOnboarding()

  const [initialData, setInitialData] = useState<Partial<OnboardingData> | null>(null)

  // 이미 완료된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (!isLoading && isOnboardingComplete) {
      router.replace('/dashboard')
    }
  }, [isLoading, isOnboardingComplete, router])

  // 저장된 진행 상태 불러오기
  useEffect(() => {
    const saved = loadProgress()
    if (saved) {
      setInitialData(saved)
    }
  }, [loadProgress])

  const handleComplete = useCallback(async (data: {
    nickname: string
    investmentStyle: string
    interests: string[]
    experience: string
    painPoints?: string[]
    acceptedDisclaimer?: boolean
  }) => {
    try {
      console.log('[Onboarding] Completing...', data)

      // 훅을 통해 완료 처리 (API + 로컬 스토리지)
      const success = await completeOnboarding({
        nickname: data.nickname,
        investmentStyle: data.investmentStyle as OnboardingData['investmentStyle'],
        experience: data.experience as OnboardingData['experience'],
        interests: data.interests,
        painPoints: data.painPoints ?? [],
        acceptedDisclaimer: data.acceptedDisclaimer,
      })

      if (success) {
        // 진행 상태 정리
        localStorage.removeItem('onboarding_step')
        localStorage.removeItem('onboarding_progress')

        // 대시보드로 이동
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('[Onboarding] Error:', error)
    }
  }, [completeOnboarding, router])

  const handleSkip = useCallback(() => {
    skipOnboarding()
    router.push('/dashboard')
  }, [skipOnboarding, router])

  // Type-safe callback that accommodates OnboardingWizard's local type definition
  const handleStepChange = useCallback((step: number, data: Partial<{
    nickname: string
    investmentStyle: 'conservative' | 'moderate' | 'aggressive' | ''
    interests: string[]
    experience: 'beginner' | 'intermediate' | 'advanced' | ''
    acceptedDisclaimer: boolean
    painPoints: string[]
  }>) => {
    // 스텝 변경 시 진행 상태 자동 저장 (filter out empty string values)
    const filteredData: Partial<OnboardingData> = {}
    if (data.nickname) filteredData.nickname = data.nickname
    // Filter out empty strings that are valid in Wizard but not in OnboardingData
    if (data.investmentStyle) {
      filteredData.investmentStyle = data.investmentStyle as OnboardingData['investmentStyle']
    }
    if (data.experience) {
      filteredData.experience = data.experience as OnboardingData['experience']
    }
    if (data.interests) filteredData.interests = data.interests
    if (data.painPoints) filteredData.painPoints = data.painPoints
    if (data.acceptedDisclaimer !== undefined) filteredData.acceptedDisclaimer = data.acceptedDisclaimer

    saveProgress(step, filteredData)
  }, [saveProgress])

  // 로딩 중
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0C]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 이미 완료된 경우 (리다이렉트 대기)
  if (isOnboardingComplete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0C]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">대시보드로 이동 중...</p>
        </div>
      </div>
    )
  }

  return (
    <OnboardingWizard
      onComplete={handleComplete}
      onSkip={handleSkip}
      onStepChange={handleStepChange}
      initialStep={currentStep}
      initialData={initialData ?? undefined}
    />
  )
}
