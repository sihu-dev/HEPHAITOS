'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/i18n/client'

// ============================================
// HEPHAITOS Credit-Based Pricing Section
// 크레딧 기반 가격 체계 - 구독제 아님!
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

interface CreditCost {
  feature: string
  featureKo: string
  credits: number
  description: string
  descriptionKo: string
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

const creditCosts: CreditCost[] = [
  {
    feature: 'Celebrity Mirroring',
    featureKo: '셀럽 포트폴리오 미러링',
    credits: 0,
    description: 'Free entry point',
    descriptionKo: '무료 진입점',
  },
  {
    feature: 'Learning Guide Question',
    featureKo: '학습 가이드 질문',
    credits: 1,
    description: 'Low-cost learning',
    descriptionKo: '저렴한 학습',
  },
  {
    feature: 'Strategy Engine',
    featureKo: '전략 엔진',
    credits: 10,
    description: 'Core value',
    descriptionKo: '핵심 가치',
  },
  {
    feature: 'Backtest (1 Year)',
    featureKo: '백테스트 (1년)',
    credits: 3,
    description: 'Validation',
    descriptionKo: '검증 필수',
  },
  {
    feature: 'Live Coaching (30min)',
    featureKo: '라이브 코칭 (30분)',
    credits: 20,
    description: 'Premium support',
    descriptionKo: '프리미엄 지원',
  },
  {
    feature: 'Market Report',
    featureKo: '시장 리포트',
    credits: 3,
    description: 'Market insights',
    descriptionKo: '시장 인사이트',
  },
]

export const PricingSection = memo(function PricingSection() {
  const { t, locale } = useI18n()
  const isKo = locale === 'ko'

  const formatPrice = (krw: number, usd: number) => {
    if (isKo) {
      return `₩${krw.toLocaleString()}`
    }
    return `$${usd}`
  }

  const getPerCreditPrice = (pkg: CreditPackage) => {
    const totalCredits = pkg.credits + pkg.bonus
    const perCredit = isKo
      ? Math.round(pkg.priceKrw / totalCredits)
      : (pkg.priceUsd / totalCredits).toFixed(2)
    return isKo ? `₩${perCredit}` : `$${perCredit}`
  }

  return (
    <section id="pricing" className="py-20 lg:py-32 bg-[#0D0D0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-xs text-[#5E6AD2] uppercase tracking-wider font-medium">
            {isKo ? '가격' : 'Pricing'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-medium text-white mt-3 mb-4">
            {isKo ? '쓴 만큼만 결제' : 'Pay As You Go'}
            <br />
            <span className="text-zinc-400">
              {isKo ? '구독 없음, 크레딧 기반' : 'No Subscription, Credit-Based'}
            </span>
          </h2>
          <p className="text-base text-zinc-400 max-w-lg mx-auto">
            {isKo
              ? '월 구독료 부담 없이, 사용한 기능만큼만 크레딧으로 결제하세요.'
              : 'No monthly fees. Just buy credits and use them for any feature.'}
          </p>
        </div>

        {/* Credit Cost Table */}
        <div className="mb-12">
          <h3 className="text-sm text-zinc-400 uppercase tracking-wider text-center mb-6">
            {isKo ? '기능별 크레딧 비용' : 'Credit Costs by Feature'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {creditCosts.map((cost) => (
              <div
                key={cost.feature}
                className="p-4 glass rounded-lg hover:glass-strong transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium">
                    {isKo ? cost.featureKo : cost.feature}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      cost.credits === 0 ? 'text-emerald-400' : 'text-[#5E6AD2]'
                    }`}
                  >
                    {cost.credits === 0
                      ? isKo
                        ? '무료'
                        : 'FREE'
                      : `${cost.credits} ${isKo ? '크레딧' : 'credits'}`}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {isKo ? cost.descriptionKo : cost.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Packages */}
        <div className="mb-12">
          <h3 className="text-sm text-zinc-400 uppercase tracking-wider text-center mb-6">
            {isKo ? '크레딧 패키지' : 'Credit Packages'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative p-6 rounded-lg transition-all ${
                  pkg.highlight
                    ? 'glass-primary glow-primary'
                    : pkg.popular
                    ? 'glass border-[#5E6AD2]/30'
                    : 'glass'
                }`}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-[#5E6AD2]/20 border border-[#5E6AD2]/30 rounded-full text-xs text-[#7C8AEA] font-medium">
                      {isKo ? '인기' : 'Popular'}
                    </span>
                  </div>
                )}

                {/* Package Name */}
                <h4 className="text-base font-medium text-white mb-1">
                  {isKo ? pkg.nameKo : pkg.name}
                </h4>

                {/* Credits */}
                <div className="mb-3">
                  <span className="text-3xl font-bold text-white">
                    {pkg.credits.toLocaleString()}
                  </span>
                  <span className="text-sm text-zinc-400 ml-1">
                    {isKo ? '크레딧' : 'credits'}
                  </span>
                  {pkg.bonus > 0 && (
                    <div className="text-xs text-emerald-400 mt-1">
                      +{pkg.bonus} {isKo ? '보너스' : 'bonus'}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-xl font-medium text-[#5E6AD2]">
                    {formatPrice(pkg.priceKrw, pkg.priceUsd)}
                  </span>
                  <p className="text-xs text-zinc-500 mt-1">
                    {getPerCreditPrice(pkg)} / {isKo ? '크레딧' : 'credit'}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={`/auth/signup?package=${pkg.id}`}
                  className={`w-full flex items-center justify-center py-2.5 rounded text-sm font-medium transition-all ${
                    pkg.highlight
                      ? 'bg-[#5E6AD2] hover:bg-[#7C8AEA] text-white'
                      : 'glass hover:glass-strong text-white'
                  }`}
                >
                  {isKo ? '구매하기' : 'Buy Now'}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Free Signup Banner */}
        <div className="mb-12 p-6 glass-primary rounded-lg bg-gradient-to-r from-emerald-500/10 via-transparent to-[#5E6AD2]/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="text-2xl">🎁</span>
                <h4 className="text-lg font-medium text-white">
                  {isKo ? '신규 가입 보너스' : 'New User Bonus'}
                </h4>
              </div>
              <p className="text-sm text-zinc-400">
                {isKo
                  ? '가입만 하면 50 크레딧 무료 지급! 신용카드 등록 불필요.'
                  : 'Get 50 free credits just by signing up! No credit card required.'}
              </p>
            </div>
            <Link
              href="/auth/signup"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-all"
            >
              {isKo ? '50 크레딧 받기' : 'Get 50 Credits'}
            </Link>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 glass rounded-lg text-center hover:glass-strong transition-all">
            <p className="text-sm text-white mb-1">
              {isKo ? '만료 없음' : 'No Expiration'}
            </p>
            <p className="text-xs text-zinc-400">
              {isKo ? '크레딧은 평생 유효' : 'Credits never expire'}
            </p>
          </div>
          <div className="p-4 glass rounded-lg text-center hover:glass-strong transition-all">
            <p className="text-sm text-white mb-1">
              {isKo ? '환불 가능' : 'Refundable'}
            </p>
            <p className="text-xs text-zinc-400">
              {isKo ? '미사용 크레딧 환불' : 'Unused credits refundable'}
            </p>
          </div>
          <div className="p-4 glass rounded-lg text-center hover:glass-strong transition-all">
            <p className="text-sm text-white mb-1">
              {isKo ? '투명한 과금' : 'Transparent Billing'}
            </p>
            <p className="text-xs text-zinc-400">
              {isKo ? '사용 내역 실시간 확인' : 'Real-time usage tracking'}
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl text-amber-400 flex-shrink-0">⚠</span>
            <div className="text-xs text-zinc-400 leading-relaxed">
              <p className="font-medium text-amber-400 mb-1">
                {isKo ? '중요' : 'Important'}
              </p>
              <p>
                HEPHAITOS{' '}
                <strong className="text-white">
                  {isKo
                    ? '투자 조언을 제공하지 않습니다'
                    : 'does not provide investment advice'}
                </strong>
                .{' '}
                {isKo
                  ? '모든 플랜은 교육 도구입니다. 투자 결정과 결과는 본인 책임입니다.'
                  : 'All plans are educational tools. Investment decisions and outcomes are your responsibility.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

PricingSection.displayName = 'PricingSection'

export { PricingSection as default }
