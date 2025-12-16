'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/i18n/client'

// ============================================
// HEPHAITOS Pricing Section
// Supabase-inspired minimal design
// ============================================

interface CreditPackage {
  id: string
  name: string
  nameKo: string
  credits: number
  bonus: number
  priceKrw: number
  priceUsd: number
  highlight?: boolean
  popular?: boolean
}

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    nameKo: '스타터',
    credits: 100,
    bonus: 0,
    priceKrw: 9900,
    priceUsd: 7.99,
  },
  {
    id: 'basic',
    name: 'Basic',
    nameKo: '베이직',
    credits: 500,
    bonus: 50,
    priceKrw: 39000,
    priceUsd: 29.99,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    nameKo: '프로',
    credits: 1000,
    bonus: 150,
    priceKrw: 69000,
    priceUsd: 54.99,
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameKo: '엔터프라이즈',
    credits: 5000,
    bonus: 1000,
    priceKrw: 299000,
    priceUsd: 239.99,
  },
]

const creditCosts = [
  { feature: 'Celebrity Mirroring', featureKo: '셀럽 포트폴리오 미러링', credits: 0 },
  { feature: 'Learning Guide', featureKo: '학습 가이드 질문', credits: 1 },
  { feature: 'Strategy Engine', featureKo: '전략 엔진', credits: 10 },
  { feature: 'Backtest (1 Year)', featureKo: '백테스트 (1년)', credits: 3 },
  { feature: 'Live Coaching', featureKo: '라이브 코칭 (30분)', credits: 20 },
  { feature: 'Market Report', featureKo: '시장 리포트', credits: 3 },
]

export const PricingSection = memo(function PricingSection() {
  const { locale } = useI18n()
  const isKo = locale === 'ko'

  const formatPrice = (krw: number, usd: number) => {
    return isKo ? `₩${krw.toLocaleString()}` : `$${usd}`
  }

  const getPerCreditPrice = (pkg: CreditPackage) => {
    const totalCredits = pkg.credits + pkg.bonus
    const perCredit = isKo
      ? Math.round(pkg.priceKrw / totalCredits)
      : (pkg.priceUsd / totalCredits).toFixed(2)
    return isKo ? `₩${perCredit}` : `$${perCredit}`
  }

  return (
    <section id="pricing" className="py-24 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm text-yellow-500 font-medium mb-3">
            {isKo ? '가격' : 'Pricing'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
            {isKo ? '쓴 만큼만 결제' : 'Pay As You Go'}
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            {isKo
              ? '월 구독료 부담 없이, 사용한 기능만큼만 크레딧으로 결제하세요.'
              : 'No monthly fees. Just buy credits and use them for any feature.'}
          </p>
        </div>

        {/* Credit Cost Table */}
        <div className="mb-16">
          <h3 className="text-sm text-zinc-500 uppercase tracking-wider text-center mb-6">
            {isKo ? '기능별 크레딧 비용' : 'Credit Costs'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {creditCosts.map((cost) => (
              <div
                key={cost.feature}
                className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">
                    {isKo ? cost.featureKo : cost.feature}
                  </span>
                  <span className={`text-sm font-medium ${cost.credits === 0 ? 'text-yellow-400' : 'text-zinc-400'}`}>
                    {cost.credits === 0
                      ? isKo ? '무료' : 'FREE'
                      : `${cost.credits}C`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Packages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative p-6 rounded-lg border transition-colors ${
                pkg.highlight
                  ? 'bg-yellow-500/5 border-yellow-500/30'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300">
                  {isKo ? '인기' : 'Popular'}
                </span>
              )}

              {/* Highlight Badge */}
              {pkg.highlight && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-yellow-500 rounded text-xs text-white font-medium">
                  {isKo ? '추천' : 'Best Value'}
                </span>
              )}

              {/* Package Name */}
              <h4 className="text-sm text-zinc-400 mb-2">
                {isKo ? pkg.nameKo : pkg.name}
              </h4>

              {/* Credits */}
              <div className="mb-4">
                <span className="text-3xl font-semibold text-white">
                  {pkg.credits.toLocaleString()}
                </span>
                <span className="text-sm text-zinc-500 ml-1">
                  {isKo ? '크레딧' : 'credits'}
                </span>
                {pkg.bonus > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                    +{pkg.bonus}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className={`text-xl font-semibold ${pkg.highlight ? 'text-yellow-400' : 'text-white'}`}>
                  {formatPrice(pkg.priceKrw, pkg.priceUsd)}
                </span>
                <p className="text-xs text-zinc-500 mt-1">
                  {getPerCreditPrice(pkg)} / {isKo ? '크레딧' : 'credit'}
                </p>
              </div>

              {/* CTA */}
              <Link
                href={`/auth/signup?package=${pkg.id}`}
                className={`w-full flex items-center justify-center py-2.5 rounded-md text-sm font-medium transition-colors ${
                  pkg.highlight
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                {isKo ? '구매하기' : 'Buy Now'}
              </Link>
            </div>
          ))}
        </div>

        {/* Free Signup Banner */}
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-medium text-white mb-1">
                {isKo ? '신규 가입 보너스' : 'New User Bonus'}
              </h4>
              <p className="text-sm text-zinc-400">
                {isKo
                  ? '가입만 하면 50 크레딧 무료 지급! 신용카드 등록 불필요.'
                  : 'Get 50 free credits just by signing up! No credit card required.'}
              </p>
            </div>
            <Link
              href="/auth/signup"
              className="flex-shrink-0 px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md text-sm font-medium transition-colors"
            >
              {isKo ? '50 크레딧 받기' : 'Get 50 Credits'}
            </Link>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { labelKo: '만료 없음', labelEn: 'No Expiration', descKo: '크레딧은 평생 유효', descEn: 'Credits never expire' },
            { labelKo: '환불 가능', labelEn: 'Refundable', descKo: '미사용 크레딧 환불', descEn: 'Unused credits refundable' },
            { labelKo: '투명한 과금', labelEn: 'Transparent', descKo: '사용 내역 실시간 확인', descEn: 'Real-time usage tracking' },
          ].map((feature) => (
            <div
              key={feature.labelEn}
              className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg text-center"
            >
              <p className="text-sm text-white font-medium mb-1">
                {isKo ? feature.labelKo : feature.labelEn}
              </p>
              <p className="text-xs text-zinc-500">
                {isKo ? feature.descKo : feature.descEn}
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400">⚠</span>
            <p className="text-sm text-zinc-400">
              <span className="text-yellow-400 font-medium">
                {isKo ? '중요' : 'Important'}:
              </span>{' '}
              {isKo
                ? 'HEPHAITOS는 투자 조언을 제공하지 않습니다. 모든 플랜은 교육 도구입니다.'
                : 'HEPHAITOS does not provide investment advice. All plans are educational tools.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
})

PricingSection.displayName = 'PricingSection'

export { PricingSection as default }
