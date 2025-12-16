'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { clsx } from 'clsx'

/**
 * HEPHAITOS GlassPanel Component
 * Cinematic Trading Terminal - Real Glass Morphism
 */

type GlassIntensity = 'light' | 'medium' | 'strong' | 'ultra'
type GlassVariant = 'neutral' | 'primary' | 'profit' | 'loss'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  intensity?: GlassIntensity
  variant?: GlassVariant
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  glow?: boolean
  border?: boolean
  hover?: boolean
  cinematic?: boolean
}

const intensityStyles: Record<GlassIntensity, string> = {
  light: 'bg-white/[0.02] backdrop-blur-md',
  medium: 'bg-white/[0.03] backdrop-blur-lg',
  strong: 'bg-white/[0.05] backdrop-blur-xl',
  ultra: 'bg-white/[0.06] backdrop-blur-2xl',
}

const variantStyles: Record<GlassVariant, string> = {
  neutral: '',
  primary: 'bg-[#5E6AD2]/[0.08]',
  profit: 'bg-emerald-500/[0.08]',
  loss: 'bg-red-500/[0.08]',
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
  xl: 'rounded-xl',
  full: 'rounded-full',
}

const glowStyles: Record<GlassVariant, string> = {
  neutral: 'shadow-lg shadow-black/20',
  primary: 'shadow-lg shadow-[#5E6AD2]/20',
  profit: 'shadow-lg shadow-emerald-500/20',
  loss: 'shadow-lg shadow-red-500/20',
}

const borderStyles: Record<GlassVariant, string> = {
  neutral: 'border-white/[0.06]',
  primary: 'border-[#5E6AD2]/20',
  profit: 'border-emerald-500/20',
  loss: 'border-red-500/20',
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      className,
      intensity = 'medium',
      variant = 'neutral',
      padding = 'md',
      rounded = 'lg',
      glow = false,
      border = true,
      hover = false,
      cinematic = false,
      children,
      ...props
    },
    ref
  ) => {
    if (cinematic) {
      return (
        <div
          ref={ref}
          className={clsx(
            'card-cinematic',
            paddingStyles[padding],
            className
          )}
          {...props}
        >
          {children}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'relative',
          intensityStyles[intensity],
          variantStyles[variant],
          roundedStyles[rounded],
          paddingStyles[padding],
          border && `border ${borderStyles[variant]}`,
          glow && glowStyles[variant],
          hover && clsx(
            'transition-all duration-300 cursor-pointer',
            'hover:bg-white/[0.04] hover:border-white/[0.12]',
            'hover:shadow-xl hover:shadow-black/30',
            'hover:-translate-y-0.5'
          ),
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
