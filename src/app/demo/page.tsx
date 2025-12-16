'use client'

import Link from 'next/link'
import { ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

export default function DemoPage() {
  const { t } = useI18n()

  return (
    <main className="min-h-screen bg-[#0D0D0F]">
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-12 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('dashboard.demo.backToHome') as string}
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[32px] font-medium text-white mb-4">
            {t('dashboard.demo.title') as string}
          </h1>
          <p className="text-base text-zinc-500 max-w-md mx-auto">
            {t('dashboard.demo.subtitle') as string}
          </p>
        </div>

        {/* Demo Video Placeholder */}
        <div className="border border-white/[0.06] rounded-xl overflow-hidden mb-12">
          <div className="aspect-video bg-zinc-900/50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.08] flex items-center justify-center mx-auto mb-4">
                <PlayIcon className="w-8 h-8 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-400">
                {t('dashboard.demo.videoPlaceholder') as string}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-[16px] font-medium text-white mb-4">
            {t('dashboard.demo.tryIt.title') as string}
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            {t('dashboard.demo.tryIt.description') as string}
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.08] text-white rounded-lg text-sm font-medium hover:bg-white/[0.12] transition-colors"
          >
            {t('dashboard.demo.tryIt.cta') as string}
          </Link>
        </div>
      </div>
    </main>
  )
}
