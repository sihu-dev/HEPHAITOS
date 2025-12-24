'use client'

// ============================================
// Screen Share Widget
// 멘토 화면 동기화 위젯 (SSE 기반 실시간)
// HEPHAITOS LEARN 기능
// ============================================

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import {
  ComputerDesktopIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  SignalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// ============================================
// Types
// ============================================

interface ScreenState {
  chartSymbol: string
  chartTimeframe: string
  currentPrice: number
  indicators: {
    rsi: number
    macd: { value: number; signal: number; histogram: number }
    ma20: number
    ma60: number
  }
  annotations: Annotation[]
  cursorPosition?: { x: number; y: number }
  timestamp: number
}

interface Annotation {
  id: string
  type: 'line' | 'arrow' | 'circle' | 'text'
  position: { x: number; y: number }
  color: string
  content?: string
}

interface ScreenShareWidgetProps {
  sessionId: string
  mentorName: string
  isLive: boolean
  className?: string
}

// ============================================
// SSE 시뮬레이션 Hook
// ============================================

function useScreenSync(sessionId: string, isLive: boolean) {
  const [screenState, setScreenState] = useState<ScreenState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [latency, setLatency] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isLive) return

    setIsConnected(true)

    // 초기 상태
    const initialState: ScreenState = {
      chartSymbol: 'NVDA',
      chartTimeframe: '15m',
      currentPrice: 875.50,
      indicators: {
        rsi: 65.4,
        macd: { value: 2.3, signal: 1.8, histogram: 0.5 },
        ma20: 860.25,
        ma60: 845.80,
      },
      annotations: [],
      timestamp: Date.now(),
    }
    setScreenState(initialState)

    // 실시간 업데이트 시뮬레이션
    intervalRef.current = setInterval(() => {
      setScreenState((prev) => {
        if (!prev) return prev

        const priceChange = (Math.random() - 0.5) * 2
        const newPrice = prev.currentPrice + priceChange
        const rsiChange = (Math.random() - 0.5) * 2
        const newRsi = Math.max(0, Math.min(100, prev.indicators.rsi + rsiChange))

        const cursorPosition = Math.random() > 0.3
          ? { x: Math.random() * 100, y: Math.random() * 100 }
          : undefined

        let newAnnotations = [...prev.annotations]
        if (Math.random() > 0.95 && newAnnotations.length < 5) {
          const types: Annotation['type'][] = ['line', 'arrow', 'circle', 'text']
          const colors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']
          const contents = ['지지선', '저항선', '진입점', '손절점']
          const idx = Math.floor(Math.random() * 4)
          newAnnotations.push({
            id: `ann_${Date.now()}`,
            type: types[idx],
            position: { x: Math.random() * 100, y: Math.random() * 100 },
            color: colors[idx],
            content: contents[idx],
          })
        }

        if (Math.random() > 0.98 && newAnnotations.length > 0) {
          newAnnotations = newAnnotations.slice(1)
        }

        return {
          ...prev,
          currentPrice: newPrice,
          indicators: {
            ...prev.indicators,
            rsi: newRsi,
            macd: {
              ...prev.indicators.macd,
              histogram: prev.indicators.macd.histogram + (Math.random() - 0.5) * 0.1,
            },
          },
          annotations: newAnnotations,
          cursorPosition,
          timestamp: Date.now(),
        }
      })

      setLatency(Math.floor(Math.random() * 50) + 20)
    }, 500)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setIsConnected(false)
    }
  }, [sessionId, isLive])

  return { screenState, isConnected, latency }
}

// ============================================
// Main Component
// ============================================

