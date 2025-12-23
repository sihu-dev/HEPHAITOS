'use client'


// ============================================
// Onboarding Page
// 온보딩 전용 페이지 + API 연동
// ============================================

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { useOnboarding, OnboardingData } from '@/hooks/use-onboarding'
import { safeLogger } from '@/lib/utils/safe-logger';

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
      safeLogger.info('[Onboarding] Completing...', data)

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
      safeLogger.error('[Onboarding] Error:', error)
    }
  }, [completeOnboarding, router])

  const handleSkip = useCallback(() => {
    skipOnboarding()
    router.push('/dashboard')
  }, [skipOnboarding, router])

  const handleStepChange = useCallback((step: number, data: Partial<OnboardingData>) => {
    // 스텝 변경 시 진행 상태 자동 저장
    saveProgress(step, data)
  }, [saveProgress]) as (step: number, data: Partial<OnboardingData>) => void

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
