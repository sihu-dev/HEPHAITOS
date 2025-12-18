'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

/**
 * HEPHAITOS Price Display Component
 * Real-time price with flash animation and trend indicator
 */

interface PriceDisplayProps {
  price: number
  change?: number
  changePercent?: number
  currency?: 'USD' | 'KRW'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showChange?: boolean
  showArrow?: boolean
  className?: string
}

const sizeStyles = {
  sm: {
    price: 'text-sm',
    change: 'text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    price: 'text-base',
    change: 'text-xs',
    icon: 'w-3.5 h-3.5',
  },
  lg: {
    price: 'text-xl',
    change: 'text-sm',
    icon: 'w-4 h-4',
  },
  xl: {
    price: 'text-3xl',
    change: 'text-base',
    icon: 'w-5 h-5',
  },
}

export function PriceDisplay({
  price,
  change = 0,
  changePercent = 0,
  currency = 'USD',
  size = 'md',
  showChange = true,
  showArrow = true,
  className,
}: PriceDisplayProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const [prevPrice, setPrevPrice] = useState(price)

  useEffect(() => {
    if (price !== prevPrice) {
      setFlash(price > prevPrice ? 'up' : 'down')
      setPrevPrice(price)
      const timer = setTimeout(() => setFlash(null), 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [price, prevPrice])

  const isPositive = change >= 0
  const styles = sizeStyles[size]

  const formatPrice = (val: number) => {
    if (currency === 'KRW') {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
      }).format(val)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val)
  }

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {/* Price */}
      <span
        className={clsx(
          'font-semibold tabular-nums transition-colors duration-300',
          styles.price,
          flash === 'up' && 'price-flash-up text-emerald-400',
          flash === 'down' && 'price-flash-down text-red-400',
          !flash && 'text-white'
        )}
      >
        {formatPrice(price)}
      </span>

      {/* Change */}
      {showChange && (
        <div
          className={clsx(
            'flex items-center gap-0.5',
            styles.change,
            isPositive ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {showArrow && (
            isPositive ? (
              <ArrowUpIcon className={styles.icon} />
            ) : (
              <ArrowDownIcon className={styles.icon} />
            )
          )}
          <span className="tabular-nums">
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  )
}

export default PriceDisplay
