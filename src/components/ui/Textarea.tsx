'use client'

import { forwardRef, TextareaHTMLAttributes, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * HEPHAITOS Textarea Component
 * Multi-line text input with Linear-style design
 */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  variant?: 'default' | 'glass'
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      variant = 'default',
      resize = 'vertical',
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)

    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            // Base styles
            'w-full min-h-[100px] px-3 py-2.5',
            'text-sm text-white placeholder:text-zinc-400',
            'rounded-lg',
            'transition-all duration-200 ease-out',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none',
            // Resize
            resizeStyles[resize],
            // Variant styles
            variant === 'default' && [
              'bg-white/[0.04]',
              'border border-border-DEFAULT',
              'hover:border-border-light',
              'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            ],
            variant === 'glass' && [
              'bg-white/[0.02]',
              'border border-white/[0.06]',
              'hover:border-white/[0.1]',
              'focus:border-white/[0.12]',
            ],
            // Error state
            error && [
              'border-error',
              'hover:border-error',
              'focus:border-error focus:ring-error/20',
            ],
            className
          )}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />

        {/* Error Message */}
        {error && (
          <p className="mt-1.5 text-xs text-error flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Hint */}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-zinc-400">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
