'use client'

// ============================================
// Onboarding Wizard
// Pain Point 기반: "당신의 Pain은 무엇인가요?"
// Copy-Learn-Build 여정으로 해결책 제시
// ============================================

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  UserCircleIcon,
  ChartBarIcon,
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  FireIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { useI18n } from '@/i18n/client'

// ============================================
// Types
// ============================================

interface OnboardingData {
  nickname: string
  investmentStyle: 'conservative' | 'moderate' | 'aggressive' | ''
  interests: string[]
  experience: 'beginner' | 'intermediate' | 'advanced' | ''
  acceptedDisclaimer: boolean
  painPoints: string[]
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void
  onSkip?: () => void
  onStepChange?: (step: number, data: Partial<OnboardingData>) => void
  initialStep?: number
  initialData?: Partial<OnboardingData>
}

// ============================================
// Pain Points 데이터 (조사 기반)
// Translation keys are used - actual text comes from i18n
// ============================================

const PAIN_POINT_IDS = [
  { id: 'youtube', key: 'youtube', icon: '📺' },
  { id: 'reading_room', key: 'readingRoom', icon: '💬' },
  { id: 'paid_course', key: 'paidCourse', icon: '📚' },
  { id: 'quant_coding', key: 'quantCoding', icon: '💻' },
  { id: 'broker_ai', key: 'brokerAi', icon: '🤖' },
  { id: 'emotional', key: 'emotional', icon: '😰' },
]

// ============================================
// Step Components
// ============================================

