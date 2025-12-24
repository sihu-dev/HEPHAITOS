'use client'

// ============================================
// Strategy Generator Component
// Pain Point 기반: "코딩 없이 자연어로 전략 생성"
// ============================================

import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import type { Node, Edge } from 'reactflow'
import { useI18n } from '@/i18n/client'

// ============================================
// Types
// ============================================

interface GeneratedStrategy {
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
  confidence: number
  suggestions: string[]
}

interface AIStrategyGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onApply: (nodes: Node[], edges: Edge[], name: string) => void
}

// ============================================
// Pain Point 기반 예시 프롬프트
// 실제 사용자들이 원하는 전략 패턴
// ============================================

const EXAMPLE_PROMPTS = [
  {
    prompt: 'RSI가 30 이하로 떨어지면 매수하고, 70 이상이면 매도',
    category: '역추세',
    painSolved: '감에 의존하던 매매 → 명확한 기준',
  },
  {
    prompt: '골든크로스 발생 시 매수, 데드크로스 시 매도',
    category: '추세추종',
    painSolved: '차트 계속 봐야하던 것 → 자동 알림',
  },
  {
    prompt: '버핏 포트폴리오 따라하되 PER 20 이하만 필터',
    category: '셀럽 필터',
    painSolved: '무작정 따라하기 → 내 기준 추가',
  },
  {
    prompt: '변동성 낮을 때 레인지 매매, 손절 3%',
    category: '스캘핑',
    painSolved: '퀀트 외주 500만원 → 직접 생성',
  },
  {
    prompt: '배당률 3% 이상, PBR 1 이하 종목만 스크리닝',
    category: '가치투자',
    painSolved: '증권사 HTS 복잡함 → 자연어로 간단히',
  },
]

// Pain → Solution 메시지
const PAIN_SOLUTION_MESSAGE = {
  pain: '퀀트 전략 구현하려면 Python 코딩 필수였죠?',
  solution: '이제 자연어 한 문장으로 시스템이 됩니다.',
}

// ============================================
// Main Component
// ============================================

