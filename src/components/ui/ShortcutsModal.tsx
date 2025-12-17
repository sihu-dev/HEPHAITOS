'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { SHORTCUTS_DATA } from '@/components/dashboard/KeyboardShortcuts'
import { clsx } from 'clsx'

// ============================================
// Keyboard Shortcuts Help Modal
// ============================================

export function ShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    const handleClose = () => setIsOpen(false)

    window.addEventListener('open-shortcuts-help', handleOpen)
    window.addEventListener('close-modal', handleClose)

    return () => {
      window.removeEventListener('open-shortcuts-help', handleOpen)
      window.removeEventListener('close-modal', handleClose)
    }
  }, [])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => setIsOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={clsx(
          'relative w-full max-w-md',
          'bg-zinc-900 border border-white/[0.08] rounded-xl',
          'shadow-2xl shadow-black/50',
          'animate-fade-in'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS_DATA.map((category) => (
            <div key={category.category}>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-zinc-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, idx) => (
                        <span key={idx}>
                          <kbd
                            className={clsx(
                              'px-2 py-0.5 rounded text-xs font-mono',
                              'bg-zinc-800 border border-zinc-700 text-zinc-300'
                            )}
                          >
                            {key}
                          </kbd>
                          {idx < shortcut.keys.length - 1 && (
                            <span className="text-zinc-600 mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] text-center">
          <p className="text-xs text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShortcutsModal
