'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Database, Lock, Zap, HardDrive, Radio, Cpu, Code2 } from 'lucide-react'

// ============================================
// SUPABASE 100% PIXEL-PERFECT BENCHMARK
// 2025-12-17 QA Loop - All P0 Issues Fixed
// ============================================

// Company logos - Styled text wordmarks (Supabase-style)
const COMPANY_LOGOS = [
  { name: 'moz://a', style: 'lowercase tracking-tight' },
  { name: 'GitHub', style: 'normal-case', hasIcon: true },
  { name: '1Password', style: 'normal-case', hasIcon: true },
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

// Product cards - Large format like Supabase
const PRODUCTS = [
  {
    icon: Database,
    name: 'Copy Trading',
    title: 'Celebrity Portfolios',
    description: 'Follow portfolios of famous investors like Warren Buffett, Nancy Pelosi in real-time.',
    features: ['Real-time sync', 'SEC 13F data', 'Auto-rebalancing'],
    href: '/dashboard/copy-trading',
    color: '#5E6AD2',
  },
  {
    icon: Lock,
    name: 'AI Mentor',
    title: 'Trading Coach',
    description: 'Chat with expert AI mentor about your investment decisions and get real-time feedback.',
    features: ['24/7 available', 'Personalized advice', 'Learn by doing'],
    href: '/dashboard/coaching',
    color: '#5E6AD2',
  },
  {
    icon: Zap,
    name: 'Strategy Builder',
    title: 'Natural Language',
    description: 'Describe your strategy in plain English, and we create an automated trading system.',
    features: ['Zero coding', 'Instant backtest', 'One-click deploy'],
    href: '/dashboard/strategy-builder',
    color: '#5E6AD2',
  },
  {
    icon: HardDrive,
    name: 'Backtesting',
    title: '10 Years Data',
    description: 'Test your strategies against historical data with institutional-grade accuracy.',
    features: ['10 years history', 'Tick-level data', 'Risk metrics'],
    href: '/dashboard/backtest',
    color: '#5E6AD2',
  },
  {
    icon: Radio,
    name: 'Realtime',
    title: 'Live Alerts',
    description: 'Get instant notifications when celebrities trade or your conditions trigger.',
    features: ['Push notifications', 'Email alerts', 'Webhook support'],
    href: '/dashboard/portfolio',
    color: '#5E6AD2',
  },
  {
    icon: Cpu,
    name: 'Analytics',
    title: 'AI Reports',
    description: 'AI-generated market analysis and portfolio performance reports daily.',
    features: ['Daily insights', 'Performance tracking', 'Risk analysis'],
    href: '/dashboard/history',
    color: '#5E6AD2',
  },
  {
    icon: Code2,
    name: 'Auto Trading',
    title: '24/7 Execution',
    description: 'Deploy your strategies to trade automatically while you sleep.',
    features: ['Paper trading', 'Live execution', 'Risk controls'],
    href: '/dashboard/ai-strategy',
    color: '#5E6AD2',
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
              className="h-[40px] px-5 inline-flex items-center justify-center text-[14px] font-medium text-white bg-[#5E6AD2] hover:bg-[#6E7AE2] rounded-md transition-colors"
            >
              Start your project
            </Link>
            <Link
              href="/demo"
              className="h-[40px] px-5 inline-flex items-center justify-center text-[14px] font-medium text-[#EDEDED] bg-transparent hover:bg-[#1F1F1F] border border-[#3E3E3E] hover:border-[#5E5E5E] rounded-md transition-colors"
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
                className="flex items-center justify-center gap-1.5 h-[24px] opacity-40 hover:opacity-70 transition-opacity"
              >
                {/* Icon for GitHub/1Password */}
                {logo.hasIcon && logo.name === 'GitHub' && (
                  <svg className="w-5 h-5 text-[#8F8F8F]" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                )}
                {logo.hasIcon && logo.name === '1Password' && (
                  <svg className="w-5 h-5 text-[#8F8F8F]" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">1</text>
                  </svg>
                )}
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
          {/* Top row: 3 large cards - Supabase style with preview image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {PRODUCTS.slice(0, 3).map((product, index) => (
              <Link
                key={product.name}
                href={product.href}
                className="group relative bg-[#111111] hover:bg-[#141414] border border-[#1F1F1F] hover:border-[#2E2E2E] rounded-xl overflow-hidden transition-all"
              >
                {/* Card content - Two column layout */}
                <div className="flex flex-col h-full">
                  {/* Text content */}
                  <div className="p-6 flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 flex items-center justify-center rounded-md bg-[#1A1A1A] group-hover:bg-[#252525] transition-colors">
                        <product.icon className="w-4 h-4 text-[#666666] group-hover:text-[#5E6AD2] transition-colors" />
                      </div>
                      <h3 className="text-[16px] font-medium text-white">{product.name}</h3>
                    </div>

                    <p className="text-[14px] text-[#8F8F8F] leading-[1.6] mb-4">
                      <strong className="text-white">{product.title}</strong>
                      {' - '}
                      {product.description}
                    </p>

                    {/* Feature list */}
                    <ul className="space-y-1.5">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-[13px] text-[#666666]">
                          <svg className="w-3 h-3 text-[#5E6AD2] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preview image area - Supabase style */}
                  <div className="relative h-[140px] bg-gradient-to-t from-[#0A0A0A] to-[#111111] overflow-hidden">
                    {/* Decorative grid pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(rgba(94, 106, 210, 0.1) 1px, transparent 1px),
                                         linear-gradient(90deg, rgba(94, 106, 210, 0.1) 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                      }} />
                    </div>
                    {/* Floating card preview mockup */}
                    <div className="absolute bottom-4 right-4 w-[180px] h-[100px] bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] shadow-2xl transform group-hover:translate-y-[-4px] transition-transform">
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded bg-[#5E6AD2]/20 flex items-center justify-center">
                            <product.icon className="w-3 h-3 text-[#5E6AD2]" />
                          </div>
                          <div className="h-2 w-16 bg-[#2E2E2E] rounded" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-1.5 w-full bg-[#252525] rounded" />
                          <div className="h-1.5 w-3/4 bg-[#252525] rounded" />
                          <div className="h-1.5 w-1/2 bg-[#252525] rounded" />
                        </div>
                      </div>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute bottom-0 right-0 w-[150px] h-[150px] bg-[#5E6AD2]/10 rounded-full blur-3xl" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom row: 4 smaller cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRODUCTS.slice(3).map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className="group relative bg-[#111111] hover:bg-[#161616] border border-[#1F1F1F] hover:border-[#2E2E2E] rounded-lg p-5 transition-all"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 flex items-center justify-center rounded-md bg-[#1A1A1A] group-hover:bg-[#252525] transition-colors">
                    <product.icon className="w-3.5 h-3.5 text-[#666666] group-hover:text-[#5E6AD2] transition-colors" />
                  </div>
                  <h3 className="text-[14px] font-medium text-white">{product.name}</h3>
                </div>

                <p className="text-[13px] text-[#666666] leading-[1.5]">
                  <span className="text-[#8F8F8F]">{product.title}</span>
                  {' - '}
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
    </section>
  )
}
