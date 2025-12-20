'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import { PHASE_COLORS, WORKFLOW_COLORS, BRAND_COLORS, BG_COLORS, type PhaseType, type WorkflowStepType } from '@/constants/design-tokens'

// ============================================
// Trading Agent Workflow Visualization
// Inspired by Claude Solutions Agents Page
// Design tokens applied
// ============================================

interface WorkflowStep {
  id: string
  label: string
  description: string
  type: 'input' | 'process' | 'decision' | 'action' | 'output'
}

interface WorkflowConnection {
  from: string
  to: string
  label?: string
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'input',
    label: 'Natural Language Input',
    description: '"Buy AAPL when RSI < 30 and MACD crosses up"',
    type: 'input',
  },
  {
    id: 'parse',
    label: 'Strategy Parser',
    description: 'AI analyzes intent and extracts trading rules',
    type: 'process',
  },
  {
    id: 'validate',
    label: 'Risk Validation',
    description: 'Check position sizing, stop-loss, portfolio limits',
    type: 'decision',
  },
  {
    id: 'backtest',
    label: 'Backtesting Engine',
    description: '10 years of historical data simulation',
    type: 'process',
  },
  {
    id: 'deploy',
    label: 'Deploy Strategy',
    description: 'Paper trading or live execution',
    type: 'action',
  },
  {
    id: 'monitor',
    label: 'Real-time Monitor',
    description: 'Continuous market analysis and alerts',
    type: 'process',
  },
  {
    id: 'execute',
    label: 'Order Execution',
    description: 'Automated buy/sell through connected broker',
    type: 'action',
  },
  {
    id: 'learn',
    label: 'Self-Learning',
    description: 'Adapt strategy based on performance',
    type: 'output',
  },
]

const CONNECTIONS: WorkflowConnection[] = [
  { from: 'input', to: 'parse' },
  { from: 'parse', to: 'validate' },
  { from: 'validate', to: 'backtest', label: 'valid' },
  { from: 'backtest', to: 'deploy' },
  { from: 'deploy', to: 'monitor' },
  { from: 'monitor', to: 'execute', label: 'signal' },
  { from: 'execute', to: 'learn' },
  { from: 'learn', to: 'monitor', label: 'feedback' },
]

// Agent capabilities in Copy-Learn-Build framework
interface AgentCapability {
  phase: PhaseType
  title: string
  description: string
  features: string[]
}

const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    phase: 'COPY',
    title: 'Portfolio Mirroring Agent',
    description: 'Automatically replicates celebrity investor portfolios in real-time using SEC 13F filings.',
    features: ['Real-time SEC data parsing', 'Auto-rebalancing', 'Position size optimization'],
  },
  {
    phase: 'LEARN',
    title: 'Trading Coach Agent',
    description: 'Personal AI mentor that explains trade logic and improves your decision-making.',
    features: ['Contextual education', 'Trade analysis feedback', 'Risk assessment coaching'],
  },
  {
    phase: 'BUILD',
    title: 'Strategy Builder Agent',
    description: 'Transforms natural language into executable trading strategies with backtesting.',
    features: ['Natural language parsing', 'Strategy validation', '24/7 autonomous execution'],
  },
]

