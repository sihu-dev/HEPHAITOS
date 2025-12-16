'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * HEPHAITOS Spinner Component
 * Loading indicator with multiple sizes and variants
 */

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type SpinnerVariant = 'default' | 'primary' | 'white'

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize
  variant?: SpinnerVariant
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

const variantStyles: Record<SpinnerVariant, { track: string; spinner: string }> = {
  default: {
    track: 'text-zinc-500',
    spinner: 'text-zinc-400',
  },
  primary: {
    track: 'text-primary-900',
    spinner: 'text-primary-500',
  },
  white: {
    track: 'text-white/20',
    spinner: 'text-white',
  },
}

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'default', ...props }, ref) => {
    const { track, spinner } = variantStyles[variant]

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn('relative', sizeStyles[size], className)}
        {...props}
      >
        {/* Track */}
        <svg
          className={cn('absolute inset-0', track)}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.25"
          />
        </svg>

        {/* Spinner */}
        <svg
          className={cn('animate-spin', spinner)}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="32"
            strokeDashoffset="12"
          />
        </svg>

        <span className="sr-only">Loading...</span>
      </div>
    )
  }
)

Spinner.displayName = 'Spinner'

export default Spinner
