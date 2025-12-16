'use client'

import { useState } from 'react'
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useExchangeStore } from '@/stores/exchange-store'
import { availableExchanges } from '@/lib/exchange'
import { useI18n } from '@/i18n/client'
import type { ExchangeId } from '@/types'

interface ExchangeFormData {
  exchangeId: ExchangeId
  apiKey: string
  secretKey: string
}

export function ExchangeSettings() {
  const { t } = useI18n()
  const { connections, addConnection, removeConnection, updateConnectionStatus } = useExchangeStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<ExchangeFormData>({
    exchangeId: 'binance',
    apiKey: '',
    secretKey: '',
  })
  const [isValidating, setIsValidating] = useState<ExchangeId | null>(null)

  const handleAddConnection = async () => {
    if (!formData.apiKey || !formData.secretKey) return

    addConnection({
      exchangeId: formData.exchangeId,
      apiKey: formData.apiKey,
      secretKey: formData.secretKey,
    })

    setFormData({ exchangeId: 'binance', apiKey: '', secretKey: '' })
    setShowAddForm(false)

    await validateConnection(formData.exchangeId)
  }

  const validateConnection = async (exchangeId: ExchangeId) => {
    setIsValidating(exchangeId)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      updateConnectionStatus(exchangeId, true, ['read', 'trade'])
    } catch {
      updateConnectionStatus(exchangeId, false)
    } finally {
      setIsValidating(null)
    }
  }

  const getExchangeIcon = (exchangeId: ExchangeId) => {
    switch (exchangeId) {
      case 'binance':
        return (
          <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center">
            <span className="text-amber-500 font-medium text-sm">B</span>
          </div>
        )
      case 'upbit':
        return (
          <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
            <span className="text-blue-500 font-medium text-sm">U</span>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded bg-white/[0.06] flex items-center justify-center">
            <span className="text-zinc-400 font-medium text-sm">{exchangeId[0].toUpperCase()}</span>
          </div>
        )
    }
  }

  const getExchangeDocsUrl = (exchangeId: ExchangeId) => {
    switch (exchangeId) {
      case 'binance':
        return 'https://www.binance.com/en/my/settings/api-management'
      case 'upbit':
        return 'https://upbit.com/mypage/open_api_management'
      default:
        return '#'
    }
  }

  return (
    <div className="border border-white/[0.06] rounded-lg p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-medium text-white">{t('dashboard.settings.exchange.title') as string}</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            {t('dashboard.settings.exchange.subtitle') as string}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded text-sm transition-colors w-full sm:w-auto"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          {t('dashboard.settings.exchange.connect') as string}
        </button>
      </div>

      {/* Warning Banner */}
      <div className="mb-5 p-3 bg-amber-500/5 border border-amber-500/10 rounded">
        <div className="flex items-start gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-400">{t('dashboard.settings.exchange.securityWarning') as string}</p>
            <p className="text-xs text-amber-400/60 mt-0.5">
              {t('dashboard.settings.exchange.securityWarningText') as string}
            </p>
          </div>
        </div>
      </div>

      {/* Connected Exchanges */}
      <div className="space-y-2">
        {connections.length === 0 && !showAddForm ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 mx-auto mb-3 rounded bg-white/[0.04] flex items-center justify-center">
              <PlusIcon className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-400">{t('dashboard.settings.exchange.notConnected') as string}</p>
          </div>
        ) : (
          connections.map((connection) => (
            <div
              key={connection.exchangeId}
              className="p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded border border-white/[0.06] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getExchangeIcon(connection.exchangeId)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm text-white capitalize">
                        {availableExchanges.find(e => e.id === connection.exchangeId)?.name}
                      </h3>
                      {connection.isConnected ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircleIcon className="w-3 h-3" />
                          {t('dashboard.settings.exchange.connected') as string}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <XCircleIcon className="w-3 h-3" />
                          {t('dashboard.settings.exchange.notConnected') as string}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-zinc-400">{t('dashboard.settings.exchange.apiKey') as string}:</span>
                      <code className="text-xs text-zinc-400 font-mono">
                        {connection.apiKey.slice(0, 8)}...{connection.apiKey.slice(-4)}
                      </code>
                    </div>
                    {connection.permissions.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        {connection.permissions.map(perm => (
                          <span
                            key={perm}
                            className="px-1.5 py-0.5 bg-white/[0.04] text-zinc-500 text-[10px] rounded"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => validateConnection(connection.exchangeId)}
                    disabled={isValidating === connection.exchangeId}
                    title={t('dashboard.settings.exchange.testConnection') as string}
                    className="p-1.5 hover:bg-white/[0.06] rounded transition-colors text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
                  >
                    <ArrowPathIcon className={`w-3.5 h-3.5 ${isValidating === connection.exchangeId ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeConnection(connection.exchangeId)}
                    title={t('dashboard.settings.exchange.delete') as string}
                    className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-zinc-500 hover:text-red-400"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Exchange Form */}
      {showAddForm && (
        <div className="mt-3 p-4 bg-white/[0.02] rounded border border-white/[0.06]">
          <h3 className="text-sm font-medium text-white mb-4">{t('dashboard.settings.exchange.connect') as string}</h3>

          <div className="space-y-3">
            {/* Exchange Select */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.settings.tabs.exchange') as string}</label>
              <select
                value={formData.exchangeId}
                onChange={(e) => setFormData({ ...formData, exchangeId: e.target.value as ExchangeId })}
                aria-label={t('dashboard.settings.tabs.exchange') as string}
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
              >
                {availableExchanges
                  .filter(e => e.enabled)
                  .map(exchange => (
                    <option key={exchange.id} value={exchange.id}>
                      {exchange.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.settings.exchange.apiKey') as string}</label>
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder={t('dashboard.settings.exchange.apiKeyPlaceholder') as string}
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/[0.12] transition-colors"
              />
            </div>

            {/* Secret Key */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.settings.exchange.apiSecret') as string}</label>
              <div className="relative">
                <input
                  type={showSecret['new'] ? 'text' : 'password'}
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  placeholder={t('dashboard.settings.exchange.apiSecretPlaceholder') as string}
                  className="w-full h-9 px-3 pr-9 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/[0.12] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret({ ...showSecret, new: !showSecret['new'] })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showSecret['new'] ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Help Link */}
            <a
              href={getExchangeDocsUrl(formData.exchangeId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {t('dashboard.settings.exchange.learnApiKeys') as string}
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </a>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({ exchangeId: 'binance', apiKey: '', secretKey: '' })
                }}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {t('dashboard.settings.exchange.cancel') as string}
              </button>
              <button
                type="button"
                onClick={handleAddConnection}
                disabled={!formData.apiKey || !formData.secretKey}
                className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] disabled:bg-white/[0.04] disabled:text-zinc-400 text-white rounded text-sm transition-colors"
              >
                {t('dashboard.settings.exchange.connect') as string}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