export function ScreenShareWidget({
  sessionId,
  mentorName,
  isLive,
  className = '',
}: ScreenShareWidgetProps) {
  const { screenState, isConnected, latency } = useScreenSync(sessionId, isLive)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  return (
    <div
      ref={containerRef}
      className={`bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <ComputerDesktopIcon className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">{mentorName}의 화면</h3>
            <div className="flex items-center gap-2 text-xs">
              {isConnected ? (
                <>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <SignalIcon className="w-3 h-3" />
                    연결됨
                  </span>
                  <span className="text-zinc-500">{latency}ms</span>
                </>
              ) : (
                <span className="text-zinc-500">연결 대기중...</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            {isMuted ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            {isFullscreen ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Screen Content */}
      <div className="relative aspect-video bg-zinc-950">
        {!screenState ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full mx-auto mb-2 animate-spin" />
              <p className="text-zinc-500 text-sm">화면 로딩 중...</p>
            </div>
          </div>
        ) : (
          <>
            <SimulatedChart screenState={screenState} isPaused={isPaused} />

            {/* Mentor Cursor */}
            {screenState.cursorPosition && !isPaused && (
              <MentorCursor position={screenState.cursorPosition} />
            )}

            {/* Annotations */}
            {screenState.annotations.map((ann) => (
              <AnnotationMarker key={ann.id} annotation={ann} />
            ))}

            {/* Live Indicator */}
            {isLive && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded text-xs text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </div>
            )}

            {/* Paused Overlay */}
            {isPaused && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center">
                  <PauseIcon className="w-16 h-16 text-white/50 mx-auto mb-2" />
                  <p className="text-white/70 text-sm">일시정지</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Info Bar */}
      {screenState && (
        <div className="flex items-center justify-between p-3 border-t border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-white font-medium">{screenState.chartSymbol}</span>
            <span className="text-zinc-500">{screenState.chartTimeframe}</span>
            <span className={screenState.currentPrice > 870 ? 'text-emerald-400' : 'text-red-400'}>
              ${screenState.currentPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>RSI: {screenState.indicators.rsi.toFixed(1)}</span>
            <span>MACD: {screenState.indicators.macd.value.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* 면책조항 (헌법 준수) */}
      <div className="px-3 pb-3">
        <p className="text-[9px] text-zinc-400 leading-relaxed">
          ⚠️ 교육 목적 화면 공유입니다. 투자 조언이 아니며 모든 결정은 본인 책임입니다.
        </p>
      </div>
    </div>
  )
}

// ============================================
// Simulated Chart
// ============================================

const SimulatedChart = memo(function SimulatedChart({ screenState, isPaused }: { screenState: ScreenState; isPaused: boolean }) {
  const [chartData, setChartData] = useState<number[]>([])

  useEffect(() => {
    if (isPaused) return
    setChartData((prev) => [...prev, screenState.currentPrice].slice(-50))
  }, [screenState.currentPrice, isPaused])

  const minPrice = Math.min(...chartData, screenState.currentPrice) - 5
  const maxPrice = Math.max(...chartData, screenState.currentPrice) + 5
  const range = maxPrice - minPrice || 1

  return (
    <svg viewBox="0 0 400 200" className="w-full h-full">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {chartData.length > 1 && (
        <path
          d={chartData
            .map((price, i) => {
              const x = (i / (chartData.length - 1)) * 380 + 10
              const y = 190 - ((price - minPrice) / range) * 180
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
            })
            .join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />
      )}

      <line
        x1="10" y1={190 - ((screenState.indicators.ma20 - minPrice) / range) * 180}
        x2="390" y2={190 - ((screenState.indicators.ma20 - minPrice) / range) * 180}
        stroke="#f59e0b" strokeWidth="1" strokeDasharray="4" opacity="0.5"
      />
      <line
        x1="10" y1={190 - ((screenState.indicators.ma60 - minPrice) / range) * 180}
        x2="390" y2={190 - ((screenState.indicators.ma60 - minPrice) / range) * 180}
        stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4" opacity="0.5"
      />

      <g transform={`translate(350, ${190 - ((screenState.currentPrice - minPrice) / range) * 180})`}>
        <rect x="-30" y="-10" width="60" height="20" rx="4" fill="#3b82f6" />
        <text x="0" y="5" textAnchor="middle" fontSize="11" fill="white">
          ${screenState.currentPrice.toFixed(0)}
        </text>
      </g>

      <text x="20" y="30" fontSize="16" fontWeight="bold" fill="white">{screenState.chartSymbol}</text>
      <text x="20" y="48" fontSize="11" fill="#71717a">{screenState.chartTimeframe}</text>
    </svg>
  )
})

// ============================================
// Mentor Cursor
// ============================================

const MentorCursor = memo(function MentorCursor({ position }: { position: { x: number; y: number } }) {
  return (
    <div
      className="absolute pointer-events-none transition-all duration-100"
      style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className="relative">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 4L10.5 20.5L13 13L20.5 10.5L4 4Z" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
        </svg>
        <div className="absolute -bottom-4 left-4 px-1.5 py-0.5 bg-blue-500 rounded text-[9px] text-white whitespace-nowrap">
          멘토
        </div>
      </div>
    </div>
  )
})

// ============================================
// Annotation Marker
// ============================================

const AnnotationMarker = memo(function AnnotationMarker({ annotation }: { annotation: Annotation }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${annotation.position.x}%`, top: `${annotation.position.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {annotation.type === 'circle' && (
        <div className="w-8 h-8 rounded-full border-2 animate-pulse" style={{ borderColor: annotation.color }} />
      )}
      {annotation.type === 'text' && annotation.content && (
        <div
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ backgroundColor: `${annotation.color}20`, color: annotation.color }}
        >
          {annotation.content}
        </div>
      )}
      {annotation.type === 'arrow' && (
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 4L20 12L12 20L12 14L4 14L4 10L12 10L12 4Z" fill={annotation.color} />
        </svg>
      )}
      {annotation.type === 'line' && (
        <div className="w-16 h-0.5" style={{ backgroundColor: annotation.color }} />
      )}
    </div>
  )
})

export default ScreenShareWidget
