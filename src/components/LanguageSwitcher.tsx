'use client'

import { useI18n } from '@/i18n/client'
import { GlobeAltIcon } from '@heroicons/react/24/outline'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-white rounded transition-colors"
      title={t('common.languageSwitcher.switchTo') as string}
      aria-label={t('common.languageSwitcher.switchTo') as string}
    >
      <GlobeAltIcon className="w-4 h-4" />
      <span>{locale === 'en' ? 'KO' : 'EN'}</span>
    </button>
  )
}
