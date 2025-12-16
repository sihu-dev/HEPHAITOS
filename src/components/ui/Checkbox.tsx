'use client'

import { forwardRef, InputHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/utils'
import { CheckIcon } from '@heroicons/react/24/outline'

/**
 * HEPHAITOS Checkbox Component
 * Custom styled checkbox with Linear design
 */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, disabled, id: propId, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = propId || generatedId
    const descriptionId = `${checkboxId}-description`
    const errorId = `${checkboxId}-error`

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'flex items-start gap-3 cursor-pointer group',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        {/* Custom Checkbox */}
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            disabled={disabled}
            {...(error && { 'aria-invalid': true })}
            aria-describedby={
              error ? errorId : description ? descriptionId : undefined
            }
            className="peer sr-only"
            {...props}
          />
          
          {/* Checkbox Box */}
          <div
            className={cn(
              'w-11 h-11 rounded-md',  // 44px ✅ WCAG 터치 타겟
              'border transition-all duration-200',
              'flex items-center justify-center',
              // Default state
              'bg-white/[0.04] border-border-DEFAULT',
              // Hover
              'group-hover:border-border-light',
              // Focus
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/20 peer-focus-visible:border-primary-500',
              // Checked state
              'peer-checked:bg-primary-500 peer-checked:border-primary-500',
              // Error state
              error && 'border-error peer-focus-visible:border-error peer-focus-visible:ring-error/20'
            )}
          >
            <CheckIcon
              className={cn(
                'w-6 h-6 text-white',  // 크기 조정
                'opacity-0 scale-50 transition-all duration-150',
                'peer-checked:opacity-100 peer-checked:scale-100'
              )}
            />
          </div>
        </div>

        {/* Label & Description */}
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-white">
                {label}
              </span>
            )}
            {description && (
              <span id={descriptionId} className="text-xs text-zinc-400 mt-0.5">
                {description}
              </span>
            )}
            {error && (
              <span id={errorId} role="alert" className="text-xs text-error mt-1">
                {error}
              </span>
            )}
          </div>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
