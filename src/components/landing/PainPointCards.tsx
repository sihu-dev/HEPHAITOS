'use client'

import { memo } from 'react'
import { useI18n } from '@/i18n/client'

// ============================================
// Pain Point Cards - Supabase-minimal style
// ============================================

interface PainPoint {
  emoji: string
  problemKo: string
  problemEn: string
  solutionKo: string
  solutionEn: string
}

const painPoints: PainPoint[] = [
  {
    emoji: '⏰',
    problemKo: '퇴근하면 애들 봐야 하는데...',
    problemEn: 'No time after work with kids...',
    solutionKo: '3분이면 끝. 출퇴근 시간에 전략 완성',
    solutionEn: 'Done in 3 min. Build strategies during commute',
  },
  {
    emoji: '🤔',
    problemKo: 'AI가 주식? 진짜 믿을 수 있나요?',
    problemEn: 'AI for stocks? Can I really trust it?',
    solutionKo: '4명 전문가 의견 모두 공개. 투명성',
    solutionEn: 'All 4 expert opinions shown. Full transparency',
  },
  {
    emoji: '📉',
    problemKo: '손절 타이밍을 자꾸 놓쳐요...',
    problemEn: 'Keep missing stop-loss timing...',
    solutionKo: '알림: "손절 타이밍이에요!"',
    solutionEn: 'Alert: "Time to cut losses!"',
  },
  {
    emoji: '💸',
    problemKo: '투자 자문 월 50만원? 너무 비싸요',
    problemEn: '$500/mo for advice? Too expensive',
    solutionKo: '쓴 만큼만 결제. 구독 NO',
    solutionEn: 'Pay as you go. No subscription',
  },
  {
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
    <section className="py-24 bg-[#0A0A0A]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-amber-500 font-medium mb-3">
            {isKo ? '문제 해결' : 'Pain Points'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
            {isKo ? '바쁜 직장인의 고민을 ' : 'Solve busy professionals\' problems '}
            <span className="text-zinc-500">
              {isKo ? '3분으로 해결' : 'in 3 minutes'}
            </span>
          </h2>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Emoji */}
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl flex-shrink-0">
                  {point.emoji}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-2">
                    "{isKo ? point.problemKo : point.problemEn}"
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">→</span>
                    <p className="text-sm text-zinc-400">
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <span>{isKo ? '50 크레딧 무료로 시작' : 'Start with 50 Free Credits'}</span>
            <span>→</span>
          </a>
          <p className="text-xs text-zinc-500 mt-4">
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
