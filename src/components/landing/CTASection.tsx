'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/i18n/client'
import { PHASE_COLORS, BG_COLORS } from '@/constants/design-tokens'

// ============================================
// HEPHAITOS CTA Section
// Supabase-inspired minimal design
// ============================================

export const CTASection = memo(function CTASection() {
  const { t, locale } = useI18n()
  const isKo = locale === 'ko'

  const pains = t('cta.pains') as unknown as string[]
  const solutions = t('cta.solutions') as unknown as string[]

  return (
    <section className={`py-24 ${BG_COLORS.secondary}`}>
      <div className="max-w-4xl mx-auto px-6">
        {/* Pain → Solution Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Pain Side */}
          <div className="p-6 bg-zinc-900/50 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-sm">✕</span>
              <h3 className="text-sm font-medium text-red-400">
                {t('cta.painTitle')}
              </h3>
            </div>
            <ul className="space-y-3">
              {Array.isArray(pains) && pains.map((pain: string) => (
                <li key={pain} className="flex items-start gap-2">
                  <span className="text-red-400/60 mt-0.5">–</span>
                  <span className="text-sm text-zinc-400">{pain}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solution Side */}
          <div className="p-6 bg-zinc-900/50 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">✓</span>
              <h3 className="text-sm font-medium text-amber-400">
                {t('cta.solutionTitle')}
              </h3>
            </div>
            <ul className="space-y-3">
              {Array.isArray(solutions) && solutions.map((solution: string) => (
                <li key={solution} className="flex items-start gap-2">
                  <span className="text-amber-400/60 mt-0.5">+</span>
                  <span className="text-sm text-zinc-400">{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main CTA Box */}
        <div className="p-8 md:p-12 bg-zinc-900/50 border border-zinc-800 rounded-lg text-center">
          <p className="text-sm text-amber-500 font-medium mb-3">
            {isKo ? '지금 시작 가능' : 'Start Now'}
          </p>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4">
            {t('cta.headline1')}
            <br />
            <span className="text-zinc-500">{t('cta.headline2')}</span>
          </h2>

          <p className="text-zinc-400 max-w-lg mx-auto mb-8">
            {t('cta.subheadline1')} {t('cta.subheadline2')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t('cta.button')}
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t('cta.demoButton')}
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
            <span>{t('cta.trust.noCard')}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700 self-center" />
            <span>{t('cta.trust.trial')}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700 self-center" />
            <span>{t('cta.trust.cancelAnytime')}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { value: isKo ? '5분' : '5 min', label: isKo ? '첫 전략 생성' : 'First Strategy' },
            { value: isKo ? '₩400만+' : '$3K+', label: isKo ? '절약 비용' : 'Saved' },
            { value: isKo ? '0줄' : '0 lines', label: isKo ? '코딩 필요' : 'Code Needed' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg text-center"
            >
              <p className="text-xl font-semibold text-white mb-1">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-amber-400">⚠</span>
            <p className="text-sm text-zinc-400">
              <span className="text-amber-400 font-medium">{t('common.important')}:</span>{' '}
              {t('cta.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
})

CTASection.displayName = 'CTASection'

export { CTASection as default }
