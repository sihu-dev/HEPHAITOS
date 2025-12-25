'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useI18n } from '@/i18n/client'

export function SignupForm() {
  const { locale } = useI18n()
  const isKo = locale === 'ko'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (pwd.length === 0) return { score: 0, label: '', color: '' }

    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++

    if (score <= 2) return { score: 1, label: isKo ? '약함' : 'Weak', color: 'bg-red-500' }
    if (score <= 3) return { score: 2, label: isKo ? '보통' : 'Fair', color: 'bg-amber-500' }
    if (score <= 4) return { score: 3, label: isKo ? '좋음' : 'Good', color: 'bg-emerald-500' }
    return { score: 4, label: isKo ? '강력함' : 'Strong', color: 'bg-emerald-600' }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password.length < 8) {
      setError(isKo ? '비밀번호는 8자 이상이어야 합니다' : 'Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setError(isKo ? '인증 서비스를 사용할 수 없습니다' : 'Authentication service unavailable')
        return
      }
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
      setError(isKo ? '가입 중 오류가 발생했습니다' : 'An error occurred during sign up')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setError(isKo ? '인증 서비스를 사용할 수 없습니다' : 'Authentication service unavailable')
        return
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch {
      setError(isKo ? '로그인 중 오류가 발생했습니다' : 'An error occurred during login')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">
            {isKo ? '이메일을 확인해주세요' : 'Check your email'}
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            {isKo ? '인증 링크를 보냈습니다:' : 'We sent a verification link to:'}
            <br />
            <span className="text-white">{email}</span>
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white hover:bg-zinc-800 transition-colors"
          >
            {isKo ? '로그인 페이지로' : 'Back to login'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">H</span>
          </div>
          <span className="text-sm font-medium text-white">HEPHAITOS</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white">
              {isKo ? '계정 만들기' : 'Create your account'}
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              {isKo ? '무료로 시작하세요. 50 크레딧 지급!' : 'Start for free. Get 50 credits!'}
            </p>
          </div>

          <div className="space-y-4">
            {/* OAuth Buttons */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              className="w-full flex items-center justify-center gap-3 h-10 px-4 bg-white text-black rounded-md text-sm font-medium hover:bg-zinc-100 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className="w-full flex items-center justify-center gap-3 h-10 px-4 bg-zinc-900 border border-zinc-800 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background-secondary px-2 text-zinc-500">or</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  {isKo ? '이름' : 'Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isKo ? '홍길동' : 'John Doe'}
                  required
                  autoComplete="name"
                  className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  {isKo ? '이메일' : 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  {isKo ? '비밀번호' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isKo ? '8자 이상' : 'Min 8 characters'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full h-10 px-3 pr-10 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.score
                              ? passwordStrength.color
                              : 'bg-zinc-800'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.label && (
                      <p className={`text-xs ${
                        passwordStrength.score === 1
                          ? 'text-red-400'
                          : passwordStrength.score === 2
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}>
                        {isKo ? '비밀번호 강도' : 'Password strength'}: {passwordStrength.label}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
              >
                {isLoading ? (isKo ? '가입 중...' : 'Creating...') : (isKo ? '계정 만들기' : 'Create account')}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-zinc-500 mt-8">
            {isKo ? '이미 계정이 있으신가요?' : 'Already have an account?'}{' '}
            <Link href="/auth/login" className="text-white hover:underline">
              {isKo ? '로그인' : 'Sign in'}
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center">
        <p className="text-xs text-zinc-600">
          By continuing, you agree to HEPHAITOS's{' '}
          <Link href="/terms" className="text-zinc-500 hover:text-white">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-zinc-500 hover:text-white">Privacy Policy</Link>
        </p>
      </footer>
    </div>
  )
}
