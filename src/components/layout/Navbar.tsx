'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bars3Icon, XMarkIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

export function Navbar() {
  const { t, locale, setLocale } = useI18n()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.howItWorks'), href: '#how-it-works' },
    { label: t('nav.pricing'), href: '#pricing' },
    { label: t('nav.docs'), href: '/docs' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
          isScrolled
            ? 'bg-[#0D0D0F] border-b border-white/[0.06]'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-base font-medium text-white tracking-tight">
                HEPHAITOS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Language Switcher */}
              <button
                onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                title={locale === 'en' ? '한국어로 변경' : 'Switch to English'}
              >
                <GlobeAltIcon className="w-4 h-4" />
                <span>{locale === 'en' ? 'KO' : 'EN'}</span>
              </button>

              <Link
                href="/auth/login"
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/auth/signup"
                className="px-3 py-1.5 text-sm text-white bg-white/[0.08] hover:bg-white/[0.12] rounded transition-colors"
              >
                {t('nav.getStarted')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-500 hover:text-white transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <Bars3Icon className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <nav className="absolute top-14 left-4 right-4 bg-[#111113] border border-white/[0.06] rounded-lg p-3">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
              {/* Mobile Language Switcher */}
              <button
                onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
                className="px-3 py-2 text-sm text-zinc-400 hover:text-white flex items-center justify-center gap-2 rounded transition-colors"
              >
                <GlobeAltIcon className="w-4 h-4" />
                <span>{locale === 'en' ? '한국어' : 'English'}</span>
              </button>
              <Link
                href="/auth/login"
                className="px-3 py-2 text-sm text-zinc-400 hover:text-white text-center rounded transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/auth/signup"
                className="px-3 py-2 text-sm text-white bg-white/[0.08] hover:bg-white/[0.12] text-center rounded transition-colors"
              >
                {t('nav.getStarted')}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
