'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/i18n/client'

// ============================================
// HEPHAITOS Hero Section
// Supabase-inspired minimal design
// ============================================

export const HeroSection = memo(function HeroSection() {
  const { t, locale } = useI18n()
  const isKo = locale === 'ko'

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-zinc-800 bg-zinc-900/50">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-zinc-400">
            {isKo ? '크레딧 기반 트레이딩 플랫폼' : 'Credit-based Trading Platform'}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white tracking-tight leading-[1.1] mb-6">
          {isKo ? (
            <>
              코딩 없이 만드는<br />
              <span className="text-zinc-500">나만의 AI 트레이딩 봇</span>
            </>
          ) : (
            <>
              Build AI Trading Bots<br />
              <span className="text-zinc-500">Without Writing Code</span>
            </>
          )}
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          {isKo
            ? '자연어로 전략을 설명하면, AI가 자동으로 트레이딩 봇을 생성합니다. 셀럽 포트폴리오 따라하기부터 나만의 전략 구축까지.'
            : 'Describe your strategy in plain language, and AI builds your trading bot automatically. From copying celebrity portfolios to building your own strategies.'}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isKo ? '무료로 시작하기' : 'Start your project'}
          </Link>
          <Link
            href="/demo"
            className="w-full sm:w-auto px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isKo ? '데모 보기' : 'View demo'}
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 mt-12 text-sm text-zinc-500">
          <span>{isKo ? '신용카드 불필요' : 'No credit card required'}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span>{isKo ? '50 크레딧 무료' : '50 free credits'}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span>{isKo ? '3분 설정' : '3 min setup'}</span>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
    </section>
  )
})

HeroSection.displayName = 'HeroSection'

export { HeroSection as default }
