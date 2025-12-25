'use client'

// ============================================
// Chart Analysis Panel Component
// Claude Vision을 활용한 차트 분석 UI
// ============================================

import { memo, useState, useCallback } from 'react'
import {
  SparklesIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { ChartAnalysisResponse, CandlePattern } from '@/types'

// ============================================
// Types
// ============================================

export interface ChartAnalysisPanelProps {
  analysis: ChartAnalysisResponse | null
  isLoading: boolean
  onClose: () => void
  className?: string
}

// ============================================
// Main Component
// ============================================

export const ChartAnalysisPanel = memo(function ChartAnalysisPanel({
  analysis,
  isLoading,
  onClose,
  className = '',
}: ChartAnalysisPanelProps) {
  if (!analysis && !isLoading) return null

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-screen w-full md:w-96 bg-zinc-900/95 backdrop-blur-xl border-l border-white/[0.06] shadow-2xl z-50',
        'animate-slide-in-right',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-medium text-white">AI 차트 분석</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
          aria-label="닫기"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-57px)] overflow-y-auto">
        {isLoading ? (
          <LoadingState />
        ) : analysis ? (
          <AnalysisResult analysis={analysis} />
        ) : null}
      </div>
    </div>
  )
})

// ============================================
// Loading State
// ============================================

const LoadingState = memo(function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="relative">
        <SparklesIcon className="w-12 h-12 text-primary animate-pulse" />
        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
      </div>
      <p className="mt-4 text-sm text-zinc-400 text-center">
        AI가 차트를 분석하고 있습니다...
      </p>
      <p className="mt-2 text-xs text-zinc-500 text-center">
        약 5초 소요됩니다
      </p>
    </div>
  )
})

// ============================================
// Analysis Result
// ============================================

const AnalysisResult = memo(function AnalysisResult({ analysis }: { analysis: ChartAnalysisResponse }) {
  return (
    <div className="p-4 space-y-4">
      {/* Trend */}
      <TrendCard trend={analysis.trend} strength={analysis.strength} />

      {/* Recommendation */}
      <RecommendationCard recommendation={analysis.recommendation} riskLevel={analysis.risk_level} />

      {/* Support & Resistance */}
      <LevelsCard support={analysis.support} resistance={analysis.resistance} />

      {/* Patterns */}
      {analysis.patterns.length > 0 && <PatternsCard patterns={analysis.patterns} />}

      {/* Volume Analysis */}
      <VolumeCard analysis={analysis.volume_analysis} />

      {/* Disclaimer */}
      <DisclaimerCard disclaimer={analysis.disclaimer} />
    </div>
  )
})

// ============================================
// Trend Card
// ============================================

