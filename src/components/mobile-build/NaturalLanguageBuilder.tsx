'use client'

import { useState, useEffect } from 'react'

// ============================================
// 자연어 전략 빌더
// 비개발자를 위한 자연어 입력 인터페이스
// ============================================

interface NaturalLanguageBuilderProps {
  onSubmit: (prompt: string) => void
  isBuilding: boolean
  selectedStrategy: string | null
  initialPrompt?: string // 검색 위젯에서 전달받은 프롬프트
}

// 자연어 예시 프롬프트
const EXAMPLE_PROMPTS = [
  'RSI가 30 이하일 때 매수하고 70 이상일 때 매도해줘',
  '이동평균선 골든크로스가 발생하면 매수해줘',
  '볼린저 밴드 하단 돌파 시 매수, 상단 돌파 시 매도',
  '삼성전자가 5% 하락하면 매수하고 10% 상승하면 매도',
]

export function NaturalLanguageBuilder({
  onSubmit,
  isBuilding,
  selectedStrategy,
  initialPrompt = '',
}: NaturalLanguageBuilderProps) {
  const [prompt, setPrompt] = useState('')
  const [showExamples, setShowExamples] = useState(false)

  // 외부에서 프롬프트가 변경되면 동기화 (검색 위젯 선택 시)
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt)
    }
  }, [initialPrompt])

  const handleSubmit = () => {
    if (!prompt.trim() || isBuilding) return
    onSubmit(prompt)
  }

  const handleExampleClick = (example: string) => {
    setPrompt(example)
    setShowExamples(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-4">
      {/* 입력 영역 */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="전략 선택 시 자동으로 백테스팅 & 정량 평가가 시작됩니다..."
          disabled={isBuilding}
          className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-primary/50 disabled:opacity-50"
        />

        {/* 상태 표시 영역 */}
        <div className="flex items-center justify-between mt-3">
          {/* 예시 보기 */}
          <button
            onClick={() => setShowExamples(!showExamples)}
            disabled={isBuilding}
            className="text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            💡 예시 보기
          </button>

          {/* 빌드 상태 표시 */}
          {isBuilding && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-400">전략 검증 실행 중...</span>
            </div>
          )}
        </div>
      </div>

      {/* 예시 프롬프트 드롭다운 */}
      {showExamples && (
        <div className="mt-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <p className="text-xs text-zinc-400 mb-2">클릭하면 자동 입력됩니다:</p>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="w-full text-left px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-primary/30 rounded-lg text-xs text-zinc-300 transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 선택된 전략 표시 */}
      {selectedStrategy && (
        <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-xs text-primary">
            🎨 <strong>선택된 템플릿:</strong> {selectedStrategy}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            위 자연어가 자동 입력되었습니다. 수정 후 "노드로 생성" 버튼을 누르세요.
          </p>
        </div>
      )}
    </div>
  )
}
