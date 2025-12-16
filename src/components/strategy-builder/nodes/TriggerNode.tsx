'use client'

import { memo } from 'react'
import { type NodeProps } from 'reactflow'
import { BoltIcon } from '@heroicons/react/24/outline'
import { BaseNode } from './BaseNode'
import { useI18n } from '@/i18n/client'

export const TriggerNode = memo(function TriggerNode(props: NodeProps) {
  const { t } = useI18n()
  const config = props.data?.config || {}

  const getSubtitle = () => {
    const type = config.type as string
    switch (type) {
      case 'price_cross':
        return `${config.symbol || 'N/A'} ${t('dashboard.nodes.trigger.priceCross') as string}`
      case 'price_above':
        return `${config.symbol || 'N/A'} ${t('dashboard.nodes.trigger.priceAbove') as string}`
      case 'price_below':
        return `${config.symbol || 'N/A'} ${t('dashboard.nodes.trigger.priceBelow') as string}`
      case 'time':
        return t('dashboard.nodes.trigger.timeBased') as string
      case 'volume':
        return t('dashboard.nodes.trigger.volumeBased') as string
      default:
        return t('dashboard.nodes.trigger.default') as string
    }
  }

  return (
    <BaseNode
      {...props}
      icon={BoltIcon}
      color="#F59E0B"
      bgColor="bg-zinc-900/80"
      borderColor="border-amber-500/30"
      title={props.data?.label || (t('dashboard.nodes.trigger.title') as string)}
      subtitle={getSubtitle()}
      hasInputHandle={false}
      hasOutputHandle={true}
    />
  )
})
