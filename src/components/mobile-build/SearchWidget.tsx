'use client'

import { useState, useEffect } from 'react'

// ============================================
// 검색 위젯 - 자연어 추천 + 선택/입력 모두 지원
// ============================================

interface QuantEngine {
  type: 'technical' | 'risk' | 'sentiment'
  name: string
  icon: string
  score: number // 0-100
  insight: string
  color: string
}

interface Strategy {
  id: string
  name: string
  category: string
  icon: string
  difficulty: 'easy' | 'medium' | 'hard'
  popularity: number
  naturalPrompt: string // 자연어 프롬프트 템플릿
  quantEngines: QuantEngine[] // 3중 검증 엔진
}

// Mock 추천 전략 (실제로는 API에서 가져옴)
const RECOMMENDED_STRATEGIES: Strategy[] = [
  {
    id: 'rsi-oversold',
    name: 'RSI 과매도 매수',
    category: '기술적 분석',
    icon: '📈',
    difficulty: 'easy',
    popularity: 95,
    naturalPrompt: 'RSI가 30 이하일 때 매수하고 70 이상일 때 매도해줘',
    quantEngines: [
      {
        type: 'technical',
        name: '기술적 분석 엔진',
        icon: '📊',
        score: 87,
        insight: '과매도/과매수 구간에서 평균 승률 67%, Sharpe 1.45 기록',
        color: '#3B82F6',
      },
      {
        type: 'risk',
        name: '리스크 평가 엔진',
        icon: '⚖️',
        score: 72,
        insight: 'MDD -12.3%. 포지션 사이징 10% 제한 권장',
        color: '#F59E0B',
      },
      {
        type: 'sentiment',
        name: '시장 심리 엔진',
        icon: '🧠',
        score: 81,
        insight: '공포-탐욕 지수 활용. 역발상 수익률 +23.5%',
        color: '#8B5CF6',
      },
    ],
  },
  {
    id: 'macd-crossover',
    name: 'MACD 골든크로스',
    category: '기술적 분석',
    icon: '💫',
    difficulty: 'medium',
    popularity: 88,
    naturalPrompt: 'MACD 골든크로스 발생 시 매수하고 데드크로스 시 매도해줘',
    quantEngines: [
      {
        type: 'technical',
        name: '기술적 분석 엔진',
        icon: '📊',
        score: 79,
        insight: '추세 전환 시그널. 중장기 수익률 +18.2%',
        color: '#3B82F6',
      },
      {
        type: 'risk',
        name: '리스크 평가 엔진',
        icon: '⚖️',
        score: 68,
        insight: '지연 신호 특성. 트렌드 장 한정 운용 권장',
        color: '#F59E0B',
      },
      {
        type: 'sentiment',
        name: '시장 심리 엔진',
        icon: '🧠',
        score: 75,
        insight: '모멘텀 전환 포착. 거래량 증가 구간 필터링 필수',
        color: '#8B5CF6',
      },
    ],
  },
  {
    id: 'bollinger-squeeze',
    name: '볼린저 밴드 스퀴즈',
    category: '변동성',
    icon: '🎯',
    difficulty: 'medium',
    popularity: 82,
    naturalPrompt: '볼린저 밴드 하단 돌파 시 매수, 상단 돌파 시 매도해줘',
    quantEngines: [
      {
        type: 'technical',
        name: '기술적 분석 엔진',
        icon: '📊',
        score: 84,
        insight: '변동성 브레이크아웃. 평균 회귀 수익률 +21.7%',
        color: '#3B82F6',
      },
      {
        type: 'risk',
        name: '리스크 평가 엔진',
        icon: '⚖️',
        score: 77,
        insight: 'Volatility Regime 필터링. 손익비 1:1.8 유지',
        color: '#F59E0B',
      },
      {
        type: 'sentiment',
        name: '시장 심리 엔진',
        icon: '🧠',
        score: 80,
        insight: '극단 가격 역발상. VIX 20+ 구간 승률 72%',
        color: '#8B5CF6',
      },
    ],
  },
  {
    id: 'momentum-breakout',
    name: '모멘텀 돌파',
    category: '추세',
    icon: '🚀',
    difficulty: 'hard',
    popularity: 76,
    naturalPrompt: '20일 고점 돌파 시 매수하고 10일 저점 이탈 시 손절해줘',
    quantEngines: [
      {
        type: 'technical',
        name: '기술적 분석 엔진',
        icon: '📊',
        score: 82,
        insight: 'Breakout 전략. 거래량 필터 적용 시 승률 64%',
        color: '#3B82F6',
      },
      {
        type: 'risk',
        name: '리스크 평가 엔진',
        icon: '⚖️',
        score: 65,
        insight: 'High Risk-High Return. ATR 기반 손절 엄수 필수',
        color: '#EF4444',
      },
      {
        type: 'sentiment',
        name: '시장 심리 엔진',
        icon: '🧠',
        score: 78,
        insight: '강세장 모멘텀. Fear&Greed Index 60+ 최적',
        color: '#8B5CF6',
      },
    ],
  },
  {
    id: 'mean-reversion',
    name: '평균 회귀',
    category: '통계적',
    icon: '📊',
    difficulty: 'medium',
    popularity: 73,
    naturalPrompt: '가격이 20일 이동평균선에서 5% 이상 벗어나면 역방향 매수해줘',
    quantEngines: [
      {
        type: 'technical',
        name: '기술적 분석 엔진',
        icon: '📊',
        score: 76,
        insight: 'Mean Reversion. 박스권 Z-Score 전략 수익률 +19.4%',
        color: '#3B82F6',
      },
      {
        type: 'risk',
        name: '리스크 평가 엔진',
        icon: '⚖️',
        score: 70,
        insight: '중위험. Regime Filter 미적용 시 MDD -18% 주의',
        color: '#F59E0B',
      },
      {
        type: 'sentiment',
        name: '시장 심리 엔진',
        icon: '🧠',
        score: 74,
        insight: 'Overshooting 역발상. 보유 기간 평균 5.2일',
        color: '#8B5CF6',
      },
    ],
  },
  {
    id: 'swing-trading',
    name: '스윙 트레이딩',
    category: '단기',
    icon: '🔄',
    difficulty: 'easy',
    popularity: 91,
    naturalPrompt: '5일선이 20일선을 상향 돌파하면 매수하고 3% 수익 시 매도해줘',
    quantEngines: [
      {
        type: 'technical',
        name: '기술적 분석 엔진',
        icon: '📊',
        score: 85,
        insight: '단기 크로스오버. 승률 71% / 평균 수익률 +3.2%',
        color: '#3B82F6',
      },
      {
        type: 'risk',
        name: '리스크 평가 엔진',
        icon: '⚖️',
        score: 80,
        insight: '저위험. 타겟 익절 3% 고정. MDD -8.5%',
        color: '#10B981',
      },
      {
        type: 'sentiment',
        name: '시장 심리 엔진',
        icon: '🧠',
        score: 83,
        insight: '단기 모멘텀 캐치. 평균 보유 2.3일',
        color: '#8B5CF6',
      },
    ],
  },
]

