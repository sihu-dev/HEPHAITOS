'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EnvelopeIcon, LockClosedIcon, UserIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useI18n } from '@/i18n/client'

export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError(t('auth.signup.errors.passwordMismatch') as string)
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError(t('auth.signup.errors.passwordTooShort') as string)
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
    } catch {
      setError(t('auth.signup.errors.generic') as string)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] text-center">
          <div className="border border-white/[0.06] rounded-lg p-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded bg-emerald-500/10 flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-base font-medium text-white mb-2">{t('auth.signup.success.title')}</h1>
            <p className="text-sm text-zinc-400 mb-6">
              {t('auth.signup.success.message')} <span className="text-zinc-300">{email}</span>
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded text-sm font-medium transition-colors"
            >
              {t('auth.signup.success.button')}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white/[0.08] flex items-center justify-center">
              <span className="text-sm font-medium text-white">H</span>
            </div>
            <span className="text-base font-medium text-white">HEPHAITOS</span>
          </Link>
          <h1 className="text-base font-medium text-white mt-8">{t('auth.signup.title')}</h1>
          <p className="text-sm text-zinc-400 mt-1">{t('auth.signup.subtitle')}</p>
        </div>

        {/* Sign Up Form */}
        <div className="border border-white/[0.06] rounded-lg p-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="py-2 px-3 border border-red-500/20 rounded text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t('auth.signup.name')}</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.signup.namePlaceholder') as string}
                  required
                  autoComplete="name"
                  className="w-full pl-10 pr-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/[0.12]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t('auth.signup.email')}</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/[0.12]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t('auth.signup.password')}</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.signup.passwordPlaceholder') as string}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/[0.12]"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t('auth.signup.confirmPassword')}</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.signup.confirmPlaceholder') as string}
                  required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/[0.12]"
                />
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-zinc-400">
              {t('auth.signup.terms1')}{' '}
              <Link href="/terms" className="text-zinc-400 hover:text-zinc-300">
                {t('auth.signup.terms')}
              </Link>
              {' '}{t('auth.signup.and')}{' '}
              <Link href="/privacy" className="text-zinc-400 hover:text-zinc-300">
                {t('auth.signup.privacy')}
              </Link>
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-white/[0.08] hover:bg-white/[0.12] disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('auth.signup.loading')}
                </>
              ) : (
                <>
                  {t('auth.signup.submit')}
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-zinc-400 mt-6">
          {t('auth.signup.hasAccount')}{' '}
          <Link href="/auth/login" className="text-zinc-300 hover:text-white">
            {t('auth.signup.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
