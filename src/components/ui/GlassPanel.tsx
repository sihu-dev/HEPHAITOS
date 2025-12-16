'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { clsx } from 'clsx'

/**
 * HEPHAITOS GlassPanel Component
 * Linear 2025 flat design - no glass/blur effects
 */

type GlassIntensity = 'light' | 'medium' | 'strong' | 'ultra'
type GlassVariant = 'neutral' | 'primary'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  intensity?: GlassIntensity
  variant?: GlassVariant
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  glow?: boolean
  border?: boolean
  hover?: boolean
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
}

const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      className,
      padding = 'md',
      rounded = 'lg',
      border = true,
      hover = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'relative',
          border && 'border border-white/[0.06]',
          roundedStyles[rounded],
          paddingStyles[padding],
          hover && 'transition-colors hover:bg-white/[0.02]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassPanel.displayName = 'GlassPanel'

export default GlassPanel
