'use client'

import { useCallback, useState, useMemo, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  Panel,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  BookmarkIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  Squares2X2Icon,
  CheckIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

// Custom Nodes
import { TriggerNode } from './nodes/TriggerNode'
import { ConditionNode } from './nodes/ConditionNode'
import { IndicatorNode } from './nodes/IndicatorNode'
import { ActionNode } from './nodes/ActionNode'
import { RiskNode } from './nodes/RiskNode'

// Node Types
import { NodeSidebar } from './NodeSidebar'
import { NodeConfigPanel } from './NodeConfigPanel'

// Custom Hooks
import { useStrategyPersistence, useUndoRedo } from '@/hooks'
import { useToast } from '@/components/ui/Toast'
import { useNotifications } from '@/hooks/use-notifications'

// Strategy Validation
import {
  isValidConnection,
  validateStrategy,
  getConnectionErrorMessage,
  type StrategyNodeType,
  type ValidationResult,
} from '@/lib/strategy-validation'

// Strategy Generator
import { AIStrategyGenerator } from './AIStrategyGenerator'

// i18n
import { useI18n } from '@/i18n/client'

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  indicator: IndicatorNode,
  action: ActionNode,
  risk: RiskNode,
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#5E6AD2', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#5E6AD2',
  },
}

// Initial nodes for demo
const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 100, y: 200 },
    data: {
      label: '가격 트리거',
      config: {
        type: 'price_cross',
        symbol: 'BTC/USDT',
        condition: 'cross_above',
        value: 50000,
      },
    },
  },
  {
    id: 'indicator-1',
    type: 'indicator',
    position: { x: 350, y: 100 },
    data: {
      label: 'RSI',
      config: {
        type: 'rsi',
        period: 14,
        source: 'close',
      },
    },
  },
  {
    id: 'condition-1',
    type: 'condition',
    position: { x: 600, y: 200 },
    data: {
      label: '조건 체크',
      config: {
        operator: 'and',
        conditions: [
          { left: 'RSI', operator: '<', right: 30 },
        ],
      },
    },
  },
  {
    id: 'action-1',
    type: 'action',
    position: { x: 850, y: 200 },
    data: {
      label: '매수 주문',
      config: {
        type: 'buy',
        orderType: 'market',
        amount: 100,
        amountType: 'percent',
      },
    },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1', source: 'trigger-1', target: 'condition-1' },
  { id: 'e2', source: 'indicator-1', target: 'condition-1' },
  { id: 'e3', source: 'condition-1', target: 'action-1' },
]

