'use client'

import { memo } from 'react'
import { type NodeProps } from 'reactflow'
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { BaseNode } from './BaseNode'
import { useI18n } from '@/i18n/client'

export const ConditionNode = memo(function ConditionNode(props: NodeProps) {
  const { t } = useI18n()
  const config = props.data?.config || {}

  const getSubtitle = () => {
    const operator = config.operator as string
    switch (operator) {
      case 'and':
        return t('dashboard.nodes.condition.and') as string
      case 'or':
        return t('dashboard.nodes.condition.or') as string
      default:
        return t('dashboard.nodes.condition.default') as string
    }
  }

  return (
    <BaseNode
      {...props}
      icon={ArrowsRightLeftIcon}
      color="#5E6AD2"
      bgColor="bg-zinc-900/80"
      borderColor="border-[#5E6AD2]/30"
      title={props.data?.label || (t('dashboard.nodes.condition.title') as string)}
      subtitle={getSubtitle()}
      hasInputHandle={true}
      hasOutputHandle={true}
    />
  )
})
