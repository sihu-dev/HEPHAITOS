'use client'

import { memo } from 'react'
import { useI18n } from '@/i18n/client'
import Link from 'next/link'

// ============================================
// HEPHAITOS Features Section
// Supabase-inspired minimal design
// ============================================

const features = [
  {
    titleKo: '포트폴리오 미러링',
    titleEn: 'Portfolio Mirroring',
    descKo: '워렌 버핏, 캐시 우드 등 유명 투자자의 포트폴리오를 실시간으로 따라하세요.',
    descEn: 'Follow portfolios of famous investors like Warren Buffett, Cathie Wood in real-time.',
    href: '/dashboard/mirroring',
    badge: 'COPY',
    badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  {
    titleKo: 'AI 코칭',
    titleEn: 'AI Coaching',
    descKo: '투자 결정에 대해 AI 멘토와 대화하고, 실시간 피드백을 받으세요.',
    descEn: 'Chat with AI mentor about your investment decisions and get real-time feedback.',
    href: '/dashboard/coaching',
    badge: 'LEARN',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    titleKo: '전략 빌더',
    titleEn: 'Strategy Builder',
    descKo: '자연어로 전략을 설명하면 AI가 자동매매 봇을 생성합니다.',
    descEn: 'Describe your strategy in natural language, and AI creates an automated trading bot.',
    href: '/dashboard/ai-strategy',
    badge: 'BUILD',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
]

const additionalFeatures = [
  { nameKo: '백테스팅', nameEn: 'Backtesting', descKo: '10년 데이터로 검증', descEn: '10 years of data' },
  { nameKo: '실시간 알림', nameEn: 'Real-time Alerts', descKo: '매매 신호 즉시 알림', descEn: 'Instant trade signals' },
  { nameKo: '증권사 연동', nameEn: 'Broker Integration', descKo: '3분 내 연동 완료', descEn: '3 min setup' },
  { nameKo: '시장 리포트', nameEn: 'Market Reports', descKo: 'AI 분석 리포트', descEn: 'AI analysis reports' },
]

export const FeaturesSection = memo(function FeaturesSection() {
  const { locale } = useI18n()
  const isKo = locale === 'ko'

  return (
    <section id="features" className="py-24 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm text-yellow-500 font-medium mb-3">
            {isKo ? '기능' : 'Features'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
            {isKo ? 'Copy · Learn · Build' : 'Copy · Learn · Build'}
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            {isKo
              ? '따라하기부터 시작해서, 배우고, 나만의 전략을 만드세요.'
              : 'Start by copying, learn along the way, and build your own strategies.'}
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
            >
              {/* Badge */}
              <span className={`inline-block px-2 py-0.5 mb-4 rounded text-xs font-medium border ${feature.badgeColor}`}>
                {feature.badge}
              </span>

              {/* Title */}
              <h3 className="text-lg font-medium text-white mb-2 group-hover:text-yellow-400 transition-colors">
                {isKo ? feature.titleKo : feature.titleEn}
              </h3>

              {/* Description */}
              <p className="text-sm text-zinc-400 leading-relaxed">
                {isKo ? feature.descKo : feature.descEn}
              </p>

              {/* Arrow */}
              <div className="mt-4 text-zinc-600 group-hover:text-yellow-400 transition-colors">
                <span className="text-sm">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {additionalFeatures.map((feature) => (
            <div
              key={feature.nameEn}
              className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg"
            >
              <p className="text-sm text-white font-medium mb-1">
                {isKo ? feature.nameKo : feature.nameEn}
              </p>
              <p className="text-xs text-zinc-500">
                {isKo ? feature.descKo : feature.descEn}
              </p>
            </div>
          ))}
        </div>

        {/* Journey Indicator */}
        <div className="flex items-center justify-center gap-4 mt-16">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-zinc-500">COPY</span>
          </div>
          <div className="w-8 h-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-zinc-500">LEARN</span>
          </div>
          <div className="w-8 h-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-zinc-500">BUILD</span>
          </div>
        </div>
      </div>
    </section>
  )
})

FeaturesSection.displayName = 'FeaturesSection'

export { FeaturesSection as default }
