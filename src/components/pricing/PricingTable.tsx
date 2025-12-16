'use client'

// ============================================
// Pricing Table Component
// 가격표 컴포넌트 (전체)
// ============================================

import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PRICING_PLANS,
  type PlanType,
  type BillingCycle,
} from '@/lib/payments/toss-payments'
import { PricingCard } from './PricingCard'
import { useI18n } from '@/i18n/client'

interface PricingTableProps {
  currentPlanId?: PlanType
  onSelectPlan: (planId: PlanType, billingCycle: BillingCycle) => void
  isLoading?: boolean
}

export const PricingTable = memo(function PricingTable({
  currentPlanId,
  onSelectPlan,
  isLoading,
}: PricingTableProps) {
  const { t } = useI18n()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('dashboard.pricingTable.title') as string}
        </h2>
        <p className="text-zinc-400">
          {t('dashboard.pricingTable.subtitle') as string}
        </p>
      </div>

      {/* 결제 주기 토글 */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-white text-black'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          {t('dashboard.pricingTable.monthly') as string}
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle('yearly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            billingCycle === 'yearly'
              ? 'bg-white text-black'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          {t('dashboard.pricingTable.yearly') as string}
          <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full">
            -17%
          </span>
        </button>
      </div>

      {/* 가격표 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="wait">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PricingCard
                plan={plan}
                billingCycle={billingCycle}
                currentPlanId={currentPlanId}
                onSelect={(planId) =>
                  onSelectPlan(planId as PlanType, billingCycle)
                }
                isLoading={isLoading}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 기업 고객 안내 */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="text-left">
            <p className="text-white font-medium">{t('dashboard.pricingTable.enterprise.title') as string}</p>
            <p className="text-sm text-zinc-400">
              {t('dashboard.pricingTable.enterprise.subtitle') as string}
            </p>
          </div>
          <button type="button" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">
            {t('dashboard.pricingTable.enterprise.contact') as string}
          </button>
        </div>
      </div>

      {/* 면책조항 */}
      <div className="mt-8 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
        <p className="text-[10px] text-zinc-500 leading-relaxed text-center">
          ⚠️ {t('dashboard.pricingTable.disclaimer') as string}
        </p>
      </div>
    </div>
  )
})

export default PricingTable
