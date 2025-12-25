'use client'

import { clsx } from 'clsx'
import Link from 'next/link'

/**
 * HEPHAITOS Cinematic Feature Card
 * Reusable card for features, benefits, etc.
 */

interface FeatureCardProps {
  icon?: React.ReactNode
  title: string
  description: string
  href?: string
  badge?: string
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning'
  variant?: 'default' | 'primary' | 'glass' | 'elevated'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

const variantStyles = {
  default: clsx(
    'bg-white/[0.02] border border-white/[0.06]',
    'hover:bg-white/[0.04] hover:border-white/[0.12]'
  ),
  primary: clsx(
    'bg-primary/10 border border-primary/30',
    'hover:bg-primary/15 hover:border-primary/50'
  ),
  glass: clsx(
    'glass',
    'hover:glass-strong'
  ),
  elevated: clsx(
    'card-cinematic'
  ),
}

const badgeVariants = {
  default: 'bg-white/[0.08] text-zinc-400',
  primary: 'bg-primary/20 text-[#7C8AEA]',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
}

const sizeStyles = {
  sm: {
    padding: 'p-4',
    icon: 'w-8 h-8',
    title: 'text-sm font-medium',
    description: 'text-xs',
  },
  md: {
    padding: 'p-5',
    icon: 'w-10 h-10',
    title: 'text-base font-medium',
    description: 'text-sm',
  },
  lg: {
    padding: 'p-6',
    icon: 'w-12 h-12',
    title: 'text-lg font-semibold',
    description: 'text-base',
  },
}

export function FeatureCard({
  icon,
  title,
  description,
  href,
  badge,
  badgeVariant = 'default',
  variant = 'default',
  size = 'md',
  className,
  onClick,
}: FeatureCardProps) {
  const sizes = sizeStyles[size]

  const content = (
    <>
      {/* Badge */}
      {badge && (
        <span
          className={clsx(
            'absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-medium',
            badgeVariants[badgeVariant]
          )}
        >
          {badge}
        </span>
      )}

      {/* Icon */}
      {icon && (
        <div
          className={clsx(
            'flex items-center justify-center rounded-lg mb-4',
            'bg-white/[0.06] text-zinc-400',
            'group-hover:bg-primary/20 group-hover:text-[#7C8AEA]',
            'transition-all duration-300',
            sizes.icon
          )}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      <h3
        className={clsx(
          'text-white mb-2 group-hover:text-[#7C8AEA] transition-colors',
          sizes.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      <p className={clsx('text-zinc-400', sizes.description)}>{description}</p>

      {/* Arrow for links */}
      {href && (
        <div className="mt-4 flex items-center gap-1 text-xs text-zinc-500 group-hover:text-[#7C8AEA] transition-colors">
          <span>Learn more</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      )}
    </>
  )

  const cardClasses = clsx(
    'relative rounded-xl transition-all duration-300 group',
    variantStyles[variant],
    sizes.padding,
    href && 'cursor-pointer',
    className
  )

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={clsx(cardClasses, 'text-left w-full')}>
        {content}
      </button>
    )
  }

  return <div className={cardClasses}>{content}</div>
}

export default FeatureCard
