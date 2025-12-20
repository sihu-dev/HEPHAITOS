'use client'

import { XMarkIcon, TrashIcon, DocumentDuplicateIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import type { Node } from 'reactflow'
import { useI18n } from '@/i18n/client'

type TranslateFunction = (key: string) => string | string[] | Record<string, unknown>

interface NodeConfigPanelProps {
  node: Node
  onUpdate: (config: Record<string, unknown>) => void
  onDelete: () => void
  onClose: () => void
}

export function NodeConfigPanel({ node, onUpdate, onDelete, onClose }: NodeConfigPanelProps) {
  const { t } = useI18n()
  const config = node.data?.config || {}

  const handleChange = (key: string, value: unknown) => {
    onUpdate({ ...config, [key]: value })
  }

  const renderConfigFields = () => {
    switch (node.type) {
      case 'trigger':
        return <TriggerConfig config={config} onChange={handleChange} t={t} />
      case 'condition':
        return <ConditionConfig config={config} onChange={handleChange} t={t} />
      case 'indicator':
        return <IndicatorConfig config={config} onChange={handleChange} t={t} />
      case 'action':
        return <ActionConfig config={config} onChange={handleChange} t={t} />
      case 'risk':
        return <RiskConfig config={config} onChange={handleChange} t={t} />
      default:
        return <p className="text-sm text-zinc-400">{t('dashboard.nodeConfig.noSettings') as string}</p>
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-72 sm:relative bg-background-primary border-l border-white/[0.06] overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cog6ToothIcon className="w-3.5 h-3.5 text-zinc-500" />
          <h2 className="text-sm font-medium text-white">{t('dashboard.nodeConfig.title') as string}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-white/[0.06] rounded transition-colors"
          aria-label={t('dashboard.nodeConfig.close') as string}
        >
          <XMarkIcon className="w-3.5 h-3.5 text-zinc-500" />
        </button>
      </div>

      {/* Node Info */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded flex items-center justify-center ${
              getNodeTypeColor(node.type || 'default')
            }`}
          >
            <span className="text-white font-medium text-xs">
              {(node.type || 'N')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm text-white">{node.data?.label || t('dashboard.nodeConfig.node') as string}</p>
            <p className="text-xs text-zinc-400">ID: {node.id}</p>
          </div>
        </div>
      </div>

      {/* Config Fields */}
      <div className="px-4 py-3 space-y-3">
        {renderConfigFields()}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-white/[0.06] space-y-2">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-1.5 h-8 bg-white/[0.04] hover:bg-white/[0.08] rounded text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <DocumentDuplicateIcon className="w-3.5 h-3.5" />
          {t('dashboard.nodeConfig.duplicate') as string}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-1.5 h-8 bg-red-500/10 hover:bg-red-500/15 rounded text-sm text-red-400 transition-colors"
        >
          <TrashIcon className="w-3.5 h-3.5" />
          {t('dashboard.nodeConfig.delete') as string}
        </button>
      </div>
    </div>
  )
}

// Config Components
function TriggerConfig({
  config,
  onChange,
  t,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  t: TranslateFunction
}) {
  return (
    <>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.trigger.type') as string}</label>
        <select
          value={(config.type as string) || 'price_cross'}
          onChange={(e) => onChange('type', e.target.value)}
          aria-label={t('dashboard.nodeConfig.trigger.type') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        >
          <option value="price_cross">{t('dashboard.nodeConfig.trigger.priceCross') as string}</option>
          <option value="price_above">{t('dashboard.nodeConfig.trigger.priceAbove') as string}</option>
          <option value="price_below">{t('dashboard.nodeConfig.trigger.priceBelow') as string}</option>
          <option value="time">{t('dashboard.nodeConfig.trigger.timeBased') as string}</option>
          <option value="volume">{t('dashboard.nodeConfig.trigger.volumeBased') as string}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.trigger.symbol') as string}</label>
        <input
          type="text"
          value={(config.symbol as string) || ''}
          onChange={(e) => onChange('symbol', e.target.value)}
          placeholder="BTC/USDT"
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/[0.12] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.trigger.conditionValue') as string}</label>
        <input
          type="number"
          value={(config.value as number) || 0}
          onChange={(e) => onChange('value', parseFloat(e.target.value))}
          aria-label={t('dashboard.nodeConfig.trigger.conditionValue') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        />
      </div>
    </>
  )
}

function ConditionConfig({
  config,
  onChange,
  t,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  t: TranslateFunction
}) {
  return (
    <>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.condition.operator') as string}</label>
        <select
          value={(config.operator as string) || 'and'}
          onChange={(e) => onChange('operator', e.target.value)}
          aria-label={t('dashboard.nodeConfig.condition.operator') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        >
          <option value="and">{t('dashboard.nodeConfig.condition.and') as string}</option>
          <option value="or">{t('dashboard.nodeConfig.condition.or') as string}</option>
        </select>
      </div>
      <div className="p-3 bg-white/[0.02] rounded border border-white/[0.06]">
        <p className="text-xs text-zinc-400">
          {t('dashboard.nodeConfig.condition.description') as string}
        </p>
      </div>
    </>
  )
}

function IndicatorConfig({
  config,
  onChange,
  t,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  t: TranslateFunction
}) {
  return (
    <>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.indicator.type') as string}</label>
        <select
          value={(config.type as string) || 'sma'}
          onChange={(e) => onChange('type', e.target.value)}
          aria-label={t('dashboard.nodeConfig.indicator.type') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        >
          <option value="sma">{t('dashboard.nodeConfig.indicator.sma') as string}</option>
          <option value="ema">{t('dashboard.nodeConfig.indicator.ema') as string}</option>
          <option value="rsi">{t('dashboard.nodeConfig.indicator.rsi') as string}</option>
          <option value="macd">MACD</option>
          <option value="bollinger">{t('dashboard.nodeConfig.indicator.bollinger') as string}</option>
          <option value="atr">{t('dashboard.nodeConfig.indicator.atr') as string}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.indicator.period') as string}</label>
        <input
          type="number"
          value={(config.period as number) || 14}
          onChange={(e) => onChange('period', parseInt(e.target.value))}
          min={1}
          max={200}
          aria-label={t('dashboard.nodeConfig.indicator.period') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.indicator.source') as string}</label>
        <select
          value={(config.source as string) || 'close'}
          onChange={(e) => onChange('source', e.target.value)}
          aria-label={t('dashboard.nodeConfig.indicator.source') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        >
          <option value="close">{t('dashboard.nodeConfig.indicator.close') as string}</option>
          <option value="open">{t('dashboard.nodeConfig.indicator.open') as string}</option>
          <option value="high">{t('dashboard.nodeConfig.indicator.high') as string}</option>
          <option value="low">{t('dashboard.nodeConfig.indicator.low') as string}</option>
          <option value="hl2">(H+L)/2</option>
          <option value="hlc3">(H+L+C)/3</option>
          <option value="ohlc4">(O+H+L+C)/4</option>
        </select>
      </div>
    </>
  )
}

function ActionConfig({
  config,
  onChange,
  t,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  t: TranslateFunction
}) {
  return (
    <>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.action.type') as string}</label>
        <select
          value={(config.type as string) || 'buy'}
          onChange={(e) => onChange('type', e.target.value)}
          aria-label={t('dashboard.nodeConfig.action.type') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        >
          <option value="buy">{t('dashboard.nodeConfig.action.buy') as string}</option>
          <option value="sell">{t('dashboard.nodeConfig.action.sell') as string}</option>
          <option value="close">{t('dashboard.nodeConfig.action.closePosition') as string}</option>
          <option value="alert">{t('dashboard.nodeConfig.action.sendAlert') as string}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.action.orderType') as string}</label>
        <select
          value={(config.orderType as string) || 'market'}
          onChange={(e) => onChange('orderType', e.target.value)}
          aria-label={t('dashboard.nodeConfig.action.orderType') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        >
          <option value="market">{t('dashboard.nodeConfig.action.market') as string}</option>
          <option value="limit">{t('dashboard.nodeConfig.action.limit') as string}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.action.quantity') as string}</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={(config.amount as number) || 100}
            onChange={(e) => onChange('amount', parseFloat(e.target.value))}
            aria-label={t('dashboard.nodeConfig.action.quantity') as string}
            className="flex-1 h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
          />
          <select
            value={(config.amountType as string) || 'percent'}
            onChange={(e) => onChange('amountType', e.target.value)}
            aria-label={t('dashboard.nodeConfig.action.quantityUnit') as string}
            className="w-20 h-9 px-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
          >
            <option value="percent">%</option>
            <option value="fixed">{t('dashboard.nodeConfig.action.fixed') as string}</option>
          </select>
        </div>
      </div>
    </>
  )
}

function RiskConfig({
  config,
  onChange,
  t,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  t: TranslateFunction
}) {
  return (
    <>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.risk.stopLoss') as string}</label>
        <input
          type="number"
          value={(config.stopLoss as number) || 5}
          onChange={(e) => onChange('stopLoss', parseFloat(e.target.value))}
          min={0}
          max={100}
          step={0.1}
          aria-label={t('dashboard.nodeConfig.risk.stopLossRatio') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.risk.takeProfit') as string}</label>
        <input
          type="number"
          value={(config.takeProfit as number) || 10}
          onChange={(e) => onChange('takeProfit', parseFloat(e.target.value))}
          min={0}
          max={1000}
          step={0.1}
          aria-label={t('dashboard.nodeConfig.risk.takeProfitRatio') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.nodeConfig.risk.maxDrawdown') as string}</label>
        <input
          type="number"
          value={(config.maxDrawdown as number) || 20}
          onChange={(e) => onChange('maxDrawdown', parseFloat(e.target.value))}
          min={0}
          max={100}
          step={0.1}
          aria-label={t('dashboard.nodeConfig.risk.maxDrawdownRatio') as string}
          className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
        />
      </div>
      <div className="p-2.5 bg-amber-500/5 rounded border border-amber-500/10">
        <p className="text-xs text-amber-400/80">
          {t('dashboard.nodeConfig.risk.warning') as string}
        </p>
      </div>
    </>
  )
}

// Helper function
function getNodeTypeColor(type: string): string {
  const colors: Record<string, string> = {
    trigger: 'bg-amber-500/20',
    condition: 'bg-zinc-500/20',
    indicator: 'bg-emerald-500/20',
    action: 'bg-red-500/20',
    risk: 'bg-[#8B5CF6]/20',
    default: 'bg-white/[0.06]',
  }
  return colors[type] ?? colors.default
}
