'use client'

/**
 * Streaming AI Tutor Component
 *
 * 실시간 타이핑 효과로 AI 튜터 응답을 스트리밍
 * - Vercel AI SDK의 useChat() hook 사용
 * - 자동 스크롤, 로딩 인디케이터
 * - 이전 대화 기록 유지
 */

import { useChat } from 'ai/react'
import { useState } from 'react'
import { Send, Loader2, BookOpen, Lightbulb, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface StreamingTutorProps {
  userTier?: 'free' | 'starter' | 'pro'
  userLevel?: 'beginner' | 'intermediate' | 'advanced'
  topic?: string
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function StreamingTutor({
  userTier = 'free',
  userLevel = 'intermediate',
  topic,
  className,
}: StreamingTutorProps) {
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    userLevel
  )

  // ✨ Vercel AI SDK useChat() hook
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/tutor/stream',
    body: {
      userTier,
      context: {
        userLevel: selectedLevel,
        topic,
      },
    },
  })

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <CardHeader className="border-b border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI 튜터</CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                투자 학습을 돕는 AI 멘토 ({getLevelLabel(selectedLevel)})
              </p>
            </div>
          </div>

          {/* Tier Badge */}
          <div className="px-3 py-1 bg-white/[0.04] rounded-full border border-white/[0.08]">
            <span className="text-xs font-medium text-gray-300">
              {userTier === 'pro'
                ? '🏆 Pro'
                : userTier === 'starter'
                  ? '⭐ Starter'
                  : '🆓 Free'}
            </span>
          </div>
        </div>

        {/* Level Selector */}
        <div className="flex gap-2 mt-4">
          <LevelButton
            level="beginner"
            selectedLevel={selectedLevel}
            onClick={() => setSelectedLevel('beginner')}
            icon={<BookOpen className="w-4 h-4" />}
          />
          <LevelButton
            level="intermediate"
            selectedLevel={selectedLevel}
            onClick={() => setSelectedLevel('intermediate')}
            icon={<Lightbulb className="w-4 h-4" />}
          />
          <LevelButton
            level="advanced"
            selectedLevel={selectedLevel}
            onClick={() => setSelectedLevel('advanced')}
            icon={<GraduationCap className="w-4 h-4" />}
          />
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-white/[0.04] rounded-full mb-4">
              <GraduationCap className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">AI 튜터에게 질문하세요</h3>
            <p className="text-sm text-gray-400 max-w-md">
              트레이딩 전략, 기술 지표, 리스크 관리 등 궁금한 점을 물어보세요. 실시간으로 답변을
              받을 수 있습니다.
            </p>

            {/* Example Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-6 w-full max-w-2xl">
              {getExampleQuestions(selectedLevel).map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const event = {
                      preventDefault: () => {},
                    } as React.FormEvent
                    handleInputChange({
                      target: { value: q },
                    } as React.ChangeEvent<HTMLInputElement>)
                    setTimeout(() => handleSubmit(event), 100)
                  }}
                  className="p-3 text-left text-sm bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary" />
              </div>
            )}

            <div
              className={cn(
                'max-w-[80%] px-4 py-3 rounded-lg',
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-white/[0.04] border border-white/[0.08]'
              )}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-white/[0.08] rounded-full flex items-center justify-center">
                <span className="text-xs font-medium">You</span>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <div className="max-w-[80%] px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>생각 중...</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Input */}
      <div className="border-t border-white/[0.08] p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            className={cn(
              'flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} glow>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 mt-3 text-center">
          ※ AI 답변은 교육 목적이며, 투자 조언이 아닙니다. 투자 결정은 본인 책임입니다.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// Helper Components
// ============================================================================

interface LevelButtonProps {
  level: 'beginner' | 'intermediate' | 'advanced'
  selectedLevel: 'beginner' | 'intermediate' | 'advanced'
  onClick: () => void
  icon: React.ReactNode
}

function LevelButton({ level, selectedLevel, onClick, icon }: LevelButtonProps) {
  const isSelected = level === selectedLevel

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all',
        isSelected
          ? 'bg-primary/10 border-primary text-primary'
          : 'bg-white/[0.02] border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'
      )}
    >
      {icon}
      <span className="text-sm font-medium">{getLevelLabel(level)}</span>
    </button>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function getLevelLabel(level: 'beginner' | 'intermediate' | 'advanced'): string {
  switch (level) {
    case 'beginner':
      return '초보자'
    case 'intermediate':
      return '중급자'
    case 'advanced':
      return '고급자'
  }
}

function getExampleQuestions(level: 'beginner' | 'intermediate' | 'advanced'): string[] {
  switch (level) {
    case 'beginner':
      return [
        'RSI 지표가 뭔가요?',
        '손절매는 언제 해야 하나요?',
        '추세 추종 전략이 뭔가요?',
        '포트폴리오 분산이 중요한 이유는?',
      ]
    case 'intermediate':
      return [
        'MACD와 RSI를 조합하는 방법은?',
        '샤프 비율이 높으면 좋은 전략인가요?',
        '백테스팅 결과를 어떻게 해석하나요?',
        '변동성 돌파 전략의 장단점은?',
      ]
    case 'advanced':
      return [
        '켈리 공식을 실전에 어떻게 적용하나요?',
        '다중 타임프레임 분석의 구현 방법은?',
        '최적 포지션 사이징 알고리즘은?',
        '시장 레짐 변화를 감지하는 방법은?',
      ]
  }
}
