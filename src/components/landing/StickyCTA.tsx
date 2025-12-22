'use client'

import { memo, useState, useEffect } from 'react'
import { useI18n } from '@/i18n/client'
import { BG_COLORS } from '@/constants/design-tokens'

// ============================================
// Sticky CTA - Supabase-minimal style
// ============================================

export const StickyCTA = memo(function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const { locale } = useI18n()
  const isKo = locale === 'ko'

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
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-3 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pointer-events-none transition-transform duration-300 ease-out"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(120%)',
      }}
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <a
          href="/auth/signup"
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-primary hover:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span>{isKo ? '50 크레딧 무료로 시작' : 'Start with 50 Free Credits'}</span>
          <span>→</span>
        </a>

        <p className="text-center text-xs text-zinc-500 mt-2">
          {isKo ? '신용카드 불필요 · 3분이면 완료' : 'No credit card · 3 min setup'}
        </p>
      </div>
    </div>
  )
})

StickyCTA.displayName = 'StickyCTA'

export { StickyCTA as default }