interface SearchWidgetProps {
  onStrategySelect: (strategyId: string, naturalPrompt: string) => void
  selectedStrategy: string | null
}

export function SearchWidget({ onStrategySelect, selectedStrategy }: SearchWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredStrategies, setFilteredStrategies] = useState(RECOMMENDED_STRATEGIES)
  const [isLoading, setIsLoading] = useState(false)

  // 검색 필터링 (실제로는 API 호출)
  useEffect(() => {
    if (!searchQuery) {
      setFilteredStrategies(RECOMMENDED_STRATEGIES)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(() => {
      const filtered = RECOMMENDED_STRATEGIES.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.naturalPrompt.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredStrategies(filtered)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const getDifficultyColor = (difficulty: Strategy['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'text-emerald-400 bg-emerald-400/10'
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'hard':
        return 'text-red-400 bg-red-400/10'
    }
  }

  const getDifficultyText = (difficulty: Strategy['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return '초급'
      case 'medium':
        return '중급'
      case 'hard':
        return '고급'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 검색 헤더 */}
      <div className="flex-shrink-0 p-3 border-b border-white/[0.06]">
        <h3 className="text-xs font-semibold text-white mb-2">기관급 전략 라이브러리</h3>

        {/* 검색 입력 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="전략 또는 자연어 검색..."
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#5E6AD2]/50"
          />
          {isLoading && (
            <div className="absolute right-3 top-2.5">
              <div className="w-3 h-3 border-2 border-[#5E6AD2] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* 전략 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredStrategies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-zinc-500">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredStrategies.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => onStrategySelect(strategy.id, strategy.naturalPrompt)}
                className={`
                  w-full p-3 rounded-lg text-left transition-all
                  ${
                    selectedStrategy === strategy.id
                      ? 'bg-[#5E6AD2]/20 border border-[#5E6AD2]/40'
                      : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-white/[0.08]'
                  }
                `}
              >
                {/* 아이콘 + 이름 */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg flex-shrink-0">{strategy.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-white truncate">
                      {strategy.name}
                    </h4>
                    <p className="text-xs text-zinc-500 truncate">{strategy.category}</p>
                  </div>
                </div>

                {/* 자연어 프롬프트 미리보기 */}
                <div className="mb-2 p-2 bg-white/[0.02] border border-white/[0.04] rounded">
                  <p className="text-xs text-zinc-400 italic line-clamp-2">
                    "{strategy.naturalPrompt}"
                  </p>
                </div>

                {/* 3중 검증 엔진 - 기관투자자급 */}
                <div className="mb-2 space-y-1">
                  <p className="text-xs text-zinc-500 font-medium mb-1">⚡ 3중 검증 엔진</p>
                  {strategy.quantEngines.map((engine, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/[0.04] rounded"
                    >
                      <span className="text-sm flex-shrink-0">{engine.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium" style={{ color: engine.color }}>
                            {engine.name}
                          </span>
                          <span className="text-xs text-zinc-500">{engine.score}점</span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-1">{engine.insight}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 난이도 + 인기도 */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(strategy.difficulty)}`}>
                    {getDifficultyText(strategy.difficulty)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <span>🔥</span>
                    <span>{strategy.popularity}%</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-white/[0.06]">
        <div className="text-xs text-zinc-500 text-center">
          총 {filteredStrategies.length}개 전략
        </div>
        <div className="mt-2 p-2 bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 rounded">
          <p className="text-xs text-[#5E6AD2] text-center">
            ⚡ 선택 즉시 3중 검증 시스템 실행
          </p>
        </div>
      </div>
    </div>
  )
}
