'use client'

import { createContext, useContext, useState, ReactNode, HTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * HEPHAITOS Tabs Component
 * Linear-style tabs with smooth transitions
 */

// Context
interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

// Root
interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const baseId = useId()

  const activeTab = value ?? internalValue
  const setActiveTab = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// TabsList
interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'pills' | 'underline'
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'p-0.5 bg-white/[0.02] rounded-lg border border-white/[0.06]',
      pills: 'gap-2',
      underline: 'gap-6 border-b border-white/[0.06] pb-0',
    }

    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          'flex w-full sm:w-fit',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

TabsList.displayName = 'TabsList'

// TabsTrigger
interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
  icon?: ReactNode
  disabled?: boolean
  variant?: 'default' | 'pills' | 'underline'
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, icon, disabled, variant = 'default', children, ...props }, ref) => {
    const { activeTab, setActiveTab, baseId } = useTabsContext()
    const isActive = activeTab === value
    const triggerId = `${baseId}-trigger-${value}`
    const panelId = `${baseId}-panel-${value}`

    const variantStyles = {
      default: cn(
        'flex-1 sm:flex-none flex items-center justify-center gap-2',
        'px-4 py-3 rounded-lg text-sm font-medium',  // py-3 for 44px+ 터치 타겟
        'transition-all duration-200',
        isActive
          ? 'bg-background-elevated text-white shadow-sm ring-1 ring-white/[0.05]'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
      ),
      pills: cn(
        'flex items-center justify-center gap-2',
        'px-4 py-3 rounded-lg text-sm font-medium',  // py-3 for 44px+ 터치 타겟
        'transition-all duration-200',
        isActive
          ? 'bg-primary-500 text-white'
          : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
      ),
      underline: cn(
        'flex items-center justify-center gap-2',
        'px-1 py-3 text-sm font-medium relative',
        'transition-all duration-200',
        isActive
          ? 'text-white'
          : 'text-zinc-500 hover:text-zinc-300',
        isActive && 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-full'
      ),
    }

    return (
      <button
        ref={ref}
        id={triggerId}
        role="tab"
        type="button"
        aria-selected={isActive ? true : false}
        aria-controls={panelId}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={() => setActiveTab(value)}
        className={cn(
          variantStyles[variant],
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {icon && (
          <span className={cn(isActive ? 'text-primary-light' : '')}>
            {icon}
          </span>
        )}
        {children}
      </button>
    )
  }
)

TabsTrigger.displayName = 'TabsTrigger'

// TabsContent
interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { activeTab, baseId } = useTabsContext()
    const triggerId = `${baseId}-trigger-${value}`
    const panelId = `${baseId}-panel-${value}`

    if (activeTab !== value) {
      return null
    }

    return (
      <div
        ref={ref}
        id={panelId}
        role="tabpanel"
        aria-labelledby={triggerId}
        tabIndex={0}
        className={cn('mt-4 animate-fade-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary rounded-lg', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

TabsContent.displayName = 'TabsContent'

export default Tabs
