'use client'

import { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { Toaster } from '@/components/ui/Toaster'
import { I18nProvider } from '@/i18n/client'
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>
        {children}
        <Toaster />
        <FeedbackWidget />
      </ToastProvider>
    </I18nProvider>
  )
}
