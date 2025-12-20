'use client'

import { memo } from 'react'
import { useI18n } from '@/i18n/client'
import { BG_COLORS, PHASE_COLORS } from '@/constants/design-tokens'

// ============================================
// HEPHAITOS How It Works Section
// Supabase-inspired minimal design
// ============================================

type PersonaKey = 'minsu' | 'jihyun' | 'youngho'

const personaKeys: PersonaKey[] = ['minsu']

const journeySteps = [
  { step: 'COPY', color: 'amber' },
  { step: 'LEARN', color: 'blue' },
  { step: 'BUILD', color: 'purple' },
]

export const HowItWorksSection = memo(function HowItWorksSection() {
  const { t, locale } = useI18n()
  const isKo = locale === 'ko'

  return (
    <section id="how-it-works" className={`py-24 ${BG_COLORS.secondary}`}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm text-amber-500 font-medium mb-3">
            {t('howItWorks.label')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
            {t('howItWorks.title1')}
            <br />
            <span className="text-zinc-500">{t('howItWorks.title2')}</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            {t('howItWorks.subtitle1')} {t('howItWorks.subtitle2')}
          </p>
        </div>

        {/* User Journey */}
        <div className="space-y-8">
          {personaKeys.map((personaKey) => {
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
            const personaJourney = [0, 1, 2].map((i) => ({
              step: t(`howItWorks.personas.${personaKey}.journey.${i}.step`),
              time: t(`howItWorks.personas.${personaKey}.journey.${i}.time`),
              action: t(`howItWorks.personas.${personaKey}.journey.${i}.action`),
              result: t(`howItWorks.personas.${personaKey}.journey.${i}.result`),
            }))

            return (
              <div
                key={personaKey}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden"
              >
                {/* Header: Persona + Before/After */}
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Persona + Before */}
                  <div className="p-6 border-b lg:border-b-0 lg:border-r border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{persona.avatar}</span>
                      <div>
                        <h3 className="text-base font-medium text-white">
                          {persona.name} <span className="text-zinc-500">({persona.age})</span>
                        </h3>
                        <p className="text-sm text-zinc-400">{persona.job}</p>
                      </div>
                    </div>

                    {/* Before */}
                    <div className="p-4 bg-zinc-900/50 border border-red-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-xs">✕</span>
                        <div>
                          <p className="text-xs text-red-400 font-medium uppercase mb-1">
                            BEFORE: {before.emotion}
                          </p>
                          <p className="text-sm text-zinc-300 mb-1">{before.situation}</p>
                          <p className="text-xs text-zinc-500">{before.pain}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* After */}
                  <div className="p-6 flex items-center">
                    <div className="w-full p-4 bg-zinc-900/50 border border-amber-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 text-xs">✓</span>
                        <div>
                          <p className="text-xs text-amber-400 font-medium uppercase mb-1">AFTER</p>
                          <p className="text-sm text-white mb-1">{after.result}</p>
                          <p className="text-xs text-zinc-500">{after.gain}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Journey Steps */}
                <div className="p-6 border-t border-zinc-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {personaJourney.map((step, index) => {
                      const journeyStep = journeySteps[index]
                      const getBadgeColor = () => {
                        if (journeyStep.color === 'amber') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        if (journeyStep.color === 'blue') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }

                      return (
                        <div
                          key={step.step}
                          className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getBadgeColor()}`}>
                              {step.step}
                            </span>
                            <span className="text-xs text-zinc-500">{step.time}</span>
                          </div>
                          <p className="text-sm text-zinc-300 mb-2 italic">"{step.action}"</p>
                          <p className="text-xs text-zinc-500">→ {step.result}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Journey Progress Visualization */}
        <div className="flex items-center justify-center gap-4 mt-12">
          {journeySteps.map((step, index) => (
            <div key={step.step} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  step.color === 'amber' ? 'bg-amber-500' :
                  step.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
                }`} />
                <span className="text-xs text-zinc-500">{step.step}</span>
              </div>
              {index < journeySteps.length - 1 && (
                <div className="w-8 h-px bg-zinc-800" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

HowItWorksSection.displayName = 'HowItWorksSection'

export { HowItWorksSection as default }
