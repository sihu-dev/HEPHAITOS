'use client'

import { memo } from 'react'
import { useI18n } from '@/i18n/client'

// ============================================
// Pain Point Cards - i18n 지원
// ============================================

interface PainPoint {
  emoji: string
  problemKo: string
  problemEn: string
  solutionKo: string
  solutionEn: string
  number: number
}

const painPoints: PainPoint[] = [
  {
    number: 1,
    emoji: '⏰',
    problemKo: '퇴근하면 애들 봐야 하는데...',
    problemEn: 'No time after work with kids...',
    solutionKo: '3분이면 끝. 출퇴근 시간에 전략 완성',
    solutionEn: 'Done in 3 min. Build strategies during commute',
  },
  {
    number: 2,
    emoji: '🤔',
    problemKo: 'AI가 주식? 진짜 믿을 수 있나요?',
    problemEn: 'AI for stocks? Can I really trust it?',
    solutionKo: '4명 전문가 의견 모두 공개. 투명성',
    solutionEn: 'All 4 expert opinions shown. Full transparency',
  },
  {
    number: 3,
    emoji: '📉',
    problemKo: '손절 타이밍을 자꾸 놓쳐요...',
    problemEn: 'Keep missing stop-loss timing...',
    solutionKo: '알림: "손절 타이밍이에요!"',
    solutionEn: 'Alert: "Time to cut losses!"',
  },
  {
    number: 4,
    emoji: '💸',
    problemKo: '투자 자문 월 50만원? 너무 비싸요',
    problemEn: '$500/mo for advice? Too expensive',
    solutionKo: '쓴 만큼만 결제. 구독 NO',
    solutionEn: 'Pay as you go. No subscription',
  },
  {
    number: 5,
    emoji: '👥',
    problemKo: 'Nancy Pelosi 따라하고 싶어요',
    problemEn: 'Want to follow Nancy Pelosi',
    solutionKo: '무료 공개. 클릭 한 번에 미러링',
    solutionEn: 'Free access. One-click mirroring',
  },
]

export const PainPointCards = memo(function PainPointCards() {
  const { locale } = useI18n()
  const isKo = locale === 'ko'

  return (
    <section className="py-16 bg-[#0D0D0F]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {isKo ? '바쁜 직장인의 고민을 ' : 'Solve busy professionals\' problems '}
            <span className="text-gradient bg-gradient-to-r from-[#5E6AD2] to-[#7C8AEA] bg-clip-text text-transparent">
              {isKo ? '3분으로 해결' : 'in 3 minutes'}
            </span>
          </h2>
          <p className="text-sm text-zinc-400">
            {isKo
              ? '30-40대 재테크족 실제 Pain Point 기반'
              : 'Based on real pain points of 30s-40s investors'}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="space-y-4">
          {painPoints.map((point) => (
            <div
              key={point.number}
              className="
                group
                p-6
                glass
                rounded-2xl
                border
                border-white/[0.06]
                hover:border-[#5E6AD2]/30
                transition-all
                duration-300
                hover:scale-[1.02]
              "
            >
              <div className="flex items-start gap-4">
                {/* Number Badge + Emoji */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    {/* Number */}
                    <div className="
                      absolute
                      -top-2
                      -left-2
                      w-6
                      h-6
                      rounded-full
                      bg-[#5E6AD2]
                      flex
                      items-center
                      justify-center
                      text-xs
                      font-bold
                      text-white
                      z-10
                    ">
                      {point.number}
                    </div>
                    {/* Emoji */}
                    <div className="
                      w-16
                      h-16
                      rounded-xl
                      bg-[#5E6AD2]/10
                      border
                      border-[#5E6AD2]/20
                      flex
                      items-center
                      justify-center
                      text-3xl
                      group-hover:scale-110
                      transition-transform
                    ">
                      {point.emoji}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Problem */}
                  <p className="text-base text-white font-semibold mb-3 leading-snug">
                    "{isKo ? point.problemKo : point.problemEn}"
                  </p>

                  {/* Solution with arrow */}
                  <div className="flex items-start gap-2">
                    <span className="
                      flex-shrink-0
                      text-[#5E6AD2]
                      text-lg
                      font-bold
                      mt-0.5
                    ">
                      →
                    </span>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {isKo ? point.solutionKo : point.solutionEn}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="/auth/signup"
            className="
              inline-flex
              items-center
              gap-2
              px-8
              py-4
              bg-[#5E6AD2]
              hover:bg-[#7C8AEA]
              text-white
              rounded-xl
              text-base
              font-bold
              transition-all
              hover:scale-105
            "
          >
            <span>{isKo ? '50 크레딧 무료로 시작' : 'Start with 50 Free Credits'}</span>
            <span className="
              block
              w-2
              h-2
              border-t-2
              border-r-2
              border-white
              rotate-45
            "></span>
          </a>
          <p className="text-xs text-zinc-400 mt-4">
            {isKo
              ? '신용카드 등록 불필요 · 3분이면 첫 전략 완성'
              : 'No credit card required · First strategy in 3 min'}
          </p>
        </div>
      </div>
    </section>
  )
})

PainPointCards.displayName = 'PainPointCards'

export { PainPointCards as default }
