'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { PHASE_COLORS, BRAND_COLORS, BG_COLORS, BORDER_COLORS, TEXT_COLORS, type PhaseType } from '@/constants/design-tokens'

// ============================================
// SUPABASE 100% PIXEL-PERFECT BENCHMARK
// 2025-12-20 - Design tokens applied
// ============================================

// Company logos - Styled text wordmarks (Supabase-style)
const COMPANY_LOGOS = [
  { name: 'moz://a', style: 'lowercase tracking-tight' },
  { name: 'GitHub', style: 'normal-case' },
  { name: '1Password', style: 'normal-case' },
  { name: 'pwc', style: 'lowercase tracking-wide' },
  { name: 'Pika', style: 'normal-case' },
  { name: 'humata', style: 'lowercase' },
  { name: 'udio', style: 'lowercase' },
  { name: 'LangChain', style: 'normal-case' },
  { name: 'Resend', style: 'normal-case' },
  { name: 'Loops', style: 'normal-case' },
  { name: 'mobbin', style: 'lowercase' },
  { name: 'gopuff', style: 'lowercase' },
  { name: 'Chatbase', style: 'normal-case' },
]

// Product cards - Using design tokens
interface Product {
  id: string
  name: string
  title: string
  description: string
  features: string[]
  href: string
  phase: PhaseType
}

const PRODUCTS: Product[] = [
  {
    id: '01',
    name: 'Copy Trading',
    title: 'Celebrity Portfolios',
    description: 'Follow portfolios of famous investors like Warren Buffett, Nancy Pelosi in real-time.',
    features: ['Real-time sync', 'SEC 13F data', 'Auto-rebalancing'],
    href: '/dashboard/copy-trading',
    phase: 'COPY',
  },
  {
    id: '02',
    name: 'AI Mentor',
    title: 'Trading Coach',
    description: 'Chat with expert AI mentor about your investment decisions and get real-time feedback.',
    features: ['24/7 available', 'Personalized advice', 'Learn by doing'],
    href: '/dashboard/coaching',
    phase: 'LEARN',
  },
  {
    id: '03',
    name: 'Strategy Builder',
    title: 'Natural Language',
    description: 'Describe your strategy in plain English, and we create an automated trading system.',
    features: ['Zero coding', 'Instant backtest', 'One-click deploy'],
    href: '/dashboard/strategy-builder',
    phase: 'BUILD',
  },
  {
    id: '04',
    name: 'Backtesting',
    title: '10 Years Data',
    description: 'Test your strategies against historical data with institutional-grade accuracy.',
    features: ['10 years history', 'Tick-level data', 'Risk metrics'],
    href: '/dashboard/backtest',
    phase: 'BUILD',
  },
  {
    id: '05',
    name: 'Realtime',
    title: 'Live Alerts',
    description: 'Get instant notifications when celebrities trade or your conditions trigger.',
    features: ['Push notifications', 'Email alerts', 'Webhook support'],
    href: '/dashboard/portfolio',
    phase: 'COPY',
  },
  {
    id: '06',
    name: 'Analytics',
    title: 'AI Reports',
    description: 'AI-generated market analysis and portfolio performance reports daily.',
    features: ['Daily insights', 'Performance tracking', 'Risk analysis'],
    href: '/dashboard/history',
    phase: 'LEARN',
  },
  {
    id: '07',
    name: 'Auto Trading',
    title: '24/7 Execution',
    description: 'Deploy your strategies to trade automatically while you sleep.',
    features: ['Paper trading', 'Live execution', 'Risk controls'],
    href: '/dashboard/ai-strategy',
    phase: 'BUILD',
  },
]

