'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { clsx } from 'clsx'

/**
 * HEPHAITOS Badge Component
 * Linear 2025 flat design
 */

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'danger' | 'info' | 'profit' | 'loss' | 'outline'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  outline?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/[0.06] text-zinc-400',
  primary: 'bg-white/[0.08] text-zinc-300',
  success: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  error: 'bg-red-500/10 text-red-400',
  danger: 'bg-red-500/10 text-red-400',
  info: 'bg-blue-500/10 text-blue-400',
  profit: 'bg-emerald-500/10 text-emerald-400',
  loss: 'bg-red-500/10 text-red-400',
  outline: 'bg-transparent text-zinc-500 border border-white/[0.08]',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'h-5 px-1.5 text-[10px]',
  md: 'h-5 px-2 text-xs',
  lg: 'h-6 px-2.5 text-xs',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-zinc-500',
  primary: 'bg-zinc-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  profit: 'bg-emerald-500',
  loss: 'bg-red-500',
  outline: 'bg-zinc-500',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      dot = false,
      outline = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center gap-1.5',
          'font-medium rounded',
          'whitespace-nowrap',
          variantStyles[variant],
          sizeStyles[size],
          outline && 'bg-transparent',
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={clsx(
              'w-1.5 h-1.5 rounded-full',
              dotColors[variant]
            )}
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge
