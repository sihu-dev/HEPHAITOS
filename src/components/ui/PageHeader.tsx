'use client'

import { clsx } from 'clsx'
import { LiveIndicator } from './LiveIndicator'

/**
 * HEPHAITOS Cinematic Page Header
 * Consistent header pattern across all pages
 */

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: string
  showLive?: boolean
  liveLabel?: string
  className?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  badge,
  showLive = false,
  liveLabel = 'Live',
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={clsx('animate-fade-in', className)}>
      {/* Badge */}
      {badge && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary/10 border border-primary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xs text-[#7C8AEA] font-medium">{badge}</span>
        </div>
      )}

      {/* Title Row */}
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {title}
        </h1>
        {showLive && <LiveIndicator status="live" label={liveLabel} />}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm md:text-base text-zinc-500 max-w-2xl">
          {subtitle}
        </p>
      )}

      {/* Additional Content */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export default PageHeader
