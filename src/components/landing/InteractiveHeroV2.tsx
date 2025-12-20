'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { CHART_COLORS } from '@/constants/design-tokens'

const PROMPTS = [
  '워렌 버핏처럼 가치투자 전략 만들어줘',
  'RSI + MACD 조합 전략 생성해줘',
  '암호화폐 스윙 트레이딩 봇 만들기',
  'Nancy Pelosi 포트폴리오 따라하기',
]

// Simulated chart data
const generateChartData = () => {
  const data = []
  let value = 100000
  for (let i = 0; i < 50; i++) {
    value += (Math.random() - 0.45) * 5000
    data.push(value)
  }
  return data
}

export function InteractiveHeroV2() {
  const [promptIndex, setPromptIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [chartData, setChartData] = useState<number[]>([])
  const [stats, setStats] = useState({
    portfolioValue: 100000,
    totalReturn: 0,
    winRate: 0,
    trades: 0,
  })

  // Rotate prompts
  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % PROMPTS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Simulate strategy execution
  const handleRun = () => {
    setIsRunning(true)
    setChartData([])
    setStats({
      portfolioValue: 100000,
      totalReturn: 0,
      winRate: 0,
      trades: 0,
    })

    // Generate data points progressively
    const data = generateChartData()
    let index = 0

    const interval = setInterval(() => {
      if (index < data.length) {
        setChartData(data.slice(0, index + 1))

        const currentValue = data[index]
        const returnPct = ((currentValue - 100000) / 100000) * 100

        setStats({
          portfolioValue: currentValue,
          totalReturn: returnPct,
          winRate: 55 + Math.random() * 20,
          trades: index + 1,
        })

        index++
      } else {
        clearInterval(interval)
        setIsRunning(false)
      }
    }, 60) // 60ms per point = ~3 seconds total
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />

      <div className="relative z-10 max-w-7xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <SparklesIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-[#7C8AEA]">
              Live Interactive Demo
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              Replit for Trading
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-zinc-400 max-w-3xl mx-auto">
            자연어로 설명하면, 시스템이 즉시 전략을 만들고 실행합니다
          </p>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid lg:grid-cols-[350px,1fr] gap-6 max-w-6xl mx-auto"
        >
          {/* Left: Input Panel */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 space-y-6 h-fit shadow-2xl">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-3">
                어떤 전략을 만들까요?
              </label>

              {/* Animated Prompt Selector */}
              <div className="relative bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 min-h-[80px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={promptIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-white font-medium"
                  >
                    {PROMPTS[promptIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full bg-gradient-to-r from-primary to-[#4B56C8] hover:from-[#4B56C8] hover:to-[#3A44A8] disabled:from-zinc-800 disabled:to-zinc-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-[#5E6AD2]/20 hover:shadow-[#5E6AD2]/30 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  실행 중...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ArrowTrendingUpIcon className="w-5 h-5" />
                  전략 실행하기
                </span>
              )}
            </button>

            {/* Quick Stats */}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">생성 속도</span>
                <span className="font-semibold text-white">3초</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">백테스트 기간</span>
                <span className="font-semibold text-white">5년</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">AI 모델</span>
                <span className="font-semibold text-white">Claude 4</span>
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
            {/* Preview Header */}
            <div className="bg-white/[0.02] border-b border-white/[0.06] px-6 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <ChartBarIcon className="w-4 h-4" />
                <span className="font-medium">Strategy Preview</span>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 lg:p-8 min-h-[500px]">
              {chartData.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center h-[450px] text-center">
                  <div className="w-20 h-20 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-4 border border-white/[0.06]">
                    <ChartBarIcon className="w-10 h-10 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    전략 실행 대기 중
                  </h3>
                  <p className="text-zinc-500 max-w-sm">
                    좌측 버튼을 클릭하면 시스템이 전략을 생성하고 백테스트 결과를
                    실시간으로 보여줍니다
                  </p>
                </div>
              ) : (
                // Live Results
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-primary" />
                        <span className="text-xs text-zinc-500">
                          포트폴리오
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        ${stats.portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                    </div>

                    <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-zinc-500">수익률</span>
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          stats.totalReturn >= 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {stats.totalReturn >= 0 ? '+' : ''}
                        {stats.totalReturn.toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ChartBarIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-zinc-500">승률</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {stats.winRate.toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="w-4 h-4 text-orange-500" />
                        <span className="text-xs text-zinc-500">거래 수</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {stats.trades}
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-6">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-white mb-1">
                        백테스트 결과 (2019-2024)
                      </h3>
                      <p className="text-xs text-zinc-500">
                        초기 자본: $100,000
                      </p>
                    </div>

                    {/* Simple Line Chart */}
                    <div className="relative h-64">
                      <svg
                        className="w-full h-full"
                        viewBox={`0 0 ${chartData.length * 10} 100`}
                        preserveAspectRatio="none"
                      >
                        {/* Grid lines */}
                        <line
                          x1="0"
                          y1="50"
                          x2={chartData.length * 10}
                          y2="50"
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="0.5"
                        />

                        {/* Chart line - only render if we have at least 2 points */}
                        {chartData.length >= 2 && (() => {
                          const minValue = Math.min(...chartData)
                          const maxValue = Math.max(...chartData)
                          const range = maxValue - minValue || 1 // Prevent division by zero

                          return (
                            <polyline
                              fill="none"
                              stroke="url(#gradient)"
                              strokeWidth="2"
                              points={chartData
                                .map((value, i) => {
                                  const x = i * 10
                                  const y = 100 - ((value - minValue) / range) * 90 - 5
                                  return `${x},${y}`
                                })
                                .join(' ')}
                            />
                          )
                        })()}

                        {/* Gradient */}
                        <defs>
                          <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop
                              offset="0%"
                              style={{ stopColor: CHART_COLORS.primary, stopOpacity: 1 }}
                            />
                            <stop
                              offset="100%"
                              style={{ stopColor: '#7C8AEA', stopOpacity: 1 }}
                            />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-zinc-500 text-sm mb-6">
            이미 <span className="font-semibold text-white">2,847명</span>의
            트레이더가 사용 중입니다
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary to-[#4B56C8] hover:from-[#4B56C8] hover:to-[#3A44A8] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#5E6AD2]/20 hover:shadow-[#5E6AD2]/30"
            >
              무료로 시작하기
            </a>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-3 border border-white/[0.12] text-white font-semibold rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              작동 방식 보기
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
