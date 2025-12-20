'use client'


// ============================================
// Billing Settings Page
// 결제 및 구독 관리 페이지
// ============================================

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { PricingTable, PaymentModal } from '@/components/pricing'
import {
  PRICING_PLANS,
  getPlanById,
  formatPrice,
  type PlanType,
  type BillingCycle,
} from '@/lib/payments/toss-payments'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { useI18n } from '@/i18n/client'

type TranslateFunction = (key: string) => string | string[] | Record<string, unknown>

// 현재 구독 정보 (Mock)
const mockSubscription = {
  planId: 'starter' as PlanType,
  billingCycle: 'monthly' as BillingCycle,
  status: 'active',
  currentPeriodEnd: new Date('2025-01-15'),
  nextPaymentAmount: 9900,
}

// ============================================
// Refund Request Section Component
// ============================================

function RefundRequestSection() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundPreview, setRefundPreview] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Mock 주문 목록 (최근 7일 이내)
  const recentOrders = [
    {
      orderId: 'order_2024121501',
      date: '2024-12-15',
      amount: 9900,
      plan: 'Starter',
      credits: 1000,
    },
  ]

  // 환불 계산 미리보기
  const handleCalculateRefund = async (orderId: string) => {
    setIsLoading(true)
    setRefundPreview(null)

    try {
      const response = await fetch(`/api/payments/refund?orderId=${orderId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '환불 계산 실패')
      }

      setRefundPreview(data)
      setSelectedOrderId(orderId)
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : '환불 계산 실패',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 환불 요청 제출
  const handleSubmitRefund = async () => {
    if (!selectedOrderId || !refundReason.trim() || refundReason.length < 10) {
      setNotification({
        type: 'error',
        message: '환불 사유는 최소 10자 이상이어야 합니다',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          reason: refundReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '환불 요청 실패')
      }

      setNotification({
        type: 'success',
        message: data.message,
      })
      setSelectedOrderId(null)
      setRefundReason('')
      setRefundPreview(null)
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : '환불 요청 실패',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
      <h3 className="text-white font-medium mb-4">환불 요청</h3>
      <p className="text-sm text-zinc-400 mb-4">
        크레딧 사용률에 따라 차등 환불됩니다 (10% 이하: 전액, 10-50%: 50%, 50% 이상: 불가)
      </p>

      {/* 알림 */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <XCircleIcon className="w-5 h-5" />
            )}
            <p className="text-sm">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 주문 목록 */}
      {recentOrders.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">
          환불 가능한 주문이 없습니다 (7일 이내 주문만 가능)
        </div>
      ) : (
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <div
              key={order.orderId}
              className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-white font-medium">
                    {order.plan} - {formatPrice(order.amount)}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {order.date} · 크레딧 {order.credits}개
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCalculateRefund(order.orderId)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading && selectedOrderId === order.orderId
                    ? '계산 중...'
                    : '환불 계산'}
                </button>
              </div>

              {/* 환불 미리보기 */}
              <AnimatePresence>
                {refundPreview && selectedOrderId === order.orderId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-zinc-700"
                  >
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">사용률</span>
                        <span className="text-white">
                          {refundPreview.usage_rate}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">환불 가능 금액</span>
                        <span
                          className={
                            refundPreview.eligible
                              ? 'text-emerald-400 font-medium'
                              : 'text-red-400'
                          }
                        >
                          {refundPreview.eligible
                            ? formatPrice(refundPreview.refund_amount)
                            : '환불 불가'}
                        </span>
                      </div>
                      {refundPreview.message && (
                        <p className="text-xs text-zinc-400">
                          {refundPreview.message}
                        </p>
                      )}
                    </div>

                    {refundPreview.eligible && (
                      <div className="space-y-2">
                        <label className="block">
                          <span className="text-sm text-zinc-400">
                            환불 사유 (최소 10자)
                          </span>
                          <textarea
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="환불 사유를 자세히 입력해주세요"
                            rows={3}
                            className="mt-1 w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleSubmitRefund}
                          disabled={
                            isLoading || !refundReason.trim() || refundReason.length < 10
                          }
                          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? '처리 중...' : '환불 요청 제출'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BillingContentInner() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showPricing, setShowPricing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // URL 파라미터로 결제 결과 확인
  useEffect(() => {
    const success = searchParams?.get('success')
    const fail = searchParams?.get('fail')

    if (success === 'true') {
      setNotification({
        type: 'success',
        message: t('dashboard.billing.notifications.paymentSuccess') as string,
      })
      // URL 정리
      router.replace('/dashboard/settings/billing')
    } else if (fail === 'true') {
      setNotification({
        type: 'error',
        message: t('dashboard.billing.notifications.paymentFailed') as string,
      })
      router.replace('/dashboard/settings/billing')
    }
  }, [searchParams, router, t])

  // 알림 자동 숨김
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [notification])

  const currentPlan = getPlanById(mockSubscription.planId)
  const daysRemaining = Math.ceil(
    (mockSubscription.currentPeriodEnd.getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  )

  const handleSelectPlan = (planId: PlanType, billingCycle: BillingCycle) => {
    if (planId === mockSubscription.planId) return

    if (planId === 'free') {
      // 무료 플랜으로 다운그레이드
      setNotification({
        type: 'success',
        message: t('dashboard.billing.notifications.downgradeScheduled') as string,
      })
      return
    }

    setSelectedPlan(planId)
    setSelectedCycle(billingCycle)
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async (customerInfo: {
    name: string
    email: string
  }) => {
    if (!selectedPlan) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          billingCycle: selectedCycle,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('dashboard.billing.errors.paymentCreationFailed') as string)
      }

      // 토스페이먼츠 결제창으로 이동 (실제 환경)
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        // 개발 환경에서는 바로 성공 처리 시뮬레이션
        setShowPaymentModal(false)
        setNotification({
          type: 'success',
          message: (t('dashboard.billing.notifications.upgradedTo') as string).replace('{plan}', getPlanById(selectedPlan)?.name || ''),
        })
      }
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm(t('dashboard.billing.confirmCancel') as string)) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/subscription', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setNotification({
          type: 'success',
          message: data.message,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: t('dashboard.billing.errors.cancelFailed') as string,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-base font-medium text-white">{t('dashboard.billing.title') as string}</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {t('dashboard.billing.description') as string}
        </p>
      </div>
      <div className="h-px bg-white/[0.06]" />

      {/* 알림 */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex items-center gap-3 p-4 rounded-xl ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-red-500/10 border border-red-500/20'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-400" />
            )}
            <p
              className={`text-sm ${
                notification.type === 'success'
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {notification.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 현재 구독 정보 */}
      <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CreditCardIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-medium">{t('dashboard.billing.currentPlan') as string}</h2>
              <p className="text-sm text-zinc-400">
                {currentPlan?.name} ({currentPlan?.nameKr})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                mockSubscription.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {mockSubscription.status === 'active' ? t('dashboard.billing.status.active') as string : t('dashboard.billing.status.pending') as string}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{t('dashboard.billing.nextPaymentDate') as string}</span>
            </div>
            <p className="text-white font-medium">
              {mockSubscription.currentPeriodEnd.toLocaleDateString('ko-KR')}
            </p>
            <p className="text-xs text-zinc-400">{(t('dashboard.billing.daysRemaining') as string).replace('{days}', String(daysRemaining))}</p>
          </div>

          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <CurrencyDollarIcon className="w-4 h-4" />
              <span>{t('dashboard.billing.paymentAmount') as string}</span>
            </div>
            <p className="text-white font-medium">
              {formatPrice(mockSubscription.nextPaymentAmount)}
            </p>
            <p className="text-xs text-zinc-400">
              {mockSubscription.billingCycle === 'yearly' ? t('dashboard.billing.yearly') as string : t('dashboard.billing.monthly') as string}
            </p>
          </div>

          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <ArrowPathIcon className="w-4 h-4" />
              <span>{t('dashboard.billing.autoRenewal') as string}</span>
            </div>
            <p className="text-white font-medium">{t('dashboard.billing.enabled') as string}</p>
            <p className="text-xs text-zinc-400">{t('dashboard.billing.cardPayment') as string}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPricing(!showPricing)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {showPricing ? t('dashboard.billing.hidePlans') as string : t('dashboard.billing.changePlan') as string}
          </button>
          {mockSubscription.planId !== 'free' && (
            <button
              type="button"
              onClick={handleCancelSubscription}
              disabled={isLoading}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
            >
              {t('dashboard.billing.cancelSubscription') as string}
            </button>
          )}
        </div>
      </div>

      {/* 가격표 */}
      <AnimatePresence>
        {showPricing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <PricingTable
              currentPlanId={mockSubscription.planId}
              onSelectPlan={handleSelectPlan}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 결제 이력 */}
      <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <h3 className="text-white font-medium mb-4">{t('dashboard.billing.paymentHistory') as string}</h3>
        <div className="space-y-3">
          {[
            {
              date: '2024-12-15',
              amount: 9900,
              status: 'completed',
              plan: 'Starter',
            },
            {
              date: '2024-11-15',
              amount: 9900,
              status: 'completed',
              plan: 'Starter',
            },
            {
              date: '2024-10-15',
              amount: 9900,
              status: 'completed',
              plan: 'Starter',
            },
          ].map((payment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <CreditCardIcon className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm text-white">{payment.plan} {t('dashboard.billing.plan') as string}</p>
                  <p className="text-xs text-zinc-400">{payment.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white font-medium">
                  {formatPrice(payment.amount)}
                </p>
                <span className="text-xs text-emerald-400">{t('dashboard.billing.completed') as string}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 환불 요청 섹션 */}
      <RefundRequestSection />

      {/* 면책조항 */}
      <DisclaimerInline />

      {/* 결제 모달 */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlan ? getPlanById(selectedPlan) || null : null}
        billingCycle={selectedCycle}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  )
}

export function BillingContent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      }
    >
      <BillingContentInner />
    </Suspense>
  )
}
