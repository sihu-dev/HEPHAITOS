'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { clsx } from 'clsx'

/**
 * HEPHAITOS Card Component
 * Cinematic Trading Terminal Design
 */

type CardVariant = 'default' | 'elevated' | 'glass' | 'interactive' | 'primary' | 'cinematic' | 'metric'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  hover?: boolean
}

const variantStyles: Record<CardVariant, string> = {
  default: clsx(
    'bg-white/[0.02]',
    'border border-white/[0.06]'
  ),
  elevated: clsx(
    'bg-[#141416]',
    'border border-white/[0.08]',
    'shadow-xl shadow-black/30'
  ),
  glass: clsx(
    'bg-white/[0.03] backdrop-blur-xl',
    'border border-white/[0.06]',
    'shadow-lg shadow-black/20'
  ),
  interactive: clsx(
    'bg-white/[0.02]',
    'border border-white/[0.06]',
    'cursor-pointer',
    'transition-all duration-300',
    'hover:bg-white/[0.04] hover:border-white/[0.12]',
    'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30',
    'active:translate-y-0 active:shadow-md'
  ),
  primary: clsx(
    'bg-amber-500/[0.08] backdrop-blur-lg',
    'border border-amber-500/20',
    'shadow-lg shadow-amber-500/10'
  ),
  cinematic: 'card-cinematic',
  metric: clsx(
    'bg-gradient-to-br from-white/[0.03] to-transparent',
    'backdrop-blur-lg',
    'border border-white/[0.06]',
    'shadow-lg shadow-black/20',
    'relative overflow-hidden'
  ),
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
}

const glowStyles: Record<CardVariant, string> = {
  default: '',
  elevated: 'shadow-xl shadow-black/40',
  glass: 'shadow-xl shadow-black/30',
  interactive: '',
  primary: 'shadow-xl shadow-amber-500/30',
  cinematic: '',
  metric: 'shadow-xl shadow-black/30',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      glow = false,
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
          'rounded-xl',
          'transition-all duration-300',
          variantStyles[variant],
          paddingStyles[padding],
          glow && glowStyles[variant],
          hover && !['interactive', 'cinematic'].includes(variant) && clsx(
            'hover:bg-white/[0.04] hover:border-white/[0.12]',
            'hover:-translate-y-0.5 hover:shadow-lg'
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

Card.displayName = 'Card'

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('flex flex-col space-y-1', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

// Card Title
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={clsx('text-base font-medium text-white', className)}
        {...props}
      >
        {children}
      </h3>
    )
  }
)

CardTitle.displayName = 'CardTitle'

// Card Description
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={clsx('text-sm text-zinc-500', className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)

CardDescription.displayName = 'CardDescription'

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('pt-4', className)} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

// Card Footer
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('flex items-center pt-4', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

export default Card
