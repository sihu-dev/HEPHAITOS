'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  AcademicCapIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  FolderIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'

// ============================================
// Command Palette (Cmd+K / Ctrl+K)
// Linear/Raycast inspired design
// ============================================

interface Command {
  id: string
  title: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  category: 'navigation' | 'actions' | 'settings' | 'help'
  shortcut?: string[]
  keywords?: string[]
}

export function CommandPalette() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Define all commands
  const commands = useMemo<Command[]>(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View your portfolio and strategies',
      icon: HomeIcon,
      action: () => router.push('/dashboard'),
      category: 'navigation',
      shortcut: ['D'],
      keywords: ['home', 'main'],
    },
    {
      id: 'nav-strategies',
      title: 'Go to Strategies',
      subtitle: 'Manage your trading strategies',
      icon: FolderIcon,
      action: () => router.push('/dashboard/strategies'),
      category: 'navigation',
      shortcut: ['S'],
      keywords: ['list', 'my'],
    },
    {
      id: 'nav-backtest',
      title: 'Go to Backtest',
      subtitle: 'Test strategies with historical data',
      icon: ChartBarIcon,
      action: () => router.push('/dashboard/backtest'),
      category: 'navigation',
      shortcut: ['B'],
      keywords: ['test', 'historical'],
    },
    {
      id: 'nav-coaching',
      title: 'Go to Coaching',
      subtitle: 'Learn from expert mentors',
      icon: AcademicCapIcon,
      action: () => router.push('/dashboard/coaching'),
      category: 'navigation',
      keywords: ['mentor', 'learn', 'education'],
    },
    {
      id: 'nav-copy-trading',
      title: 'Go to Copy Trading',
      subtitle: 'Follow celebrity portfolios',
      icon: UserGroupIcon,
      action: () => router.push('/dashboard/copy-trading'),
      category: 'navigation',
      keywords: ['mirror', 'follow', 'celebrity'],
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      subtitle: 'Configure your account',
      icon: Cog6ToothIcon,
      action: () => router.push('/dashboard/settings'),
      category: 'navigation',
      keywords: ['preferences', 'account', 'profile'],
    },

    // Actions
    {
      id: 'action-ai-strategy',
      title: 'Create AI Strategy',
      subtitle: 'Generate strategy with natural language',
      icon: SparklesIcon,
      action: () => router.push('/dashboard/ai-strategy'),
      category: 'actions',
      shortcut: ['A'],
      keywords: ['new', 'generate', 'create', 'gpt', 'claude'],
    },
    {
      id: 'action-new-strategy',
      title: 'New Visual Strategy',
      subtitle: 'Build with drag-and-drop blocks',
      icon: RocketLaunchIcon,
      action: () => router.push('/dashboard/strategy-builder'),
      category: 'actions',
      shortcut: ['N'],
      keywords: ['create', 'builder', 'blocks'],
    },
    {
      id: 'action-connect-broker',
      title: 'Connect Broker',
      subtitle: 'Link your brokerage account',
      icon: BoltIcon,
      action: () => router.push('/dashboard/settings/broker'),
      category: 'actions',
      shortcut: ['C'],
      keywords: ['api', 'kis', 'alpaca', 'kiwoom'],
    },

    // Settings
    {
      id: 'settings-billing',
      title: 'Billing & Credits',
      subtitle: 'Manage your subscription and credits',
      icon: DocumentTextIcon,
      action: () => router.push('/dashboard/settings/billing'),
      category: 'settings',
      keywords: ['payment', 'subscription', 'credits'],
    },

    // Help
    {
      id: 'help-docs',
      title: 'Documentation',
      subtitle: 'Read the user guide',
      icon: DocumentTextIcon,
      action: () => router.push('/docs'),
      category: 'help',
      keywords: ['guide', 'help', 'tutorial'],
    },
    {
      id: 'help-shortcuts',
      title: 'Keyboard Shortcuts',
      subtitle: 'View all shortcuts',
      icon: DocumentTextIcon,
      action: () => {
        setIsOpen(false)
        window.dispatchEvent(new CustomEvent('open-shortcuts-help'))
      },
      category: 'help',
      shortcut: ['?'],
      keywords: ['hotkeys', 'keys'],
    },
  ], [router])

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands

    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd => {
      const matchTitle = cmd.title.toLowerCase().includes(lowerQuery)
      const matchSubtitle = cmd.subtitle?.toLowerCase().includes(lowerQuery)
      const matchKeywords = cmd.keywords?.some(k => k.includes(lowerQuery))
      return matchTitle || matchSubtitle || matchKeywords
    })
  }, [commands, query])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      navigation: [],
      actions: [],
      settings: [],
      help: [],
    }
    filteredCommands.forEach(cmd => {
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])

  // Flatten for keyboard navigation
  const flatCommands = useMemo(() => {
    return [
      ...groupedCommands.actions,
      ...groupedCommands.navigation,
      ...groupedCommands.settings,
      ...groupedCommands.help,
    ]
  }, [groupedCommands])

  // Open/close handlers
  const open = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
  }, [])

  // Execute selected command
  const executeCommand = useCallback((command: Command) => {
    close()
    command.action()
  }, [close])

  // Listen for open event
  useEffect(() => {
    const handleOpen = () => open()
    const handleClose = () => close()

    window.addEventListener('open-command-palette', handleOpen)
    window.addEventListener('close-modal', handleClose)

    return () => {
      window.removeEventListener('open-command-palette', handleOpen)
      window.removeEventListener('close-modal', handleClose)
    }
  }, [open, close])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, flatCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (flatCommands[selectedIndex]) {
            executeCommand(flatCommands[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          close()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, flatCommands, executeCommand, close])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && flatCommands[selectedIndex]) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, flatCommands])

  if (!isOpen) return null

  const categoryLabels: Record<string, string> = {
    actions: 'Quick Actions',
    navigation: 'Navigation',
    settings: 'Settings',
    help: 'Help',
  }

  let currentIndex = -1

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={clsx(
          'relative w-full max-w-lg mx-4',
          'bg-zinc-900 border border-white/[0.08] rounded-xl',
          'shadow-2xl shadow-black/50',
          'overflow-hidden',
          'animate-fade-in'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <MagnifyingGlassIcon className="w-5 h-5 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-500 outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-500">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {flatCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No commands found for "{query}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => {
              if (cmds.length === 0) return null

              return (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1.5 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                    {categoryLabels[category]}
                  </div>
                  {cmds.map((cmd) => {
                    currentIndex++
                    const index = currentIndex
                    const isSelected = selectedIndex === index

                    return (
                      <button
                        key={cmd.id}
                        data-index={index}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                          'transition-colors text-left',
                          isSelected
                            ? 'bg-primary/20 text-white'
                            : 'text-zinc-300 hover:bg-white/[0.04]'
                        )}
                      >
                        <div className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          isSelected ? 'bg-primary/30' : 'bg-white/[0.06]'
                        )}>
                          <cmd.icon className={clsx(
                            'w-4 h-4',
                            isSelected ? 'text-[#7C8AEA]' : 'text-zinc-400'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cmd.title}</p>
                          {cmd.subtitle && (
                            <p className="text-xs text-zinc-500 truncate">{cmd.subtitle}</p>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <div className="flex items-center gap-1">
                            {cmd.shortcut.map((key, idx) => (
                              <kbd
                                key={idx}
                                className={clsx(
                                  'px-1.5 py-0.5 rounded text-[10px] font-mono',
                                  isSelected
                                    ? 'bg-primary/30 text-[#7C8AEA]'
                                    : 'bg-zinc-800 text-zinc-500'
                                )}
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800">↵</kbd>
              Select
            </span>
          </div>
          <span>Press ? for keyboard shortcuts</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
