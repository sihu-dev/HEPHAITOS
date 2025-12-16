'use client'

// ============================================
// Payment Modal Component
// ============================================

import { useState, useEffect, Fragment, memo } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { motion } from 'framer-motion'
import {
  XMarkIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import {
  type PricingPlan,
  type BillingCycle,
  formatPrice,
  getDiscountPercent,
} from '@/lib/payments/toss-payments'
import { useI18n } from '@/i18n/client'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  plan: PricingPlan | null
  billingCycle: BillingCycle
  onConfirm: (customerInfo: CustomerInfo) => Promise<void>
}

interface CustomerInfo {
  name: string
  email: string
}

export const PaymentModal = memo(function PaymentModal({
  isOpen,
  onClose,
  plan,
  billingCycle,
  onConfirm,
}: PaymentModalProps) {
  const { t } = useI18n()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setCustomerInfo({ name: '', email: '' })
      setError(null)
    }
  }, [isOpen])

  if (!plan) return null

  const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  const discount = getDiscountPercent(plan)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!customerInfo.name.trim()) {
      setError(t('dashboard.payment.validation.nameRequired') as string)
      return
    }
    if (!customerInfo.email.trim() || !customerInfo.email.includes('@')) {
      setError(t('dashboard.payment.validation.emailInvalid') as string)
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(customerInfo)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : (t('dashboard.payment.validation.paymentError') as string)
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-semibold text-white">
                    {t('dashboard.payment.title') as string}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('dashboard.payment.close') as string}
                    title={t('dashboard.payment.close') as string}
                    className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Selected Plan Info */}
                <div className="p-4 bg-zinc-800/50 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium">
                        {(t('dashboard.payment.planInfo') as string).replace('{plan}', plan.name)}
                      </h4>
                      <p className="text-sm text-zinc-400">
                        {billingCycle === 'yearly'
                          ? t('dashboard.payment.billingCycle.yearly') as string
                          : t('dashboard.payment.billingCycle.monthly') as string}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        {formatPrice(price)}
                      </p>
                      {billingCycle === 'yearly' && discount > 0 && (
                        <p className="text-xs text-emerald-400">
                          {(t('dashboard.payment.discountApplied') as string).replace('{discount}', String(discount))}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-zinc-700 my-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{t('dashboard.payment.paymentAmount') as string}</span>
                    <span className="text-white font-medium">
                      {formatPrice(price)}
                    </span>
                  </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      {t('dashboard.payment.form.name') as string}
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder={t('dashboard.payment.form.namePlaceholder') as string}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      {t('dashboard.payment.form.email') as string}
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Security Info */}
                  <div className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <LockClosedIcon className="w-4 h-4" />
                      <span>{t('dashboard.payment.security.ssl') as string}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <ShieldCheckIcon className="w-4 h-4" />
                      <span>{t('dashboard.payment.security.securePayment') as string}</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCardIcon className="w-5 h-5" />
                        {(t('dashboard.payment.submitButton') as string).replace('{price}', formatPrice(price))}
                      </>
                    )}
                  </button>
                </form>

                {/* Disclaimer */}
                <p className="mt-4 text-[10px] text-zinc-500 text-center leading-relaxed">
                  {t('dashboard.payment.disclaimer.terms') as string}
                  <br />
                  {t('dashboard.payment.disclaimer.refund') as string}
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
})

export default PaymentModal
