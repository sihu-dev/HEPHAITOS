'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { BRAND_COLORS, BG_COLORS, BORDER_COLORS, TEXT_COLORS } from '@/constants/design-tokens'

// ============================================
// SUPABASE 100% BENCHMARK NAVBAR
// ============================================

const NAV_ITEMS = [
  {
    label: 'Product',
    href: '#',
    dropdown: [
      { label: 'Copy Trading', href: '/dashboard/copy-trading' },
      { label: 'AI Mentor', href: '/dashboard/coaching' },
      { label: 'Strategy Builder', href: '/dashboard/strategy-builder' },
      { label: 'Backtesting', href: '/dashboard/backtest' },
      { label: 'Auto Trading', href: '/dashboard/ai-strategy' },
    ]
  },
  {
    label: 'Developers',
    href: '#',
    dropdown: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/docs/api' },
      { label: 'Guides', href: '/docs/guides' },
    ]
  },
  {
    label: 'Solutions',
    href: '#',
    dropdown: [
      { label: 'For Beginners', href: '/solutions/beginners' },
      { label: 'For Day Traders', href: '/solutions/day-traders' },
      { label: 'For Quants', href: '/solutions/quants' },
      { label: 'For Institutions', href: '/solutions/institutions' },
    ]
  },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: '/docs' },
  { label: 'Blog', href: '/blog' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-[#0D0D0F]/95 backdrop-blur-sm border-b border-[#1F1F1F]'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center justify-between h-[64px]">
            {/* Logo - Left (Supabase style: icon + text) */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                {/* Logo Icon - HEPHAITOS Anvil/Forge Symbol */}
                <svg
                  className="w-5 h-5 text-primary"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z"/>
                </svg>
                <span className="text-[15px] font-medium text-white tracking-tight">
                  HEPHAITOS
                </span>
              </Link>

              {/* Desktop Nav Items - Center */}
              <div className="hidden lg:flex items-center">
                {NAV_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => item.dropdown && setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-1 px-3 py-2 text-[13px] text-[#ABABAB] hover:text-white transition-colors"
                    >
                      {item.label}
                      {item.dropdown && (
                        <ChevronDownIcon className="w-3 h-3" />
                      )}
                    </Link>

                    {/* Dropdown */}
                    {item.dropdown && activeDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-1 py-2 min-w-[180px] bg-[#1A1A1A] border border-[#2E2E2E] rounded-md shadow-xl">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className="block px-4 py-2 text-[13px] text-[#ABABAB] hover:text-white hover:bg-[#252525] transition-colors"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - CTA */}
            <div className="hidden lg:flex items-center gap-2">
              {/* GitHub Stars - P1 FIX: Show actual count like Supabase */}
              <Link
                href="https://github.com/hephaitos"
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-[#ABABAB] hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span>1.2K</span>
              </Link>

              <Link
                href="/auth/login"
                className={`px-3 py-1.5 text-[13px] ${TEXT_COLORS.secondary} hover:text-white ${BORDER_COLORS.default} hover:border-zinc-600 rounded-[4px] transition-colors border`}
              >
                Sign in
              </Link>

              <Link
                href="/auth/signup"
                className={`h-[32px] px-3 inline-flex items-center text-[13px] text-white ${BRAND_COLORS.primary.bg} ${BRAND_COLORS.primary.bgHover} rounded-[4px] transition-colors`}
              >
                Start your project
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#ABABAB] hover:text-white transition-colors"
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
            className="absolute inset-0 bg-black/80"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <nav className="absolute top-[64px] left-4 right-4 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg overflow-hidden">
            <div className="py-2">
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => !item.dropdown && setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-[14px] text-[#ABABAB] hover:text-white hover:bg-[#252525] transition-colors"
                  >
                    {item.label}
                  </Link>
                  {item.dropdown && (
                    <div className="bg-[#141414]">
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.label}
                          href={subItem.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-6 py-2 text-[13px] text-[#888888] hover:text-white transition-colors"
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-[#2E2E2E] p-4 flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 text-[14px] text-[#ABABAB] hover:text-white text-center transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 text-[14px] text-white ${BRAND_COLORS.primary.bg} ${BRAND_COLORS.primary.bgHover} text-center rounded-[4px] transition-colors`}
              >
                Start your project
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
