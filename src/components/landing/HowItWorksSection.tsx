'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/i18n/client'

// ============================================
// Linear 2025 Design System
// Pain Point based user journey
// Before (Pain) → After (Solution) story
// ============================================

type PersonaKey = 'minsu' | 'jihyun' | 'youngho'

const personaKeys: PersonaKey[] = ['minsu']

const colorClasses = {
  primary: {
    bg: 'bg-[#5E6AD2]/10',
    border: 'border-[#5E6AD2]/20',
    text: 'text-[#5E6AD2]',
  },
}

const personaColors: Record<PersonaKey, keyof typeof colorClasses> = {
  minsu: 'primary',
  jihyun: 'primary',
  youngho: 'primary',
}

const stepColors = {
  COPY: 'primary',
  LEARN: 'primary',
  BUILD: 'primary',
}

// ============================================
// Main Component
// ============================================

export const HowItWorksSection = memo(function HowItWorksSection() {
  const { t } = useI18n()

  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-[#0D0D0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs text-[#5E6AD2] uppercase tracking-wider font-medium">
            {t('howItWorks.label')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-medium text-white mt-3 mb-4">
            {t('howItWorks.title1')}
            <br />
            <span className="text-zinc-400">{t('howItWorks.title2')}</span>
          </h2>
          <p className="text-base text-zinc-400 max-w-lg mx-auto">
            {t('howItWorks.subtitle1')}
            <br className="hidden sm:block" />
            {t('howItWorks.subtitle2')}
          </p>
        </div>

        {/* User Journey Cards */}
        <div className="space-y-8">
          {personaKeys.map((personaKey) => {
            const colors = colorClasses[personaColors[personaKey]]
            const persona = {
              name: t(`howItWorks.personas.${personaKey}.name`),
              age: t(`howItWorks.personas.${personaKey}.age`),
              job: t(`howItWorks.personas.${personaKey}.job`),
              avatar: t(`howItWorks.personas.${personaKey}.avatar`),
            }
            const before = {
              emotion: t(`howItWorks.personas.${personaKey}.before.emotion`),
              situation: t(`howItWorks.personas.${personaKey}.before.situation`),
              pain: t(`howItWorks.personas.${personaKey}.before.pain`),
            }
            const after = {
              result: t(`howItWorks.personas.${personaKey}.after.result`),
              gain: t(`howItWorks.personas.${personaKey}.after.gain`),
            }
            const journeySteps = [0, 1, 2].map((i) => ({
              step: t(`howItWorks.personas.${personaKey}.journey.${i}.step`),
              time: t(`howItWorks.personas.${personaKey}.journey.${i}.time`),
              action: t(`howItWorks.personas.${personaKey}.journey.${i}.action`),
              result: t(`howItWorks.personas.${personaKey}.journey.${i}.result`),
            }))

            return (
              <div
                key={personaKey}
                className="glass rounded-lg overflow-hidden"
              >
                {/* Header: Persona + Before */}
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Persona */}
                  <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/[0.06] hover:glass-strong transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{persona.avatar}</span>
                      <div>
                        <h3 className="text-base font-medium text-white">
                          {persona.name} ({persona.age})
                        </h3>
                        <p className="text-xs text-zinc-400">{persona.job}</p>
                      </div>
                    </div>

                    {/* Before (Pain) */}
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">❌</span>
                        <div>
                          <p className="text-xs text-red-400 font-medium mb-1">BEFORE: {before.emotion}</p>
                          <p className="text-sm text-zinc-300 mb-1">{before.situation}</p>
                          <p className="text-xs text-red-300">{before.pain}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* After (Solution) */}
                  <div className="p-6">
                    <div className={`p-4 ${colors.bg} ${colors.border} border rounded-lg h-full`}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">✓</span>
                        <div>
                          <p className={`text-xs ${colors.text} font-medium mb-1`}>AFTER</p>
                          <p className="text-sm text-white mb-2">{after.result}</p>
                          <p className={`text-xs ${colors.text}`}>{after.gain}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Journey Steps */}
                <div className="px-6 py-4 bg-white/[0.01] border-t border-white/[0.06]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {journeySteps.map((step, index) => {
                      const stepColor = colorClasses[stepColors[step.step as keyof typeof stepColors] as keyof typeof colorClasses]

                      return (
                        <div key={step.step} className="relative">
                          {/* Arrow (mobile) */}
                          {index < journeySteps.length - 1 && (
                            <div className="md:hidden flex justify-center py-2">
                              <span className="text-2xl text-zinc-500">↓</span>
                            </div>
                          )}

                          <div className="p-4 glass rounded-lg hover:glass-strong transition-all">
                            {/* Step Badge + Time */}
                            <div className="flex items-center justify-between mb-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${stepColor.bg} ${stepColor.border} border ${stepColor.text}`}>
                                {step.step}
                              </span>
                              <span className="text-xs text-zinc-400">{step.time}</span>
                            </div>

                            {/* Action */}
                            <p className="text-xs text-zinc-400 mb-2">"{step.action}"</p>

                            {/* Result */}
                            <p className="text-xs text-zinc-400">
                              → {step.result}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
})

HowItWorksSection.displayName = 'HowItWorksSection'

export { HowItWorksSection as default }
