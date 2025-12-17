'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlayIcon,
  SparklesIcon,
  ChartBarIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'
import { clsx } from 'clsx'

// ============================================
// Interactive Demo Components
// ============================================

function StrategyDemo() {
  const [strategy, setStrategy] = useState<'rsi' | 'macd' | 'ai'>('rsi')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ profit: number; trades: number } | null>(null)

  const strategies = {
    rsi: { name: 'RSI Oversold', profit: 12.5, trades: 24 },
    macd: { name: 'MACD Crossover', profit: 8.3, trades: 18 },
    ai: { name: 'AI Smart Signal', profit: 18.7, trades: 32 },
  }

  const runDemo = () => {
    setIsRunning(true)
    setResult(null)
    setTimeout(() => {
      setResult(strategies[strategy])
      setIsRunning(false)
    }, 1500)
  }

  return (
    <div className="border border-white/[0.06] rounded-xl p-6 bg-zinc-900/30">
      <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <CpuChipIcon className="w-4 h-4 text-[#5E6AD2]" />
        Strategy Simulator
      </h3>

      {/* Strategy Selection */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(['rsi', 'macd', 'ai'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStrategy(s)}
            className={clsx(
              'px-3 py-2 rounded-lg text-xs font-medium transition-all',
              strategy === s
                ? 'bg-[#5E6AD2] text-white'
                : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
            )}
          >
            {strategies[s].name}
          </button>
        ))}
      </div>

      {/* Run Button */}
      <button
        onClick={runDemo}
        disabled={isRunning}
        className={clsx(
          'w-full py-3 rounded-lg text-sm font-medium transition-all',
          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          'hover:bg-emerald-500/30 disabled:opacity-50'
        )}
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            Running Backtest...
          </span>
        ) : (
          'Run Demo Backtest'
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-4 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500">Profit</p>
              <p className="text-lg font-bold text-emerald-400">+{result.profit}%</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Trades</p>
              <p className="text-lg font-bold text-white">{result.trades}</p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      )}
    </div>
  )
}

function MarketTicker() {
  const tickers = [
    { symbol: 'BTC', price: 97245.50, change: 2.34 },
    { symbol: 'ETH', price: 3842.20, change: -0.82 },
    { symbol: 'SOL', price: 224.85, change: 5.67 },
  ]

  return (
    <div className="border border-white/[0.06] rounded-xl p-6 bg-zinc-900/30">
      <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <ChartBarIcon className="w-4 h-4 text-[#5E6AD2]" />
        Live Market Preview
      </h3>
      <div className="space-y-3">
        {tickers.map((ticker) => (
          <div key={ticker.symbol} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
            <div>
              <span className="text-sm font-medium text-white">{ticker.symbol}</span>
              <span className="text-xs text-zinc-500 ml-2">/USDT</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-white">${ticker.price.toLocaleString()}</p>
              <p className={clsx(
                'text-xs font-medium flex items-center justify-end gap-1',
                ticker.change >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {ticker.change >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                {ticker.change >= 0 ? '+' : ''}{ticker.change}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Main Demo Page
// ============================================

export default function DemoPage() {
  const { t } = useI18n()

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI Strategy Generation',
      description: 'Describe your trading idea in plain language, AI builds the strategy',
    },
    {
      icon: ChartBarIcon,
      title: 'Instant Backtesting',
      description: 'Test your strategies against years of historical market data',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Risk Management',
      description: 'Built-in stop-loss, position sizing, and risk controls',
    },
  ]

  return (
    <main className="min-h-screen bg-[#0D0D0F]">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5E6AD2]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-12 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('dashboard.demo.backToHome') as string}
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 text-[#7C8AEA] text-xs font-medium mb-6">
            <SparklesIcon className="w-4 h-4" />
            Interactive Demo
          </div>
          <h1 className="text-[40px] font-medium text-white mb-4">
            Experience HEPHAITOS
          </h1>
          <p className="text-lg text-zinc-400 max-w-lg mx-auto">
            Build AI-powered trading strategies without writing code.
            Try our interactive demo below.
          </p>
        </div>

        {/* Interactive Demo Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <StrategyDemo />
          <MarketTicker />
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-[#5E6AD2]" />
              </div>
              <h3 className="text-sm font-medium text-white mb-2">{feature.title}</h3>
              <p className="text-xs text-zinc-500">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Video Placeholder */}
        <div className="border border-white/[0.06] rounded-xl overflow-hidden mb-12">
          <div className="aspect-video bg-zinc-900/50 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#5E6AD2]/5 to-transparent" />
            <div className="text-center relative z-10">
              <div className="w-20 h-20 rounded-full bg-white/[0.08] backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/[0.1] hover:scale-105 transition-transform cursor-pointer">
                <PlayIcon className="w-10 h-10 text-white ml-1" />
              </div>
              <p className="text-sm text-zinc-400">
                Watch Full Product Tour
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Coming Soon
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center p-8 rounded-xl bg-gradient-to-b from-[#5E6AD2]/10 to-transparent border border-[#5E6AD2]/20">
          <h2 className="text-xl font-medium text-white mb-3">
            Ready to Build Your Strategy?
          </h2>
          <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
            Join thousands of traders using AI to automate their trading.
            Start with 10,000 free credits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5E6AD2] text-white rounded-lg text-sm font-medium hover:bg-[#4F5ABF] transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.08] text-white rounded-lg text-sm font-medium hover:bg-white/[0.12] transition-colors"
            >
              Explore Dashboard
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-zinc-600 mt-12">
          This is a demo for educational purposes only. Not financial advice.
          Past performance does not guarantee future results.
        </p>
      </div>
    </main>
  )
}
