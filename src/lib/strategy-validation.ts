// ============================================
// Strategy Builder Node Validation System
// ============================================

import type { Node, Edge, Connection } from 'reactflow'

// Node type definitions
export type StrategyNodeType = 'trigger' | 'condition' | 'indicator' | 'action' | 'risk'

// Node connection rules
export interface NodeConnectionRule {
  canConnectTo: StrategyNodeType[]
  canReceiveFrom: StrategyNodeType[]
  maxInputs: number
  maxOutputs: number
  isStartNode: boolean
  isEndNode: boolean
}

// Connection rules for each node type
export const NODE_CONNECTION_RULES: Record<StrategyNodeType, NodeConnectionRule> = {
  trigger: {
    canConnectTo: ['condition', 'indicator', 'action', 'risk'],
    canReceiveFrom: [], // Trigger is always the start
    maxInputs: 0,
    maxOutputs: 5,
    isStartNode: true,
    isEndNode: false,
  },
  indicator: {
    canConnectTo: ['condition', 'indicator', 'risk'],
    canReceiveFrom: ['trigger', 'indicator'],
    maxInputs: 3,
    maxOutputs: 5,
    isStartNode: false,
    isEndNode: false,
  },
  condition: {
    canConnectTo: ['action', 'condition', 'risk'],
    canReceiveFrom: ['trigger', 'indicator', 'condition', 'risk'],
    maxInputs: 10,
    maxOutputs: 3,
    isStartNode: false,
    isEndNode: false,
  },
  risk: {
    canConnectTo: ['action', 'condition'],
    canReceiveFrom: ['trigger', 'indicator', 'condition'],
    maxInputs: 3,
    maxOutputs: 3,
    isStartNode: false,
    isEndNode: false,
  },
  action: {
    canConnectTo: [], // Action is always the end
    canReceiveFrom: ['condition', 'risk'],
    maxInputs: 5,
    maxOutputs: 0,
    isStartNode: false,
    isEndNode: true,
  },
}

// Validation result types
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'connection' | 'node' | 'structure'
  code: string
  message: string
  nodeId?: string
  edgeId?: string
}

export interface ValidationWarning {
  type: 'performance' | 'best-practice' | 'suggestion'
  code: string
  message: string
  nodeId?: string
}

/**
 * Validate if a connection between two nodes is allowed
 */
export function isValidConnection(
  connection: Connection,
  nodes: Node[],
  edges: Edge[]
): { valid: boolean; reason?: string } {
  const sourceNode = nodes.find((n) => n.id === connection.source)
  const targetNode = nodes.find((n) => n.id === connection.target)

  if (!sourceNode || !targetNode) {
    return { valid: false, reason: '노드를 찾을 수 없습니다' }
  }

  const sourceType = sourceNode.type as StrategyNodeType
  const targetType = targetNode.type as StrategyNodeType

  // Check if source can connect to target type
  const sourceRules = NODE_CONNECTION_RULES[sourceType]
  if (!sourceRules) {
    return { valid: false, reason: '알 수 없는 소스 노드 유형입니다' }
  }

  if (!sourceRules.canConnectTo.includes(targetType)) {
    return {
      valid: false,
      reason: `${getNodeTypeName(sourceType)}는 ${getNodeTypeName(targetType)}에 연결할 수 없습니다`,
    }
  }

  // Check if target can receive from source type
  const targetRules = NODE_CONNECTION_RULES[targetType]
  if (!targetRules) {
    return { valid: false, reason: '알 수 없는 대상 노드 유형입니다' }
  }

  if (!targetRules.canReceiveFrom.includes(sourceType)) {
    return {
      valid: false,
      reason: `${getNodeTypeName(targetType)}는 ${getNodeTypeName(sourceType)}로부터 연결을 받을 수 없습니다`,
    }
  }

  // Check max outputs from source
  const existingOutputs = edges.filter((e) => e.source === connection.source)
  if (existingOutputs.length >= sourceRules.maxOutputs) {
    return {
      valid: false,
      reason: `${getNodeTypeName(sourceType)}의 최대 출력 연결 수(${sourceRules.maxOutputs})를 초과했습니다`,
    }
  }

  // Check max inputs to target
  const existingInputs = edges.filter((e) => e.target === connection.target)
  if (existingInputs.length >= targetRules.maxInputs) {
    return {
      valid: false,
      reason: `${getNodeTypeName(targetType)}의 최대 입력 연결 수(${targetRules.maxInputs})를 초과했습니다`,
    }
  }

  // Check for duplicate connections
  const isDuplicate = edges.some(
    (e) => e.source === connection.source && e.target === connection.target
  )
  if (isDuplicate) {
    return { valid: false, reason: '이미 연결이 존재합니다' }
  }

  // Check for self-connection
  if (connection.source === connection.target) {
    return { valid: false, reason: '자기 자신에게 연결할 수 없습니다' }
  }

  // Check for circular dependencies (only for condition nodes)
  if (wouldCreateCycle(connection, edges)) {
    return { valid: false, reason: '순환 연결은 허용되지 않습니다' }
  }

  return { valid: true }
}

