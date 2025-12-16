'use client'

import { memo } from 'react'
import { useI18n } from '@/i18n/client'

// ============================================
// Trust Badge - Supabase-minimal style
// ============================================

export const TrustBadge = memo(function TrustBadge() {
  const { locale } = useI18n()
  const isKo = locale === 'ko'

  return (
    <section className="py-8 bg-zinc-900/50 border-y border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Main badge */}
        <div className="flex items-center justify-center gap-3 px-6 py-3 mx-auto max-w-fit rounded-full bg-yellow-500/10 border border-yellow-500/20">
          {/* Pulse dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
          </span>

          {/* Text */}
          <div className="text-center">
            <p className="text-sm text-white font-medium">
              <span className="text-yellow-400">{isKo ? '데이터 기반' : 'Data-Driven'}</span>{' '}
              {isKo ? '투자 교육 플랫폼' : 'Investment Education Platform'}
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-white">{isKo ? '0줄' : '0 lines'}</span>
            <span>{isKo ? '코드' : 'code'}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-white">{isKo ? '3분' : '3 min'}</span>
            <span>{isKo ? '시작' : 'setup'}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-white">{isKo ? '무료' : 'Free'}</span>
            <span>{isKo ? '체험' : 'trial'}</span>
          </div>
        </div>
      </div>
    </section>
  )
})

TrustBadge.displayName = 'TrustBadge'

export { TrustBadge as default }
