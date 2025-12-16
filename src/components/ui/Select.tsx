'use client'

import { forwardRef, SelectHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

/**
 * HEPHAITOS Select Component
 * Dropdown select with Linear-style design
 */

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  options: SelectOption[]
  variant?: 'default' | 'glass'
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      placeholder,
      options,
      variant = 'default',
      disabled,
      id: propId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const selectId = propId || generatedId
    const errorId = `${selectId}-error`
    const hintId = `${selectId}-hint`

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-zinc-400 mb-1.5">
            {label}
          </label>
        )}

        {/* Select Container */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            {...(error && { 'aria-invalid': true })}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            className={cn(
              // Base styles
              'w-full h-11 px-3 pr-10',  // 44px ✅ WCAG 준수
              'text-sm text-white',
              'rounded-lg',
              'appearance-none cursor-pointer',
              'transition-all duration-200 ease-out',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none',
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
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-zinc-400 bg-background-primary">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-background-primary text-white"
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Chevron Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
            <ChevronDownIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-error flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
          <p id={hintId} className="mt-1.5 text-xs text-zinc-400">{hint}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
