'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition, Combobox } from '@headlessui/react'
import {
  MagnifyingGlassIcon,
  CommandLineIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  CogIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

interface Command {
  id: string
  name: string
  description: string
  icon: typeof MagnifyingGlassIcon
  action: () => void
  keywords: string[]
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const commands: Command[] = [
    {
      id: 'new-strategy',
      name: 'Create New Strategy',
      description: 'Build a new trading strategy with AI',
      icon: RocketLaunchIcon,
      action: () => router.push('/dashboard/strategy-builder'),
      keywords: ['create', 'new', 'strategy', 'build', 'ai'],
    },
    {
      id: 'run-backtest',
      name: 'Run Backtest',
      description: 'Test your strategy on historical data',
      icon: ChartBarIcon,
      action: () => router.push('/dashboard/backtest'),
      keywords: ['backtest', 'test', 'history', 'run'],
    },
    {
      id: 'view-strategies',
      name: 'View All Strategies',
      description: 'Manage your active strategies',
      icon: CommandLineIcon,
      action: () => router.push('/dashboard/strategies'),
      keywords: ['strategies', 'view', 'manage', 'list'],
    },
    {
      id: 'leaderboard',
      name: 'Strategy Leaderboard',
      description: 'See top performing strategies',
      icon: UsersIcon,
      action: () => router.push('/strategies/leaderboard'),
      keywords: ['leaderboard', 'top', 'best', 'ranking'],
    },
    {
      id: 'settings',
      name: 'Settings',
      description: 'Configure your account and preferences',
      icon: CogIcon,
      action: () => router.push('/dashboard/settings'),
      keywords: ['settings', 'preferences', 'config'],
    },
  ]

  const filteredCommands =
    query === ''
      ? commands
      : commands.filter((command) =>
          command.keywords.some((keyword) =>
            keyword.toLowerCase().includes(query.toLowerCase())
          ) ||
          command.name.toLowerCase().includes(query.toLowerCase())
        )

  const handleSelect = (command: Command | null) => {
    if (!command) return
    setIsOpen(false)
    setQuery('')
    command.action()
  }

  return (
    <>
      {/* Trigger Button (Optional - can be triggered via keyboard only) */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:border-white/[0.12] transition-all"
      >
        <MagnifyingGlassIcon className="w-3.5 h-3.5" />
        <span>Search</span>
        <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-white/[0.08] rounded border border-white/[0.12]">
          ⌘K
        </kbd>
      </button>

      {/* Dialog */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          {/* Panel */}
          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="mx-auto max-w-2xl transform overflow-hidden rounded-xl bg-[#141416] border border-white/[0.08] shadow-2xl transition-all">
                <Combobox onChange={handleSelect}>
                  {/* Search Input */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                    <Combobox.Input
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-white placeholder:text-zinc-400 focus:ring-0 focus:outline-none text-sm"
                      placeholder="Search commands..."
                      onChange={(event) => setQuery(event.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Results */}
                  {filteredCommands.length > 0 && (
                    <Combobox.Options
                      static
                      className="max-h-80 scroll-py-2 overflow-y-auto border-t border-white/[0.08]"
                    >
                      {filteredCommands.map((command) => (
                        <Combobox.Option
                          key={command.id}
                          value={command}
                          className={({ active }) =>
                            clsx(
                              'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                              active ? 'bg-white/[0.06]' : 'bg-transparent'
                            )
                          }
                        >
                          <command.icon className="w-5 h-5 text-zinc-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {command.name}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                              {command.description}
                            </p>
                          </div>
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  )}

                  {/* Empty State */}
                  {query !== '' && filteredCommands.length === 0 && (
                    <div className="px-4 py-14 text-center border-t border-white/[0.08]">
                      <p className="text-sm text-zinc-400">No commands found</p>
                    </div>
                  )}
                </Combobox>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.08] bg-white/[0.02]">
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded border border-white/[0.12]">↑↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded border border-white/[0.12]">↵</kbd>
                      Select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded border border-white/[0.12]">Esc</kbd>
                      Close
                    </span>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
