'use client'


import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BookOpenIcon,
  ArrowRightIcon,
  BeakerIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { useI18n } from '@/i18n/client'

// Dynamic import for AgentChat to avoid SSR issues
const AgentChat = dynamic(
  () => import('@/components/agent/AgentChat').then(m => m.AgentChat),
  { ssr: false, loading: () => <ChatSkeleton /> }
)

export function AgentContent() {
  const { t } = useI18n()
  const [showTips, setShowTips] = useState(true)
  const [createdStrategy, setCreatedStrategy] = useState<unknown>(null)

  const handleStrategyCreated = useCallback((strategy: unknown) => {
    setCreatedStrategy(strategy)
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-white flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-[#7C8AEA]" />
            AI 트레이딩 에이전트
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            자연어로 전략을 설명하면 AI가 자동으로 트레이딩 봇을 만들어드립니다
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
        >
          <BookOpenIcon className="w-4 h-4" />
          {showTips ? '팁 숨기기' : '사용 팁'}
        </button>
      </div>

      {/* Tips Section */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TipCard
                icon={BeakerIcon}
                title="1. 전략 생성"
                description="자연어로 원하는 전략을 설명하세요. RSI, MACD, 볼린저밴드 등 기술적 지표를 활용할 수 있습니다."
                example='"비트코인 RSI 30 이하면 매수, 70 이상이면 매도"'
              />
              <TipCard
                icon={ChartBarIcon}
                title="2. 백테스트"
                description="생성된 전략을 과거 데이터로 테스트해보세요. 수익률, 샤프비율, 최대낙폭을 확인할 수 있습니다."
                example='"3개월 백테스트 돌려줘"'
              />
              <TipCard
                icon={RocketLaunchIcon}
                title="3. 실전 투입"
                description="백테스트 결과가 만족스러우면 실전에 투입하세요. 페이퍼 트레이딩으로 먼저 테스트를 권장합니다."
                example='"실전 투입해줘"'
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Panel */}
        <div className="lg:col-span-2 h-[600px]">
          <AgentChat onStrategyCreated={handleStrategyCreated} />
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Created Strategy Preview */}
          {createdStrategy ? (
            <StrategyPreview strategy={createdStrategy} />
          ) : (
            <EmptyStrategyCard />
          )}

          {/* Quick Commands */}
          <div className="border border-white/[0.06] rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Cog6ToothIcon className="w-4 h-4 text-zinc-500" />
              빠른 명령어
            </h3>
            <div className="space-y-2">
              {quickCommands.map((cmd) => (
                <div
                  key={cmd.command}
                  className="p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <p className="text-sm text-white font-mono">{cmd.command}</p>
                  <p className="text-xs text-zinc-500 mt-1">{cmd.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="pt-4">
        <DisclaimerInline />
      </div>
    </div>
  )
}

// ============================================
// Sub Components
// ============================================

function ChatSkeleton() {
  return (
    <div className="h-[600px] bg-[#0A0A0C] border border-white/[0.06] rounded-lg animate-pulse">
      <div className="h-14 border-b border-white/[0.06] bg-white/[0.02]" />
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/[0.04] rounded w-3/4" />
              <div className="h-4 bg-white/[0.04] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface TipCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  example: string
}

function TipCard({ icon: Icon, title, description, example }: TipCardProps) {
  return (
    <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[#7C8AEA]" />
        <h3 className="text-sm font-medium text-white">{title}</h3>
      </div>
      <p className="text-xs text-zinc-400 mb-2">{description}</p>
      <p className="text-xs text-[#7C8AEA] bg-[#5E6AD2]/10 px-2 py-1 rounded font-mono">
        {example}
      </p>
    </div>
  )
}

function StrategyPreview({ strategy }: { strategy: unknown }) {
  return (
    <div className="border border-[#5E6AD2]/20 bg-[#5E6AD2]/5 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="w-5 h-5 text-[#7C8AEA]" />
        <h3 className="text-sm font-medium text-white">생성된 전략</h3>
      </div>
      <pre className="text-xs text-zinc-400 bg-black/30 p-3 rounded overflow-auto max-h-48">
        {JSON.stringify(strategy, null, 2)}
      </pre>
      <button
        type="button"
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-[#7C8AEA] hover:text-[#9AA5EF] bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/20 rounded transition-colors"
      >
        전략 빌더에서 편집
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

function EmptyStrategyCard() {
  return (
    <div className="border border-white/[0.06] rounded-lg p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-white/[0.04] flex items-center justify-center">
        <SparklesIcon className="w-6 h-6 text-zinc-500" />
      </div>
      <h3 className="text-sm font-medium text-white mb-1">전략 생성 대기 중</h3>
      <p className="text-xs text-zinc-500">
        왼쪽 채팅에서 전략을 설명하면<br />
        AI가 자동으로 생성합니다
      </p>
    </div>
  )
}

const quickCommands = [
  { command: '도움말', description: '사용 가능한 명령어 확인' },
  { command: '백테스트', description: '현재 전략 백테스트 실행' },
  { command: '현재 포지션', description: '보유 포지션 조회' },
  { command: '거래 중지', description: '실시간 거래 중지' },
]
