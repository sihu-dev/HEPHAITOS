'use client'

import { memo } from 'react'
import { useI18n } from '@/i18n/client'
import { BG_COLORS } from '@/constants/design-tokens'

// ============================================
// Social Proof Section - Supabase-minimal style
// ============================================

interface UserStory {
  avatarEmoji: string
  nameKo: string
  nameEn: string
  ageRange: string
  roleKo: string
  roleEn: string
  quoteKo: string
  quoteEn: string
  detailKo: string
  detailEn: string
  resultKo: string
  resultEn: string
}

const userStories: UserStory[] = [
  {
    avatarEmoji: '👨‍💼',
    nameKo: '직장인 A',
    nameEn: 'User A',
    ageRange: '30s',
    roleKo: '마케팅 담당',
    roleEn: 'Marketing',
    quoteKo: '3분 만에 전략을 만들 수 있다니!',
    quoteEn: 'Built a strategy in just 3 minutes!',
    detailKo: '바쁜 일상 중에도 출퇴근 시간을 활용해 투자 전략을 학습하고 테스트할 수 있었습니다.',
    detailEn: 'Was able to learn and test investment strategies during commute time.',
    resultKo: '시간 절약',
    resultEn: 'Time saved',
  },
  {
    avatarEmoji: '👩‍💻',
    nameKo: '직장인 B',
    nameEn: 'User B',
    ageRange: '40s',
    roleKo: 'IT 개발자',
    roleEn: 'Developer',
    quoteKo: '투자 자문 비용을 크게 줄였어요',
    quoteEn: 'Significantly reduced advisory costs',
    detailKo: 'AI 기반 전략 생성 도구로 직접 전략을 만들고 검증할 수 있어 비용 효율적입니다.',
    detailEn: 'AI-based strategy tools let me build and validate strategies cost-effectively.',
    resultKo: '비용 절감',
    resultEn: 'Cost reduced',
  },
  {
    avatarEmoji: '👨‍🔧',
    nameKo: '직장인 C',
    nameEn: 'User C',
    ageRange: '30s',
    roleKo: '스타트업 PM',
    roleEn: 'Startup PM',
    quoteKo: '감정적 매매에서 벗어났어요',
    quoteEn: 'Escaped emotional trading',
    detailKo: '시스템 기반 알림으로 계획된 진입/청산 타이밍을 지킬 수 있게 되었습니다.',
    detailEn: 'System-based alerts helped me stick to planned entry/exit timing.',
    resultKo: '규칙적 매매',
    resultEn: 'Disciplined trading',
  },
]

export const SocialProofSection = memo(function SocialProofSection() {
  const { locale } = useI18n()
  const isKo = locale === 'ko'

  return (
    <section className={`py-24 ${BG_COLORS.secondary}`}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-primary font-medium mb-3">
            {isKo ? '사용 사례' : 'Use Cases'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
            {isKo ? '바쁜 ' : 'For Busy '}
            <span className="text-zinc-500">
              {isKo ? '30-40대' : '30s-40s'}
            </span>
            {isKo ? ' 직장인을 위한' : ' Professionals'}
          </h2>
          <p className="text-sm text-zinc-400">
            {isKo
              ? '이런 방식으로 HEPHAITOS를 활용할 수 있습니다'
              : 'How you can use HEPHAITOS'}
          </p>
        </div>

        {/* User Story Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {userStories.map((story, index) => (
            <div
              key={index}
              className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-lg"
            >
              {/* Avatar + Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl">
                  {story.avatarEmoji}
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    {isKo ? story.nameKo : story.nameEn}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {story.ageRange} · {isKo ? story.roleKo : story.roleEn}
                  </p>
                </div>
              </div>

              {/* Quote */}
              <p className="text-sm text-white font-medium mb-3">
                "{isKo ? story.quoteKo : story.quoteEn}"
              </p>

              {/* Detail */}
              <p className="text-xs text-zinc-400 mb-4">
                {isKo ? story.detailKo : story.detailEn}
              </p>

              {/* Result */}
              <span className="inline-flex px-2.5 py-1 bg-primary/10 border border-primary/20 rounded text-xs text-primary-400 font-medium">
                ✓ {isKo ? story.resultKo : story.resultEn}
              </span>
            </div>
          ))}
        </div>

        {/* Demo Notice */}
        <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg text-center">
          <p className="text-xs text-zinc-400">
            ⚠ {isKo
              ? '위 스토리는 예상 사용 시나리오입니다. 실제 투자 결과를 보장하지 않습니다.'
              : 'These are example use cases. Actual investment results are not guaranteed.'}
          </p>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { valueKo: '0줄', valueEn: '0 lines', labelKo: '코딩 불필요', labelEn: 'No coding' },
            { valueKo: '3분', valueEn: '3 min', labelKo: '시작 시간', labelEn: 'To start' },
            { valueKo: '무료', valueEn: 'Free', labelKo: '체험 가능', labelEn: 'To try' },
          ].map((item, index) => (
            <div
              key={index}
              className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg text-center"
            >
              <p className="text-2xl font-semibold text-white mb-1">
                {isKo ? item.valueKo : item.valueEn}
              </p>
              <p className="text-xs text-zinc-500">
                {isKo ? item.labelKo : item.labelEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

SocialProofSection.displayName = 'SocialProofSection'

export { SocialProofSection as default }
