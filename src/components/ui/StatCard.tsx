'use client'

import { clsx } from 'clsx'
import { AnimatedValue } from './AnimatedValue'

/**
 * HEPHAITOS Cinematic Stat Card
 * For displaying key statistics with animations
 */

interface StatCardProps {
  label: string
  value: number | string
  suffix?: string
  prefix?: string
  format?: 'number' | 'currency' | 'percent' | 'compact'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantStyles = {
  default: {
    bg: 'bg-white/[0.02]',
    border: 'border-white/[0.06]',
    accent: 'text-white',
  },
  primary: {
    bg: 'bg-[#5E6AD2]/10',
    border: 'border-[#5E6AD2]/30',
    accent: 'text-[#7C8AEA]',
  },
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    accent: 'text-amber-400',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    accent: 'text-red-400',
  },
}

const sizeStyles = {
  sm: {
    padding: 'p-4',
    label: 'text-[10px]',
    value: 'text-xl',
    trend: 'text-[10px]',
  },
  md: {
    padding: 'p-5',
    label: 'text-xs',
    value: 'text-2xl',
    trend: 'text-xs',
  },
  lg: {
    padding: 'p-6',
    label: 'text-sm',
    value: 'text-3xl',
    trend: 'text-sm',
  },
}

const trendColors = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  neutral: 'text-zinc-500',
}

export function StatCard({
  label,
  value,
  suffix,
  prefix,
  format = 'number',
  trend,
  trendValue,
  icon,
  variant = 'default',
  size = 'md',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant]
  const sizes = sizeStyles[size]

  return (
    <div
      className={clsx(
        'relative rounded-xl border backdrop-blur-lg overflow-hidden',
        'transition-all duration-300',
        'hover:border-white/[0.12] hover:-translate-y-0.5',
        'hover:shadow-lg hover:shadow-black/20',
        styles.bg,
        styles.border,
        sizes.padding,
        className
      )}
    >
      {/* Background Glow */}
      <div
        className={clsx(
          'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20',
          variant === 'success' && 'bg-emerald-500',
          variant === 'error' && 'bg-red-500',
          variant === 'primary' && 'bg-[#5E6AD2]',
          variant === 'warning' && 'bg-amber-500',
          variant === 'default' && 'bg-white/10'
        )}
      />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={clsx(
              'font-medium text-zinc-400 uppercase tracking-wider',
              sizes.label
            )}
          >
            {label}
          </span>
          {icon && (
            <div className={clsx('text-zinc-500', styles.accent)}>{icon}</div>
          )}
        </div>

        {/* Value */}
        <div className={clsx('font-bold', styles.accent, sizes.value)}>
          {prefix}
          {typeof value === 'number' ? (
            <AnimatedValue value={value} format={format} />
          ) : (
            value
          )}
          {suffix}
        </div>

        {/* Trend */}
        {trend && trendValue && (
          <div
            className={clsx(
              'flex items-center gap-1 mt-2',
              trendColors[trend],
              sizes.trend
            )}
          >
            {trend === 'up' && <span>↑</span>}
            {trend === 'down' && <span>↓</span>}
            {trend === 'neutral' && <span>→</span>}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
