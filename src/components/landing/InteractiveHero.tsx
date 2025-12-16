'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesIcon, PlayIcon, ChartBarIcon } from '@heroicons/react/24/solid'

const PROMPTS = [
  '워렌 버핏처럼 가치투자 전략 만들어줘',
  'Nancy Pelosi 포트폴리오 따라하기',
  'RSI + MACD 조합 전략 생성해줘',
  '암호화폐 스윙 트레이딩 봇 만들기',
]

const GENERATED_CODE = `# Warren Buffett Style Value Investment Strategy
import pandas as pd
from hephaitos import Strategy, Indicator

class ValueInvestmentStrategy(Strategy):
    def __init__(self):
        self.pe_threshold = 15  # P/E ratio < 15
        self.debt_ratio_max = 0.5  # Debt/Equity < 0.5

    def should_buy(self, stock):
        # Buffett's criteria: Low P/E, Strong fundamentals
        if stock.pe_ratio < self.pe_threshold:
            if stock.debt_to_equity < self.debt_ratio_max:
                if stock.roe > 0.15:  # ROE > 15%
                    return True
        return False

    def should_sell(self, position):
        # Hold for long-term (5+ years)
        if position.holding_period_years > 5:
            if position.total_return > 2.0:  # 100%+ gain
                return True
        return False

# Backtest Results (2019-2024):
# Total Return: +187.3%
# CAGR: 23.5%
# Max Drawdown: -18.2%
# Sharpe Ratio: 2.14
# Win Rate: 68.3%`

const BACKTEST_RESULTS = {
  totalReturn: '+187.3%',
  cagr: '23.5%',
  maxDrawdown: '-18.2%',
  sharpeRatio: '2.14',
  winRate: '68.3%',
  trades: '47',
}

export function InteractiveHero() {
  const [promptIndex, setPromptIndex] = useState(0)
  const [displayedCode, setDisplayedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Rotate prompts every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % PROMPTS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Simulate code generation when user "submits"
  const handleGenerate = () => {
    setIsGenerating(true)
    setDisplayedCode('')
    setShowResults(false)

    // Type out code character by character
    let index = 0
    const typingInterval = setInterval(() => {
      if (index < GENERATED_CODE.length) {
        setDisplayedCode(GENERATED_CODE.slice(0, index + 1))
        index++
      } else {
        clearInterval(typingInterval)
        setIsGenerating(false)
        setShowResults(true)
      }
    }, 10) // 10ms per character = ~3 seconds for full code

    return () => clearInterval(typingInterval)
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />

      <div className="relative z-10 max-w-7xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <SparklesIcon className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-mono text-blue-300">
              AI-Powered Trading · Live Demo
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
              Replit for Trading
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto font-light">
            자연어로 트레이딩 전략을 만들고, AI가 즉시 Python 코드로 변환합니다
          </p>
        </motion.div>

        {/* Interactive Split View */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-4 max-w-6xl mx-auto"
        >
          {/* Left: Input Panel */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-zinc-500 font-mono ml-2">
                strategy_builder.ai
              </span>
            </div>

            {/* Prompt Label */}
            <label className="block text-sm font-mono text-zinc-400 mb-3">
              {'>'} 어떤 전략을 만들까요?
            </label>

            {/* Animated Prompt Input */}
            <AnimatePresence mode="wait">
              <motion.div
                key={promptIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <div className="bg-zinc-950/50 border border-zinc-700 rounded-lg p-4 font-mono text-sm text-zinc-200">
                  {PROMPTS[promptIndex]}
                  <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-zinc-700 disabled:to-zinc-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 group shadow-lg shadow-blue-500/20"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>전략 생성 중...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>전략 생성하기</span>
                </>
              )}
            </button>

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-zinc-950/30 border border-zinc-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">3초</div>
                <div className="text-xs text-zinc-500 mt-1">생성 속도</div>
              </div>
              <div className="bg-zinc-950/30 border border-zinc-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">100%</div>
                <div className="text-xs text-zinc-500 mt-1">Python 코드</div>
              </div>
              <div className="bg-zinc-950/30 border border-zinc-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">AI</div>
                <div className="text-xs text-zinc-500 mt-1">Claude 4</div>
              </div>
            </div>
          </div>

          {/* Right: Output Panel */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
            {/* Code Editor Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
              <ChartBarIcon className="w-4 h-4 text-green-400" />
              <span className="text-xs text-zinc-500 font-mono">
                value_investment.py
              </span>
              {isGenerating && (
                <span className="ml-auto text-xs text-yellow-400 font-mono animate-pulse">
                  ● Generating...
                </span>
              )}
            </div>

            {/* Generated Code */}
            <div className="bg-zinc-950/50 border border-zinc-700 rounded-lg p-4 h-[400px] overflow-auto font-mono text-xs leading-relaxed">
              {displayedCode ? (
                <pre className="text-zinc-300 whitespace-pre-wrap">
                  <code>{displayedCode}</code>
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-600">
                  <div className="text-center">
                    <div className="text-4xl mb-3">⚡</div>
                    <p>전략이 여기에 생성됩니다...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Backtest Results */}
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ChartBarIcon className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-300">
                      백테스트 결과 (2019-2024)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(BACKTEST_RESULTS).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-bold text-white">
                          {value}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-zinc-500 text-sm mb-4">
            이미 <span className="text-blue-400 font-semibold">2,847명</span>의
            트레이더가 사용 중
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/auth/signup"
              className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              무료로 시작하기
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-3 border border-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-900 transition-colors"
            >
              작동 방식 보기
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
