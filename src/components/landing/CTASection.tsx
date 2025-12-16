'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/i18n/client'

// ============================================
// Linear 2025 Design System
// Pain Point based final CTA
// "Escape this Pain" message
// ============================================

export const CTASection = memo(function CTASection() {
  const { t } = useI18n()

  const pains = t('cta.pains') as unknown as string[]
  const solutions = t('cta.solutions') as unknown as string[]

  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pain → Solution Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Pain Side */}
          <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl text-red-400">❌</span>
              <h3 className="text-sm font-medium text-red-400">{t('cta.painTitle')}</h3>
            </div>
            <ul className="space-y-3">
              {Array.isArray(pains) && pains.map((pain: string) => (
                <li key={pain} className="flex items-start gap-2">
                  <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center text-red-400">•</span>
                  <span className="text-sm text-red-300">{pain}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solution Side */}
          <div className="p-6 border border-[#5E6AD2]/20 bg-[#5E6AD2]/5 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl text-[#5E6AD2]">✓</span>
              <h3 className="text-sm font-medium text-[#5E6AD2]">{t('cta.solutionTitle')}</h3>
            </div>
            <ul className="space-y-3">
              {Array.isArray(solutions) && solutions.map((solution: string) => (
                <li key={solution} className="flex items-start gap-2">
                  <span className="text-[#5E6AD2] mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-sm text-[#5E6AD2]">{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main CTA Box */}
        <div className="p-8 glass-ultra rounded-lg bg-gradient-to-br from-[#5E6AD2]/10 to-[#7C8AEA]/5 text-center">
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl font-medium text-white mb-4">
            {t('cta.headline1')}
            <br />
            <span className="text-[#5E6AD2]">{t('cta.headline2')}</span>
          </h2>

          <p className="text-base text-zinc-400 mb-8 max-w-md mx-auto">
            {t('cta.subheadline1')}
            <br className="hidden sm:block" />
            {t('cta.subheadline2')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5E6AD2] text-white rounded text-sm font-medium hover:bg-[#7C8AEA] glow-primary animate-pulse-glow transition-all"
            >
              {t('cta.button')}
              <span className="inline-block w-2 h-2 border-t-2 border-r-2 border-white rotate-45"></span>
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 text-zinc-400 hover:text-white glass hover:glass-strong rounded text-sm transition-all"
            >
              {t('cta.demoButton')}
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="text-[#5E6AD2]">✓</span>
              <span>{t('cta.trust.noCard')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#5E6AD2]">✓</span>
              <span>{t('cta.trust.trial')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#5E6AD2]">✓</span>
              <span>{t('cta.trust.cancelAnytime')}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="p-4 glass rounded-lg text-center hover:glass-strong transition-all">
            <p className="text-2xl font-medium text-white mb-1">{t('cta.stats.firstStrategy')}</p>
            <p className="text-xs text-zinc-400">{t('cta.stats.firstStrategyLabel')}</p>
          </div>
          <div className="p-4 glass rounded-lg text-center hover:glass-strong transition-all">
            <p className="text-2xl font-medium text-white mb-1">{t('cta.stats.savings')}</p>
            <p className="text-xs text-zinc-400">{t('cta.stats.savingsLabel')}</p>
          </div>
          <div className="p-4 glass rounded-lg text-center hover:glass-strong transition-all">
            <p className="text-2xl font-medium text-white mb-1">{t('cta.stats.coding')}</p>
            <p className="text-xs text-zinc-400">{t('cta.stats.codingLabel')}</p>
          </div>
        </div>

        {/* Final Disclaimer */}
        <div className="mt-8 p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl text-amber-400 flex-shrink-0">⚠</span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <span className="text-amber-400">{t('common.important')}:</span> {t('cta.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
})

CTASection.displayName = 'CTASection'

export { CTASection as default }
