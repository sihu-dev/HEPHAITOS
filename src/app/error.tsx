'use client'

import { useEffect } from 'react'
import { useI18n } from '@/i18n/client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useI18n()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0F]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-zinc-300 mb-4">
          {t('dashboard.errors.server.title') as string}
        </h2>
        <p className="text-zinc-500 mb-8">
          {t('dashboard.errors.server.description') as string}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#5E6AD2] hover:bg-[#7C8AEA] text-white rounded-lg font-medium transition-colors"
        >
          {t('dashboard.errors.server.retry') as string}
        </button>
      </div>
    </div>
  )
}
