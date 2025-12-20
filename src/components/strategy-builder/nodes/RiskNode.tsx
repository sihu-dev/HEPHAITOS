'use client'

import { memo } from 'react'
import { type NodeProps } from 'reactflow'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { BaseNode } from './BaseNode'
import { useI18n } from '@/i18n/client'

export const RiskNode = memo(function RiskNode(props: NodeProps) {
  const { t } = useI18n()
  const config = props.data?.config || {}

  const getSubtitle = () => {
    const stopLoss = config.stopLoss as number
    const takeProfit = config.takeProfit as number

    if (stopLoss && takeProfit) {
      return `SL: ${stopLoss}% / TP: ${takeProfit}%`
    }
    if (stopLoss) {
      return `${t('dashboard.nodes.risk.stopLoss') as string}: ${stopLoss}%`
    }
    if (takeProfit) {
      return `${t('dashboard.nodes.risk.takeProfit') as string}: ${takeProfit}%`
    }
    return t('dashboard.nodes.risk.default') as string
  }

  return (
    <BaseNode
      {...props}
      icon={ShieldCheckIcon}
      color="#8B5CF6"
      bgColor="bg-zinc-900/80"
      borderColor="border-[#8B5CF6]/30"
      title={props.data?.label || (t('dashboard.nodes.risk.title') as string)}
      subtitle={getSubtitle()}
      hasInputHandle={true}
      hasOutputHandle={true}
    />
  )
})
