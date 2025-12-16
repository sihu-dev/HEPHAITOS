'use client'

import { memo } from 'react'
import { type NodeProps } from 'reactflow'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import { BaseNode } from './BaseNode'
import { useI18n } from '@/i18n/client'

export const ActionNode = memo(function ActionNode(props: NodeProps) {
  const { t } = useI18n()
  const config = props.data?.config || {}

  const getSubtitle = () => {
    const type = config.type as string
    const orderType = config.orderType as string
    const amount = config.amount as number
    const amountType = config.amountType as string

    let subtitle = ''
    switch (type) {
      case 'buy':
        subtitle = t('dashboard.nodes.action.buy') as string
        break
      case 'sell':
        subtitle = t('dashboard.nodes.action.sell') as string
        break
      case 'close':
        return t('dashboard.nodes.action.closePosition') as string
      case 'alert':
        return t('dashboard.nodes.action.sendAlert') as string
      default:
        return t('dashboard.nodes.action.default') as string
    }

    const orderLabel = orderType === 'market'
      ? (t('dashboard.nodes.action.market') as string)
      : (t('dashboard.nodes.action.limit') as string)
    const amountLabel = amountType === 'percent' ? `${amount}%` : amount
    return `${subtitle} ${orderLabel} ${amountLabel}`
  }

  return (
    <BaseNode
      {...props}
      icon={ShoppingCartIcon}
      color="#EF4444"
      bgColor="bg-zinc-900/80"
      borderColor="border-red-500/30"
      title={props.data?.label || (t('dashboard.nodes.action.title') as string)}
      subtitle={getSubtitle()}
      hasInputHandle={true}
      hasOutputHandle={false}
    />
  )
})
