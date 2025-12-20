'use client'


import { useState } from 'react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  celebrityPortfolioManager,
  formatPortfolioChange,
  getUpdateFrequencyText,
  type CelebrityProfile,
  type CelebrityPortfolio,
  type TradeActivity,
} from '@/lib/mirroring/celebrity-portfolio'
import { DisclaimerInline, DisclaimerModal, TradeWarning } from '@/components/ui/Disclaimer'
import { AIAnalysisButton } from '@/components/widgets/AIAnalysisWidget'
import { useI18n } from '@/i18n/client'


type TranslateFunction = (key: string) => string | string[] | Record<string, unknown>

// ============================================
// Icons
// ============================================

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const TrendingDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

// ============================================
// Type Badge Component
// ============================================

function TypeBadge({ type, t }: { type: CelebrityProfile['type']; t: TranslateFunction }) {
  const styles = {
    politician: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    investor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    fund_manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    influencer: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }

  return (
    <span className={clsx('px-2 py-0.5 text-[10px] rounded border', styles[type])}>
      {t(`dashboard.mirroring.types.${type}`) as string}
    </span>
  )
}

// ============================================
// Celebrity Card Component
// ============================================

function CelebrityCard({
  celebrity,
  portfolio,
  isSelected,
  onSelect,
  t,
}: {
  celebrity: CelebrityProfile
  portfolio: CelebrityPortfolio | null
  isSelected: boolean
  onSelect: () => void
  t: TranslateFunction
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'w-full p-4 rounded-lg border text-left transition-all',
        'hover:bg-white/[0.02]',
        isSelected
          ? 'border-white/20 bg-white/[0.04]'
          : 'border-white/[0.06]'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-zinc-400">
          <UserIcon />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-white font-medium truncate">
              {celebrity.nameKr}
            </span>
            <TypeBadge type={celebrity.type} t={t} />
          </div>
          <p className="text-xs text-zinc-400 truncate">
            {celebrity.name}
          </p>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
            {celebrity.description}
          </p>
        </div>

        {/* Performance */}
        {portfolio && (
          <div className="text-right">
            <p className={clsx(
              'text-sm font-medium',
              portfolio.performance.ytd >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {formatPortfolioChange(portfolio.performance.ytd)}
            </p>
            <p className="text-xs text-zinc-400">YTD</p>
          </div>
        )}
      </div>

      {/* Update Info */}
      <div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-400">
        <ClockIcon />
        <span>{getUpdateFrequencyText(celebrity.updateFrequency)}</span>
      </div>
    </button>
  )
}

// ============================================
// Portfolio Detail Component
// ============================================

function PortfolioDetail({
  celebrity,
  portfolio,
  onMirror,
  t,
}: {
  celebrity: CelebrityProfile
  portfolio: CelebrityPortfolio
  onMirror: () => void
  t: TranslateFunction
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center text-zinc-400">
            <UserIcon />
          </div>
          <div>
            <h2 className="text-[16px] text-white font-medium">{celebrity.nameKr}</h2>
            <p className="text-xs text-zinc-400">{celebrity.description}</p>
          </div>
        </div>
        <Button onClick={onMirror} leftIcon={<CopyIcon />}>
          {t('dashboard.mirroring.startMirroring') as string}
        </Button>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.mirroring.performance.ytd') as string}
          value={formatPortfolioChange(portfolio.performance.ytd)}
          positive={portfolio.performance.ytd >= 0}
        />
        <StatCard
          label={t('dashboard.mirroring.performance.oneMonth') as string}
          value={formatPortfolioChange(portfolio.performance.oneMonth)}
          positive={portfolio.performance.oneMonth >= 0}
        />
        <StatCard
          label={t('dashboard.mirroring.performance.threeMonth') as string}
          value={formatPortfolioChange(portfolio.performance.threeMonth)}
          positive={portfolio.performance.threeMonth >= 0}
        />
        <StatCard
          label={t('dashboard.mirroring.performance.oneYear') as string}
          value={formatPortfolioChange(portfolio.performance.oneYear)}
          positive={portfolio.performance.oneYear >= 0}
        />
      </div>

      {/* Risk Metrics */}
      {portfolio.performance.sharpeRatio && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">Sharpe Ratio</p>
            <p className="text-base text-white font-medium">
              {portfolio.performance.sharpeRatio.toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">Max Drawdown</p>
            <p className="text-base text-red-400 font-medium">
              {portfolio.performance.maxDrawdown?.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Holdings */}
      <div>
        <h3 className="text-sm text-white font-medium mb-3 flex items-center gap-2">
          <ChartIcon />
          {t('dashboard.mirroring.holdings') as string}
        </h3>
        <div className="space-y-2">
          {portfolio.holdings.map((holding) => (
            <div
              key={holding.symbol}
              className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white/[0.06] flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {holding.symbol.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-white">{holding.symbol}</p>
                  <p className="text-xs text-zinc-400">{holding.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white">{holding.weight.toFixed(1)}%</p>
                <p className={clsx(
                  'text-xs',
                  holding.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {holding.changePercent >= 0 ? '+' : ''}{holding.changePercent.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="p-3 rounded-lg border border-white/[0.06]">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {positive ? (
          <TrendingUpIcon />
        ) : (
          <TrendingDownIcon />
        )}
        <p className={clsx(
          'text-base font-medium',
          positive ? 'text-emerald-400' : 'text-red-400'
        )}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ============================================
// Recent Trades Component
// ============================================

function RecentTrades({ trades, t }: { trades: TradeActivity[]; t: TranslateFunction }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm text-white font-medium">{t('dashboard.mirroring.recentTrades.title') as string}</h3>
      {trades.length === 0 ? (
        <p className="text-sm text-zinc-400">{t('dashboard.mirroring.recentTrades.empty') as string}</p>
      ) : (
        <div className="space-y-2">
          {trades.map((trade) => {
            const celebrity = celebrityPortfolioManager.getCelebrity(trade.celebrityId)
            return (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-8 h-8 rounded flex items-center justify-center',
                    trade.action === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  )}>
                    {trade.action === 'buy' ? (
                      <TrendingUpIcon />
                    ) : (
                      <TrendingDownIcon />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white">
                      {trade.symbol}
                      <span className="text-zinc-500 ml-2">{trade.name}</span>
                    </p>
                    <p className="text-xs text-zinc-400">
                      {celebrity?.nameKr || 'Unknown'} · {new Date(trade.date).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Analysis Button */}
                  <AIAnalysisButton
                    size="sm"
                    trade={{
                      celebrity: celebrity?.nameKr || 'Unknown',
                      ticker: trade.symbol,
                      company: trade.name,
                      action: trade.action,
                      amount: `$${trade.value.toLocaleString()}`,
                      date: new Date(trade.date).toLocaleDateString('en-US'),
                    }}
                  />
                  <div className="text-right">
                    <p className={clsx(
                      'text-sm font-medium',
                      trade.action === 'buy' ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {trade.action === 'buy' ? t('dashboard.mirroring.buy') as string : t('dashboard.mirroring.sell') as string}
                    </p>
                    <p className="text-xs text-zinc-400">
                      ${trade.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// Mirror Setup Modal Component
// ============================================

function MirrorSetupModal({
  celebrity,
  portfolio,
  onClose,
  onConfirm,
  t,
}: {
  celebrity: CelebrityProfile
  portfolio: CelebrityPortfolio
  onClose: () => void
  onConfirm: (amount: number) => void
  t: TranslateFunction
}) {
  const [amount, setAmount] = useState<string>('1000000')

  const mirrorPortfolio = celebrityPortfolioManager.calculateMirrorPortfolio(
    celebrity.id,
    parseInt(amount) || 0
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{(t('dashboard.mirroring.modal.title') as string).replace('{name}', celebrity.nameKr)}</CardTitle>
          <CardDescription>{t('dashboard.mirroring.modal.description') as string}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount Input */}
          <div>
            <label htmlFor="investmentAmount" className="block text-xs text-zinc-400 mb-1.5">
              {t('dashboard.mirroring.modal.investmentAmount') as string}
            </label>
            <input
              id="investmentAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              title={t('dashboard.mirroring.modal.investmentAmount') as string}
              className="w-full h-10 px-3 text-sm text-white bg-white/[0.04] border border-white/[0.06] rounded focus:outline-none focus:border-white/[0.12]"
              placeholder="1,000,000"
            />
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-2">{t('dashboard.mirroring.modal.expectedPortfolio') as string}</p>
            <div className="space-y-2">
              {mirrorPortfolio.slice(0, 5).map((item) => (
                <div key={item.symbol} className="flex items-center justify-between text-xs">
                  <span className="text-white">{item.symbol}</span>
                  <span className="text-zinc-500">{item.shares} {t('dashboard.mirroring.modal.shares') as string} (₩{item.value.toLocaleString()})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trade Warning */}
          <TradeWarning />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={onClose}>
              {t('dashboard.mirroring.modal.cancel') as string}
            </Button>
            <Button
              fullWidth
              onClick={() => onConfirm(parseInt(amount) || 0)}
              disabled={!amount || parseInt(amount) <= 0}
            >
              {t('dashboard.mirroring.startMirroring') as string}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// Main Page Component
// ============================================

export function MirroringContent() {
  const { t } = useI18n()
  const [selectedCelebrity, setSelectedCelebrity] = useState<string | null>(null)
  const [showMirrorModal, setShowMirrorModal] = useState(false)
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)

  const celebrities = celebrityPortfolioManager.getCelebrities()
  const recentTrades = celebrityPortfolioManager.getAllRecentTrades(5)

  const selectedCelebrityData = selectedCelebrity
    ? celebrityPortfolioManager.getCelebrity(selectedCelebrity)
    : null
  const selectedPortfolio = selectedCelebrity
    ? celebrityPortfolioManager.getPortfolio(selectedCelebrity)
    : null

  const handleMirrorStart = () => {
    if (!disclaimerAccepted) {
      setShowDisclaimerModal(true)
      return
    }
    setShowMirrorModal(true)
  }

  const handleDisclaimerAccept = () => {
    setDisclaimerAccepted(true)
    setShowDisclaimerModal(false)
    setShowMirrorModal(true)
  }

  const handleMirrorConfirm = (amount: number) => {
    console.log('Mirror confirmed:', { celebrity: selectedCelebrity, amount })
    setShowMirrorModal(false)
    // TODO: Implement actual mirror setup with broker integration
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-base font-medium text-white">{t('dashboard.mirroring.title') as string}</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {t('dashboard.mirroring.description') as string}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Celebrity List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm text-zinc-400 font-medium">{t('dashboard.mirroring.investorList') as string}</h2>
          <div className="space-y-3">
            {celebrities.map((celebrity) => {
              const portfolio = celebrityPortfolioManager.getPortfolio(celebrity.id)
              return (
                <CelebrityCard
                  key={celebrity.id}
                  celebrity={celebrity}
                  portfolio={portfolio}
                  isSelected={selectedCelebrity === celebrity.id}
                  onSelect={() => setSelectedCelebrity(celebrity.id)}
                  t={t}
                />
              )
            })}
          </div>
        </div>

        {/* Portfolio Detail */}
        <div className="lg:col-span-2">
          {selectedCelebrityData && selectedPortfolio ? (
            <Card>
              <CardContent className="pt-0">
                <PortfolioDetail
                  celebrity={selectedCelebrityData}
                  portfolio={selectedPortfolio}
                  onMirror={handleMirrorStart}
                  t={t}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-400 mb-4">
                  <UserIcon />
                </div>
                <p className="text-sm text-zinc-400">{t('dashboard.mirroring.selectInvestor') as string}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {t('dashboard.mirroring.selectInvestorDesc') as string}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Recent Trades */}
      <RecentTrades trades={recentTrades} t={t} />

      {/* Disclaimer */}
      <DisclaimerInline className="mt-8" />

      {/* Data Attribution */}
      <div className="text-center">
        <p className="text-[10px] text-zinc-500">
          {t('dashboard.mirroring.dataAttribution') as string}
        </p>
      </div>

      {/* Mirror Setup Modal */}
      {showMirrorModal && selectedCelebrityData && selectedPortfolio && (
        <MirrorSetupModal
          celebrity={selectedCelebrityData}
          portfolio={selectedPortfolio}
          onClose={() => setShowMirrorModal(false)}
          onConfirm={handleMirrorConfirm}
          t={t}
        />
      )}

      {/* Disclaimer Modal (First-time) */}
      <DisclaimerModal
        isOpen={showDisclaimerModal}
        onAccept={handleDisclaimerAccept}
      />
    </div>
  )
}