// Pain Point 선택 스텝 (새로 추가)
function StepPainPoints({
  data,
  onChange,
}: {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
}) {
  const { t } = useI18n()

  const togglePain = (id: string) => {
    const current = data.painPoints || []
    const updated = current.includes(id)
      ? current.filter((p) => p !== id)
      : [...current, id]
    onChange({ painPoints: updated })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center"
        >
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
        </motion.div>
        <h2 className="text-xl font-medium text-white mb-2">
          {t('dashboard.onboarding.painPoints.title') as string}
        </h2>
        <p className="text-sm text-zinc-400">
          {t('dashboard.onboarding.painPoints.subtitle') as string}
        </p>
      </div>

      <div className="space-y-2">
        {PAIN_POINT_IDS.map((pain, index) => (
          <motion.button
            key={pain.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => togglePain(pain.id)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              (data.painPoints || []).includes(pain.id)
                ? 'border-red-500/50 bg-red-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{pain.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {t(`dashboard.onboarding.painPoints.items.${pain.key}.label`) as string}
                </div>
                <div className="text-xs text-red-300">
                  {t(`dashboard.onboarding.painPoints.items.${pain.key}.pain`) as string}
                </div>
              </div>
              {(data.painPoints || []).includes(pain.id) && (
                <CheckCircleIcon className="w-5 h-5 text-red-400" />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-center text-xs text-zinc-400">
        {(t('dashboard.onboarding.painPoints.selected') as string).replace('{count}', String((data.painPoints || []).length))}
      </p>
    </div>
  )
}

// 웰컴 스텝 - Pain Point 기반 해결책 제시
function StepWelcome({
  data,
  onAcceptDisclaimer,
  accepted,
}: {
  data: OnboardingData
  onAcceptDisclaimer: (value: boolean) => void
  accepted: boolean
}) {
  const { t } = useI18n()
  // Pain Point에 따른 맞춤 메시지
  const painCount = (data.painPoints || []).length
  const hasPainPoints = painCount > 0

  const featureKeys = ['copy', 'learn', 'build'] as const
  const featureIcons = {
    copy: DocumentDuplicateIcon,
    learn: AcademicCapIcon,
    build: WrenchScrewdriverIcon,
  }
  const featureColors = {
    copy: 'emerald',
    learn: 'blue',
    build: 'amber',
  }

  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  }

  return (
    <div className="space-y-6">
      {/* 헤더 - Pain 공감 */}
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center"
        >
          <FireIcon className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-xl font-medium text-white mb-2">
          {hasPainPoints
            ? (t('dashboard.onboarding.welcome.titleWithPain') as string).replace('{count}', String(painCount))
            : t('dashboard.onboarding.welcome.titleNoPain') as string}
        </h2>
        <p className="text-sm text-zinc-400">
          {t('dashboard.onboarding.welcome.subtitle') as string}
        </p>
      </div>

      {/* Pain → Solution 배너 */}
      {hasPainPoints && (
        <div className="p-3 bg-gradient-to-r from-red-500/10 to-emerald-500/10 border border-white/[0.06] rounded-lg">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <XMarkIcon className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-300">
                {(t('dashboard.onboarding.welcome.painBanner.pain') as string).replace('{count}', String(painCount))}
              </span>
            </div>
            <span className="text-zinc-400">→</span>
            <div className="flex items-center gap-1.5">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">{t('dashboard.onboarding.welcome.painBanner.solution') as string}</span>
            </div>
          </div>
        </div>
      )}

      {/* Copy-Learn-Build 소개 */}
      <div className="space-y-2">
        {featureKeys.map((key, index) => {
          const Icon = featureIcons[key]
          const color = featureColors[key]
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium uppercase">
                      {t(`dashboard.onboarding.welcome.features.${key}.stage`) as string}
                    </span>
                    <span className="text-xs text-white">
                      {t(`dashboard.onboarding.welcome.features.${key}.title`) as string}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {t(`dashboard.onboarding.welcome.features.${key}.desc`) as string}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircleIcon className="w-3 h-3" />
                    <span className="text-[10px]">
                      {t(`dashboard.onboarding.welcome.features.${key}.painSolved`) as string}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 면책조항 동의 */}
      <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => onAcceptDisclaimer(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
          />
          <div className="text-xs text-zinc-400 leading-relaxed">
            <span className="text-amber-400 font-medium">{t('dashboard.onboarding.welcome.disclaimer.required') as string}</span>: {t('dashboard.onboarding.welcome.disclaimer.text') as string}
            <strong className="text-white"> {t('dashboard.onboarding.welcome.disclaimer.emphasis') as string}</strong>
            {t('dashboard.onboarding.welcome.disclaimer.suffix') as string}
          </div>
        </label>
      </div>
    </div>
  )
}

function StepProfile({
  data,
  onChange
}: {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
}) {
  const { t } = useI18n()
  const experienceLevels = ['beginner', 'intermediate', 'advanced'] as const

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/[0.08] flex items-center justify-center">
          <UserCircleIcon className="w-7 h-7 text-zinc-400" />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">
          {t('dashboard.onboarding.profile.title') as string}
        </h2>
        <p className="text-sm text-zinc-400">
          {t('dashboard.onboarding.profile.subtitle') as string}
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label={t('dashboard.onboarding.profile.nickname') as string}
          placeholder={t('dashboard.onboarding.profile.nicknamePlaceholder') as string}
          value={data.nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
          maxLength={20}
        />

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-3">
            {t('dashboard.onboarding.profile.experience') as string}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {experienceLevels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onChange({ experience: level as OnboardingData['experience'] })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  data.experience === level
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                }`}
              >
                <div className="text-sm font-medium text-white">
                  {t(`dashboard.onboarding.profile.experienceLevels.${level}`) as string}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {t(`dashboard.onboarding.profile.experienceLevels.${level}Desc`) as string}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepInvestmentStyle({
  data,
  onChange
}: {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
}) {
  const { t } = useI18n()
  const styleKeys = ['conservative', 'moderate', 'aggressive'] as const
  const colorClasses = {
    conservative: 'border-emerald-500/50 bg-emerald-500/10',
    moderate: 'border-blue-500/50 bg-blue-500/10',
    aggressive: 'border-amber-500/50 bg-amber-500/10',
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/[0.08] flex items-center justify-center">
          <ChartBarIcon className="w-7 h-7 text-zinc-400" />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">
          {t('dashboard.onboarding.investmentStyle.title') as string}
        </h2>
        <p className="text-sm text-zinc-400">
          {t('dashboard.onboarding.investmentStyle.subtitle') as string}
        </p>
      </div>

      <div className="space-y-2">
        {styleKeys.map((styleKey) => (
          <button
            key={styleKey}
            type="button"
            onClick={() => onChange({ investmentStyle: styleKey as OnboardingData['investmentStyle'] })}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              data.investmentStyle === styleKey
                ? colorClasses[styleKey]
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">
                  {t(`dashboard.onboarding.investmentStyle.styles.${styleKey}.label`) as string}
                </div>
                <div className="text-xs text-zinc-400">
                  {t(`dashboard.onboarding.investmentStyle.styles.${styleKey}.desc`) as string}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  {t(`dashboard.onboarding.investmentStyle.styles.${styleKey}.recommended`) as string}
                </div>
              </div>
              {data.investmentStyle === styleKey && (
                <CheckCircleIcon className="w-5 h-5 text-current" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepInterests({
  data,
  onChange
}: {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
}) {
  const { t } = useI18n()
  const interestKeys = ['tech', 'finance', 'healthcare', 'energy', 'consumer', 'industrial', 'etf', 'crypto'] as const
  const interestIcons: Record<string, string> = {
    tech: '💻',
    finance: '🏦',
    healthcare: '💊',
    energy: '⚡',
    consumer: '🛒',
    industrial: '🏭',
    etf: '📊',
    crypto: '₿',
  }

  const toggleInterest = (value: string) => {
    const current = data.interests
    const updated = current.includes(value)
      ? current.filter((i) => i !== value)
      : [...current, value]
    onChange({ interests: updated })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/[0.08] flex items-center justify-center">
          <SparklesIcon className="w-7 h-7 text-zinc-400" />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">
          {t('dashboard.onboarding.interests.title') as string}
        </h2>
        <p className="text-sm text-zinc-400">
          {t('dashboard.onboarding.interests.subtitle') as string}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {interestKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleInterest(key)}
            className={`p-3 rounded-lg border-2 transition-all ${
              data.interests.includes(key)
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
            }`}
          >
            <div className="text-xl mb-1">{interestIcons[key]}</div>
            <div className="text-xs font-medium text-white">
              {t(`dashboard.onboarding.interests.items.${key}`) as string}
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-zinc-400">
        {(t('dashboard.onboarding.interests.selected') as string).replace('{count}', String(data.interests.length))}
      </p>
    </div>
  )
}

function StepComplete({ data }: { data: OnboardingData }) {
  const { t } = useI18n()
  // Pain 개수에 따른 맞춤 메시지
  const painCount = (data.painPoints || []).length

  return (
    <div className="text-center py-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center"
      >
        <CheckIcon className="w-8 h-8 text-white" />
      </motion.div>

      <h2 className="text-xl font-medium text-white mb-2">
        {t('dashboard.onboarding.complete.title') as string}
      </h2>
      <p className="text-sm text-zinc-400 mb-6">
        {painCount > 0
          ? (t('dashboard.onboarding.complete.subtitleWithPain') as string)
              .replace('{name}', data.nickname)
              .replace('{count}', String(painCount))
          : (t('dashboard.onboarding.complete.subtitle') as string).replace('{name}', data.nickname)}
      </p>

      {/* 추천 시작점 */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-white/[0.06] rounded-lg mb-4">
        <p className="text-xs text-zinc-400 mb-2">
          {t('dashboard.onboarding.complete.recommendedStart') as string}
        </p>
        <p className="text-sm text-white font-medium">
          {t(`dashboard.onboarding.complete.recommendations.${data.investmentStyle || 'moderate'}`) as string}
        </p>
      </div>

      {/* 요약 */}
      <div className="bg-white/[0.02] rounded-lg p-4 text-left space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-500">
            {t('dashboard.onboarding.complete.summary.experience') as string}
          </span>
          <span className="text-white">
            {t(`dashboard.onboarding.profile.experienceLevels.${data.experience || 'beginner'}`) as string}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">
            {t('dashboard.onboarding.complete.summary.style') as string}
          </span>
          <span className="text-white">
            {t(`dashboard.onboarding.investmentStyle.styles.${data.investmentStyle || 'moderate'}.label`) as string}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">
            {t('dashboard.onboarding.complete.summary.interests') as string}
          </span>
          <span className="text-white">{data.interests.length}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function OnboardingWizard({
  onComplete,
  onSkip,
  onStepChange,
  initialStep = 0,
  initialData,
}: OnboardingWizardProps) {
  const { t } = useI18n()
  const [step, setStep] = useState(initialStep)
  const [data, setData] = useState<OnboardingData>({
    nickname: initialData?.nickname ?? '',
    investmentStyle: (initialData?.investmentStyle ?? '') as OnboardingData['investmentStyle'],
    interests: initialData?.interests ?? [],
    experience: (initialData?.experience ?? '') as OnboardingData['experience'],
    acceptedDisclaimer: initialData?.acceptedDisclaimer ?? false,
    painPoints: initialData?.painPoints ?? [],
  })

  const stepKeys = ['pain', 'welcome', 'profile', 'style', 'interests', 'complete'] as const
  const steps = stepKeys.map((key) => ({
    id: key,
    title: t(`dashboard.onboarding.steps.${key}`) as string,
  }))

  const handleChange = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  const canProceed = () => {
    switch (step) {
      case 0: // Pain Points
        return (data.painPoints || []).length >= 1
      case 1: // Welcome
        return data.acceptedDisclaimer === true
      case 2: // Profile
        return data.nickname.length >= 2 && data.experience !== ''
      case 3: // Style
        return data.investmentStyle !== ''
      case 4: // Interests
        return data.interests.length >= 1
      default:
        return true
    }
  }

  const handleNext = () => {
    if (step < steps.length - 1) {
      const nextStep = step + 1
      setStep(nextStep)
      // 진행 상태 저장 콜백
      onStepChange?.(nextStep, data)
    } else {
      onComplete(data)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepPainPoints data={data} onChange={handleChange} />
      case 1:
        return (
          <StepWelcome
            data={data}
            onAcceptDisclaimer={(value) => handleChange({ acceptedDisclaimer: value })}
            accepted={data.acceptedDisclaimer}
          />
        )
      case 2:
        return <StepProfile data={data} onChange={handleChange} />
      case 3:
        return <StepInvestmentStyle data={data} onChange={handleChange} />
      case 4:
        return <StepInterests data={data} onChange={handleChange} />
      case 5:
        return <StepComplete data={data} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0C]/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4"
      >
        {/* Progress Bar */}
        <div className="flex gap-1.5 mb-6">
          {steps.slice(0, -1).map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-amber-500' : 'bg-white/[0.06]'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-background-primary border border-white/[0.06] rounded-xl p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-6 border-t border-white/[0.06]">
            <div>
              {step > 0 && step < steps.length - 1 && (
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  {t('dashboard.onboarding.navigation.back') as string}
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              {onSkip && step === 0 && (
                <Button variant="ghost" onClick={onSkip}>
                  {t('dashboard.onboarding.navigation.skip') as string}
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="min-w-[100px]"
              >
                {step === steps.length - 1
                  ? t('dashboard.onboarding.navigation.start') as string
                  : t('dashboard.onboarding.navigation.next') as string}
                {step < steps.length - 1 && <ArrowRightIcon className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <p className="text-center text-xs text-zinc-400 mt-4">
          {(t('dashboard.onboarding.navigation.stepIndicator') as string)
            .replace('{current}', String(step + 1))
            .replace('{total}', String(steps.length))}
        </p>
      </motion.div>
    </div>
  )
}

export default OnboardingWizard
