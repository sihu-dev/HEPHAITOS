'use client'

import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
interface BaseNodeProps extends NodeProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  bgColor: string
  borderColor: string
  title: string
  subtitle?: string
  hasInputHandle?: boolean
  hasOutputHandle?: boolean
}

export const BaseNode = memo(function BaseNode({
  icon: Icon,
  color,
  bgColor,
  borderColor,
  title,
  subtitle,
  selected,
  hasInputHandle = true,
  hasOutputHandle = true,
}: BaseNodeProps) {
  // Memoize dynamic class string - Linear flat style
  const containerClassName = useMemo(() => `
    relative px-3 py-2.5 rounded border min-w-[140px]
    ${bgColor} ${borderColor}
    ${selected ? 'ring-1 ring-white/20' : ''}
    transition-colors
  `, [bgColor, borderColor, selected])

  // Memoize icon background style
  const iconBgStyle = useMemo(() => ({
    backgroundColor: `${color}15`
  }), [color])

  // Memoize icon style
  const iconStyle = useMemo(() => ({ color }), [color])

  return (
    <div className={containerClassName}>
      {/* Input Handle */}
      {hasInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2.5 !h-2.5 !bg-white/[0.1] !border !border-white/[0.2] hover:!bg-white/[0.2] transition-colors"
        />
      )}

      {/* Content */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded flex items-center justify-center"
          style={iconBgStyle}
        >
          <Icon className="w-3.5 h-3.5" style={iconStyle} />
        </div>
        <div>
          <p className="text-sm text-white">{title}</p>
          {subtitle && (
            <p className="text-xs text-zinc-400">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Output Handle */}
      {hasOutputHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2.5 !h-2.5 !bg-white/[0.1] !border !border-white/[0.2] hover:!bg-white/[0.2] transition-colors"
        />
      )}
    </div>
  )
})
