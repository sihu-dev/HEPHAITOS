'use client'

import { memo } from 'react'
import { useI18n } from '@/i18n/client'

// ============================================
// Social Proof Section - User Stories
// 개선: 가짜 리뷰 제거, 데모용 스토리로 명시
// i18n 지원 추가
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

// 데모용 사용자 스토리 (실제 리뷰 아님)
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
    <section className="py-16 bg-[#0D0D0F]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {isKo ? '바쁜 ' : 'For Busy '}
            <span className="text-gradient bg-gradient-to-r from-[#5E6AD2] to-[#7C8AEA] bg-clip-text text-transparent">
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
        <div className="space-y-4 mb-12">
          {userStories.map((story, index) => (
            <div
              key={index}
              className="
                p-6
                glass
                rounded-2xl
                border
                border-white/[0.06]
                hover:border-[#5E6AD2]/20
                transition-all
                duration-300
              "
            >
              {/* Quote */}
              <p className="text-lg text-white font-bold mb-4 leading-snug">
                "{isKo ? story.quoteKo : story.quoteEn}"
              </p>

              {/* Profile */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar Emoji */}
                  <div className="
                    w-12
                    h-12
                    rounded-full
                    bg-gradient-to-br
                    from-[#5E6AD2]
                    to-[#7C8AEA]
                    flex
                    items-center
                    justify-center
                    text-2xl
                  ">
                    {story.avatarEmoji}
                  </div>
                  <div>
                    <p className="text-sm text-white font-semibold">
                      {isKo ? story.nameKo : story.nameEn}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {story.ageRange} · {isKo ? story.roleKo : story.roleEn}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail + Result */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-sm text-zinc-300 mb-2">
                  {isKo ? story.detailKo : story.detailEn}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/20">
                  <span className="text-sm font-bold text-[#5E6AD2]">
                    ✓ {isKo ? story.resultKo : story.resultEn}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Notice */}
        <div className="mb-8 p-3 border border-zinc-700 bg-zinc-800/50 rounded-lg text-center">
          <p className="text-xs text-zinc-500">
            {isKo
              ? '※ 위 스토리는 예상 사용 시나리오입니다. 실제 투자 결과를 보장하지 않습니다.'
              : '※ These are example use cases. Actual investment results are not guaranteed.'}
          </p>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 glass rounded-xl text-center">
            <p className="text-3xl font-bold text-[#5E6AD2] mb-1">
              {isKo ? '0줄' : '0 lines'}
            </p>
            <p className="text-xs text-zinc-400">
              {isKo ? '코딩 불필요' : 'No coding'}
            </p>
          </div>
          <div className="p-6 glass rounded-xl text-center">
            <p className="text-3xl font-bold text-[#5E6AD2] mb-1">
              {isKo ? '3분' : '3 min'}
            </p>
            <p className="text-xs text-zinc-400">
              {isKo ? '시작 시간' : 'To start'}
            </p>
          </div>
          <div className="p-6 glass rounded-xl text-center">
            <p className="text-3xl font-bold text-[#5E6AD2] mb-1">
              {isKo ? '무료' : 'Free'}
            </p>
            <p className="text-xs text-zinc-400">
              {isKo ? '체험 가능' : 'To try'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
})

SocialProofSection.displayName = 'SocialProofSection'

export { SocialProofSection as default }