// Inner component that uses ReactFlow hooks
function StrategyBuilderInner() {
  const { t } = useI18n()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showSidebar, setShowSidebar] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true)
  const [strategyName, setStrategyName] = useState(t('dashboard.strategyBuilder.newStrategy') as string)
  const [strategyId, setStrategyId] = useState<string | undefined>(undefined)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)

  // Custom hooks
  const { isSaving, error: saveError, saveStrategy, loadStrategy } = useStrategyPersistence()
  const { canUndo, canRedo, undo, redo, takeSnapshot, clear: clearHistory } = useUndoRedo(initialNodes, initialEdges)
  const toast = useToast()
  const { notify } = useNotifications()

  // ReactFlow instance for zoom controls
  const reactFlowInstance = useReactFlow()

  // Take snapshot on node/edge changes for undo/redo
  useEffect(() => {
    takeSnapshot(nodes, edges)
  }, [nodes, edges, takeSnapshot])

  // Validate strategy when nodes/edges change
  useEffect(() => {
    const result = validateStrategy(nodes, edges)
    setValidationResult(result)
  }, [nodes, edges])

  // Clear connection error after timeout
  useEffect(() => {
    if (connectionError) {
      const timeout = setTimeout(() => setConnectionError(null), 3000)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [connectionError])

  // Connection validation handler
  const onConnect = useCallback(
    (connection: Connection) => {
      const validation = isValidConnection(connection, nodes, edges)

      if (!validation.valid) {
        setConnectionError(validation.reason || (t('dashboard.strategyBuilder.cannotConnect') as string))
        return
      }

      setEdges((eds) => addEdge(connection, eds))
      setConnectionError(null)
    },
    [nodes, edges, setEdges, t]
  )

  // Validate connection before it's created
  const isValidConnectionHandler = useCallback(
    (connection: Connection) => {
      const validation = isValidConnection(connection, nodes, edges)
      return validation.valid
    },
    [nodes, edges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const addNode = useCallback((type: string) => {
    const id = `${type}-${Date.now()}`
    const newNode: Node = {
      id,
      type,
      position: { x: 400, y: 300 },
      data: {
        label: getNodeLabel(type),
        config: getDefaultConfig(type),
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
    setSelectedNode(null)
  }, [selectedNode, setNodes, setEdges])

  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config } }
          : n
      )
    )
  }, [setNodes])

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    try {
      const savedId = await saveStrategy({
        id: strategyId,
        name: strategyName,
        description: `전략 빌더로 생성된 전략`,
        graph: { nodes, edges },
      })

      if (savedId) {
        setStrategyId(savedId)
        setSaveStatus('saved')
        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (err) {
      console.error('Save failed:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [strategyId, strategyName, nodes, edges, saveStrategy])

  // Undo handler
  const handleUndo = useCallback(() => {
    const previousState = undo()
    if (previousState) {
      setNodes(previousState.nodes)
      setEdges(previousState.edges)
    }
  }, [undo, setNodes, setEdges])

  // Redo handler
  const handleRedo = useCallback(() => {
    const nextState = redo()
    if (nextState) {
      setNodes(nextState.nodes)
      setEdges(nextState.edges)
    }
  }, [redo, setNodes, setEdges])

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn()
  }, [reactFlowInstance])

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut()
  }, [reactFlowInstance])

  // Export strategy to JSON file
  const handleExport = useCallback(() => {
    const strategy = {
      name: strategyName,
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }
    const blob = new Blob([JSON.stringify(strategy, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${strategyName.replace(/\s+/g, '_')}_strategy.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [strategyName, nodes, edges])

  // Import strategy from JSON file
  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const strategy = JSON.parse(text)

        if (strategy.nodes && strategy.edges) {
          setNodes(strategy.nodes)
          setEdges(strategy.edges)
          if (strategy.name) setStrategyName(strategy.name)
          clearHistory()
        }
      } catch (err) {
        console.error('Import failed:', err)
      }
    }
    input.click()
  }, [setNodes, setEdges, clearHistory])

  const handleRun = useCallback(() => {
    // Validate before running
    if (!validationResult?.isValid) {
      setShowValidation(true)
      toast.error(
        t('dashboard.strategyBuilder.toast.validationFailed.title') as string,
        t('dashboard.strategyBuilder.toast.validationFailed.message') as string
      )
      return
    }

    const newRunningState = !isRunning
    setIsRunning(newRunningState)

    if (newRunningState) {
      // Strategy started
      toast.success(
        t('dashboard.strategyBuilder.toast.started.title') as string,
        t('dashboard.strategyBuilder.toast.started.message') as string
      )
      // Send strategy signal notification
      notify('strategy_signal', strategyName, t('dashboard.strategyBuilder.toast.started.notification') as string, {
        priority: 'normal',
        actionUrl: '/dashboard/strategies',
      })
    } else {
      // Strategy stopped
      toast.info(
        t('dashboard.strategyBuilder.toast.stopped.title') as string,
        t('dashboard.strategyBuilder.toast.stopped.message') as string
      )
    }
  }, [validationResult, isRunning, strategyName, toast, notify, t])

  // Validate strategy and show results
  const handleValidate = useCallback(() => {
    const result = validateStrategy(nodes, edges)
    setValidationResult(result)
    setShowValidation(true)
  }, [nodes, edges])

  // Handle system-generated strategy application
  const handleAIStrategyApply = useCallback((newNodes: Node[], newEdges: Edge[], name: string) => {
    setNodes(newNodes)
    setEdges(newEdges)
    setStrategyName(name)
    clearHistory()
  }, [setNodes, setEdges, clearHistory])

  const miniMapNodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'trigger':
        return '#F59E0B'
      case 'condition':
        return '#5E6AD2'
      case 'indicator':
        return '#10B981'
      case 'action':
        return '#EF4444'
      case 'risk':
        return '#8B5CF6'
      default:
        return '#6B7280'
    }
  }, [])

  return (
    <div className="h-full flex">
      {/* Node Sidebar */}
      {showSidebar && (
        <NodeSidebar onAddNode={addNode} />
      )}

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          isValidConnection={isValidConnectionHandler}
          fitView
          className="bg-[#0D0D0F]"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#27272a" gap={20} size={1} />
          <Controls
            className="!bg-zinc-900 !border-zinc-800 !rounded-lg overflow-hidden"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={miniMapNodeColor}
            className="!bg-zinc-900 !border-zinc-800 !rounded-lg"
            maskColor="rgba(13, 13, 15, 0.8)"
          />

          {/* Top Toolbar */}
          <Panel position="top-left" className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowSidebar((prev) => !prev)}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
              aria-label={t('dashboard.strategyBuilder.toggleSidebar') as string}
              title={t('dashboard.strategyBuilder.toggleSidebar') as string}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowAIGenerator(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-lg text-purple-400 hover:text-purple-300 transition-colors"
              aria-label={t('dashboard.strategyBuilder.aiGenerate') as string}
              title={t('dashboard.strategyBuilder.aiGenerateTitle') as string}
            >
              <SparklesIcon className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">{t('dashboard.strategyBuilder.aiGenerate') as string}</span>
            </button>
            <div className="px-3 py-1.5 bg-[#0D0D0F] border border-white/[0.06] rounded">
              <label htmlFor="strategy-name" className="sr-only">{t('dashboard.strategyBuilder.strategyName') as string}</label>
              <input
                id="strategy-name"
                type="text"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder={t('dashboard.strategyBuilder.strategyNamePlaceholder') as string}
                className="bg-transparent border-none text-sm text-white focus:outline-none"
                aria-label={t('dashboard.strategyBuilder.strategyName') as string}
              />
            </div>
          </Panel>

          {/* Top Right Actions */}
          <Panel position="top-right" className="flex items-center gap-1 sm:gap-2">
            {/* Validation Status Button */}
            <button
              type="button"
              onClick={handleValidate}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 border rounded-lg text-sm transition-colors ${
                validationResult?.isValid
                  ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400'
                  : validationResult && validationResult.errors.length > 0
                  ? 'bg-red-900/30 border-red-700/50 text-red-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
              aria-label={t('dashboard.strategyBuilder.validate') as string}
              title={t('dashboard.strategyBuilder.validateTitle') as string}
            >
              {validationResult?.isValid ? (
                <CheckCircleIcon className="w-4 h-4" />
              ) : validationResult && validationResult.errors.length > 0 ? (
                <XCircleIcon className="w-4 h-4" />
              ) : (
                <ExclamationTriangleIcon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{validationResult?.errors.length || 0}</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border rounded-lg text-sm transition-colors ${
                saveStatus === 'saved'
                  ? 'bg-emerald-900/50 border-emerald-700 text-emerald-400'
                  : saveStatus === 'error'
                  ? 'bg-red-900/50 border-red-700 text-red-400'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
              aria-label={t('dashboard.strategyBuilder.save') as string}
            >
              {saveStatus === 'saving' ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              ) : saveStatus === 'saved' ? (
                <CheckIcon className="w-4 h-4" />
              ) : saveStatus === 'error' ? (
                <ExclamationCircleIcon className="w-4 h-4" />
              ) : (
                <BookmarkIcon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {saveStatus === 'saving' ? t('dashboard.strategyBuilder.saving') as string : saveStatus === 'saved' ? t('dashboard.strategyBuilder.saved') as string : saveStatus === 'error' ? t('dashboard.strategyBuilder.error') as string : t('dashboard.strategyBuilder.save') as string}
              </span>
            </button>
            <button
              type="button"
              onClick={handleRun}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
              aria-label={isRunning ? t('dashboard.strategyBuilder.pause') as string : t('dashboard.strategyBuilder.run') as string}
            >
              {isRunning ? (
                <>
                  <PauseIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('dashboard.strategyBuilder.pause') as string}</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('dashboard.strategyBuilder.run') as string}</span>
                </>
              )}
            </button>
          </Panel>

          {/* Bottom Toolbar */}
          <Panel position="bottom-center" className="flex items-center gap-2">
            <div className="p-1 bg-[#0D0D0F] border border-white/[0.06] rounded flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className={`p-2 rounded transition-colors ${
                  canUndo
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    : 'text-zinc-400 cursor-not-allowed'
                }`}
                aria-label={t('dashboard.strategyBuilder.undo') as string}
                title={t('dashboard.strategyBuilder.undoTitle') as string}
              >
                <ArrowUturnLeftIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className={`p-2 rounded transition-colors ${
                  canRedo
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    : 'text-zinc-400 cursor-not-allowed'
                }`}
                aria-label={t('dashboard.strategyBuilder.redo') as string}
                title={t('dashboard.strategyBuilder.redoTitle') as string}
              >
                <ArrowUturnRightIcon className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-zinc-700 mx-1" aria-hidden="true" />
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                aria-label={t('dashboard.strategyBuilder.zoomIn') as string}
                title={t('dashboard.strategyBuilder.zoomIn') as string}
              >
                <MagnifyingGlassPlusIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                aria-label={t('dashboard.strategyBuilder.zoomOut') as string}
                title={t('dashboard.strategyBuilder.zoomOut') as string}
              >
                <MagnifyingGlassMinusIcon className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-zinc-700 mx-1" aria-hidden="true" />
              <button
                type="button"
                onClick={handleExport}
                className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                aria-label={t('dashboard.strategyBuilder.export') as string}
                title={t('dashboard.strategyBuilder.exportTitle') as string}
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                aria-label={t('dashboard.strategyBuilder.import') as string}
                title={t('dashboard.strategyBuilder.importTitle') as string}
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Config Panel */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={(config) => updateNodeConfig(selectedNode.id, config)}
          onDelete={deleteSelectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Connection Error Toast */}
      {connectionError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded">
            <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{connectionError}</p>
            <button
              type="button"
              onClick={() => setConnectionError(null)}
              className="p-1 hover:bg-red-500/10 rounded transition-colors"
              aria-label={t('dashboard.strategyBuilder.close') as string}
            >
              <XCircleIcon className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Validation Panel */}
      {showValidation && validationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
            {/* Header */}
            <div className={`px-5 py-4 border-b border-white/[0.06] ${
              validationResult.isValid
                ? 'bg-emerald-500/5'
                : 'bg-red-500/5'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {validationResult.isValid ? (
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-400" />
                  )}
                  <h3 className="text-base font-medium text-white">
                    {validationResult.isValid ? t('dashboard.strategyBuilder.validationPassed') as string : t('dashboard.strategyBuilder.validationFailed') as string}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowValidation(false)}
                  className="p-1.5 hover:bg-white/[0.04] rounded transition-colors"
                  aria-label={t('dashboard.strategyBuilder.close') as string}
                >
                  <XCircleIcon className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-medium text-red-400 mb-2.5 flex items-center gap-2">
                    <XCircleIcon className="w-3.5 h-3.5" />
                    {t('dashboard.strategyBuilder.errors') as string} ({validationResult.errors.length})
                  </h4>
                  <div className="space-y-2">
                    {validationResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="p-3 bg-red-500/5 border border-red-500/10 rounded"
                      >
                        <p className="text-sm text-red-300">{error.message}</p>
                        <p className="text-xs text-red-400/60 mt-1">
                          코드: {error.code}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-amber-400 mb-2.5 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                    {t('dashboard.strategyBuilder.warnings') as string} ({validationResult.warnings.length})
                  </h4>
                  <div className="space-y-2">
                    {validationResult.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className="p-3 bg-amber-500/5 border border-amber-500/10 rounded"
                      >
                        <p className="text-sm text-amber-300">{warning.message}</p>
                        <p className="text-xs text-amber-400/60 mt-1">
                          {t('dashboard.strategyBuilder.code') as string}: {warning.code}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {validationResult.isValid && validationResult.warnings.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircleIcon className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-zinc-300">{t('dashboard.strategyBuilder.validationSuccess') as string}</p>
                  <p className="text-xs text-zinc-400 mt-1">{t('dashboard.strategyBuilder.readyToRun') as string}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/[0.06] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowValidation(false)}
                className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white rounded text-sm transition-colors"
              >
                {t('dashboard.strategyBuilder.close') as string}
              </button>
              {validationResult.isValid && (
                <button
                  type="button"
                  onClick={() => {
                    setShowValidation(false)
                    handleRun()
                  }}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-sm font-medium transition-colors"
                >
                  {t('dashboard.strategyBuilder.runStrategy') as string}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Strategy Generator Modal */}
      <AIStrategyGenerator
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onApply={handleAIStrategyApply}
      />
    </div>
  )
}

// Helper functions
function getNodeLabel(type: string): string {
  const labels: Record<string, string> = {
    trigger: '트리거',
    condition: '조건',
    indicator: '지표',
    action: '액션',
    risk: '리스크',
  }
  return labels[type] || type
}

function getDefaultConfig(type: string): Record<string, unknown> {
  const configs: Record<string, Record<string, unknown>> = {
    trigger: {
      type: 'price_cross',
      symbol: 'BTC/USDT',
      condition: 'cross_above',
      value: 0,
    },
    condition: {
      operator: 'and',
      conditions: [],
    },
    indicator: {
      type: 'sma',
      period: 20,
      source: 'close',
    },
    action: {
      type: 'buy',
      orderType: 'market',
      amount: 100,
      amountType: 'percent',
    },
    risk: {
      stopLoss: 5,
      takeProfit: 10,
      maxDrawdown: 20,
    },
  }
  return configs[type] || {}
}

// Export wrapper component with ReactFlowProvider
export function StrategyBuilder() {
  return (
    <ReactFlowProvider>
      <StrategyBuilderInner />
    </ReactFlowProvider>
  )
}