export function SupabaseHero() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let animationId: number
    let pos = 0

    const animate = () => {
      pos += 0.5
      const maxScroll = container.scrollWidth / 2
      if (pos >= maxScroll) pos = 0
      container.style.transform = `translateX(-${pos}px)`
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <section className="relative">
      {/* ========== HERO SECTION ========== */}
      <div className="relative pt-[100px] pb-[60px] overflow-hidden">
        {/* Background Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] pointer-events-none"
          style={{
            background: 'radial-gradient(50% 50% at 50% 0%, rgba(94, 106, 210, 0.15) 0%, transparent 100%)',
          }}
        />

        <div className="relative max-w-[1200px] mx-auto px-6 text-center">
          {/* ===== P0 FIX: Announcement Badge ===== */}
          <Link
            href="/changelog"
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] rounded-full transition-colors group"
          >
            <span className="text-[14px] text-[#EDEDED]">
              HEPHAITOS Launch 2025: Build your trading system today.
            </span>
            <svg
              className="w-4 h-4 text-[#8F8F8F] group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Headline */}
          <h1 className="text-[32px] sm:text-[40px] lg:text-[56px] font-normal leading-[1.1] tracking-[-0.02em] text-white">
            Build in a weekend
            <br />
            <span className="text-[#5E6AD2]">Scale to millions</span>
          </h1>

          {/* Subtitle - Supabase style: 2 lines, centered */}
          <p className="mt-6 text-[16px] sm:text-[18px] leading-[1.7] text-[#8F8F8F] max-w-[700px] mx-auto">
            HEPHAITOS is the AI trading development platform.
            <br />
            Start your project with Copy Trading, AI Mentor, Strategy Builder,
            Backtesting, Realtime Alerts, and Auto Trading.
          </p>

          {/* CTA Buttons - P2: More rounded corners like Supabase */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className={`h-[40px] px-5 inline-flex items-center justify-center text-[14px] font-medium text-white ${BRAND_COLORS.primary.bg} ${BRAND_COLORS.primary.bgHover} rounded-md transition-colors`}
            >
              Start your project
            </Link>
            <Link
              href="/demo"
              className={`h-[40px] px-5 inline-flex items-center justify-center text-[14px] font-medium ${TEXT_COLORS.secondary} bg-transparent hover:bg-zinc-900 ${BORDER_COLORS.default} hover:border-zinc-600 rounded-md transition-colors border`}
            >
              Request a demo
            </Link>
          </div>
        </div>
      </div>

      {/* ========== LOGO CAROUSEL ========== */}
      <div className="relative py-8 overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-[150px] bg-gradient-to-r from-[#0D0D0F] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-[150px] bg-gradient-to-l from-[#0D0D0F] to-transparent z-10 pointer-events-none" />

        {/* Scrolling logos - Supabase-style wordmarks */}
        <div className="flex items-center justify-center">
          <div ref={scrollRef} className="flex items-center gap-[60px] whitespace-nowrap">
            {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="flex items-center justify-center h-[24px] opacity-40 hover:opacity-70 transition-opacity"
              >
                <span className={`text-[15px] font-medium text-[#8F8F8F] ${logo.style || ''}`}>
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* P0 FIX: "Trusted by" text */}
        <p className="text-center text-[13px] text-[#666666] mt-6">
          Trusted by fast-growing traders worldwide
        </p>
      </div>

      {/* ========== PRODUCT GRID - P0 FIX: Large Cards Layout ========== */}
      <div className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Accessibility: Section heading for proper heading hierarchy (h1 → h2 → h3) */}
          <h2 className="sr-only">Products and Features</h2>

          {/* Top row: 3 large cards - Minimal design with ID numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {PRODUCTS.slice(0, 3).map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className="group relative bg-[#111111] hover:bg-[#141414] border border-[#1F1F1F] hover:border-[#2E2E2E] rounded-xl overflow-hidden transition-all"
              >
                {/* Card content */}
                <div className="flex flex-col h-full">
                  {/* Text content */}
                  <div className="p-6 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* ID Number instead of icon */}
                        <span className="text-[10px] font-mono text-zinc-600">{product.id}</span>
                        <h3 className="text-base font-medium text-white">{product.name}</h3>
                      </div>
                      {/* Phase badge - using design tokens */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${PHASE_COLORS[product.phase].bg} ${PHASE_COLORS[product.phase].text} ${PHASE_COLORS[product.phase].border}`}>
                        {product.phase}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                      <strong className="text-white">{product.title}</strong>
                      {' — '}
                      {product.description}
                    </p>

                    {/* Feature list - using design tokens */}
                    <ul className="space-y-1.5">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-[13px] text-zinc-500">
                          <span className={`w-1 h-1 rounded-full flex-shrink-0 ${PHASE_COLORS[product.phase].dot}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preview area - Simplified without inline styles */}
                  <div className="relative h-[120px] bg-gradient-to-t from-zinc-950 to-zinc-900 overflow-hidden">
                    {/* Grid pattern - CSS only */}
                    <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:24px_24px]" />
                    {/* Terminal-style preview */}
                    <div className="absolute bottom-4 right-4 w-[160px] bg-zinc-950 rounded border border-zinc-800 shadow-2xl transform group-hover:translate-y-[-4px] transition-transform">
                      <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-700" />
                        <span className="w-2 h-2 rounded-full bg-zinc-700" />
                        <span className="w-2 h-2 rounded-full bg-zinc-700" />
                      </div>
                      <div className="p-3 font-mono text-[9px] text-zinc-600 space-y-1">
                        <div>$ hephaitos run</div>
                        <div className={PHASE_COLORS[product.phase].text}>→ {product.phase.toLowerCase()}</div>
                      </div>
                    </div>
                    {/* Glow effect - using design tokens */}
                    <div className={`absolute bottom-0 right-0 w-[100px] h-[100px] rounded-full blur-3xl opacity-20 ${PHASE_COLORS[product.phase].dot}`} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom row: 4 smaller cards - Using design tokens */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRODUCTS.slice(3).map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className="group relative bg-zinc-900 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-lg p-5 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-zinc-600">{product.id}</span>
                    <h3 className="text-sm font-medium text-white">{product.name}</h3>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${PHASE_COLORS[product.phase].dot}`} />
                </div>

                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  <span className="text-zinc-400">{product.title}</span>
                  {' — '}
                  {product.description.split('.')[0]}.
                </p>
              </Link>
            ))}
          </div>

          {/* Tagline */}
          <p className="text-center text-[14px] text-[#666666] mt-8">
            Use one or all. Best of breed products. Integrated as a platform.
          </p>
        </div>
      </div>

      {/* ========== FRAMEWORK/BROKER BADGES ========== */}
      <div className="py-12">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-[14px] text-[#8F8F8F]">Use HEPHAITOS with</span>
            <span className="text-[14px] text-white font-medium">any broker</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {['한국투자증권', '키움증권', 'Alpaca', 'Binance', 'Upbit', 'Bithumb', 'Coinbase', 'Interactive Brokers'].map((name) => (
              <div
                key={name}
                className="h-[40px] px-5 inline-flex items-center justify-center bg-[#111111] hover:bg-[#161616] border border-[#1F1F1F] rounded-md transition-colors cursor-default"
              >
                <span className="text-[13px] text-[#8F8F8F]">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== LEGAL DISCLAIMER ========== */}
      <div className="py-8 border-t border-zinc-800/50">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-[11px] text-center text-zinc-500 leading-relaxed">
            본 서비스는 투자 교육 및 도구 제공 목적이며, 투자 조언이 아닙니다.
            모든 투자 결정과 그에 따른 손익은 사용자 본인의 책임입니다.
            백테스트 결과는 과거 데이터 기반이며, 미래 수익을 보장하지 않습니다.
          </p>
        </div>
      </div>
    </section>
  )
}
