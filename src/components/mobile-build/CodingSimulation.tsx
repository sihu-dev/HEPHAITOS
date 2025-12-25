'use client'

import { useEffect, useState, useCallback } from 'react'
import { CHART_COLORS } from "@/constants/design-tokens"
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'

// ============================================
// 노드 기반 개발 과정 시각화
// ReactFlow 캔버스로 전략 빌딩 단계 표시
// ============================================

interface CodingSimulationProps {
  isActive: boolean
  progress: number
  userPrompt: string
}

// 전략 빌딩 단계별 노드 정의
const STRATEGY_NODES = [
  {
    id: 'start',
    type: 'input',
    label: '📝 자연어 입력',
    description: '사용자 전략 요청',
    position: { x: 50, y: 50 },
    color: CHART_COLORS.primary,
  },
  {
    id: 'analyze',
    type: 'default',
    label: '⚙️ 알고리즘 설계',
    description: '자연어 → 퀀트 로직 변환',
    position: { x: 50, y: 150 },
    color: '#3B82F6',
  },
  {
    id: 'indicators',
    type: 'default',
    label: '📊 기술 지표',
    description: 'RSI, MACD, Bollinger Bands',
    position: { x: 250, y: 150 },
    color: '#10B981',
  },
  {
    id: 'entry-exit',
    type: 'default',
    label: '🎯 진입/청산',
    description: '매수/매도 조건 로직',
    position: { x: 450, y: 150 },
    color: '#F59E0B',
  },
  {
    id: 'risk',
    type: 'default',
    label: '🛡️ 리스크 관리',
    description: '손절/익절, 포지션 사이징',
    position: { x: 250, y: 270 },
    color: '#EF4444',
  },
  {
    id: 'backtest',
    type: 'default',
    label: '⚡ 백테스팅',
    description: '과거 데이터 검증',
    position: { x: 50, y: 270 },
    color: '#8B5CF6',
  },
  {
    id: 'result',
    type: 'output',
    label: '✅ 전략 완성',
    description: 'Sharpe 1.45 | 승률 67%',
    position: { x: 250, y: 390 },
    color: '#059669',
  },
]

// 노드 간 연결 (엣지)
const STRATEGY_EDGES = [
  { id: 'e1', source: 'start', target: 'analyze', animated: true },
  { id: 'e2', source: 'analyze', target: 'indicators', animated: true },
  { id: 'e3', source: 'indicators', target: 'entry-exit', animated: true },
  { id: 'e4', source: 'entry-exit', target: 'risk', animated: true },
  { id: 'e5', source: 'risk', target: 'backtest', animated: true },
  { id: 'e6', source: 'backtest', target: 'result', animated: true },
]

export function CodingSimulation({ isActive, progress, userPrompt }: CodingSimulationProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [activeNodeIndex, setActiveNodeIndex] = useState(-1)

  // 진행률에 따라 노드/엣지 순차 추가
  useEffect(() => {
    if (!isActive) {
      // 초기화
      setNodes([])
      setEdges([])
      setActiveNodeIndex(-1)
      return
    }

    // 진행률 기반 활성 노드 계산 (0-100% → 0-7 nodes)
    const nodeIndex = Math.floor((progress / 100) * STRATEGY_NODES.length)
    setActiveNodeIndex(nodeIndex)

    // 노드 생성 (순차적으로 표시)
    const visibleNodes: Node[] = STRATEGY_NODES.slice(0, nodeIndex + 1).map((node, idx) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        label: (
          <div className="p-3 min-w-[140px]">
            <div className="text-sm font-semibold mb-1">{node.label}</div>
            <div className="text-xs text-zinc-400">{node.description}</div>
            {idx === nodeIndex && isActive && progress < 100 && (
              <div className="mt-2">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"
                    style={{ width: `${((progress % (100 / STRATEGY_NODES.length)) / (100 / STRATEGY_NODES.length)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ),
      },
      style: {
        background: idx === nodeIndex ? node.color : '#1F2937',
        border: `2px solid ${idx === nodeIndex ? node.color : '#374151'}`,
        borderRadius: '12px',
        color: '#fff',
        fontSize: '12px',
        padding: 0,
        boxShadow: idx === nodeIndex ? `0 0 20px ${node.color}80` : 'none',
        transition: 'all 0.3s ease',
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }))

    setNodes(visibleNodes)

    // 엣지 생성 (노드보다 1개 적게)
    const visibleEdges: Edge[] = STRATEGY_EDGES.slice(0, Math.max(0, nodeIndex)).map((edge, idx) => ({
      ...edge,
      animated: idx === nodeIndex - 1,
      style: {
        stroke: idx === nodeIndex - 1 ? CHART_COLORS.primary : '#374151',
        strokeWidth: idx === nodeIndex - 1 ? 3 : 2,
      },
    }))

    setEdges(visibleEdges)
  }, [isActive, progress, setNodes, setEdges])

  // 완료 시 사용자 프롬프트를 start 노드에 반영
  useEffect(() => {
    if (progress === 100 && userPrompt && nodes.length > 0) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === 'start') {
            return {
              ...node,
              data: {
                label: (
                  <div className="p-3 min-w-[140px]">
                    <div className="text-sm font-semibold mb-1">📝 자연어 입력</div>
                    <div className="text-xs text-zinc-400 italic">"{userPrompt.substring(0, 30)}..."</div>
                  </div>
                ),
              },
            }
          }
          return node
        })
      )
    }
  }, [progress, userPrompt, nodes.length, setNodes])

  if (!isActive && !userPrompt) {
    return (
      <div className="h-full flex items-center justify-center bg-background-primary">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            전략을 선택해주세요
          </h3>
          <p className="text-sm text-zinc-400">
            왼쪽 라이브러리에서 전략 선택 시
            <br />
            3중 검증 엔진이 자동 실행됩니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background-primary relative">
      {/* ReactFlow 캔버스 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={16} />
      </ReactFlow>

      {/* 진행 상태 오버레이 */}
      {isActive && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="p-4 bg-[#111113]/90 backdrop-blur-lg border border-white/[0.06] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <h3 className="text-sm font-semibold text-white">
                  알고리즘 구축 중... ({progress}%)
                </h3>
              </div>
              <span className="text-xs text-zinc-400">
                {activeNodeIndex + 1}/{STRATEGY_NODES.length} 단계
              </span>
            </div>
            {activeNodeIndex >= 0 && activeNodeIndex < STRATEGY_NODES.length && (
              <p className="text-xs text-zinc-400">
                {STRATEGY_NODES[activeNodeIndex].label} - {STRATEGY_NODES[activeNodeIndex].description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 완료 알림 */}
      {progress === 100 && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="p-4 bg-emerald-500/20 backdrop-blur-lg border border-emerald-500/40 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h3 className="text-sm font-semibold text-emerald-400">알고리즘 구축 완료!</h3>
                <p className="text-xs text-zinc-400">
                  오른쪽 패널에서 퀀트 분석 리포트를 확인하세요
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 범례 */}
      {nodes.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 p-3 bg-[#111113]/90 backdrop-blur-lg border border-white/[0.06] rounded-xl">
          <p className="text-xs text-zinc-400 mb-2">노드 색상:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-zinc-400">현재 진행 중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#374151]" />
              <span className="text-xs text-zinc-400">대기 중</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
