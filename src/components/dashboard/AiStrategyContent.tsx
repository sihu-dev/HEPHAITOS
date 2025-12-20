'use client'


import { useState } from 'react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AIGenerationFeedback, type AIGenerationStatus } from '@/components/ui/AIGenerationFeedback'
import { useToast } from '@/components/ui/Toast'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { useI18n } from '@/i18n/client'
import {
  SparklesIcon,
  ChartBarIcon,
  PlayIcon,
  ArrowPathIcon,
  BookmarkIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'


// Translation function type
type TranslateFunction = (key: string) => string | string[] | Record<string, unknown>

// ============================================
// Types
// ============================================

interface StrategyConfig {
  name: string
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  investmentGoal: 'growth' | 'income' | 'balanced' | 'preservation'
  timeHorizon: 'short' | 'medium' | 'long'
  preferredSectors: string[]
  excludedSectors: string[]
  maxPositionSize: number
  stopLossPercent: number
  takeProfitPercent: number
}

interface GeneratedStrategy {
  id: string
  name: string
  description: string
  signals: StrategySignal[]
  backtestResult: BacktestResult
  aiInsights: string
}

interface StrategySignal {
  type: 'entry' | 'exit'
  condition: string
  indicator: string
  value: string
}

interface BacktestResult {
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
}


// ============================================
// Sector Constants
// ============================================

const SECTOR_IDS = ['tech', 'finance', 'healthcare', 'consumer', 'energy', 'industrial', 'materials', 'utilities', 'realestate', 'communication'] as const

// ============================================
// Risk Level Selector
// ============================================

function RiskLevelSelector({
  value,
  onChange,
  t,
}: {
  value: StrategyConfig['riskLevel']
  onChange: (v: StrategyConfig['riskLevel']) => void
  t: TranslateFunction
}) {
  const options: { value: StrategyConfig['riskLevel']; labelKey: string; color: string }[] = [
    { value: 'conservative', labelKey: 'conservative', color: 'emerald' },
    { value: 'moderate', labelKey: 'moderate', color: 'yellow' },
    { value: 'aggressive', labelKey: 'aggressive', color: 'red' },
  ]

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-400">{t('dashboard.aiStrategy.config.riskLevel') as string}</p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              'flex-1 py-2.5 rounded text-sm transition-colors border',
              value === opt.value
                ? opt.color === 'emerald'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : opt.color === 'yellow'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:bg-white/[0.06]'
            )}
          >
            {t(`dashboard.aiStrategy.riskLevels.${opt.labelKey}`) as string}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Investment Goal Selector
// ============================================

