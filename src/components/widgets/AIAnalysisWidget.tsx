'use client'

// ============================================
// Analysis Widget
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import { useI18n } from '@/i18n/client'

// ============================================
// Types
// ============================================

interface TradeData {
  celebrity: string
  ticker: string
  company: string
  action: 'buy' | 'sell'
  amount: string
  date: string
  currentPrice?: number
  recentNews?: string[]
  portfolioContext?: {
    previousHoldings?: number
    newHoldings?: number
    portfolioWeight?: number
  }
}

interface AIAnalysisWidgetProps {
  trade: TradeData
  className?: string
  variant?: 'inline' | 'modal' | 'panel'
  onClose?: () => void
  autoStart?: boolean
}

// ============================================
// Streaming Hook
// ============================================

function useStreamingAnalysis() {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const startAnalysis = useCallback(async (trade: TradeData) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setContent('')
    setIsLoading(true)
    setIsComplete(false)
    setError(null)

    try {
      const response = await fetch('/api/ai/trade-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trade),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start analysis')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setIsComplete(true)
              continue
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'text' && parsed.content) {
                setContent(prev => prev + parsed.content)
              }
            } catch {
              // Skip unparseable
            }
          }
        }
      }

      setIsComplete(true)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Ignore abort errors
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const cancelAnalysis = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  return { content, isLoading, isComplete, error, startAnalysis, cancelAnalysis }
}

// ============================================
// Main Component
// ============================================

export function AIAnalysisWidget({
  trade,
  className = '',
  variant = 'inline',
  onClose,
  autoStart = false,
}: AIAnalysisWidgetProps) {
  const { t } = useI18n()
  const { content, isLoading, isComplete, error, startAnalysis, cancelAnalysis } =
    useStreamingAnalysis()
  const [isExpanded, setIsExpanded] = useState(variant !== 'inline')
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Auto-scroll during streaming
  useEffect(() => {
    if (isLoading && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [content, isLoading])

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !content && !isLoading) {
      startAnalysis(trade)
    }
  }, [autoStart, trade, content, isLoading, startAnalysis])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Container styles based on variant
  const containerStyles = {
    inline: 'bg-zinc-900/50 border border-zinc-800 rounded-xl',
    modal: 'bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-2xl w-full mx-4',
    panel: 'bg-zinc-900/80 backdrop-blur-xl border-l border-zinc-800 h-full',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: variant === 'inline' ? 10 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: variant === 'inline' ? -10 : 0 }}
      className={`${containerStyles[variant]} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5E6AD2]/20 rounded-lg">
            <SparklesIcon className="w-5 h-5 text-[#7C8AEA]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{t('dashboard.aiAnalysis.title') as string}</h3>
            <p className="text-xs text-zinc-400">
              {trade.celebrity} · {trade.ticker}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {variant === 'inline' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Analysis Content */}
            <div
              ref={contentRef}
              className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar"
            >
              {/* Error State */}
              {error && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                  <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t('dashboard.aiAnalysis.status.failed') as string}</p>
                    <p className="text-xs mt-1 opacity-80">{error}</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!content && !isLoading && !error && (
                <div className="text-center py-8">
                  <LightBulbIcon className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm mb-4">
                    {t('dashboard.aiAnalysis.status.prompt') as string}
                  </p>
                  <button
                    onClick={() => startAnalysis(trade)}
                    className="px-4 py-2 bg-[#5E6AD2] hover:bg-[#6E7AE2] text-white text-sm font-medium rounded-lg transition-all"
                  >
                    <SparklesIcon className="w-4 h-4 inline-block mr-2" />
                    {t('dashboard.aiAnalysis.actions.start') as string}
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isLoading && !content && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#7C8AEA]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </motion.div>
                    <span className="text-sm">{t('dashboard.aiAnalysis.status.analyzing') as string}</span>
                  </div>
                  <SkeletonLoader />
                </div>
              )}

              {/* Streaming Content */}
              {content && (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h3: ({ children }) => (
                        <h3 className="text-base font-semibold text-white mt-4 mb-2 flex items-center gap-2">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-zinc-300 text-sm leading-relaxed mb-3">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="text-zinc-300 text-sm space-y-1 mb-3 list-disc pl-4">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-zinc-300">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-white font-semibold">{children}</strong>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>

                  {/* Typing indicator */}
                  {isLoading && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-2 h-4 bg-[#7C8AEA] ml-1"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {(content || isLoading) && (
              <div className="flex items-center justify-between p-3 border-t border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  {isComplete && (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckIcon className="w-3.5 h-3.5" />
                      {t('dashboard.aiAnalysis.status.complete') as string}
                    </span>
                  )}
                  {isLoading && (
                    <span className="text-[#7C8AEA]">{t('dashboard.aiAnalysis.status.streaming') as string}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isLoading && (
                    <button
                      type="button"
                      onClick={cancelAnalysis}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
                    >
                      {t('dashboard.aiAnalysis.actions.cancel') as string}
                    </button>
                  )}
                  {isComplete && (
                    <>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {copied ? (
                          <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                        )}
                        {copied ? t('dashboard.aiAnalysis.actions.copied') as string : t('dashboard.aiAnalysis.actions.copy') as string}
                      </button>
                      <button
                        type="button"
                        onClick={() => startAnalysis(trade)}
                        className="px-3 py-1.5 text-xs text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                        {t('dashboard.aiAnalysis.actions.retry') as string}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="px-4 pb-4">
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                ⚠️ {t('dashboard.aiAnalysis.disclaimer') as string}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================
// Skeleton Loader
// ============================================

function SkeletonLoader() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-zinc-800 rounded w-3/4" />
      <div className="h-4 bg-zinc-800 rounded w-full" />
      <div className="h-4 bg-zinc-800 rounded w-5/6" />
      <div className="h-4 bg-zinc-800 rounded w-2/3" />
      <div className="h-4 bg-zinc-800 rounded w-4/5" />
    </div>
  )
}

// ============================================
// Analysis Button (Trigger)
// ============================================

interface AIAnalysisButtonProps {
  trade: TradeData
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AIAnalysisButton({
  trade,
  size = 'md',
  className = '',
}: AIAnalysisButtonProps) {
  const { t } = useI18n()
  const [showWidget, setShowWidget] = useState(false)

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowWidget(true)}
        className={`
          inline-flex items-center font-medium rounded-lg transition-all
          bg-[#5E6AD2]/20 hover:bg-[#5E6AD2]/30
          text-[#9AA5EF] hover:text-[#A8B4F5]
          border border-[#5E6AD2]/30 hover:border-[#5E6AD2]/50
          ${sizeStyles[size]}
          ${className}
        `}
      >
        <SparklesIcon className={iconSizes[size]} />
        {t('dashboard.aiAnalysis.button') as string}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWidget(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <AIAnalysisWidget
                trade={trade}
                variant="modal"
                onClose={() => setShowWidget(false)}
                autoStart
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================
// Exports
// ============================================

export default AIAnalysisWidget
