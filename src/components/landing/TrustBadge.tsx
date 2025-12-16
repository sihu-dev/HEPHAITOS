'use client'

import { memo } from 'react'

// ============================================
// Trust Badge - Hero 바로 아래 배치
// 개선: 아이콘 완전 제거, 텍스트 강조로 대체
// ============================================

export const TrustBadge = memo(function TrustBadge() {
  return (
    <section className="
      py-8
      bg-gradient-to-r
      from-[#5E6AD2]/5
      via-[#7C8AEA]/5
      to-[#5E6AD2]/5
      border-y
      border-[#5E6AD2]/10
      backdrop-blur-sm
    ">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Main badge */}
        <div className="
          flex
          items-center
          justify-center
          gap-3
          px-6
          py-3
          mx-auto
          max-w-fit
          rounded-full
          bg-[#5E6AD2]/10
          border
          border-[#5E6AD2]/20
          backdrop-blur-md
        ">
          {/* Pulse dot */}
          <div className="relative flex h-3 w-3">
            <span className="
              animate-ping
              absolute
              inline-flex
              h-full
              w-full
              rounded-full
              bg-[#5E6AD2]
              opacity-75
            "></span>
            <span className="
              relative
              inline-flex
              rounded-full
              h-3
              w-3
              bg-[#5E6AD2]
            "></span>
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-sm text-white font-bold">
              <span className="text-[#5E6AD2]">데이터 기반</span> 투자 교육 플랫폼
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              코딩 없이 · 투명한 방식 · 교육 목적
            </p>
          </div>

          {/* Pulse dot */}
          <div className="relative flex h-3 w-3">
            <span className="
              animate-ping
              absolute
              inline-flex
              h-full
              w-full
              rounded-full
              bg-[#5E6AD2]
              opacity-75
            "></span>
            <span className="
              relative
              inline-flex
              rounded-full
              h-3
              w-3
              bg-[#5E6AD2]
            "></span>
          </div>
        </div>

        {/* Trust indicators - 실제 가치 제안 */}
        <div className="
          flex
          items-center
          justify-center
          gap-6
          mt-4
          text-xs
          text-zinc-400
        ">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#5E6AD2]">0줄</span>
            <span>코드</span>
          </div>
          <div className="w-px h-4 bg-zinc-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#5E6AD2]">3분</span>
            <span>시작</span>
          </div>
          <div className="w-px h-4 bg-zinc-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#5E6AD2]">무료</span>
            <span>체험</span>
          </div>
        </div>
      </div>
    </section>
  )
})

TrustBadge.displayName = 'TrustBadge'

export { TrustBadge as default }