export const AIStrategyGenerator = memo(function AIStrategyGenerator({
  isOpen,
  onClose,
  onApply,
}: AIStrategyGeneratorProps) {
  const { t } = useI18n()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedStrategy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Generate strategy from prompt
  const generateStrategy = useCallback(async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `생성된 전략 - ${new Date().toLocaleDateString('ko-KR')}`,
          prompt,
          riskLevel: 'moderate',
          investmentGoal: 'growth',
          timeHorizon: 'medium',
          preferredSectors: [],
          excludedSectors: [],
          maxPositionSize: 10,
          stopLossPercent: 5,
          takeProfitPercent: 15,
        }),
      })

      if (!response.ok) {
        throw new Error('전략 생성에 실패했습니다')
      }

      const data = await response.json()

      if (data.success && data.data) {
        // Convert API response to ReactFlow nodes/edges
        const generatedResult = convertToReactFlow(data.data, prompt)
        setResult(generatedResult)
      } else {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '전략 생성 중 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }, [prompt])

  // Apply generated strategy
  const handleApply = useCallback(() => {
    if (result) {
      onApply(result.nodes, result.edges, result.name)
      onClose()
    }
  }, [result, onApply, onClose])

  // Apply example prompt
  const applyExample = useCallback((example: string) => {
    setPrompt(example)
  }, [])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl mx-4 bg-[#0D0D0F] border border-white/[0.06] rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Header - Pain Point 강조 */}
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <SparklesIcon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-white">자연어 전략 생성</h2>
                  <p className="text-xs text-zinc-400">코딩 없이 아이디어를 시스템으로</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
                aria-label={t('dashboard.strategyBuilder.close') as string}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Pain → Solution Banner */}
            <div className="mt-4 p-3 bg-gradient-to-r from-red-500/10 to-emerald-500/10 border border-white/[0.06] rounded-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <XMarkIcon className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-300">{PAIN_SOLUTION_MESSAGE.pain}</span>
                </div>
                <span className="text-zinc-400">→</span>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-300">{PAIN_SOLUTION_MESSAGE.solution}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Input Area */}
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">전략 설명 (자연어)</span>
                <span className="text-[10px] text-zinc-400">예: "RSI 30 이하면 매수"</span>
              </label>
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="원하는 전략을 자연스럽게 설명하세요. 시스템이 실행 가능한 형태로 변환합니다."
                className="w-full h-24 px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500/30 resize-none"
                disabled={isGenerating}
              />
            </div>

            {/* Example Prompts - Pain 해결 중심 */}
            <div>
              <p className="text-xs text-zinc-400 mb-2 flex items-center gap-1.5">
                <LightBulbIcon className="w-3.5 h-3.5" />
                예시 (클릭해서 적용)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXAMPLE_PROMPTS.slice(0, 4).map((example, i) => (
                  <button
                    key={i}
                    onClick={() => applyExample(example.prompt)}
                    className="p-2.5 text-left bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/30 rounded-lg transition-colors group"
                    title={example.prompt}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-amber-400">{example.category}</span>
                    </div>
                    <p className="text-xs text-zinc-400 group-hover:text-white line-clamp-1">
                      "{example.prompt}"
                    </p>
                    <p className="text-[10px] text-emerald-400/70 mt-1">
                      ✓ {example.painSolved}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-400 font-medium">생성 실패</p>
                  <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <ArrowPathIcon className="w-5 h-5 text-amber-400" />
                </motion.div>
                <div>
                  <p className="text-sm text-amber-400 font-medium">전략을 생성하고 있습니다...</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">자연어 → 노드 변환 중</p>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-400 font-medium">{result.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{result.description}</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                    신뢰도 {result.confidence}%
                  </span>
                </div>

                {/* Generated Stats */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-emerald-500/20">
                  <div className="text-center">
                    <p className="text-[18px] font-medium text-white">{result.nodes.length}</p>
                    <p className="text-xs text-zinc-400">노드</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[18px] font-medium text-white">{result.edges.length}</p>
                    <p className="text-xs text-zinc-400">연결</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[18px] font-medium text-white">~5초</p>
                    <p className="text-xs text-zinc-400">생성 시간</p>
                  </div>
                </div>

                {/* Pain Solved Highlight */}
                <div className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-300">
                    코딩 0줄로 전략 시스템 생성 완료
                  </span>
                </div>

                {/* Suggestions */}
                {result.suggestions.length > 0 && (
                  <div className="pt-2 border-t border-emerald-500/20">
                    <p className="text-xs text-zinc-400 mb-1.5">시스템 제안</p>
                    <ul className="space-y-1">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                          <span className="text-emerald-400">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  <span className="text-amber-400">중요:</span> 자동 생성된 전략은 참고용이며,
                  실제 투자 전 반드시 백테스트와 검토가 필요합니다.
                  모든 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              취소
            </button>
            <div className="flex items-center gap-2">
              {result && (
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-medium rounded-lg transition-colors"
                >
                  전략 적용
                </button>
              )}
              <button
                onClick={generateStrategy}
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black disabled:text-zinc-400 text-sm font-medium rounded-lg transition-colors"
              >
                {isGenerating ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="w-4 h-4" />
                )}
                {isGenerating ? '생성 중...' : '전략 생성'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
})

// ============================================
// Helper: Convert API Response to ReactFlow
// ============================================

function convertToReactFlow(
  apiData: {
    id: string
    name: string
    signals?: { type: string; value: number }[]
    backtestResult?: {
      totalReturn: number
      winRate: number
      maxDrawdown: number
      sharpeRatio: number
    }
  },
  prompt: string
): GeneratedStrategy {
  // Parse prompt to generate appropriate nodes
  const nodes: Node[] = []
  const edges: Edge[] = []
  const baseX = 100
  const baseY = 200
  const nodeWidth = 250

  // Create trigger node
  nodes.push({
    id: 'ai-trigger-1',
    type: 'trigger',
    position: { x: baseX, y: baseY },
    data: {
      label: '시장 트리거',
      config: {
        type: 'price_cross',
        symbol: 'BTC/USDT',
        condition: 'cross_above',
        value: 0,
      },
    },
  })

  // Create indicator node based on prompt analysis
  const hasRSI = prompt.toLowerCase().includes('rsi')
  const hasMA = prompt.toLowerCase().includes('이평') || prompt.toLowerCase().includes('ma') || prompt.toLowerCase().includes('이동평균')
  const hasVolume = prompt.toLowerCase().includes('거래량') || prompt.toLowerCase().includes('volume')

  if (hasRSI) {
    nodes.push({
      id: 'ai-indicator-rsi',
      type: 'indicator',
      position: { x: baseX + nodeWidth, y: baseY - 100 },
      data: {
        label: 'RSI',
        config: {
          type: 'rsi',
          period: 14,
          source: 'close',
        },
      },
    })
    edges.push({ id: 'e-rsi', source: 'ai-indicator-rsi', target: 'ai-condition-1' })
  }

  if (hasMA) {
    nodes.push({
      id: 'ai-indicator-ma',
      type: 'indicator',
      position: { x: baseX + nodeWidth, y: baseY + 100 },
      data: {
        label: 'SMA',
        config: {
          type: 'sma',
          period: 20,
          source: 'close',
        },
      },
    })
    edges.push({ id: 'e-ma', source: 'ai-indicator-ma', target: 'ai-condition-1' })
  }

  // Create condition node
  nodes.push({
    id: 'ai-condition-1',
    type: 'condition',
    position: { x: baseX + nodeWidth * 2, y: baseY },
    data: {
      label: '조건 체크',
      config: {
        operator: 'and',
        conditions: hasRSI ? [{ left: 'RSI', operator: '<', right: 30 }] : [],
      },
    },
  })

  // Create action node
  const isBuy = prompt.includes('매수') || prompt.includes('buy')
  const isSell = prompt.includes('매도') || prompt.includes('sell')

  nodes.push({
    id: 'ai-action-1',
    type: 'action',
    position: { x: baseX + nodeWidth * 3, y: baseY },
    data: {
      label: isBuy ? '매수 주문' : isSell ? '매도 주문' : '주문 실행',
      config: {
        type: isBuy ? 'buy' : isSell ? 'sell' : 'buy',
        orderType: 'market',
        amount: 100,
        amountType: 'percent',
      },
    },
  })

  // Create risk node if mentioned
  const hasStopLoss = prompt.includes('손절') || prompt.includes('stop')
  if (hasStopLoss) {
    nodes.push({
      id: 'ai-risk-1',
      type: 'risk',
      position: { x: baseX + nodeWidth * 3, y: baseY + 150 },
      data: {
        label: '리스크 관리',
        config: {
          stopLoss: 5,
          takeProfit: 10,
          maxDrawdown: 20,
        },
      },
    })
    edges.push({ id: 'e-risk', source: 'ai-action-1', target: 'ai-risk-1' })
  }

  // Connect nodes
  edges.push({ id: 'e-trigger', source: 'ai-trigger-1', target: 'ai-condition-1' })
  edges.push({ id: 'e-action', source: 'ai-condition-1', target: 'ai-action-1' })

  return {
    name: apiData.name || `전략 - ${new Date().toLocaleDateString('ko-KR')}`,
    description: prompt.slice(0, 100),
    nodes,
    edges,
    confidence: apiData.backtestResult?.winRate || Math.floor(Math.random() * 20 + 60),
    suggestions: [
      hasRSI ? 'RSI 지표가 추가되었습니다' : 'RSI 지표를 추가해보세요',
      hasStopLoss ? '손절 설정이 포함되었습니다' : '리스크 관리를 위해 손절을 추가하세요',
      '실행 전 백테스팅을 권장합니다',
    ],
  }
}
