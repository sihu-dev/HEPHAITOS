'use client'

// ============================================
// Pricing Card Component
// ============================================

import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  CheckIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import {
  type PricingPlan,
  type BillingCycle,
  formatPrice,
  getDiscountPercent,
} from '@/lib/payments/toss-payments'
import { useI18n } from '@/i18n/client'

interface PricingCardProps {
  plan: PricingPlan
  billingCycle: BillingCycle
  currentPlanId?: string
  onSelect: (planId: string) => void
  isLoading?: boolean
}

export const PricingCard = memo(function PricingCard({
  plan,
  billingCycle,
  currentPlanId,
  onSelect,
  isLoading,
}: PricingCardProps) {
  const { t } = useI18n()
  const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  const monthlyEquivalent =
    billingCycle === 'yearly' ? Math.round(plan.yearlyPrice / 12) : price
  const discount = getDiscountPercent(plan)
  const isCurrentPlan = currentPlanId === plan.id
  const isFree = plan.id === 'free'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl p-6 ${
        plan.highlighted
          ? 'bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-2 border-blue-500/50'
          : 'bg-zinc-900/50 border border-zinc-800'
      }`}
    >
      {/* Recommended Badge */}
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-500 rounded-full text-xs font-medium text-white">
            <SparklesIcon className="w-3 h-3" />
            {t('dashboard.pricingCard.recommended') as string}
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <div className="px-3 py-1 bg-emerald-500 rounded-full text-xs font-medium text-white">
            {t('dashboard.pricingCard.currentPlan') as string}
          </div>
        </div>
      )}

      {/* Plan Info */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
        <p className="text-sm text-zinc-400">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">
            {isFree ? (t('dashboard.pricingCard.free') as string) : formatPrice(monthlyEquivalent)}
          </span>
          {!isFree && <span className="text-zinc-500 text-sm">{t('dashboard.pricingCard.perMonth') as string}</span>}
        </div>
        {billingCycle === 'yearly' && !isFree && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-zinc-400">
              {(t('dashboard.pricingCard.yearly') as string).replace('{price}', formatPrice(price))}
            </span>
            {discount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                {(t('dashboard.pricingCard.discount') as string).replace('{discount}', String(discount))}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Features List */}
      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-zinc-300">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Limits */}
      <div className="mb-6 p-3 bg-zinc-800/50 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-zinc-500">{t('dashboard.pricingCard.limits.backtest') as string}</span>
            <p className="text-white font-medium">
              {plan.limits.backtestPerMonth === 'unlimited'
                ? (t('dashboard.pricingCard.limits.unlimited') as string)
                : (t('dashboard.pricingCard.limits.perMonth') as string).replace('{count}', String(plan.limits.backtestPerMonth))}
            </p>
          </div>
          <div>
            <span className="text-zinc-500">{t('dashboard.pricingCard.limits.liveStrategies') as string}</span>
            <p className="text-white font-medium">
              {plan.limits.liveStrategies === 'unlimited'
                ? (t('dashboard.pricingCard.limits.unlimited') as string)
                : (t('dashboard.pricingCard.limits.count') as string).replace('{count}', String(plan.limits.liveStrategies))}
            </p>
          </div>
          <div>
            <span className="text-zinc-500">{t('dashboard.pricingCard.limits.data') as string}</span>
            <p className="text-white font-medium capitalize">
              {plan.limits.dataAccess === 'basic'
                ? (t('dashboard.pricingCard.limits.dataAccess.basic') as string)
                : plan.limits.dataAccess === 'realtime'
                ? (t('dashboard.pricingCard.limits.dataAccess.realtime') as string)
                : (t('dashboard.pricingCard.limits.dataAccess.premium') as string)}
            </p>
          </div>
          <div>
            <span className="text-zinc-500">{t('dashboard.pricingCard.limits.support') as string}</span>
            <p className="text-white font-medium capitalize">
              {plan.limits.support === 'community'
                ? (t('dashboard.pricingCard.limits.supportLevel.community') as string)
                : plan.limits.support === 'email'
                ? (t('dashboard.pricingCard.limits.supportLevel.email') as string)
                : (t('dashboard.pricingCard.limits.supportLevel.priority') as string)}
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={() => onSelect(plan.id)}
        disabled={isCurrentPlan || isLoading}
        className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
          isCurrentPlan
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : plan.highlighted
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : isFree
            ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
            : 'bg-zinc-800 hover:bg-zinc-700 text-white'
        }`}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isCurrentPlan ? (
          t('dashboard.pricingCard.buttons.currentlyUsing') as string
        ) : isFree ? (
          t('dashboard.pricingCard.buttons.startFree') as string
        ) : (
          <>
            {t('dashboard.pricingCard.buttons.subscribe') as string}
            <ArrowRightIcon className="w-4 h-4" />
          </>
        )}
      </button>
    </motion.div>
  )
})
