'use client'

import { useEffect, useState } from 'react'

// ============================================
// 전문 데이터 패널
// 자연어 입력 시 전문 트레이딩 데이터 노출
// ============================================

interface ProfessionalDataPanelProps {
  isVisible: boolean
  userPrompt: string
  buildProgress: number
}

interface TradingMetric {
  label: string
  value: string
  change?: number
  icon: string
  color: string
}

interface BacktestResult {
  sharpeRatio: number
  totalReturn: number
  winRate: number
  maxDrawdown: number
  totalTrades: number
}

export function ProfessionalDataPanel({
  isVisible,
  userPrompt,
  buildProgress
}: ProfessionalDataPanelProps) {
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 백테스트 결과 시뮬레이션
  useEffect(() => {
    if (buildProgress === 100 && !backtestResults) {
      setIsAnalyzing(true)

      setTimeout(() => {
        setBacktestResults({
          sharpeRatio: 1.45,
          totalReturn: 23.5,
          winRate: 67,
          maxDrawdown: -12.3,
          totalTrades: 156,
        })
        setIsAnalyzing(false)
      }, 1500)
    }
  }, [buildProgress, backtestResults])

  if (!isVisible) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">⚡</div>
          <p className="text-xs text-zinc-500">
            전략 선택 시<br />퀀트 리포트 생성
          </p>
        </div>
      </div>
    )
  }

  const metrics: TradingMetric[] = [
    {
      label: 'Sharpe Ratio',
      value: backtestResults ? backtestResults.sharpeRatio.toFixed(2) : '검증 중...',
      icon: '📊',
      color: 'text-emerald-400',
    },
    {
      label: 'Total Return',
      value: backtestResults ? `${backtestResults.totalReturn.toFixed(1)}%` : '검증 중...',
      change: backtestResults ? backtestResults.totalReturn : undefined,
      icon: '💹',
      color: 'text-blue-400',
    },
    {
      label: 'Win Rate',
      value: backtestResults ? `${backtestResults.winRate}%` : '검증 중...',
      icon: '🎯',
      color: 'text-yellow-400',
    },
    {
      label: 'Max Drawdown',
      value: backtestResults ? `${backtestResults.maxDrawdown.toFixed(1)}%` : '검증 중...',
      icon: '⚖️',
      color: 'text-red-400',
    },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 p-3 border-b border-white/[0.06]">
        <h3 className="text-xs font-semibold text-white mb-1">퀀트 분석 리포트</h3>
        <p className="text-xs text-zinc-500">정량 평가 & 백테스트</p>
      </div>

      {/* 메트릭 카드 */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{metric.icon}</span>
                {metric.change !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      metric.change > 0
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : 'bg-red-400/10 text-red-400'
                    }`}
                  >
                    {metric.change > 0 ? '+' : ''}
                    {metric.change.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mb-1">{metric.label}</p>
              <p className={`text-lg font-semibold ${metric.color}`}>
                {isAnalyzing ? (
                  <span className="text-sm text-zinc-500">검증 중...</span>
                ) : (
                  metric.value
                )}
              </p>
            </div>
          ))}
        </div>

        {/* 상세 통계 */}
        {backtestResults && (
          <div className="mt-4 p-3 bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 rounded-lg">
            <h4 className="text-xs font-semibold text-[#5E6AD2] mb-3">상세 통계</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">총 거래 횟수</span>
                <span className="text-white font-semibold">{backtestResults.totalTrades}회</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">평균 보유 기간</span>
                <span className="text-white font-semibold">3.2일</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">평균 수익/손실</span>
                <span className="text-white font-semibold">+2.1% / -1.5%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Risk/Reward 비율</span>
                <span className="text-white font-semibold">1:1.4</span>
              </div>
            </div>
          </div>
        )}

        {/* 3중 검증 엔진 리포트 */}
        {backtestResults && (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-semibold text-white mb-2">⚡ 3중 검증 엔진 리포트</h4>

            {/* 기술적 분석 엔진 */}
            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">📊</span>
                <span className="text-xs font-medium text-blue-400">기술적 분석 엔진</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sharpe Ratio 1.45는 <strong className="text-white">우수한 수준</strong>입니다.
                Win Rate 67%는 안정적이며, Total Return 23.5%는 시장 평균 대비 초과 수익입니다.
              </p>
            </div>

            {/* 리스크 평가 엔진 */}
            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">⚖️</span>
                <span className="text-xs font-medium text-amber-400">리스크 평가 엔진</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                MDD -12.3% 고려 시 <strong className="text-yellow-400">포지션 사이징 10% 제한</strong> 권장.
                Risk-Adjusted Return 기준 중위험-중수익 프로파일입니다.
              </p>
            </div>

            {/* 시장 심리 엔진 */}
            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🧠</span>
                <span className="text-xs font-medium text-purple-400">시장 심리 엔진</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                총 156회 거래로 <strong className="text-white">통계적 유의성</strong> 확보.
                규칙 기반 실행과 감정 배제가 성공의 핵심입니다.
              </p>
            </div>
          </div>
        )}

        {/* 리스크 경고 */}
        {backtestResults && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 text-sm flex-shrink-0">⚠️</span>
              <div>
                <h4 className="text-xs font-semibold text-amber-400 mb-1">투자 유의사항</h4>
                <p className="text-xs text-zinc-400">
                  과거 성과는 미래 수익을 보장하지 않습니다.
                  실전 투자 전 소액으로 테스트하는 것을 권장합니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 */}
      {backtestResults && (
        <div className="flex-shrink-0 p-3 border-t border-white/[0.06] space-y-2">
          <button className="w-full py-2 bg-[#5E6AD2] text-white text-xs font-medium rounded-lg hover:bg-[#7C8AEA] transition-all flex items-center justify-center gap-2">
            <span>📊</span>
            <span>상세 리포트 보기</span>
          </button>
          <button className="w-full py-2 bg-white/[0.03] border border-white/[0.06] text-white text-xs font-medium rounded-lg hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2">
            <span>💾</span>
            <span>알고리즘 저장</span>
          </button>
        </div>
      )}
    </div>
  )
}