function GoalSelector({
  value,
  onChange,
  t,
}: {
  value: StrategyConfig['investmentGoal']
  onChange: (v: StrategyConfig['investmentGoal']) => void
  t: TranslateFunction
}) {
  const goals: StrategyConfig['investmentGoal'][] = ['growth', 'income', 'balanced', 'preservation']

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-400">{t('dashboard.aiStrategy.config.investmentGoal') as string}</p>
      <div className="grid grid-cols-2 gap-2">
        {goals.map((goal) => (
          <button
            key={goal}
            type="button"
            onClick={() => onChange(goal)}
            className={clsx(
              'p-3 rounded text-left transition-colors border',
              value === goal
                ? 'bg-white/[0.08] text-white border-white/20'
                : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:bg-white/[0.06]'
            )}
          >
            <p className="text-sm font-medium">{t(`dashboard.aiStrategy.goals.${goal}.label`) as string}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{t(`dashboard.aiStrategy.goals.${goal}.desc`) as string}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Sector Selector
// ============================================

function SectorSelector({
  selected,
  onChange,
  label,
  t,
}: {
  selected: string[]
  onChange: (sectors: string[]) => void
  label: string
  t: TranslateFunction
}) {
  const toggleSector = (sectorId: string) => {
    if (selected.includes(sectorId)) {
      onChange(selected.filter((s) => s !== sectorId))
    } else {
      onChange([...selected, sectorId])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {SECTOR_IDS.map((sectorId) => (
          <button
            key={sectorId}
            type="button"
            onClick={() => toggleSector(sectorId)}
            className={clsx(
              'px-2.5 py-1 rounded text-xs transition-colors border',
              selected.includes(sectorId)
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-white/[0.04] text-zinc-500 border-white/[0.06] hover:bg-white/[0.06]'
            )}
          >
            {t(`dashboard.aiStrategy.sectors.${sectorId}`) as string}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Generated Strategy Card
// ============================================

function StrategyResultCard({
  strategy,
  onDeploy,
  onRegenerate,
  t,
}: {
  strategy: GeneratedStrategy
  onDeploy: () => void
  onRegenerate: () => void
  t: TranslateFunction
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-orange-400" />
              {strategy.name}
            </CardTitle>
            <CardDescription>{strategy.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onRegenerate} leftIcon={<ArrowPathIcon className="w-4 h-4" />}>
              {t('dashboard.aiStrategy.actions.regenerate') as string}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Backtest Results */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">{t('dashboard.aiStrategy.results.totalReturn') as string}</p>
            <p className={clsx(
              'text-base font-medium',
              strategy.backtestResult.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {strategy.backtestResult.totalReturn >= 0 ? '+' : ''}{strategy.backtestResult.totalReturn}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">{t('dashboard.aiStrategy.results.sharpeRatio') as string}</p>
            <p className="text-base text-white font-medium">
              {strategy.backtestResult.sharpeRatio.toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">{t('dashboard.aiStrategy.results.maxDrawdown') as string}</p>
            <p className="text-base text-red-400 font-medium">
              {strategy.backtestResult.maxDrawdown}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">{t('dashboard.aiStrategy.results.winRate') as string}</p>
            <p className="text-base text-white font-medium">
              {strategy.backtestResult.winRate}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">{t('dashboard.aiStrategy.results.totalTrades') as string}</p>
            <p className="text-base text-white font-medium">
              {strategy.backtestResult.totalTrades}
            </p>
          </div>
        </div>

        {/* Strategy Signals */}
        <div>
          <h4 className="text-xs text-zinc-400 font-medium mb-3">{t('dashboard.aiStrategy.signals.title') as string}</h4>
          <div className="space-y-2">
            {strategy.signals.map((signal, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06]"
              >
                <div className={clsx(
                  'px-2 py-0.5 rounded text-xs',
                  signal.type === 'entry'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                )}>
                  {signal.type === 'entry' ? t('dashboard.aiStrategy.signals.entry') as string : t('dashboard.aiStrategy.signals.exit') as string}
                </div>
                <div className="flex-1">
                  <span className="text-sm text-white">{signal.indicator}</span>
                  <span className="text-sm text-zinc-400 mx-2">{signal.condition}</span>
                  <span className="text-sm text-blue-400">{signal.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Insights */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs text-zinc-400 font-medium">{t('dashboard.aiStrategy.aiInsights') as string}</h4>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {strategy.aiInsights}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth leftIcon={<ChartBarIcon className="w-4 h-4" />}>
            {t('dashboard.aiStrategy.actions.backtestDetail') as string}
          </Button>
          <Button fullWidth onClick={onDeploy} leftIcon={<PlayIcon className="w-4 h-4" />}>
            {t('dashboard.aiStrategy.actions.deploy') as string}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Main Page Component
// ============================================

export function AiStrategyContent() {
  const { t } = useI18n()
  const { success, error: showError } = useToast()
  const [config, setConfig] = useState<StrategyConfig>({
    name: '',
    riskLevel: 'moderate',
    investmentGoal: 'balanced',
    timeHorizon: 'medium',
    preferredSectors: [],
    excludedSectors: [],
    maxPositionSize: 10,
    stopLossPercent: 5,
    takeProfitPercent: 15,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null)
  const [generationStatus, setGenerationStatus] = useState<AIGenerationStatus>('idle')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStage, setGenerationStage] = useState('')

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGeneratedStrategy(null)

    // Stage 1: Preparing
    setGenerationStatus('preparing')
    setGenerationStage(t('dashboard.aiStrategy.generation.stages.preparing') as string)
    setGenerationProgress(0)

    try {
      // Stage 2: Analyzing
      await new Promise((resolve) => setTimeout(resolve, 500))
      setGenerationStatus('analyzing')
      setGenerationStage(t('dashboard.aiStrategy.generation.stages.analyzing') as string)
      setGenerationProgress(25)

      // Stage 3: Generating - Call API
      await new Promise((resolve) => setTimeout(resolve, 300))
      setGenerationStatus('generating')
      setGenerationStage(t('dashboard.aiStrategy.generation.stages.generating') as string)
      setGenerationProgress(50)

      const response = await fetch('/api/ai/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      const result = await response.json()

      // Stage 4: Processing response
      setGenerationStatus('streaming')
      setGenerationStage(t('dashboard.aiStrategy.generation.stages.backtesting') as string)
      setGenerationProgress(75)

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error(t('dashboard.aiStrategy.errors.unauthorized') as string)
        }
        if (response.status === 402) {
          throw new Error(t('dashboard.aiStrategy.errors.insufficientCredits') as string)
        }
        if (response.status === 429) {
          throw new Error(t('dashboard.aiStrategy.errors.rateLimited') as string)
        }
        throw new Error(result.error || t('dashboard.aiStrategy.errors.generic') as string)
      }

      // Complete
      setGenerationProgress(100)
      setGenerationStatus('complete')

      const strategy = result.strategy || result.data?.strategy
      if (strategy) {
        setGeneratedStrategy(strategy)
        success(
          t('dashboard.aiStrategy.toast.success.title') as string,
          result.usedClaude
            ? (t('dashboard.aiStrategy.toast.success.messageClaude') as string)
            : (t('dashboard.aiStrategy.toast.success.message') as string)
        )
      } else {
        throw new Error(t('dashboard.aiStrategy.errors.noStrategy') as string)
      }
    } catch (error) {
      console.error('[AIStrategy] Generation failed:', error)
      setGenerationStatus('error')
      showError(
        t('dashboard.aiStrategy.toast.error.title') as string,
        error instanceof Error ? error.message : (t('dashboard.aiStrategy.errors.generic') as string)
      )
    } finally {
      setIsGenerating(false)
      // Reset status after a delay
      setTimeout(() => {
        setGenerationStatus('idle')
      }, 2000)
    }
  }

  const handleCancel = () => {
    setIsGenerating(false)
    setGenerationStatus('idle')
    setGenerationProgress(0)
    showError(t('dashboard.aiStrategy.toast.cancelled.title') as string, t('dashboard.aiStrategy.toast.cancelled.message') as string)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-base font-medium text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-orange-400" />
          {t('dashboard.aiStrategy.title') as string}
        </h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {t('dashboard.aiStrategy.description') as string}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.aiStrategy.configCard.title') as string}</CardTitle>
            <CardDescription>{t('dashboard.aiStrategy.configCard.description') as string}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label={t('dashboard.aiStrategy.config.strategyName') as string}
              placeholder={t('dashboard.aiStrategy.config.strategyNamePlaceholder') as string}
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />

            <RiskLevelSelector
              value={config.riskLevel}
              onChange={(v) => setConfig({ ...config, riskLevel: v })}
              t={t}
            />

            <GoalSelector
              value={config.investmentGoal}
              onChange={(v) => setConfig({ ...config, investmentGoal: v })}
              t={t}
            />

            {/* Time Horizon */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-400">{t('dashboard.aiStrategy.config.timeHorizon') as string}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                {(['short', 'medium', 'long'] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setConfig({ ...config, timeHorizon: h })}
                    className={clsx(
                      'flex-1 py-2.5 rounded text-sm transition-colors border',
                      config.timeHorizon === h
                        ? 'bg-white/[0.08] text-white border-white/20'
                        : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:bg-white/[0.06]'
                    )}
                  >
                    {t(`dashboard.aiStrategy.timeHorizons.${h}`) as string}
                  </button>
                ))}
              </div>
            </div>

            <SectorSelector
              selected={config.preferredSectors}
              onChange={(sectors) => setConfig({ ...config, preferredSectors: sectors })}
              label={t('dashboard.aiStrategy.config.preferredSectors') as string}
              t={t}
            />

            {/* Risk Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="maxPositionSize" className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.aiStrategy.config.maxPosition') as string}</label>
                <input
                  id="maxPositionSize"
                  type="number"
                  value={config.maxPositionSize}
                  onChange={(e) => setConfig({ ...config, maxPositionSize: parseInt(e.target.value) || 10 })}
                  title={t('dashboard.aiStrategy.config.maxPosition') as string}
                  className="w-full h-9 px-3 text-sm text-white bg-white/[0.04] border border-white/[0.06] rounded focus:outline-none focus:border-white/[0.12]"
                />
              </div>
              <div>
                <label htmlFor="stopLossPercent" className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.aiStrategy.config.stopLoss') as string}</label>
                <input
                  id="stopLossPercent"
                  type="number"
                  value={config.stopLossPercent}
                  onChange={(e) => setConfig({ ...config, stopLossPercent: parseInt(e.target.value) || 5 })}
                  title={t('dashboard.aiStrategy.config.stopLoss') as string}
                  className="w-full h-9 px-3 text-sm text-white bg-white/[0.04] border border-white/[0.06] rounded focus:outline-none focus:border-white/[0.12]"
                />
              </div>
              <div>
                <label htmlFor="takeProfitPercent" className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.aiStrategy.config.takeProfit') as string}</label>
                <input
                  id="takeProfitPercent"
                  type="number"
                  value={config.takeProfitPercent}
                  onChange={(e) => setConfig({ ...config, takeProfitPercent: parseInt(e.target.value) || 15 })}
                  title={t('dashboard.aiStrategy.config.takeProfit') as string}
                  className="w-full h-9 px-3 text-sm text-white bg-white/[0.04] border border-white/[0.06] rounded focus:outline-none focus:border-white/[0.12]"
                />
              </div>
            </div>

            <Button
              fullWidth
              onClick={handleGenerate}
              isLoading={isGenerating}
              leftIcon={<SparklesIcon className="w-4 h-4" />}
            >
              {t('dashboard.aiStrategy.actions.generate') as string}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Strategy Result */}
        <div>
          {isGenerating ? (
            <Card className="h-full min-h-[500px] flex items-center justify-center">
              <AIGenerationFeedback
                status={generationStatus}
                progress={generationProgress}
                stage={generationStage}
                onCancel={handleCancel}
              />
            </Card>
          ) : generatedStrategy ? (
            <StrategyResultCard
              strategy={generatedStrategy}
              onDeploy={() => {
                success(t('dashboard.aiStrategy.toast.deployed.title') as string, t('dashboard.aiStrategy.toast.deployed.message') as string)
              }}
              onRegenerate={handleGenerate}
              t={t}
            />
          ) : (
            <Card className="h-full min-h-[500px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-orange-500/10 to-purple-500/10 flex items-center justify-center mb-4">
                  <SparklesIcon className="w-8 h-8 text-orange-400/60" />
                </div>
                <p className="text-sm text-zinc-400">{t('dashboard.aiStrategy.emptyState.title') as string}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {t('dashboard.aiStrategy.emptyState.description') as string}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Strategies */}
      <div className="h-px bg-white/[0.06]" />

      <div>
        <h2 className="text-sm text-zinc-400 font-medium mb-4">{t('dashboard.aiStrategy.recentStrategies.title') as string}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { nameKey: 'momentumSwing', return: '+32.5%', trades: 45 },
            { nameKey: 'dividendGrowth', return: '+18.2%', trades: 12 },
            { nameKey: 'techFocus', return: '+48.7%', trades: 67 },
          ].map((s, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-white/[0.06] hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white font-medium">{t(`dashboard.aiStrategy.recentStrategies.items.${s.nameKey}`) as string}</span>
                <span className="text-sm text-emerald-400">{s.return}</span>
              </div>
              <p className="text-xs text-zinc-400">
                {(t('dashboard.aiStrategy.recentStrategies.tradesCount') as string).replace('{count}', String(s.trades))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 면책조항 */}
      <DisclaimerInline className="mt-4" />
    </div>
  )
}
