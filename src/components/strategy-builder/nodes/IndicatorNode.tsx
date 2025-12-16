'use client'

import { memo } from 'react'
import { type NodeProps } from 'reactflow'
import { PresentationChartLineIcon } from '@heroicons/react/24/outline'
import { BaseNode } from './BaseNode'
import { useI18n } from '@/i18n/client'

export const IndicatorNode = memo(function IndicatorNode(props: NodeProps) {
  const { t } = useI18n()
  const config = props.data?.config || {}

  const getSubtitle = () => {
    const type = config.type as string
    const period = config.period as number
    switch (type) {
      case 'sma':
        return `SMA(${period || 20})`
      case 'ema':
        return `EMA(${period || 20})`
      case 'rsi':
        return `RSI(${period || 14})`
      case 'macd':
        return 'MACD(12,26,9)'
      case 'bollinger':
        return `BB(${period || 20})`
      case 'atr':
        return `ATR(${period || 14})`
      default:
        return t('dashboard.nodes.indicator.default') as string
    }
  }

  return (
    <BaseNode
      {...props}
      icon={PresentationChartLineIcon}
      color="#10B981"
      bgColor="bg-zinc-900/80"
      borderColor="border-emerald-500/30"
      title={props.data?.label || (t('dashboard.nodes.indicator.title') as string)}
      subtitle={getSubtitle()}
      hasInputHandle={true}
      hasOutputHandle={true}
    />
  )
})
