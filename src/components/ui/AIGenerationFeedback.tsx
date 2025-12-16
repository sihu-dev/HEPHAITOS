'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

// ============================================
// Types
// ============================================

export type AIGenerationStatus =
  | 'idle'
  | 'preparing'
  | 'analyzing'
  | 'generating'
  | 'streaming'
  | 'complete'
  | 'error'

interface AIGenerationFeedbackProps {
  status: AIGenerationStatus
  progress?: number
  stage?: string
  error?: string
  onRetry?: () => void
  onCancel?: () => void
}

// ============================================
// Stage Configuration
// ============================================

const stageIds = ['preparing', 'analyzing', 'generating', 'streaming'] as const
const stageIcons = {
  preparing: ChartBarIcon,
  analyzing: MagnifyingGlassIcon,
  generating: CpuChipIcon,
  streaming: DocumentTextIcon,
}

function getStageIndex(status: AIGenerationStatus): number {
  switch (status) {
    case 'preparing': return 0
    case 'analyzing': return 1
    case 'generating': return 2
    case 'streaming': return 3
    case 'complete': return 4
    default: return -1
  }
}

// ============================================
// Sub Components
// ============================================

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}

function StageIndicator({ currentIndex }: { currentIndex: number }) {
  const { t } = useI18n()
  return (
    <div className="flex justify-between mt-4">
      {stageIds.map((stageId, index) => {
        const Icon = stageIcons[stageId]
        return (
          <div
            key={stageId}
            className={`flex flex-col items-center ${
              index <= currentIndex ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg mb-1 transition-all ${
                index < currentIndex
                  ? 'bg-green-500/20 border border-green-500'
                  : index === currentIndex
                  ? 'bg-orange-500/20 border border-orange-500 animate-pulse'
                  : 'bg-zinc-800 border border-zinc-700'
              }`}
            >
              {index < currentIndex ? (
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            <span className="text-xs text-zinc-400">{t(`dashboard.aiGeneration.stages.${stageId}`) as string}</span>
          </div>
        )
      })}
    </div>
  )
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-1 ml-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 bg-orange-500 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </span>
  )
}

// ============================================
// Main Component
// ============================================

export function AIGenerationFeedback({
  status,
  progress = 0,
  stage,
  error,
  onRetry,
  onCancel,
}: AIGenerationFeedbackProps) {
  const { t } = useI18n()
  const [dots, setDots] = useState('')
  const currentStageIndex = getStageIndex(status)

  // Animated dots
  useEffect(() => {
    if (status === 'idle' || status === 'complete' || status === 'error') return

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)

    return () => clearInterval(interval)
  }, [status])

  if (status === 'idle') return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-zinc-700 bg-zinc-800/50 backdrop-blur-sm p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {status === 'complete' ? (
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
          </div>
        ) : status === 'error' ? (
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircleIcon className="w-6 h-6 text-red-500" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <SparklesIcon className="w-6 h-6 text-orange-500" />
            </motion.div>
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-medium text-white">
            {status === 'complete'
              ? t('dashboard.aiGeneration.complete') as string
              : status === 'error'
              ? t('dashboard.aiGeneration.error') as string
              : t('dashboard.aiGeneration.working') as string}
            {status !== 'complete' && status !== 'error' && <LoadingDots />}
          </h3>
          <p className="text-sm text-zinc-400">
            {status === 'complete'
              ? t('dashboard.aiGeneration.checkResults') as string
              : status === 'error'
              ? error || (t('dashboard.aiGeneration.errorOccurred') as string)
              : stage || (currentStageIndex >= 0 ? t(`dashboard.aiGeneration.stages.${stageIds[currentStageIndex]}`) as string : t('dashboard.aiGeneration.processing') as string)}
          </p>
        </div>

        {/* Progress Percentage */}
        {status !== 'complete' && status !== 'error' && progress > 0 && (
          <div className="text-right">
            <span className="text-2xl font-bold text-orange-500">{Math.round(progress)}%</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {status !== 'complete' && status !== 'error' && (
        <ProgressBar progress={progress} />
      )}

      {/* Stage Indicator */}
      {status !== 'complete' && status !== 'error' && (
        <StageIndicator currentIndex={currentStageIndex} />
      )}

      {/* Actions */}
      <AnimatePresence>
        {(status === 'error' || ['preparing', 'analyzing', 'generating', 'streaming'].includes(status)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 mt-4 pt-4 border-t border-zinc-700"
          >
            {status === 'error' && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                {t('dashboard.aiGeneration.retry') as string}
              </button>
            )}
            {onCancel && ['preparing', 'analyzing', 'generating', 'streaming'].includes(status) && (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                {t('dashboard.aiGeneration.cancel') as string}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      {status === 'complete' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex justify-center mt-4"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/30">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-400">{t('dashboard.aiGeneration.success') as string}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================
// Compact Version
// ============================================

export function AIGenerationCompact({
  status,
  progress = 0,
}: {
  status: AIGenerationStatus
  progress?: number
}) {
  const { t } = useI18n()
  if (status === 'idle') return null

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
      {status === 'complete' ? (
        <CheckCircleIcon className="w-5 h-5 text-green-500" />
      ) : status === 'error' ? (
        <XCircleIcon className="w-5 h-5 text-red-500" />
      ) : (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <SparklesIcon className="w-5 h-5 text-orange-500" />
        </motion.div>
      )}

      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              status === 'complete'
                ? 'bg-green-500'
                : status === 'error'
                ? 'bg-red-500'
                : 'bg-orange-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: status === 'complete' ? '100%' : `${progress}%` }}
          />
        </div>
      </div>

      <span className="text-sm text-zinc-400 tabular-nums">
        {status === 'complete' ? t('dashboard.aiGeneration.done') as string : status === 'error' ? t('dashboard.aiGeneration.failed') as string : `${Math.round(progress)}%`}
      </span>
    </div>
  )
}

export default AIGenerationFeedback
