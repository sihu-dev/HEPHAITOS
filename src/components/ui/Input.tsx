'use client'

import { forwardRef, InputHTMLAttributes, useId } from 'react'
import { clsx } from 'clsx'

/**
 * HEPHAITOS Input Component
 * Linear 2025 flat design
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'glass'
  'aria-label'?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      type = 'text',
      disabled,
      required,
      id: propId,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = propId || generatedId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs text-zinc-400 mb-1.5"
          >
            {label}
            {required && <span className="text-red-400 ml-1" aria-label="required">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            aria-label={ariaLabel || label}
            aria-required={required}
            {...(error && { 'aria-invalid': true })}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            className={clsx(
              'w-full h-11 px-3',  // 44px ✅ WCAG 준수
              'text-sm text-white placeholder:text-zinc-400',
              'bg-white/[0.04] border border-white/[0.06] rounded',
              'transition-all duration-200',
              'hover:border-white/[0.08] hover:bg-white/[0.05]',
              'focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.06] focus:ring-1 focus:ring-white/[0.05]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500/50',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-400">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs text-zinc-400">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
