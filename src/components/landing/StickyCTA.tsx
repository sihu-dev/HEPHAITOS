'use client'

import { memo, useState, useEffect } from 'react'

// ============================================
// Sticky CTA - 하단 고정 버튼
// 개선: 아이콘 완전 제거, CSS 화살표로 대체
// ============================================

export const StickyCTA = memo(function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight
      setIsVisible(window.scrollY > heroHeight)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        px-4
        pb-4
        pt-3
        bg-gradient-to-t
        from-[#0D0D0F]
        via-[#0D0D0F]/95
        to-transparent
        pointer-events-none
        transition-transform
        duration-300
        ease-out
      "
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(120%)',
      }}
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <a
          href="/auth/signup"
          className="
            group
            flex
            items-center
            justify-center
            gap-2
            w-full
            py-4
            px-6
            bg-gradient-to-r
            from-[#5E6AD2]
            to-[#7C8AEA]
            hover:from-[#7C8AEA]
            hover:to-[#5E6AD2]
            text-white
            rounded-xl
            text-sm
            font-semibold
            shadow-lg
            shadow-[#5E6AD2]/40
            transition-all
            duration-300
            active:scale-[0.97]
            hover:shadow-2xl
            hover:shadow-[#5E6AD2]/60
            relative
            overflow-hidden
          "
        >
          {/* Animated shimmer */}
          <div className="
            absolute
            inset-0
            bg-gradient-to-r
            from-transparent
            via-white/10
            to-transparent
            translate-x-[-100%]
            group-hover:translate-x-[100%]
            transition-transform
            duration-1000
          " />

          <span className="relative z-10">50 크레딧 무료로 시작</span>

          {/* CSS Arrow (no icon) */}
          <span className="
            relative
            z-10
            w-5
            h-5
            flex
            items-center
            justify-center
            group-hover:translate-x-1
            transition-transform
            duration-300
          ">
            <span className="
              block
              w-2
              h-2
              border-t-2
              border-r-2
              border-white
              rotate-45
            "></span>
          </span>
        </a>

        {/* Sub text */}
        <p className="
          text-center
          text-xs
          text-zinc-400
          mt-2
          opacity-0
          animate-[fadeIn_0.5s_ease-out_0.3s_forwards]
        ">
          신용카드 불필요 · 3분이면 완료
        </p>
      </div>
    </div>
  )
})

StickyCTA.displayName = 'StickyCTA'

export { StickyCTA as default }