const TrendCard = memo(function TrendCard({
  trend,
  strength
}: {
  trend: 'uptrend' | 'downtrend' | 'sideways'
  strength: number
}) {
  const trendConfig = {
    uptrend: {
      label: '상승 추세',
      icon: ArrowTrendingUpIcon,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    downtrend: {
      label: '하락 추세',
      icon: ArrowTrendingDownIcon,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    sideways: {
      label: '횡보 추세',
      icon: MinusIcon,
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10',
    },
  }

  const config = trendConfig[trend]
  const Icon = config.icon

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-400">추세</span>
        <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded', config.bgColor)}>
          <Icon className={cn('w-4 h-4', config.color)} />
          <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
        </div>
      </div>

      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">추세 강도</span>
          <span className="text-white font-medium">{strength}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              strength >= 70 ? 'bg-emerald-500' : strength >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>
    </div>
  )
})

// ============================================
// Recommendation Card
// ============================================

const RecommendationCard = memo(function RecommendationCard({
  recommendation,
  riskLevel,
}: {
  recommendation: {
    action: 'buy' | 'sell' | 'hold' | 'wait'
    reasoning: string
    confidence: number
  }
  riskLevel: 'low' | 'medium' | 'high'
}) {
  const actionConfig = {
    buy: { label: '매수 가능', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    sell: { label: '매도 가능', color: 'text-red-400', bgColor: 'bg-red-500/10' },
    hold: { label: '보유 권장', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    wait: { label: '관망 권장', color: 'text-zinc-400', bgColor: 'bg-zinc-500/10' },
  }

  const riskConfig = {
    low: { icon: ShieldCheckIcon, color: 'text-emerald-400', label: '낮음' },
    medium: { icon: ShieldExclamationIcon, color: 'text-yellow-400', label: '보통' },
    high: { icon: ExclamationTriangleIcon, color: 'text-red-400', label: '높음' },
  }

  const action = actionConfig[recommendation.action]
  const risk = riskConfig[riskLevel]
  const RiskIcon = risk.icon

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-400">AI 추천</span>
        <div className={cn('px-2 py-1 rounded text-xs font-medium', action.bgColor, action.color)}>
          {action.label}
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-sm text-zinc-300 mb-3">{recommendation.reasoning}</p>

      {/* Confidence & Risk */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">신뢰도</span>
          <span className="text-xs text-white font-medium">{recommendation.confidence}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RiskIcon className={cn('w-4 h-4', risk.color)} />
          <span className={cn('text-xs font-medium', risk.color)}>리스크 {risk.label}</span>
        </div>
      </div>
    </div>
  )
})

// ============================================
// Support & Resistance Levels Card
// ============================================

const LevelsCard = memo(function LevelsCard({
  support,
  resistance,
}: {
  support: number[]
  resistance: number[]
}) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-lg p-4">
      <h4 className="text-xs text-zinc-400 mb-3">주요 가격대</h4>

      <div className="grid grid-cols-2 gap-3">
        {/* Support */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500">지지선</span>
          </div>
          {support.length > 0 ? (
            support.map((level, i) => (
              <div key={i} className="text-sm text-emerald-400 font-mono">
                {level.toLocaleString()}
              </div>
            ))
          ) : (
            <span className="text-xs text-zinc-600">없음</span>
          )}
        </div>

        {/* Resistance */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-zinc-500">저항선</span>
          </div>
          {resistance.length > 0 ? (
            resistance.map((level, i) => (
              <div key={i} className="text-sm text-red-400 font-mono">
                {level.toLocaleString()}
              </div>
            ))
          ) : (
            <span className="text-xs text-zinc-600">없음</span>
          )}
        </div>
      </div>
    </div>
  )
})

// ============================================
// Candlestick Patterns Card
// ============================================

const PatternsCard = memo(function PatternsCard({ patterns }: { patterns: CandlePattern[] }) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-lg p-4">
      <h4 className="text-xs text-zinc-400 mb-3">감지된 패턴</h4>

      <div className="space-y-2">
        {patterns.map((pattern, i) => (
          <div key={i} className="flex items-start justify-between p-2 bg-white/[0.02] rounded">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-white font-medium">{pattern.name}</span>
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    pattern.type === 'bullish'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : pattern.type === 'bearish'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-zinc-500/10 text-zinc-400'
                  )}
                >
                  {pattern.type === 'bullish' ? '강세' : pattern.type === 'bearish' ? '약세' : '중립'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{pattern.description}</p>
            </div>
            <span className="text-xs text-zinc-500 ml-2">{pattern.confidence}%</span>
          </div>
        ))}
      </div>
    </div>
  )
})

// ============================================
// Volume Analysis Card
// ============================================

const VolumeCard = memo(function VolumeCard({ analysis }: { analysis: string }) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-lg p-4">
      <h4 className="text-xs text-zinc-400 mb-2">거래량 분석</h4>
      <p className="text-sm text-zinc-300">{analysis}</p>
    </div>
  )
})

// ============================================
// Disclaimer Card
// ============================================

const DisclaimerCard = memo(function DisclaimerCard({ disclaimer }: { disclaimer: string }) {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-200/80">{disclaimer}</p>
      </div>
    </div>
  )
})

export default ChartAnalysisPanel
