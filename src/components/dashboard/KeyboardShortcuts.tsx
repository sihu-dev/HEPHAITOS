'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useKeyBindings } from '@/hooks/use-keyboard'

// ============================================
// Dashboard Global Keyboard Shortcuts
// Based on Quick Actions in Dashboard
// ============================================

interface KeyboardShortcutsProps {
  children: React.ReactNode
}

export function KeyboardShortcuts({ children }: KeyboardShortcutsProps) {
  const router = useRouter()

  // Define all dashboard shortcuts
  const bindings = [
    // Quick Actions (from Dashboard page)
    {
      key: 'a',
      handler: () => router.push('/dashboard/ai-strategy'),
      preventDefault: true,
    },
    {
      key: 'n',
      handler: () => router.push('/dashboard/strategy-builder'),
      preventDefault: true,
    },
    {
      key: 'b',
      handler: () => router.push('/dashboard/backtest'),
      preventDefault: true,
    },
    {
      key: 'c',
      handler: () => router.push('/dashboard/settings/broker'),
      preventDefault: true,
    },
    // Navigation shortcuts
    {
      key: 'd',
      handler: () => router.push('/dashboard'),
      preventDefault: true,
    },
    {
      key: 's',
      handler: () => router.push('/dashboard/strategies'),
      preventDefault: true,
    },
    {
      key: 'l',
      handler: () => router.push('/leaderboard'),
      preventDefault: true,
    },
    // Cmd/Ctrl+K for search (handled separately with modifier)
    {
      key: 'k',
      modifiers: ['ctrl'] as const,
      handler: () => {
        // Dispatch custom event for command palette
        window.dispatchEvent(new CustomEvent('open-command-palette'))
      },
      preventDefault: true,
    },
    // Escape to close modals
    {
      key: 'Escape',
      handler: () => {
        window.dispatchEvent(new CustomEvent('close-modal'))
      },
      preventDefault: false,
    },
    // ? for help/shortcuts modal
    {
      key: '?',
      modifiers: ['shift'] as const,
      handler: () => {
        window.dispatchEvent(new CustomEvent('open-shortcuts-help'))
      },
      preventDefault: true,
    },
  ]

  useKeyBindings(bindings)

  return <>{children}</>
}

// ============================================
// Shortcuts Help Modal Data
// ============================================

export const SHORTCUTS_DATA = [
  {
    category: 'Quick Actions',
    shortcuts: [
      { keys: ['A'], description: 'AI Strategy Builder' },
      { keys: ['N'], description: 'New Strategy (Visual)' },
      { keys: ['B'], description: 'Run Backtest' },
      { keys: ['C'], description: 'Connect Broker' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['D'], description: 'Dashboard' },
      { keys: ['S'], description: 'Strategies' },
      { keys: ['L'], description: 'Leaderboard' },
      { keys: ['⌘', 'K'], description: 'Command Palette' },
    ],
  },
  {
    category: 'General',
    shortcuts: [
      { keys: ['Esc'], description: 'Close Modal' },
      { keys: ['?'], description: 'Show Shortcuts' },
    ],
  },
]

export default KeyboardShortcuts
