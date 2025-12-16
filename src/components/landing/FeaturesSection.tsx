'use client'

import { memo } from 'react'
import { useI18n } from '@/i18n/client'

// ============================================
// Linear 2025 Design System
// Flat, minimal, professional design
// Copy-Learn-Build focus
// ============================================

type FeatureKey = 'portfolioMirroring' | 'aiCoach' | 'nlStrategies' | 'visualBuilder' | 'backtesting' | 'deployment'

const featureConfigs: Array<{
  category: string
  emoji: string
  key: FeatureKey
}> = [
  { category: 'COPY', emoji: '👥', key: 'portfolioMirroring' },
  { category: 'LEARN', emoji: '🎓', key: 'aiCoach' },
  { category: 'BUILD', emoji: '⚡', key: 'nlStrategies' },
]

export const FeaturesSection = memo(function FeaturesSection() {
  const { t, locale } = useI18n()

  const stats = [
    { value: locale === 'en' ? '3 min' : '3분', label: t('features.stats.brokerSetup') },
    { value: locale === 'en' ? '15 sec' : '15초', label: t('features.stats.strategyBuild') },
    { value: locale === 'en' ? '0 lines' : '0줄', label: t('features.stats.codeRequired') },
    { value: locale === 'en' ? 'Free' : '무료', label: t('features.stats.toStart') },
  ]

  return (
    <section id="features" className="py-20 lg:py-32 bg-[#0D0D0F]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs text-[#5E6AD2] uppercase tracking-wider font-medium">
            {t('features.label')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-medium text-white mt-3 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-base text-zinc-400 max-w-lg mx-auto">
            {t('features.subtitle')}
            <br />
            {t('features.subtitle2')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {featureConfigs.map((feature) => (
            <div
              key={feature.key}
              className="p-8 glass rounded-xl hover:glass-strong transition-all"
            >
              {/* Category Badge */}
              <div className="inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider mb-4 bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 text-[#7C8AEA]">
                {feature.category}
              </div>

              {/* Emoji */}
              <div className="w-12 h-12 rounded-xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center mb-4 text-2xl">
                {feature.emoji}
              </div>

              {/* Content */}
              <h3 className="text-base font-medium text-white mb-2">
                {t(`features.${feature.key}.title`)}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                {t(`features.${feature.key}.desc`)}
              </p>

              {/* Highlight */}
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-1 h-1 rounded-full bg-[#5E6AD2]" />
                {t(`features.${feature.key}.highlight`)}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
})

FeaturesSection.displayName = 'FeaturesSection'

export { FeaturesSection as default }
