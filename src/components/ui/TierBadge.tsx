'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { Badge } from './Badge'
import { Tooltip } from './Tooltip'
import { Sparkles, Zap, Gift } from 'lucide-react'

/**
 * HEPHAITOS Tier Badge Component
 * Displays user tier with appropriate styling and AI model info
 */

export type UserTier = 'free' | 'starter' | 'pro'

interface TierBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  tier: UserTier
  showModel?: boolean // Show AI model info in tooltip
  size?: 'sm' | 'md' | 'lg'
}

const tierConfig = {
  free: {
    label: 'Free',
    icon: Gift,
    variant: 'default' as const,
    model: 'Claude Haiku 4',
    modelDescription: '빠른 응답 | 기본 품질',
    color: 'text-zinc-400',
  },
  starter: {
    label: 'Starter',
    icon: Zap,
    variant: 'info' as const,
    model: 'Claude Sonnet 4',
    modelDescription: '균형잡힌 성능 | 높은 품질',
    color: 'text-blue-400',
  },
  pro: {
    label: 'Pro',
    icon: Sparkles,
    variant: 'primary' as const,
    model: 'Claude Opus 4.5',
    modelDescription: '최고 품질 | +40% 성능',
    color: 'text-primary',
  },
}

export const TierBadge = forwardRef<HTMLSpanElement, TierBadgeProps>(
  (
    {
      className,
      tier,
      showModel = true,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const config = tierConfig[tier]
    const Icon = config.icon

    const badgeContent = (
      <Badge
        ref={ref}
        variant={config.variant}
        size={size}
        className={clsx('gap-1', className)}
        {...props}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )

    if (!showModel) {
      return badgeContent
    }

    return (
      <Tooltip
        content={
          <div className="text-sm space-y-1">
            <div className="font-medium">{config.model}</div>
            <div className="text-xs text-zinc-400">{config.modelDescription}</div>
            {tier === 'pro' && (
              <div className="text-xs text-primary-light mt-2">
                🔥 Opus 4.5로 최고 품질의 전략 생성
              </div>
            )}
          </div>
        }
        side="top"
      >
        {badgeContent}
      </Tooltip>
    )
  }
)

TierBadge.displayName = 'TierBadge'

/**
 * Model Info Badge (no tier, just model name)
 */
interface ModelBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  model: 'haiku' | 'sonnet' | 'opus'
  size?: 'sm' | 'md' | 'lg'
}

export const ModelBadge = forwardRef<HTMLSpanElement, ModelBadgeProps>(
  ({ model, size = 'sm', className, ...props }, ref) => {
    const modelConfig = {
      haiku: { label: 'Haiku', variant: 'default' as const },
      sonnet: { label: 'Sonnet', variant: 'info' as const },
      opus: { label: 'Opus 4.5', variant: 'primary' as const },
    }

    const config = modelConfig[model]

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        size={size}
        className={clsx('font-mono', className)}
        {...props}
      >
        {config.label}
      </Badge>
    )
  }
)

ModelBadge.displayName = 'ModelBadge'

export default TierBadge
