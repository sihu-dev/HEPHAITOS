'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Sparkles } from 'lucide-react'

// Supabase-style Hero: Centered, Bold, Minimal
export function SupabaseHero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Gradient Background - Supabase style */}
      <div className="absolute inset-0 -z-10">
        {/* Top gradient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(94, 106, 210, 0.4) 0%, transparent 70%)',
          }}
        />
        {/* Bottom accent */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[400px] opacity-20"
          style={{
            background: 'linear-gradient(to top, rgba(94, 106, 210, 0.2) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* Announcement Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Link
          href="/strategies/leaderboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20">
            <Sparkles className="w-3 h-3 text-primary" />
          </span>
          <span className="text-sm text-zinc-400">
            전략 리더보드 오픈
          </span>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </Link>
      </motion.div>

      {/* Main Headline - Supabase style split text */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center max-w-4xl mx-auto"
      >
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
          <span className="text-white">Build in a weekend</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
            Scale to millions
          </span>
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 text-lg sm:text-xl text-zinc-400 text-center max-w-2xl mx-auto leading-relaxed"
      >
        코딩 없이 나만의 AI 트레이딩 봇을 만드세요.
        <br className="hidden sm:block" />
        {' '}전문가 전략 복사부터 자연어 빌더까지, 모든 것이 여기에.
      </motion.p>

      {/* CTA Buttons - Dual buttons side by side */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-10 flex flex-col sm:flex-row items-center gap-4"
      >
        <Link
          href="/signup"
          className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
        >
          Start your project
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/demo"
          className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all"
        >
          <Play className="w-4 h-4" />
          Watch demo
        </Link>
      </motion.div>

      {/* Trust Logos - Supabase style carousel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-20 w-full max-w-4xl mx-auto"
      >
        <p className="text-center text-sm text-zinc-600 mb-6">
          TRUSTED BY TRADERS WORLDWIDE
        </p>

        {/* Logo Grid */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap opacity-50">
          {/* Partner/Integration Logos - simplified placeholders */}
          {['KIS', 'Alpaca', 'Binance', 'TradingView', 'Coinbase'].map((name, i) => (
            <div
              key={name}
              className="text-zinc-500 font-semibold text-lg tracking-wider hover:text-zinc-300 transition-colors cursor-default"
            >
              {name}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Product Preview - Below fold teaser */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="mt-20 w-full max-w-5xl mx-auto"
      >
        <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-hidden shadow-2xl">
          {/* Browser Chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
            </div>
            <div className="flex-1 mx-4">
              <div className="max-w-md mx-auto px-3 py-1.5 rounded-md bg-zinc-800 text-xs text-zinc-500 text-center">
                hephaitos.vercel.app/dashboard
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="aspect-[16/9] bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-8">
            {/* Dashboard Grid Preview */}
            <div className="h-full grid grid-cols-3 gap-4">
              {/* Sidebar */}
              <div className="col-span-1 space-y-3">
                <div className="h-8 w-24 rounded bg-zinc-800/50" />
                <div className="space-y-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-6 rounded bg-zinc-800/30" style={{ width: `${60 + i * 8}%` }} />
                  ))}
                </div>
              </div>

              {/* Main Content */}
              <div className="col-span-2 space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-20 rounded-lg bg-zinc-800/40 p-3">
                      <div className="h-3 w-12 rounded bg-zinc-700/50 mb-2" />
                      <div className="h-6 w-20 rounded bg-primary/30" />
                    </div>
                  ))}
                </div>

                {/* Chart Area */}
                <div className="flex-1 h-40 rounded-lg bg-zinc-800/30 p-4">
                  <div className="h-full flex items-end gap-1">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-primary/60 to-primary/20"
                        style={{ height: `${30 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
