/**
 * HEPHAITOS Design Tokens
 *
 * 모든 컬러값은 이 파일에서 관리합니다.
 * 하드코딩 컬러값 사용 금지 - 반드시 이 토큰을 사용하세요.
 */

// ============================================
// Phase Colors (Copy/Learn/Build)
// ============================================
export const PHASE_COLORS = {
  COPY: {
    name: 'COPY',
    // Tailwind classes
    bg: 'bg-amber-500/10',
    bgHover: 'hover:bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
    // For dynamic styles (use sparingly)
    hex: '#F59E0B',
  },
  LEARN: {
    name: 'LEARN',
    bg: 'bg-blue-500/10',
    bgHover: 'hover:bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
    hex: '#3B82F6',
  },
  BUILD: {
    name: 'BUILD',
    bg: 'bg-purple-500/10',
    bgHover: 'hover:bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    dot: 'bg-purple-500',
    hex: '#8B5CF6',
  },
} as const

export type PhaseType = keyof typeof PHASE_COLORS

// ============================================
// Background Colors
// ============================================
export const BG_COLORS = {
  primary: 'bg-[#0D0D0F]',      // Main background
  secondary: 'bg-[#0A0A0A]',    // Section background
  card: 'bg-[#111111]',         // Card background
  cardHover: 'bg-[#141414]',    // Card hover
  elevated: 'bg-[#1A1A1A]',     // Elevated elements
  input: 'bg-zinc-900/50',      // Input fields
} as const

// ============================================
// Border Colors
// ============================================
export const BORDER_COLORS = {
  default: 'border-[#1F1F1F]',
  hover: 'border-[#2E2E2E]',
  subtle: 'border-zinc-800',
  subtleHover: 'border-zinc-700',
} as const

// ============================================
// Text Colors
// ============================================
export const TEXT_COLORS = {
  primary: 'text-white',
  secondary: 'text-[#EDEDED]',
  muted: 'text-[#8F8F8F]',
  subtle: 'text-[#666666]',
  disabled: 'text-zinc-500',
} as const

// ============================================
// Brand Colors
// ============================================
export const BRAND_COLORS = {
  primary: {
    bg: 'bg-[#5E6AD2]',
    bgHover: 'hover:bg-[#6E7AE2]',
    text: 'text-[#5E6AD2]',
    hex: '#5E6AD2',
  },
  profit: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    hex: '#22C55E',
  },
  loss: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    hex: '#EF4444',
  },
} as const

// ============================================
// Semantic Colors
// ============================================
export const SEMANTIC_COLORS = {
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  error: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
} as const

// ============================================
// Workflow Step Colors
// ============================================
export const WORKFLOW_COLORS = {
  input: {
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/30',
    indicator: '→',
  },
  process: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/30',
    indicator: '◇',
  },
  decision: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/30',
    indicator: '?',
  },
  action: {
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/30',
    indicator: '!',
  },
  output: {
    bg: 'bg-cyan-500/5',
    border: 'border-cyan-500/30',
    indicator: '←',
  },
} as const

export type WorkflowStepType = keyof typeof WORKFLOW_COLORS

// ============================================
// Chart Colors (일관된 차트 컬러 팔레트)
// ============================================
export const CHART_COLORS = {
  // Primary brand colors first
  primary: '#5E6AD2',
  secondary: '#7C8AEA',
  // Phase-based colors
  copy: '#F59E0B',    // Amber - COPY phase
  learn: '#3B82F6',   // Blue - LEARN phase
  build: '#8B5CF6',   // Purple - BUILD phase
  // Status colors
  profit: '#22C55E',  // Emerald
  loss: '#EF4444',    // Red
  // Additional palette for multiple series
  palette: [
    '#5E6AD2',  // Primary
    '#F59E0B',  // Amber (COPY)
    '#3B82F6',  // Blue (LEARN)
    '#8B5CF6',  // Purple (BUILD)
    '#22C55E',  // Emerald (Profit)
    '#EC4899',  // Pink (Accent)
  ],
} as const

// ============================================
// Helper Functions
// ============================================

/**
 * Get phase badge classes
 */
export function getPhaseBadgeClasses(phase: PhaseType): string {
  const colors = PHASE_COLORS[phase]
  return `${colors.bg} ${colors.text} ${colors.border} border`
}

/**
 * Get workflow step classes
 */
export function getWorkflowStepClasses(type: WorkflowStepType): string {
  const colors = WORKFLOW_COLORS[type]
  return `${colors.bg} ${colors.border} border`
}
