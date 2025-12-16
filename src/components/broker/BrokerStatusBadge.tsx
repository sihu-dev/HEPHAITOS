'use client'

import { clsx } from 'clsx'
import type { BrokerStatus } from '@/lib/broker/types'

// ============================================
// Broker Status Badge Component
// GPT V1 피드백 P0-7: 브로커 상태 시각화
// ============================================

interface BrokerStatusBadgeProps {
  status: BrokerStatus
  className?: string
}

export function BrokerStatusBadge({ status, className }: BrokerStatusBadgeProps) {
  const config = {
    supported: {
      label: '✅ 지원',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    beta: {
      label: '🔬 베타',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    coming_soon: {
      label: '🔜 준비중',
      className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    },
    unavailable: {
      label: '❌ 미제공',
      className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    },
  }

  const { label, className: statusClassName } = config[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'text-xs font-medium border',
        statusClassName,
        className
      )}
    >
      {label}
    </span>
  )
}
