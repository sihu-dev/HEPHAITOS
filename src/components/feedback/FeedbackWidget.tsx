'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useI18n } from '@/i18n/client'
import { useFeatureFlags } from '@/lib/feature-flags/useFeatureFlags'
import { clsx } from 'clsx'

interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'other'
  category: 'ux' | 'performance' | 'content' | 'technical' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  email?: string
}

export function FeedbackWidget() {
  const { locale } = useI18n()
  const isKo = locale === 'ko'
  const { isEnabled, isLoading: flagsLoading } = useFeatureFlags()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FeedbackData>({
    type: 'improvement',
    category: 'ux',
    severity: 'medium',
    title: '',
    description: '',
    email: '',
  })

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsSuccess(false)
        setError(null)
        setFormData({
          type: 'improvement',
          category: 'ux',
          severity: 'medium',
          title: '',
          description: '',
          email: '',
        })
      }, 300)
    }
  }, [isOpen])

  // Feature flag 체크 - 비활성화 시 렌더링 안 함
  if (!flagsLoading && !isEnabled('feedback-widget')) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setError(isKo ? '서비스를 사용할 수 없습니다' : 'Service unavailable')
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Gather browser and device info
      const browserInfo = {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        language: navigator.language,
      }

      const deviceInfo = {
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        email: formData.email || user?.email || null,
        type: formData.type,
        category: formData.category,
        severity: formData.severity,
        page_url: window.location.href,
        title: formData.title,
        description: formData.description,
        browser_info: browserInfo,
        device_info: deviceInfo,
      } as any)

      if (insertError) {
        throw insertError
      }

      setIsSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
      }, 2000)
    } catch (err) {
      console.error('Feedback submission error:', err)
      setError(isKo ? '피드백 전송에 실패했습니다' : 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          'fixed bottom-6 right-6 z-40',
          'w-14 h-14 rounded-full',
          'bg-[#5E6AD2] hover:bg-[#4B56C8]',
          'text-white shadow-xl hover:shadow-2xl',
          'transition-all duration-300',
          'flex items-center justify-center',
          'group'
        )}
        aria-label={isKo ? '피드백 보내기' : 'Send feedback'}
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className={clsx(
              'w-full max-w-lg bg-[#111113] rounded-xl border border-white/[0.08]',
              'shadow-2xl shadow-black/50',
              'animate-scale-in'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <h2 className="text-lg font-semibold text-white">
                {isKo ? '피드백 보내기' : 'Send Feedback'}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {isSuccess ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white font-medium mb-2">
                    {isKo ? '피드백 감사합니다!' : 'Thank you for your feedback!'}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {isKo ? '소중한 의견이 제품 개선에 큰 도움이 됩니다' : 'Your input helps us improve'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type */}
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      {isKo ? '유형' : 'Type'}
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as FeedbackData['type'] })}
                      className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white focus:outline-none focus:border-zinc-600"
                    >
                      <option value="bug">{isKo ? '버그 제보' : 'Bug Report'}</option>
                      <option value="feature">{isKo ? '기능 제안' : 'Feature Request'}</option>
                      <option value="improvement">{isKo ? '개선 제안' : 'Improvement'}</option>
                      <option value="other">{isKo ? '기타' : 'Other'}</option>
                    </select>
                  </div>

                  {/* Category & Severity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5">
                        {isKo ? '카테고리' : 'Category'}
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as FeedbackData['category'] })}
                        className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white focus:outline-none focus:border-zinc-600"
                      >
                        <option value="ux">UX/UI</option>
                        <option value="performance">{isKo ? '성능' : 'Performance'}</option>
                        <option value="content">{isKo ? '콘텐츠' : 'Content'}</option>
                        <option value="technical">{isKo ? '기술' : 'Technical'}</option>
                        <option value="other">{isKo ? '기타' : 'Other'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5">
                        {isKo ? '심각도' : 'Severity'}
                      </label>
                      <select
                        value={formData.severity}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value as FeedbackData['severity'] })}
                        className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white focus:outline-none focus:border-zinc-600"
                      >
                        <option value="low">{isKo ? '낮음' : 'Low'}</option>
                        <option value="medium">{isKo ? '보통' : 'Medium'}</option>
                        <option value="high">{isKo ? '높음' : 'High'}</option>
                        <option value="critical">{isKo ? '심각' : 'Critical'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      {isKo ? '제목' : 'Title'}
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={isKo ? '간단한 제목을 입력하세요' : 'Brief title'}
                      required
                      maxLength={100}
                      className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      {isKo ? '상세 설명' : 'Description'}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={isKo ? '상세한 내용을 입력하세요...' : 'Describe in detail...'}
                      required
                      rows={4}
                      maxLength={1000}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      {formData.description.length}/1000
                    </p>
                  </div>

                  {/* Email (optional) */}
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      {isKo ? '이메일 (선택)' : 'Email (optional)'}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={isKo ? '답변을 받으실 이메일' : 'For follow-up'}
                      className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={clsx(
                      'w-full h-10 rounded-md text-sm font-medium transition-colors',
                      'bg-[#5E6AD2] hover:bg-[#4B56C8] text-white',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isSubmitting
                      ? (isKo ? '전송 중...' : 'Submitting...')
                      : (isKo ? '피드백 보내기' : 'Send Feedback')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
