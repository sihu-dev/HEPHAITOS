'use client'

import {
  BoltIcon,
  ArrowsRightLeftIcon,
  PresentationChartLineIcon,
  ShoppingCartIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { useState, memo, useMemo } from 'react'
import { useI18n } from '@/i18n/client'

interface NodeCategory {
  id: string
  labelKey: string
  icon: React.ElementType
  color: string
  nodes: {
    type: string
    labelKey: string
    descKey: string
  }[]
}

const nodeCategoryDefs: NodeCategory[] = [
  {
    id: 'triggers',
    labelKey: 'triggers',
    icon: BoltIcon,
    color: '#F59E0B',
    nodes: [
      { type: 'trigger', labelKey: 'priceTrigger', descKey: 'priceTriggerDesc' },
      { type: 'trigger', labelKey: 'timeTrigger', descKey: 'timeTriggerDesc' },
      { type: 'trigger', labelKey: 'volumeTrigger', descKey: 'volumeTriggerDesc' },
    ],
  },
  {
    id: 'indicators',
    labelKey: 'indicators',
    icon: PresentationChartLineIcon,
    color: '#10B981',
    nodes: [
      { type: 'indicator', labelKey: 'rsi', descKey: 'rsiDesc' },
      { type: 'indicator', labelKey: 'macd', descKey: 'macdDesc' },
      { type: 'indicator', labelKey: 'sma', descKey: 'smaDesc' },
      { type: 'indicator', labelKey: 'ema', descKey: 'emaDesc' },
      { type: 'indicator', labelKey: 'bollinger', descKey: 'bollingerDesc' },
      { type: 'indicator', labelKey: 'atr', descKey: 'atrDesc' },
    ],
  },
  {
    id: 'conditions',
    labelKey: 'conditions',
    icon: ArrowsRightLeftIcon,
    color: '#71717A',
    nodes: [
      { type: 'condition', labelKey: 'andCondition', descKey: 'andConditionDesc' },
      { type: 'condition', labelKey: 'orCondition', descKey: 'orConditionDesc' },
      { type: 'condition', labelKey: 'compareCondition', descKey: 'compareConditionDesc' },
    ],
  },
  {
    id: 'actions',
    labelKey: 'actions',
    icon: ShoppingCartIcon,
    color: '#EF4444',
    nodes: [
      { type: 'action', labelKey: 'buyOrder', descKey: 'buyOrderDesc' },
      { type: 'action', labelKey: 'sellOrder', descKey: 'sellOrderDesc' },
      { type: 'action', labelKey: 'closePosition', descKey: 'closePositionDesc' },
      { type: 'action', labelKey: 'sendAlert', descKey: 'sendAlertDesc' },
    ],
  },
  {
    id: 'risk',
    labelKey: 'risk',
    icon: ShieldCheckIcon,
    color: '#8B5CF6',
    nodes: [
      { type: 'risk', labelKey: 'stopLoss', descKey: 'stopLossDesc' },
      { type: 'risk', labelKey: 'takeProfit', descKey: 'takeProfitDesc' },
      { type: 'risk', labelKey: 'trailingStop', descKey: 'trailingStopDesc' },
      { type: 'risk', labelKey: 'maxLoss', descKey: 'maxLossDesc' },
    ],
  },
]

interface NodeSidebarProps {
  onAddNode: (type: string) => void
}

export const NodeSidebar = memo(function NodeSidebar({ onAddNode }: NodeSidebarProps) {
  const { t } = useI18n()
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['triggers', 'indicators'])

  // Build translated categories
  const nodeCategories = useMemo(() => {
    return nodeCategoryDefs.map((cat) => ({
      ...cat,
      label: t(`dashboard.nodeSidebar.categories.${cat.labelKey}`) as string,
      nodes: cat.nodes.map((node) => ({
        ...node,
        label: t(`dashboard.nodeSidebar.nodes.${node.labelKey}`) as string,
        description: t(`dashboard.nodeSidebar.nodes.${node.descKey}`) as string,
      })),
    }))
  }, [t])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-56 bg-[#0D0D0F] border-r border-white/[0.06] overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-3 border-b border-white/[0.06]">
        <h2 className="text-sm font-medium text-white">{t('dashboard.nodeSidebar.title') as string}</h2>
        <p className="text-xs text-zinc-400 mt-0.5">{t('dashboard.nodeSidebar.subtitle') as string}</p>
      </div>

      {/* Node Categories */}
      <div className="p-2">
        {nodeCategories.map((category) => (
          <div key={category.id} className="mb-1">
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between p-2 hover:bg-white/[0.04] rounded transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}15` }}
                >
                  <category.icon
                    className="w-3 h-3"
                    style={{ color: category.color }}
                  />
                </div>
                <span className="text-sm text-zinc-400">
                  {category.label}
                </span>
              </div>
              <ChevronDownIcon
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                  expandedCategories.includes(category.id) ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Category Nodes */}
            {expandedCategories.includes(category.id) && (
              <div className="mt-1 ml-2 space-y-0.5">
                {category.nodes.map((node, index) => (
                  <div
                    key={`${category.id}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node.type)}
                    onClick={() => onAddNode(node.type)}
                    className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.1] rounded cursor-grab active:cursor-grabbing transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-zinc-400 group-hover:text-white">
                        {node.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 ml-3.5">
                      {node.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <h3 className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
          {t('dashboard.nodeSidebar.tips.title') as string}
        </h3>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>• {t('dashboard.nodeSidebar.tips.dragToCanvas') as string}</li>
          <li>• {t('dashboard.nodeSidebar.tips.connectNodes') as string}</li>
          <li>• {t('dashboard.nodeSidebar.tips.editSettings') as string}</li>
          <li>• {t('dashboard.nodeSidebar.tips.deleteNode') as string}</li>
        </ul>
      </div>
    </div>
  )
})
