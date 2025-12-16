'use client'

import dynamicImport from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowRightIcon,
  UsersIcon,
  AcademicCapIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { useI18n } from '@/i18n/client'

export const dynamic = 'force-dynamic'

// ============================================
// Pain Point 기반 대시보드
// "다음에 뭘 해야 할지" 명확히 안내
// COPY → LEARN → BUILD 여정 가이드
// ============================================

const PortfolioOverview = dynamicImport(
  () => import('@/components/dashboard/PortfolioOverview').then(m => m.PortfolioOverview),
  { ssr: false }
)
const ActiveStrategies = dynamicImport(
  () => import('@/components/dashboard/ActiveStrategies').then(m => m.ActiveStrategies),
  { ssr: false }
)
const QuickActions = dynamicImport(
  () => import('@/components/dashboard/QuickActions').then(m => m.QuickActions),
  { ssr: false }
)
const MarketOverview = dynamicImport(
  () => import('@/components/dashboard/MarketOverview').then(m => m.MarketOverview),
  { ssr: false }
)
const RecentTrades = dynamicImport(
  () => import('@/components/dashboard/RecentTrades').then(m => m.RecentTrades),
  { ssr: false }
)

// COPY → LEARN → BUILD 여정 카드 (아이콘/색상/href만 정의, 텍스트는 i18n에서)
const journeyStagesConfig = [
  {
    id: 'copy',
    icon: UsersIcon,
    color: 'emerald',
    href: '/dashboard/mirroring',
  },
  {
    id: 'learn',
    icon: AcademicCapIcon,
    color: 'blue',
    href: '/dashboard/coaching',
  },
  {
    id: 'build',
    icon: SparklesIcon,
    color: 'amber',
    href: '/dashboard/strategy-builder',
  },
]

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    hoverBg: 'hover:bg-blue-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    hoverBg: 'hover:bg-amber-500/20',
  },
}

export default function DashboardPage() {
  const { t } = useI18n()

  // i18n에서 stages 텍스트 가져오기
  const getStageText = (stageId: string) => {
    const stageData = t(`dashboard.stages.${stageId}`) as Record<string, unknown>
    return {
      stage: stageData.stage as string,
      title: stageData.title as string,
      description: stageData.description as string,
      cta: stageData.cta as string,
      painSolved: stageData.painSolved as string,
      features: stageData.features as string[],
    }
  }

  return (
    <div className="space-y-8">
      {/* Header with Pain Point Message */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-medium text-white">{t('dashboard.title')}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* ============================================ */}
      {/* COPY → LEARN → BUILD 여정 가이드 */}
      {/* ============================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm text-zinc-400 uppercase tracking-wider">{t('dashboard.myJourney')}</h2>
          <span className="text-xs text-zinc-400">{t('dashboard.journeyPath')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {journeyStagesConfig.map((config) => {
            const colors = colorClasses[config.color as keyof typeof colorClasses]
            const stageText = getStageText(config.id)

            return (
              <div
                key={config.id}
                className={`p-5 border ${colors.border} ${colors.bg} rounded-lg`}
              >
                {/* Stage Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-medium ${colors.text} uppercase tracking-wider`}>
                    {stageText.stage}
                  </span>
                  <config.icon className={`w-4 h-4 ${colors.text}`} />
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-medium text-white mb-1">{stageText.title}</h3>
                <p className="text-xs text-zinc-400 mb-3">{stageText.description}</p>

                {/* Pain Solved */}
                <div className="flex items-center gap-1.5 mb-3">
                  <CheckCircleIcon className={`w-3.5 h-3.5 ${colors.text}`} />
                  <span className={`text-xs ${colors.text}`}>{stageText.painSolved}</span>
                </div>

                {/* Features */}
                <ul className="space-y-1 mb-4">
                  {stageText.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-zinc-400 text-[10px] mt-0.5">•</span>
                      <span className="text-xs text-zinc-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={config.href}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-medium ${colors.bg} ${colors.border} border ${colors.text} ${colors.hoverBg} transition-colors`}
                >
                  {stageText.cta}
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Portfolio Overview */}
      <PortfolioOverview />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ActiveStrategies />
        </div>
        <div className="space-y-6">
          <MarketOverview />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Recent Trades */}
      <RecentTrades />

      {/* Quick Start for New Users */}
      <div className="p-5 border border-white/[0.06] rounded-lg bg-gradient-to-r from-amber-500/5 via-transparent to-emerald-500/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">
              {t('dashboard.newUser.title')}
            </h3>
            <p className="text-xs text-zinc-400">
              {t('dashboard.newUser.description')}
            </p>
          </div>
          <Link
            href="/dashboard/strategy-builder"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded text-sm font-medium hover:bg-zinc-200 transition-colors whitespace-nowrap"
          >
            {t('dashboard.newUser.cta')}
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 면책조항 */}
      <DisclaimerInline className="mt-4" />
    </div>
  )
}
