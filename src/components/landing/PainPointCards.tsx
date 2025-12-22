'use client'

import { memo } from 'react'
import { useI18n } from '@/i18n/client'
import { BG_COLORS, PHASE_COLORS } from '@/constants/design-tokens'

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
    emoji: '📈',
    problemKo: '유튜브 따라했는데 주가는 이미 올라간 후',
    problemEn: 'Followed YouTube picks but price already jumped',
    solutionKo: '셀럽 거래 실시간 공개, 늦지 않습니다',
    solutionEn: 'Celebrity trades in real-time, never late',
  },
  {
    emoji: '💻',
    problemKo: 'Python 공부하려다 포기한 퀀트 투자',
    problemEn: 'Gave up quant trading learning Python',
    solutionKo: '코딩 1도 몰라도 OK, 한국어면 충분',
    solutionEn: 'Zero coding needed, just speak Korean',
  },
  {
    emoji: '💳',
    problemKo: '매달 ₩9,900 내는데 이번 달 안 쓴 구독',
    problemEn: 'Paying ₩9,900/mo but didnt use it this month',
    solutionKo: '월 구독 NO, 쓴 만큼만 크레딧 충전',
    solutionEn: 'No subscription, pay as you go credits',
  },
  {
    emoji: '👥',
    problemKo: 'Nancy Pelosi 따라하고 싶은데 방법 모름',
    problemEn: 'Want to follow Nancy Pelosi but dont know how',
    solutionKo: 'Nancy Pelosi 포트폴리오 무료 공개',
    solutionEn: 'Nancy Pelosi portfolio for free',
  },
  {
    emoji: '🤖',
    problemKo: '자동매매? 코딩 몰라서 포기',
    problemEn: 'Automated trading? Gave up, cant code',
    solutionKo: '시스템이 감정 빼고 데이터로만 판단',
    solutionEn: 'System judges by data only, no emotion',
  },
]

export const PainPointCards = memo(function PainPointCards() {
  const { locale } = useI18n()
  const isKo = locale === 'ko'

  return (
    <section className={`py-24 ${BG_COLORS.secondary}`}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-primary font-medium mb-3">
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
                    <span className="text-primary-400">→</span>
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors"
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