function WorkflowNode({
  step,
  isActive
}: {
  step: WorkflowStep
  isActive: boolean
}) {
  const getTypeStyles = () => {
    switch (step.type) {
      case 'input':
        return 'border-emerald-500/30 bg-emerald-500/5'
      case 'process':
        return 'border-blue-500/30 bg-blue-500/5'
      case 'decision':
        return 'border-amber-500/30 bg-amber-500/5'
      case 'action':
        return 'border-purple-500/30 bg-purple-500/5'
      case 'output':
        return 'border-cyan-500/30 bg-cyan-500/5'
      default:
        return 'border-zinc-700 bg-zinc-900/50'
    }
  }

  const getTypeIndicator = () => {
    switch (step.type) {
      case 'input':
        return '→'
      case 'process':
        return '◇'
      case 'decision':
        return '?'
      case 'action':
        return '!'
      case 'output':
        return '←'
      default:
        return '·'
    }
  }

  return (
    <div
      className={`
        relative p-4 rounded-lg border transition-all
        ${getTypeStyles()}
        ${isActive ? 'ring-1 ring-white/20 scale-[1.02]' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-xs font-mono text-zinc-500 mt-0.5">
          {getTypeIndicator()}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white mb-1">
            {step.label}
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {step.description}
          </p>
        </div>
      </div>
    </div>
  )
}

export const TradingAgentWorkflow = memo(function TradingAgentWorkflow() {
  const [activeStep, setActiveStep] = useState<string | null>(null)

  return (
    <section className={`py-24 ${BG_COLORS.secondary}`}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className={`text-sm ${BRAND_COLORS.primary.text} font-medium mb-3 tracking-wide`}>
            AUTONOMOUS TRADING
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
            Your Personal Trading Agent
            <br />
            <span className="text-zinc-500">Works 24/7 While You Sleep</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            From natural language to automated execution.
            Build once, let the agent handle the rest.
          </p>
        </div>

        {/* Workflow Visualization */}
        <div className="mb-20">
          <div className="relative">
            {/* Flow Line - Horizontal on desktop, vertical on mobile */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-700 to-transparent hidden md:block" />
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-700 to-transparent md:hidden" />

            {/* Workflow Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {WORKFLOW_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`relative ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}
                  onMouseEnter={() => setActiveStep(step.id)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  {/* Connection Dot */}
                  <div className={`
                    absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-700
                    hidden md:block
                    ${index % 2 === 0 ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'}
                  `} />

                  <WorkflowNode
                    step={step}
                    isActive={activeStep === step.id}
                  />

                  {/* Step Number */}
                  <div className={`
                    absolute top-4 text-[10px] font-mono text-zinc-600
                    ${index % 2 === 0 ? 'right-4 md:right-12' : 'right-4 md:left-12'}
                  `}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Loop Indicator */}
          <div className="flex items-center justify-center gap-2 mt-8 text-xs text-zinc-500">
            <span className="w-8 h-px bg-zinc-700" />
            <span>Continuous feedback loop</span>
            <span className="w-8 h-px bg-zinc-700" />
          </div>
        </div>

        {/* Agent Capabilities - Copy/Learn/Build */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AGENT_CAPABILITIES.map((capability) => (
            <div
              key={capability.phase}
              className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-all"
            >
              {/* Phase Badge - using design tokens */}
              <div className={`inline-block px-2 py-0.5 mb-4 rounded text-xs font-medium border ${PHASE_COLORS[capability.phase].bg} ${PHASE_COLORS[capability.phase].text} ${PHASE_COLORS[capability.phase].border}`}>
                {capability.phase}
              </div>

              {/* Title */}
              <h3 className="text-lg font-medium text-white mb-2">
                {capability.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                {capability.description}
              </p>

              {/* Features - using design tokens */}
              <ul className="space-y-2">
                {capability.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-xs text-zinc-500"
                  >
                    <span className={`w-1 h-1 rounded-full ${PHASE_COLORS[capability.phase].dot}`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA - using brand primary color */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard/strategy-builder"
            className={`inline-flex items-center gap-2 px-6 py-3 ${BRAND_COLORS.primary.bg} ${BRAND_COLORS.primary.bgHover} text-white rounded-lg text-sm font-medium transition-colors`}
          >
            <span>Build Your First Agent</span>
            <span className="text-white/60">→</span>
          </Link>
          <p className="text-xs text-zinc-500 mt-4">
            No coding required · Describe in natural language
          </p>
        </div>
      </div>
    </section>
  )
})

TradingAgentWorkflow.displayName = 'TradingAgentWorkflow'

export { TradingAgentWorkflow as default }
