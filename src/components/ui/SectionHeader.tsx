'use client'

import { clsx } from 'clsx'
import Link from 'next/link'

/**
 * HEPHAITOS Cinematic Section Header
 * Consistent section header pattern
 */

interface SectionHeaderProps {
  title: string
  subtitle?: string
  badge?: string
  viewAllHref?: string
  viewAllLabel?: string
  centered?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

const sizeStyles = {
  sm: {
    title: 'text-base font-semibold',
    subtitle: 'text-xs',
    badge: 'text-[10px]',
  },
  md: {
    title: 'text-lg font-semibold',
    subtitle: 'text-sm',
    badge: 'text-xs',
  },
  lg: {
    title: 'text-2xl md:text-3xl font-medium',
    subtitle: 'text-base',
    badge: 'text-xs',
  },
}

export function SectionHeader({
  title,
  subtitle,
  badge,
  viewAllHref,
  viewAllLabel = 'View All',
  centered = false,
  size = 'md',
  className,
  children,
}: SectionHeaderProps) {
  const styles = sizeStyles[size]

  return (
    <div
      className={clsx(
        'mb-6',
        centered && 'text-center',
        className
      )}
    >
      {/* Badge */}
      {badge && (
        <span
          className={clsx(
            'text-primary uppercase tracking-wider font-medium mb-2 block',
            styles.badge
          )}
        >
          {badge}
        </span>
      )}

      {/* Title Row */}
      <div
        className={clsx(
          'flex items-center gap-4',
          centered ? 'justify-center' : 'justify-between'
        )}
      >
        <h2 className={clsx('text-white', styles.title)}>{title}</h2>
        {viewAllHref && !centered && (
          <Link
            href={viewAllHref}
            className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1 group"
          >
            {viewAllLabel}
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p
          className={clsx(
            'text-zinc-400 mt-2',
            styles.subtitle,
            centered && 'max-w-lg mx-auto'
          )}
        >
          {subtitle}
        </p>
      )}

      {/* Additional Content */}
      {children}
    </div>
  )
}

export default SectionHeader
