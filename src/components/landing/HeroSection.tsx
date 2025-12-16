'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/i18n/client'

// ============================================
// Linear 2025 Design System
// Flat, minimal, professional design
// No gradients, shadows, or 3D effects
// ============================================

export const HeroSection = memo(function HeroSection() {
  const { t } = useI18n()

  return (
    <section className="min-h-screen flex items-center justify-center">
      <div className="max-w-3xl mx-auto px-6 text-center pt-20 pb-24">
        {/* Badge - Primary Color */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2]" />
          <span className="text-xs text-[#7C8AEA] font-medium">
            {t('hero.badge')}
          </span>
        </div>

        {/* Headline - Standardized */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-medium tracking-[-0.03em] leading-[1.05] mb-6">
          <span className="text-gradient-hero">{t('hero.headline1')}</span>
          <br />
          <span className="text-zinc-400">{t('hero.headline2')}</span>
        </h1>

        {/* Sub Headline - Standardized color */}
        <p className="text-lg text-zinc-400 max-w-lg mx-auto mb-4 leading-relaxed">
          {t('hero.subheadline')}
          <br />
          {t('hero.subheadline2')}
        </p>

        {/* CTA - Primary Color + Glow */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#5E6AD2] text-white rounded-lg text-sm font-medium hover:bg-[#7C8AEA] glow-primary transition-all"
          >
            {t('hero.cta')}
            <span className="inline-block w-2 h-2 border-t-2 border-r-2 border-white rotate-45 group-hover:translate-x-0.5 transition-transform"></span>
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 text-zinc-400 hover:text-white glass hover:glass-strong rounded-lg text-sm transition-all"
          >
            {t('hero.watchDemo')}
          </Link>
        </div>

        {/* Trust Indicators - Ultra Minimal */}
        <div className="flex items-center justify-center gap-8 text-xs text-zinc-500">
          <span>{t('hero.trust1')}</span>
          <span>{t('hero.trust2')}</span>
          <span>{t('hero.trust3')}</span>
        </div>
      </div>
    </section>
  )
})

HeroSection.displayName = 'HeroSection'

export { HeroSection as default }
