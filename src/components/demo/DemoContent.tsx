'use client'


import { useState, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  PlayIcon,
  SparklesIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChatBubbleLeftRightIcon,
  BeakerIcon,
  BellIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'
import { clsx } from 'clsx'

// ============================================
// Interactive Demo Components
// ============================================

// Demo conversations data (constant)
const DEMO_CONVERSATIONS = [
  [
    { role: 'user' as const, content: '비트코인 RSI 30 이하면 매수하는 전략 만들어줘' },
    { role: 'assistant' as const, content: '✨ 전략이 생성되었습니다!\n\n**RSI 역발상 매수 전략**\n• 진입: RSI(14) < 30\n• 청산: RSI(14) > 70\n• 손절: -5%\n\n백테스트를 실행하시겠습니까?' },
  ],
  [
    { role: 'user' as const, content: '3개월 백테스트 돌려줘' },
    { role: 'assistant' as const, content: '📊 백테스트 완료!\n\n• 총 수익률: +18.5%\n• 샤프 비율: 1.82\n• 최대 낙폭: -8.3%\n• 총 거래: 24회\n\n✅ 전략이 양호한 성과를 보입니다.' },
  ],
]

// Demo Agent Chat Preview
const AgentChatDemo = memo(function AgentChatDemo() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [currentDemo, setCurrentDemo] = useState(0)

  const runDemo = useCallback(() => {
    setMessages([])
    setIsTyping(true)

    const conversation = DEMO_CONVERSATIONS[currentDemo]
    let index = 0

    const addMessage = () => {
      if (index < conversation.length) {
        setMessages(prev => [...prev, conversation[index]])
        index++
        setTimeout(addMessage, index === 1 ? 1500 : 800)
      } else {
        setIsTyping(false)
        setCurrentDemo(prev => (prev + 1) % DEMO_CONVERSATIONS.length)
      }
    }

    setTimeout(addMessage, 500)
  }, [currentDemo])

  return (
    <div className="border border-white/[0.06] rounded-xl bg-zinc-900/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-white">AI Agent Preview</span>
        </div>
        <span className="text-[10px] text-[#7C8AEA] bg-primary/10 px-2 py-0.5 rounded">NEW</span>
      </div>

      <div className="h-64 p-4 space-y-3 overflow-y-auto">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={clsx(
                'max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-line',
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-white/[0.04] border border-white/[0.06] text-zinc-200'
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div className="flex gap-1 px-3 py-2">
            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {messages.length === 0 && !isTyping && (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <SparklesIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">자연어로 전략을 만들어보세요</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/[0.06]">
        <button
          onClick={runDemo}
          disabled={isTyping}
          className="w-full py-2 bg-primary hover:bg-[#6E7AE2] disabled:bg-primary/50 text-white text-sm rounded-lg transition-colors"
        >
          {isTyping ? '대화 진행 중...' : '데모 실행'}
        </button>
      </div>
    </div>
  )
})

// Strategy Demo with Enhanced UI
const StrategyDemo = memo(function StrategyDemo() {
  const [strategy, setStrategy] = useState<'rsi' | 'macd' | 'ai'>('rsi')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ profit: number; trades: number; sharpe: number } | null>(null)

  const strategies = {
    rsi: { name: 'RSI Oversold', profit: 12.5, trades: 24, sharpe: 1.45 },
    macd: { name: 'MACD Crossover', profit: 8.3, trades: 18, sharpe: 1.12 },
    ai: { name: 'AI Smart Signal', profit: 18.7, trades: 32, sharpe: 1.92 },
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
    <div className="border border-white/[0.06] rounded-xl bg-zinc-900/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <BeakerIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">Backtest Simulator</span>
        </div>
      </div>

      <div className="p-4">
        {/* Strategy Selection */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['rsi', 'macd', 'ai'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStrategy(s)}
              className={clsx(
                'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                strategy === s
                  ? 'bg-primary text-white'
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
              백테스트 실행 중...
            </span>
          ) : (
            '백테스트 실행'
          )}
        </button>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-zinc-500">수익률</p>
                    <p className="text-lg font-bold text-emerald-400">+{result.profit}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">거래 수</p>
                    <p className="text-lg font-bold text-white">{result.trades}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">샤프 비율</p>
                    <p className="text-lg font-bold text-blue-400">{result.sharpe}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})

// Market Ticker with Real Data
const MarketTicker = memo(function MarketTicker() {
  const [tickers, setTickers] = useState([
    { symbol: 'BTC', price: 97245.50, change: 2.34 },
    { symbol: 'ETH', price: 3842.20, change: -0.82 },
    { symbol: 'SOL', price: 224.85, change: 5.67 },
  ])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const response = await fetch('/api/market?symbols=BTC,ETH,SOL')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setTickers(result.data.map((d: { symbol: string; price: number; change24h: number }) => ({
              symbol: d.symbol,
              price: d.price,
              change: d.change24h,
            })))
          }
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarketData()
    const interval = setInterval(fetchMarketData, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="border border-white/[0.06] rounded-xl bg-zinc-900/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">실시간 시세</span>
        </div>
        {!isLoading && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">
        {tickers.map((ticker) => (
          <div key={ticker.symbol} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-xs font-bold text-white">
                {ticker.symbol.charAt(0)}
              </div>
              <div>
                <span className="text-sm font-medium text-white">{ticker.symbol}</span>
                <span className="text-xs text-zinc-500">/USDT</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-white">
                ${ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={clsx(
                'text-xs font-medium flex items-center justify-end gap-1',
                ticker.change >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {ticker.change >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                {ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// Notification Demo
const NotificationDemo = memo(function NotificationDemo() {
  const [notifications, setNotifications] = useState<Array<{ id: number; type: string; message: string }>>([])

  const addNotification = useCallback(() => {
    const types = [
      { type: 'signal', message: 'BTC RSI가 30 이하로 하락했습니다' },
      { type: 'trade', message: 'ETH 매수 주문이 체결되었습니다' },
      { type: 'alert', message: '포트폴리오가 목표 수익률을 달성했습니다' },
    ]
    const random = types[Math.floor(Math.random() * types.length)]
    const newNotification = { id: Date.now(), ...random }

    setNotifications(prev => [newNotification, ...prev.slice(0, 2)])

    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 3000)
  }, [])

  return (
    <div className="border border-white/[0.06] rounded-xl bg-zinc-900/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <BellIcon className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">알림 시스템</span>
        </div>
      </div>

      <div className="p-4 h-40 relative">
        <AnimatePresence>
          {notifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0, y: index * 52 }}
              exit={{ opacity: 0, x: -50 }}
              className="absolute inset-x-4 top-4 p-3 bg-white/[0.04] border border-white/[0.08] rounded-lg"
            >
              <p className="text-xs text-zinc-400 mb-1">{notif.type === 'signal' ? '📊 신호' : notif.type === 'trade' ? '💰 거래' : '🔔 알림'}</p>
              <p className="text-sm text-white">{notif.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-zinc-500">알림이 여기에 표시됩니다</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/[0.06]">
        <button
          onClick={addNotification}
          className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm rounded-lg transition-colors"
        >
          알림 테스트
        </button>
      </div>
    </div>
  )
})

// Command Palette Demo
const CommandPaletteDemo = memo(function CommandPaletteDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const commands = [
    { icon: '📊', label: '새 전략 생성', shortcut: 'N' },
    { icon: '🔍', label: '종목 검색', shortcut: 'S' },
    { icon: '📈', label: '백테스트 실행', shortcut: 'B' },
    { icon: '⚙️', label: '설정', shortcut: ',' },
  ]

  return (
    <div className="border border-white/[0.06] rounded-xl bg-zinc-900/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <CommandLineIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Command Palette</span>
        </div>
        <kbd className="px-1.5 py-0.5 text-[10px] bg-white/[0.06] rounded text-zinc-400">⌘K</kbd>
      </div>

      <div className="p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-left text-sm text-zinc-500 hover:border-white/[0.12] transition-colors"
        >
          검색 또는 명령어 입력...
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 border border-white/[0.08] rounded-lg bg-zinc-900 overflow-hidden"
            >
              {commands.map((cmd, i) => (
                <div
                  key={cmd.label}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2 hover:bg-white/[0.04] cursor-pointer',
                    i === 0 && 'bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{cmd.icon}</span>
                    <span className="text-sm text-white">{cmd.label}</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-white/[0.06] rounded text-zinc-500">
                    ⌘{cmd.shortcut}
                  </kbd>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})

// ============================================
// Main Demo Page
// ============================================

export function DemoContent() {
  const { t } = useI18n()

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI 전략 생성',
      description: '자연어로 전략을 설명하면 AI가 자동으로 빌드합니다',
      color: 'primary',
    },
    {
      icon: ChartBarIcon,
      title: '즉시 백테스트',
      description: '수년간의 과거 데이터로 전략을 테스트합니다',
      color: 'emerald',
    },
    {
      icon: ShieldCheckIcon,
      title: '리스크 관리',
      description: '손절, 포지션 사이징, 리스크 컨트롤 내장',
      color: 'amber',
    },
  ]

  return (
    <main className="min-h-screen bg-[#0D0D0F]">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          홈으로 돌아가기
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-[#7C8AEA] text-xs font-medium mb-6"
          >
            <SparklesIcon className="w-4 h-4" />
            Interactive Demo
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[36px] md:text-[42px] font-medium text-white mb-4"
          >
            HEPHAITOS 체험하기
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 max-w-lg mx-auto"
          >
            코딩 없이 AI 트레이딩 전략을 만들어보세요.
            아래 데모를 직접 체험해보세요.
          </motion.p>
        </div>

        {/* Main Demo Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
        >
          {/* AI Agent Chat - Featured */}
          <div className="lg:col-span-2">
            <AgentChatDemo />
          </div>

          {/* Market Ticker */}
          <MarketTicker />

          {/* Backtest Simulator */}
          <StrategyDemo />

          {/* Notification System */}
          <NotificationDemo />

          {/* Command Palette */}
          <CommandPaletteDemo />
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-4 mb-12"
        >
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all hover:-translate-y-1"
            >
              <div className={clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center mb-4',
                feature.color === 'primary' && 'bg-primary/10',
                feature.color === 'emerald' && 'bg-emerald-500/10',
                feature.color === 'amber' && 'bg-amber-500/10'
              )}>
                <feature.icon className={clsx(
                  'w-5 h-5',
                  feature.color === 'primary' && 'text-[#7C8AEA]',
                  feature.color === 'emerald' && 'text-emerald-400',
                  feature.color === 'amber' && 'text-amber-400'
                )} />
              </div>
              <h3 className="text-sm font-medium text-white mb-2">{feature.title}</h3>
              <p className="text-xs text-zinc-500">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border border-white/[0.06] rounded-xl overflow-hidden mb-12"
        >
          <div className="aspect-video bg-zinc-900/50 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
            <div className="text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-white/[0.08] backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/[0.1] hover:scale-105 transition-transform cursor-pointer group">
                <PlayIcon className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-sm text-zinc-400">제품 투어 영상</p>
              <p className="text-xs text-zinc-600 mt-1">Coming Soon</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center p-8 rounded-xl bg-gradient-to-b from-primary/10 to-transparent border border-primary/20"
        >
          <h2 className="text-xl font-medium text-white mb-3">
            나만의 전략을 만들 준비가 되셨나요?
          </h2>
          <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
            수천 명의 트레이더가 AI로 트레이딩을 자동화하고 있습니다.
            10,000 무료 크레딧으로 시작하세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#4F5ABF] transition-colors"
            >
              무료 체험 시작
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.08] text-white rounded-lg text-sm font-medium hover:bg-white/[0.12] transition-colors"
            >
              대시보드 둘러보기
            </Link>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-zinc-600 mt-12">
          본 서비스는 교육 목적의 데모입니다. 투자 조언이 아닙니다.
          과거 성과는 미래 수익을 보장하지 않습니다.
        </p>
      </div>
    </main>
  )
}
