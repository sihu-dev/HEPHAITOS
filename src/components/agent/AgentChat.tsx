'use client'

// ============================================
// Agent Chat Component
// Interactive Chat Interface for Trading Agent
// ============================================

import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PaperAirplaneIcon,
  ArrowPathIcon,
  SparklesIcon,
  UserIcon,
  ChevronDownIcon,
  CheckIcon,
  XMarkIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import { useAgent, type AgentMessage, type AgentState } from '@/hooks/use-agent'
import { useI18n } from '@/i18n/client'

// ============================================
// Types
// ============================================

interface AgentChatProps {
  className?: string
  onStrategyCreated?: (strategy: unknown) => void
}

// ============================================
// Main Component
// ============================================

export const AgentChat = memo(function AgentChat({ className = '', onStrategyCreated }: AgentChatProps) {
  const { t } = useI18n()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    state,
    pendingConfirmation,
    send,
    confirm,
    reset,
    addSystemMessage,
  } = useAgent({
    onMessage: (msg) => {
      // Check if strategy was created
      if (msg.action?.type === 'CREATE_STRATEGY') {
        onStrategyCreated?.(msg.action)
      }
    },
  })

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addSystemMessage(
        '안녕하세요! 자연어로 트레이딩 전략을 만들어보세요.\n\n' +
        '예시:\n' +
        '• "비트코인 RSI 30 이하면 매수"\n' +
        '• "이더리움 가격이 5% 떨어지면 알려줘"\n' +
        '• "백테스트 돌려줘"'
      )
    }
  }, [messages.length, addSystemMessage])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputValue.trim() || state === 'sending' || state === 'streaming') return

      send(inputValue.trim())
      setInputValue('')
    },
    [inputValue, state, send]
  )

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (state === 'sending' || state === 'streaming') return
      send(suggestion)
    },
    [state, send]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
    },
    [handleSubmit]
  )

  const isDisabled = state === 'sending' || state === 'streaming'

  return (
    <div className={`flex flex-col h-full bg-[#0A0A0C] border border-white/[0.06] rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">AI 트레이딩 에이전트</h3>
            <StatusIndicator state={state} />
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={isDisabled}
          className="p-2 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded transition-colors disabled:opacity-50"
          title="대화 초기화"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}
        </AnimatePresence>

        {/* Pending Confirmation */}
        {pendingConfirmation && (
          <ConfirmationButtons onConfirm={confirm} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled || pendingConfirmation}
            placeholder={pendingConfirmation ? '확인 대기 중...' : '전략을 자연어로 입력하세요...'}
            className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={isDisabled || !inputValue.trim() || pendingConfirmation}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {quickActions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleSuggestionClick(action)}
              disabled={isDisabled || pendingConfirmation}
              className="flex-shrink-0 px-3 py-1.5 text-xs text-zinc-400 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-full transition-colors disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      </form>
    </div>
  )
})

// ============================================
// Sub Components
// ============================================

const quickActions = [
  'BTC RSI 전략 만들어줘',
  '백테스트',
  '현재 포지션',
  '시장 분석',
  '도움말',
]

interface StatusIndicatorProps {
  state: AgentState
}

const StatusIndicator = memo(function StatusIndicator({ state }: StatusIndicatorProps) {
  const statusConfig: Record<AgentState, { color: string; text: string }> = {
    idle: { color: 'bg-emerald-500', text: '준비 완료' },
    sending: { color: 'bg-amber-500 animate-pulse', text: '처리 중...' },
    streaming: { color: 'bg-blue-500 animate-pulse', text: '응답 중...' },
    confirming: { color: 'bg-violet-500', text: '확인 대기' },
    error: { color: 'bg-red-500', text: '오류 발생' },
  }

  const config = statusConfig[state]

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      <span className="text-[10px] text-zinc-500">{config.text}</span>
    </div>
  )
})

interface MessageBubbleProps {
  message: AgentMessage
  onSuggestionClick: (suggestion: string) => void
}

const MessageBubble = memo(function MessageBubble({ message, onSuggestionClick }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex justify-center"
      >
        <div className="max-w-md px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-center">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-violet-400 mx-auto mb-2" />
          <p className="text-sm text-zinc-400 whitespace-pre-line">{message.content}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-zinc-700'
            : message.isError
              ? 'bg-red-500/20'
              : 'bg-gradient-to-br from-violet-500 to-purple-600'
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4 text-zinc-300" />
        ) : message.isError ? (
          <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
        ) : (
          <SparklesIcon className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block px-4 py-2.5 rounded-lg ${
            isUser
              ? 'bg-violet-600 text-white'
              : message.isError
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-white/[0.04] border border-white/[0.06] text-zinc-200'
          }`}
        >
          {/* Message Content */}
          <div className="text-sm whitespace-pre-line">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-1 h-4 ml-0.5 bg-violet-400 animate-pulse" />
            )}
          </div>

          {/* Intent Badge */}
          {message.intent && !isUser && (
            <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">
                인텐트: {message.intent}
              </span>
              {message.confidence !== undefined && (
                <span className="text-[10px] text-zinc-600">
                  ({Math.round(message.confidence * 100)}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && !isUser && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <LightBulbIcon className="w-3.5 h-3.5 text-amber-500 mt-1" />
            {message.suggestions.map((suggestion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
                className="px-2 py-1 text-xs text-zinc-400 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-[10px] text-zinc-600">
          {message.timestamp.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  )
})

interface ConfirmationButtonsProps {
  onConfirm: (confirmed: boolean) => void
}

const ConfirmationButtons = memo(function ConfirmationButtons({ onConfirm }: ConfirmationButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex justify-center gap-3 py-4"
    >
      <button
        type="button"
        onClick={() => onConfirm(true)}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
      >
        <CheckIcon className="w-4 h-4" />
        네, 진행합니다
      </button>
      <button
        type="button"
        onClick={() => onConfirm(false)}
        className="flex items-center gap-2 px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
        아니오
      </button>
    </motion.div>
  )
})

// ============================================
// Exports
// ============================================

export default AgentChat
