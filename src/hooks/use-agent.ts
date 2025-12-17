'use client'

// ============================================
// Trading Agent Hook
// React Hook for Agent Interaction
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react'
import { generateId } from '@/lib/utils'

// ============================================
// Types
// ============================================

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
  action?: AgentActionResult
  suggestions?: string[]
  isStreaming?: boolean
  isError?: boolean
}

interface AgentActionResult {
  type: string
  [key: string]: unknown
}

interface AgentApiResponse {
  success: boolean
  data?: {
    message: string
    intent: string
    confidence: number
    action?: AgentActionResult
    suggestions?: string[]
    requiresConfirmation?: boolean
    confirmationPrompt?: string
    warning?: string
  }
  error?: string
}

export type AgentState = 'idle' | 'sending' | 'streaming' | 'confirming' | 'error'

export interface UseAgentOptions {
  sessionId?: string
  onStateChange?: (state: AgentState) => void
  onMessage?: (message: AgentMessage) => void
  onError?: (error: string) => void
}

export interface UseAgentReturn {
  messages: AgentMessage[]
  state: AgentState
  pendingConfirmation: boolean
  send: (input: string) => Promise<void>
  confirm: (confirmed: boolean) => Promise<void>
  reset: () => Promise<void>
  addSystemMessage: (content: string) => void
}

// ============================================
// Hook Implementation
// ============================================

export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const { sessionId = 'default', onStateChange, onMessage, onError } = options

  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [state, setState] = useState<AgentState>('idle')
  const [pendingConfirmation, setPendingConfirmation] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Update state with callback
  const updateState = useCallback(
    (newState: AgentState) => {
      setState(newState)
      onStateChange?.(newState)
    },
    [onStateChange]
  )

  // Add message to list
  const addMessage = useCallback(
    (message: Omit<AgentMessage, 'id' | 'timestamp'>) => {
      const fullMessage: AgentMessage = {
        ...message,
        id: generateId('msg'),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, fullMessage])
      onMessage?.(fullMessage)
      return fullMessage.id
    },
    [onMessage]
  )

  // Update existing message
  const updateMessage = useCallback((id: string, updates: Partial<AgentMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    )
  }, [])

  // Send message to agent
  const send = useCallback(
    async (input: string) => {
      if (state !== 'idle' && state !== 'error') return

      // Cancel any pending requests
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      // Add user message
      addMessage({ role: 'user', content: input })

      // Add streaming assistant message
      const assistantMsgId = addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
      })

      updateState('sending')

      try {
        const response = await fetch('/api/ai/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, sessionId }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result: AgentApiResponse = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Unknown error')
        }

        const { message, intent, confidence, action, suggestions, requiresConfirmation, confirmationPrompt, warning } = result.data

        // Simulate streaming effect
        updateState('streaming')
        await simulateStreaming(assistantMsgId, message, updateMessage)

        // Update final message
        updateMessage(assistantMsgId, {
          content: message,
          intent,
          confidence,
          action,
          suggestions,
          isStreaming: false,
        })

        // Handle confirmation
        if (requiresConfirmation) {
          setPendingConfirmation(true)
          updateState('confirming')
        } else {
          updateState('idle')
        }

        // Show warning if any
        if (warning) {
          addMessage({
            role: 'system',
            content: `⚠️ ${warning}`,
          })
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        updateMessage(assistantMsgId, {
          content: `오류가 발생했습니다: ${errorMessage}`,
          isStreaming: false,
          isError: true,
        })
        updateState('error')
        onError?.(errorMessage)
      }
    },
    [state, sessionId, addMessage, updateMessage, updateState, onError]
  )

  // Confirm pending action
  const confirm = useCallback(
    async (confirmed: boolean) => {
      if (!pendingConfirmation) return

      setPendingConfirmation(false)
      updateState('sending')

      // Add user confirmation message
      addMessage({
        role: 'user',
        content: confirmed ? '네' : '아니오',
      })

      const assistantMsgId = addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
      })

      try {
        const response = await fetch('/api/ai/agent', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, confirmed }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result: AgentApiResponse = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Unknown error')
        }

        updateState('streaming')
        await simulateStreaming(assistantMsgId, result.data.message, updateMessage)

        updateMessage(assistantMsgId, {
          content: result.data.message,
          action: result.data.action,
          isStreaming: false,
        })

        updateState('idle')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        updateMessage(assistantMsgId, {
          content: `오류가 발생했습니다: ${errorMessage}`,
          isStreaming: false,
          isError: true,
        })
        updateState('error')
        onError?.(errorMessage)
      }
    },
    [pendingConfirmation, sessionId, addMessage, updateMessage, updateState, onError]
  )

  // Reset session
  const reset = useCallback(async () => {
    abortControllerRef.current?.abort()

    try {
      await fetch(`/api/ai/agent?sessionId=${sessionId}`, {
        method: 'DELETE',
      })
    } catch {
      // Ignore errors on reset
    }

    setMessages([])
    setPendingConfirmation(false)
    updateState('idle')
  }, [sessionId, updateState])

  // Add system message
  const addSystemMessage = useCallback(
    (content: string) => {
      addMessage({ role: 'system', content })
    },
    [addMessage]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    messages,
    state,
    pendingConfirmation,
    send,
    confirm,
    reset,
    addSystemMessage,
  }
}

// ============================================
// Utility Functions
// ============================================

async function simulateStreaming(
  messageId: string,
  fullText: string,
  updateMessage: (id: string, updates: Partial<AgentMessage>) => void
) {
  const words = fullText.split(' ')
  let currentText = ''

  for (let i = 0; i < words.length; i++) {
    currentText += (i > 0 ? ' ' : '') + words[i]
    updateMessage(messageId, { content: currentText })
    await sleep(20 + Math.random() * 30) // 20-50ms per word
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default useAgent
