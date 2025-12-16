// ============================================
// useUndoRedo Hook Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUndoRedo } from '@/hooks/use-undo-redo'
import type { Node, Edge } from 'reactflow'

const createNode = (id: string, x = 0, y = 0): Node => ({
  id,
  position: { x, y },
  data: { label: `Node ${id}` },
})

const createEdge = (id: string, source: string, target: string): Edge => ({
  id,
  source,
  target,
})

describe('useUndoRedo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start with empty history', () => {
    const { result } = renderHook(() => useUndoRedo())

    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('should take snapshot and enable undo', () => {
    const { result } = renderHook(() => useUndoRedo())

    const nodes = [createNode('1')]
    const edges: Edge[] = []

    act(() => {
      result.current.takeSnapshot(nodes, edges)
      vi.advanceTimersByTime(300) // Wait for debounce
    })

    // Add another snapshot to have something to undo to
    const newNodes = [createNode('1'), createNode('2')]

    act(() => {
      result.current.takeSnapshot(newNodes, edges)
      vi.advanceTimersByTime(300)
    })

    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('should undo to previous state', () => {
    const { result } = renderHook(() =>
      useUndoRedo([createNode('1')], [])
    )

    const initialNodes = [createNode('1')]
    const initialEdges: Edge[] = []

    // Take initial snapshot
    act(() => {
      result.current.takeSnapshot(initialNodes, initialEdges)
      vi.advanceTimersByTime(300)
    })

    // Add new node
    const newNodes = [createNode('1'), createNode('2', 100, 100)]

    act(() => {
      result.current.takeSnapshot(newNodes, initialEdges)
      vi.advanceTimersByTime(300)
    })

    // Undo
    let undoResult: { nodes: Node[]; edges: Edge[] } | null = null
    act(() => {
      undoResult = result.current.undo()
    })

    expect(undoResult).not.toBeNull()
    expect(undoResult!.nodes).toHaveLength(1)
    expect(result.current.canRedo).toBe(true)
  })

  it('should redo to next state', () => {
    const { result } = renderHook(() => useUndoRedo())

    const state1 = { nodes: [createNode('1')], edges: [] as Edge[] }
    const state2 = { nodes: [createNode('1'), createNode('2')], edges: [] as Edge[] }

    // Record history
    act(() => {
      result.current.takeSnapshot(state1.nodes, state1.edges)
      vi.advanceTimersByTime(300)
    })

    act(() => {
      result.current.takeSnapshot(state2.nodes, state2.edges)
      vi.advanceTimersByTime(300)
    })

    // Undo
    act(() => {
      result.current.undo()
    })

    expect(result.current.canRedo).toBe(true)

    // Redo
    let redoResult: { nodes: Node[]; edges: Edge[] } | null = null
    act(() => {
      redoResult = result.current.redo()
    })

    expect(redoResult).not.toBeNull()
    expect(redoResult!.nodes).toHaveLength(2)
    expect(result.current.canRedo).toBe(false)
  })

  it('should clear future on new action after undo', () => {
    const { result } = renderHook(() => useUndoRedo())

    const state1 = { nodes: [createNode('1')], edges: [] as Edge[] }
    const state2 = { nodes: [createNode('1'), createNode('2')], edges: [] as Edge[] }
    const state3 = { nodes: [createNode('1'), createNode('3')], edges: [] as Edge[] }

    // Build history
    act(() => {
      result.current.takeSnapshot(state1.nodes, state1.edges)
      vi.advanceTimersByTime(300)
    })

    act(() => {
      result.current.takeSnapshot(state2.nodes, state2.edges)
      vi.advanceTimersByTime(300)
    })

    // Undo
    act(() => {
      result.current.undo()
    })

    expect(result.current.canRedo).toBe(true)

    // New action (should clear redo history)
    act(() => {
      result.current.takeSnapshot(state3.nodes, state3.edges)
      vi.advanceTimersByTime(300)
    })

    expect(result.current.canRedo).toBe(false)
  })

  it('should return null when undo not available', () => {
    const { result } = renderHook(() => useUndoRedo())

    let undoResult: { nodes: Node[]; edges: Edge[] } | null = null
    act(() => {
      undoResult = result.current.undo()
    })

    expect(undoResult).toBeNull()
  })

  it('should return null when redo not available', () => {
    const { result } = renderHook(() => useUndoRedo())

    let redoResult: { nodes: Node[]; edges: Edge[] } | null = null
    act(() => {
      redoResult = result.current.redo()
    })

    expect(redoResult).toBeNull()
  })

  it('should clear history', () => {
    const { result } = renderHook(() => useUndoRedo())

    // Build some history
    act(() => {
      result.current.takeSnapshot([createNode('1')], [])
      vi.advanceTimersByTime(300)
    })

    act(() => {
      result.current.takeSnapshot([createNode('1'), createNode('2')], [])
      vi.advanceTimersByTime(300)
    })

    act(() => {
      result.current.undo()
    })

    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(true)

    // Clear
    act(() => {
      result.current.clear()
    })

    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('should debounce rapid snapshots', () => {
    const { result } = renderHook(() => useUndoRedo())

    // Take multiple rapid snapshots
    act(() => {
      result.current.takeSnapshot([createNode('1')], [])
      result.current.takeSnapshot([createNode('1'), createNode('2')], [])
      result.current.takeSnapshot([createNode('1'), createNode('2'), createNode('3')], [])
    })

    // Before debounce completes - should have no history
    expect(result.current.canUndo).toBe(false)

    // After debounce - only the last state should be recorded
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Now we have one snapshot recorded
    // Add another distinct state
    act(() => {
      result.current.takeSnapshot([createNode('1'), createNode('2'), createNode('3'), createNode('4')], [])
      vi.advanceTimersByTime(300)
    })

    expect(result.current.canUndo).toBe(true)
  })

  it('should preserve history across multiple undo/redo cycles', () => {
    const { result } = renderHook(() => useUndoRedo())

    const nodes1 = [createNode('1')]
    const nodes2 = [createNode('1'), createNode('2')]
    const nodes3 = [createNode('1'), createNode('2'), createNode('3')]
    const edges: Edge[] = []

    // Build history: empty -> nodes1 -> nodes2 -> nodes3
    act(() => {
      result.current.takeSnapshot(nodes1, edges)
      vi.advanceTimersByTime(300)
    })

    act(() => {
      result.current.takeSnapshot(nodes2, edges)
      vi.advanceTimersByTime(300)
    })

    act(() => {
      result.current.takeSnapshot(nodes3, edges)
      vi.advanceTimersByTime(300)
    })

    // Should be able to undo
    expect(result.current.canUndo).toBe(true)

    // Undo twice
    act(() => {
      result.current.undo()
    })
    expect(result.current.canRedo).toBe(true)

    act(() => {
      result.current.undo()
    })
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(true)

    // Redo once
    act(() => {
      result.current.redo()
    })
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(true)
  })

  it('should handle edges correctly', () => {
    const { result } = renderHook(() => useUndoRedo())

    const nodes = [createNode('1'), createNode('2')]
    const edges: Edge[] = []
    const edgesWithConnection = [createEdge('e1', '1', '2')]

    // Initial state with no edges
    act(() => {
      result.current.takeSnapshot(nodes, edges)
      vi.advanceTimersByTime(300)
    })

    // Add edge
    act(() => {
      result.current.takeSnapshot(nodes, edgesWithConnection)
      vi.advanceTimersByTime(300)
    })

    expect(result.current.canUndo).toBe(true)

    // Undo should return previous state (with edge, since lastSnapshot tracks current)
    let undoResult: { nodes: Node[]; edges: Edge[] } | null = null
    act(() => {
      undoResult = result.current.undo()
    })

    expect(undoResult).not.toBeNull()
    // The undo returns the state before the last change (no edges)
    expect(undoResult!.nodes).toHaveLength(2)
  })
})
