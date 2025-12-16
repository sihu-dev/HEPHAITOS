'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

const PROMPTS = [
  '워렌 버핏처럼 가치투자 전략',
  'RSI + MACD 기술적 분석',
  '암호화폐 스윙 트레이딩',
  'Nancy Pelosi 포트폴리오',
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
      <div className="max-w-7xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <SparklesIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Live Interactive Demo
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
              Replit for Trading
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
            자연어로 설명하면, AI가 즉시 전략을 만들고 실행합니다
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 h-fit">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                어떤 전략을 만들까요?
              </label>

              {/* Animated Prompt Selector */}
              <div className="relative bg-gray-50 rounded-xl border border-gray-200 p-4 min-h-[80px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={promptIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-gray-900 font-medium"
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-400 disabled:to-gray-300 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
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
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">생성 속도</span>
                <span className="font-semibold text-gray-900">3초</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">백테스트 기간</span>
                <span className="font-semibold text-gray-900">5년</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">AI 모델</span>
                <span className="font-semibold text-gray-900">Claude 4</span>
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Preview Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ChartBarIcon className="w-4 h-4" />
                <span className="font-medium">Strategy Preview</span>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 lg:p-8 min-h-[500px] bg-gradient-to-br from-gray-50 to-white">
              {chartData.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center h-[450px] text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <ChartBarIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    전략 실행 대기 중
                  </h3>
                  <p className="text-gray-600 max-w-sm">
                    좌측 버튼을 클릭하면 AI가 전략을 생성하고 백테스트 결과를
                    실시간으로 보여줍니다
                  </p>
                </div>
              ) : (
                // Live Results
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600">
                          포트폴리오
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${stats.portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-gray-600">수익률</span>
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          stats.totalReturn >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stats.totalReturn >= 0 ? '+' : ''}
                        {stats.totalReturn.toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ChartBarIcon className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-gray-600">승률</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.winRate.toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="w-4 h-4 text-orange-600" />
                        <span className="text-xs text-gray-600">거래 수</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.trades}
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        백테스트 결과 (2019-2024)
                      </h3>
                      <p className="text-xs text-gray-600">
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
                          stroke="#e5e7eb"
                          strokeWidth="0.5"
                        />

                        {/* Chart line */}
                        <polyline
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="2"
                          points={chartData
                            .map((value, i) => {
                              const x = i * 10
                              const y =
                                100 -
                                ((value - Math.min(...chartData)) /
                                  (Math.max(...chartData) -
                                    Math.min(...chartData))) *
                                  90 -
                                5
                              return `${x},${y}`
                            })
                            .join(' ')}
                        />

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
                              style={{ stopColor: '#3b82f6', stopOpacity: 1 }}
                            />
                            <stop
                              offset="100%"
                              style={{ stopColor: '#8b5cf6', stopOpacity: 1 }}
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
          <p className="text-gray-600 text-sm mb-6">
            이미 <span className="font-semibold text-gray-900">2,847명</span>의
            트레이더가 사용 중입니다
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              무료로 시작하기
            </a>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-3 border border-gray-300 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              작동 방식 보기
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
