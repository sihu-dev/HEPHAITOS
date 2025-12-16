// ============================================
// Undo/Redo Hook for Strategy Builder
// ============================================

'use client'

import { useState, useCallback, useRef } from 'react'
import type { Node, Edge } from 'reactflow'

interface HistoryState {
  nodes: Node[]
  edges: Edge[]
}

interface UseUndoRedoReturn {
  canUndo: boolean
  canRedo: boolean
  undo: () => HistoryState | null
  redo: () => HistoryState | null
  takeSnapshot: (nodes: Node[], edges: Edge[]) => void
  clear: () => void
}

const MAX_HISTORY_SIZE = 50

export function useUndoRedo(
  initialNodes: Node[] = [],
  initialEdges: Edge[] = []
): UseUndoRedoReturn {
  const [past, setPast] = useState<HistoryState[]>([])
  const [future, setFuture] = useState<HistoryState[]>([])

  // Debounce timer to avoid too many snapshots
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastSnapshot = useRef<HistoryState>({ nodes: initialNodes, edges: initialEdges })

  const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
    // Clear any pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Debounce to avoid too many snapshots during rapid changes
    debounceTimer.current = setTimeout(() => {
      // Check if state actually changed
      const currentState = JSON.stringify({ nodes, edges })
      const lastState = JSON.stringify(lastSnapshot.current)

      if (currentState === lastState) return

      setPast((prev) => {
        const newPast = [...prev, lastSnapshot.current]
        // Limit history size
        if (newPast.length > MAX_HISTORY_SIZE) {
          newPast.shift()
        }
        return newPast
      })

      // Clear future when new action is taken
      setFuture([])

      // Update last snapshot
      lastSnapshot.current = { nodes, edges }
    }, 300)
  }, [])

  const undo = useCallback((): HistoryState | null => {
    if (past.length === 0) return null

    const previous = past[past.length - 1]
    if (!previous) return null

    const newPast = past.slice(0, -1)

    setPast(newPast)
    setFuture((prev) => [lastSnapshot.current, ...prev])
    lastSnapshot.current = previous

    return previous
  }, [past])

  const redo = useCallback((): HistoryState | null => {
    if (future.length === 0) return null

    const next = future[0]
    if (!next) return null

    const newFuture = future.slice(1)

    setFuture(newFuture)
    setPast((prev) => [...prev, lastSnapshot.current])
    lastSnapshot.current = next

    return next
  }, [future])

  const clear = useCallback(() => {
    setPast([])
    setFuture([])
  }, [])

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    takeSnapshot,
    clear,
  }
}
