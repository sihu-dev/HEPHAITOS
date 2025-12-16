'use client'

import { useState, useRef, ReactNode, HTMLAttributes, useId, cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/utils'

/**
 * HEPHAITOS Tooltip Component
 * Hover tooltip with positioning options
 */

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  content: ReactNode
  position?: TooltipPosition
  delay?: number
  children: ReactNode
}

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowStyles: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-background-elevated border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-background-elevated border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-background-elevated border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-background-elevated border-y-transparent border-l-transparent',
}

export function Tooltip({
  content,
  position = 'top',
  delay = 200,
  className,
  children,
  ...props
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipId = useId()

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  // Clone children to add aria-describedby
  const trigger = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': tooltipId,
      })
    : children

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      {...props}
    >
      {trigger}

      {/* Tooltip */}
      <div
        id={tooltipId}
        role="tooltip"
        aria-hidden={!isVisible}
        className={cn(
          'absolute z-50',
          'pointer-events-none',
          positionStyles[position],
          // Visibility
          'transition-all duration-150',
          isVisible
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible',
          // Animation offset based on position
          !isVisible && position === 'top' && 'translate-y-1',
          !isVisible && position === 'bottom' && '-translate-y-1',
          !isVisible && position === 'left' && 'translate-x-1',
          !isVisible && position === 'right' && '-translate-x-1'
        )}
      >
        <div
          className={cn(
            'px-3 py-2 rounded-lg',
            'bg-background-elevated',
            'border border-border-light',
            'shadow-lg',
            'text-xs text-white whitespace-nowrap'
          )}
        >
          {content}
        </div>

        {/* Arrow */}
        <div
          className={cn(
            'absolute',
            'border-4',
            arrowStyles[position]
          )}
        />
      </div>
    </div>
  )
}

export default Tooltip
