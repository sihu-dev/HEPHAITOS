'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

/**
 * HEPHAITOS Button Component
 * Linear 2025 flat design
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  glow?: boolean // kept for backward compatibility, but ignored
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-white/[0.08] text-white hover:bg-white/[0.12] active:bg-white/[0.06] active:scale-[0.98]',
  secondary: 'bg-transparent text-zinc-400 border border-white/[0.06] hover:bg-white/[0.04] hover:text-zinc-300 active:bg-white/[0.02] active:scale-[0.98]',
  ghost: 'bg-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-white active:bg-white/[0.02] active:scale-[0.98]',
  danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/15 active:bg-red-500/8 active:scale-[0.98]',
  outline: 'bg-transparent text-zinc-400 border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.12] active:bg-white/[0.02] active:scale-[0.98]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5 rounded',      // 36px (컴팩트)
  md: 'h-11 px-4 text-sm gap-2 rounded',       // 44px ✅ WCAG 준수
  lg: 'h-12 px-5 text-base gap-2 rounded',     // 48px ✅ 권장
  icon: 'h-11 w-11 p-0 rounded',               // 44px ✅ 터치 타겟
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        aria-label={ariaLabel}
        className={clsx(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isLoading && <span className="sr-only">Loading...</span>}
        {!isLoading && leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