/**
 * Check if adding a connection would create a cycle
 */
function wouldCreateCycle(connection: Connection, edges: Edge[]): boolean {
  if (!connection.source || !connection.target) return false

  const visited = new Set<string>()
  const stack = [connection.target]

  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === connection.source) {
      return true // Cycle detected
    }

    if (!visited.has(current)) {
      visited.add(current)
      const outgoing = edges.filter((e) => e.source === current)
      for (const edge of outgoing) {
        stack.push(edge.target)
      }
    }
  }

  return false
}

/**
 * Validate the entire strategy graph
 */
export function validateStrategy(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check if strategy has at least one trigger
  const triggers = nodes.filter((n) => n.type === 'trigger')
  if (triggers.length === 0) {
    errors.push({
      type: 'structure',
      code: 'NO_TRIGGER',
      message: '전략에 최소 하나의 트리거 노드가 필요합니다',
    })
  }

  // Check if strategy has at least one action
  const actions = nodes.filter((n) => n.type === 'action')
  if (actions.length === 0) {
    errors.push({
      type: 'structure',
      code: 'NO_ACTION',
      message: '전략에 최소 하나의 액션 노드가 필요합니다',
    })
  }

  // Validate each node
  for (const node of nodes) {
    const nodeType = node.type as StrategyNodeType
    const rules = NODE_CONNECTION_RULES[nodeType]
    if (!rules) continue

    const incomingEdges = edges.filter((e) => e.target === node.id)
    const outgoingEdges = edges.filter((e) => e.source === node.id)

    // Check for disconnected nodes (except triggers which don't need inputs)
    if (!rules.isStartNode && incomingEdges.length === 0) {
      errors.push({
        type: 'node',
        code: 'DISCONNECTED_INPUT',
        message: `${getNodeTypeName(nodeType)} 노드가 입력 연결이 없습니다`,
        nodeId: node.id,
      })
    }

    // Check for dead-end nodes (except actions which don't need outputs)
    if (!rules.isEndNode && outgoingEdges.length === 0) {
      warnings.push({
        type: 'best-practice',
        code: 'NO_OUTPUT',
        message: `${getNodeTypeName(nodeType)} 노드가 출력 연결이 없습니다`,
        nodeId: node.id,
      })
    }

    // Validate node config
    const configValidation = validateNodeConfig(node)
    if (!configValidation.valid) {
      errors.push({
        type: 'node',
        code: 'INVALID_CONFIG',
        message: configValidation.message || '노드 설정이 유효하지 않습니다',
        nodeId: node.id,
      })
    }
  }

  // Validate each edge
  for (const edge of edges) {
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const targetNode = nodes.find((n) => n.id === edge.target)

    if (!sourceNode || !targetNode) {
      errors.push({
        type: 'connection',
        code: 'INVALID_EDGE',
        message: '연결의 소스 또는 대상 노드가 존재하지 않습니다',
        edgeId: edge.id,
      })
      continue
    }

    const sourceType = sourceNode.type as StrategyNodeType
    const targetType = targetNode.type as StrategyNodeType
    const sourceRules = NODE_CONNECTION_RULES[sourceType]

    if (sourceRules && !sourceRules.canConnectTo.includes(targetType)) {
      errors.push({
        type: 'connection',
        code: 'INVALID_CONNECTION_TYPE',
        message: `${getNodeTypeName(sourceType)}는 ${getNodeTypeName(targetType)}에 연결할 수 없습니다`,
        edgeId: edge.id,
      })
    }
  }

  // Check if triggers can reach actions (reachability)
  for (const trigger of triggers) {
    const reachableActions = findReachableNodes(trigger.id, edges, nodes)
      .filter((id) => {
        const n = nodes.find((node) => node.id === id)
        return n?.type === 'action'
      })

    if (reachableActions.length === 0) {
      warnings.push({
        type: 'best-practice',
        code: 'TRIGGER_NO_ACTION',
        message: '트리거에서 도달 가능한 액션 노드가 없습니다',
        nodeId: trigger.id,
      })
    }
  }

  // Performance warnings
  if (nodes.length > 20) {
    warnings.push({
      type: 'performance',
      code: 'TOO_MANY_NODES',
      message: '노드가 너무 많습니다. 성능에 영향을 줄 수 있습니다',
    })
  }

  const indicatorCount = nodes.filter((n) => n.type === 'indicator').length
  if (indicatorCount > 5) {
    warnings.push({
      type: 'performance',
      code: 'TOO_MANY_INDICATORS',
      message: '지표 노드가 많습니다. 실시간 성능에 영향을 줄 수 있습니다',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Find all nodes reachable from a starting node
 */
function findReachableNodes(startId: string, edges: Edge[], nodes: Node[]): string[] {
  const visited = new Set<string>()
  const stack = [startId]

  while (stack.length > 0) {
    const current = stack.pop()!
    if (!visited.has(current)) {
      visited.add(current)
      const outgoing = edges.filter((e) => e.source === current)
      for (const edge of outgoing) {
        stack.push(edge.target)
      }
    }
  }

  return Array.from(visited)
}

/**
 * Validate node configuration
 */
function validateNodeConfig(node: Node): { valid: boolean; message?: string } {
  const config = node.data?.config
  if (!config) {
    return { valid: false, message: '노드 설정이 없습니다' }
  }

  switch (node.type) {
    case 'trigger':
      if (!config.type) {
        return { valid: false, message: '트리거 유형을 선택해주세요' }
      }
      if (config.type === 'price_cross' && !config.symbol) {
        return { valid: false, message: '트리거 심볼을 선택해주세요' }
      }
      break

    case 'indicator':
      if (!config.type) {
        return { valid: false, message: '지표 유형을 선택해주세요' }
      }
      if (typeof config.period === 'number' && config.period <= 0) {
        return { valid: false, message: '지표 기간은 0보다 커야 합니다' }
      }
      break

    case 'condition':
      if (!config.operator) {
        return { valid: false, message: '조건 연산자를 선택해주세요' }
      }
      break

    case 'action':
      if (!config.type) {
        return { valid: false, message: '액션 유형을 선택해주세요' }
      }
      if (config.type === 'buy' || config.type === 'sell') {
        if (!config.orderType) {
          return { valid: false, message: '주문 유형을 선택해주세요' }
        }
        if (typeof config.amount !== 'number' || config.amount <= 0) {
          return { valid: false, message: '주문 수량은 0보다 커야 합니다' }
        }
        if (config.amountType === 'percent' && config.amount > 100) {
          return { valid: false, message: '비율은 100%를 초과할 수 없습니다' }
        }
      }
      break

    case 'risk':
      if (typeof config.stopLoss === 'number' && config.stopLoss < 0) {
        return { valid: false, message: '손절매는 0 이상이어야 합니다' }
      }
      if (typeof config.takeProfit === 'number' && config.takeProfit < 0) {
        return { valid: false, message: '이익실현은 0 이상이어야 합니다' }
      }
      if (typeof config.maxDrawdown === 'number' && config.maxDrawdown < 0) {
        return { valid: false, message: '최대 손실률은 0 이상이어야 합니다' }
      }
      break
  }

  return { valid: true }
}

/**
 * Get Korean name for node type
 */
export function getNodeTypeName(type: StrategyNodeType): string {
  const names: Record<StrategyNodeType, string> = {
    trigger: '트리거',
    indicator: '지표',
    condition: '조건',
    action: '액션',
    risk: '리스크',
  }
  return names[type] || type
}

/**
 * Get connection validation error message for UI toast
 */
export function getConnectionErrorMessage(
  sourceType: StrategyNodeType,
  targetType: StrategyNodeType
): string {
  const sourceName = getNodeTypeName(sourceType)
  const targetName = getNodeTypeName(targetType)

  // Specific error messages
  if (sourceType === 'action') {
    return '액션 노드는 다른 노드에 연결할 수 없습니다 (최종 노드)'
  }
  if (targetType === 'trigger') {
    return '트리거 노드는 입력을 받을 수 없습니다 (시작 노드)'
  }
  if (sourceType === 'indicator' && targetType === 'action') {
    return '지표는 조건 노드를 거쳐야 액션에 연결할 수 있습니다'
  }
  if (sourceType === 'trigger' && targetType === 'action') {
    return '트리거는 조건 노드를 거쳐야 액션에 연결할 수 있습니다'
  }

  return `${sourceName}는 ${targetName}에 연결할 수 없습니다`
}

/**
 * Suggest next nodes that can be connected to a given node
 */
export function getSuggestedConnections(nodeType: StrategyNodeType): StrategyNodeType[] {
  const rules = NODE_CONNECTION_RULES[nodeType]
  if (!rules) return []
  return rules.canConnectTo
}

/**
 * Get nodes that can connect to a given node
 */
export function getValidSourceTypes(nodeType: StrategyNodeType): StrategyNodeType[] {
  const rules = NODE_CONNECTION_RULES[nodeType]
  if (!rules) return []
  return rules.canReceiveFrom
}
