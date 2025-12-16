'use client'

import { memo } from 'react'
import Link from 'next/link'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

export const Footer = memo(function Footer() {
  const { t } = useI18n()

  const footerLinks = {
    product: {
      title: t('footer.product.title'),
      links: [
        { label: t('footer.product.features'), href: '#features' },
        { label: t('footer.product.pricing'), href: '#pricing' },
        { label: t('footer.product.roadmap'), href: '/roadmap' },
        { label: t('footer.product.changelog'), href: '/changelog' },
      ],
    },
    learn: {
      title: t('footer.learn.title'),
      links: [
        { label: t('footer.learn.copyGuide'), href: '/docs#copy' },
        { label: t('footer.learn.learnGuide'), href: '/docs#learn' },
        { label: t('footer.learn.buildTutorial'), href: '/docs#build' },
        { label: t('footer.learn.apiDocs'), href: '/docs#api' },
      ],
    },
    company: {
      title: t('footer.company.title'),
      links: [
        { label: t('footer.company.about'), href: '/about' },
        { label: t('footer.company.blog'), href: '/blog' },
        { label: t('footer.company.careers'), href: '/careers' },
        { label: t('footer.company.contact'), href: '/contact' },
      ],
    },
    legal: {
      title: t('footer.legal.title'),
      links: [
        { label: t('footer.legal.terms'), href: '/terms' },
        { label: t('footer.legal.privacy'), href: '/privacy' },
        { label: t('footer.legal.riskDisclosure'), href: '/risk-disclosure' },
        { label: t('footer.legal.disclaimer'), href: '/disclaimer' },
      ],
    },
  }

  return (
    <footer className="border-t border-white/[0.06]">
      {/* Risk Disclaimer Banner */}
      <div className="bg-amber-500/5 border-b border-amber-500/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-400 leading-relaxed">
              <p className="font-medium text-amber-400 mb-1">{t('footer.riskDisclosure.title')}</p>
              <p>
                {t('footer.riskDisclosure.text1')} <strong className="text-white">{t('footer.riskDisclosure.text2')}</strong>
                {t('footer.riskDisclosure.text3')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-base font-medium text-white">HEPHAITOS</span>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              {t('footer.tagline1')}
              <br />
              {t('footer.tagline2')}
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t('footer.systemStatus')}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-xs text-zinc-400 uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Regulatory Compliance */}
        <div className="mt-12 pt-6 border-t border-white/[0.06]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Compliance Statement */}
            <div className="text-xs text-zinc-400 leading-relaxed">
              <p className="font-medium text-zinc-500 mb-2">{t('footer.compliance.title')}</p>
              <p>{t('footer.compliance.text')}</p>
            </div>

            {/* Data Sources */}
            <div className="text-xs text-zinc-400 leading-relaxed">
              <p className="font-medium text-zinc-500 mb-2">{t('footer.dataSources.title')}</p>
              <p>
                {t('footer.dataSources.celebrity')}
                <br />
                {t('footer.dataSources.market')}
                <br />
                {t('footer.dataSources.note')}
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/[0.04]">
            <p className="text-xs text-zinc-400">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span>{t('footer.businessInfo.registration')}</span>
              <span>{t('footer.businessInfo.ceo')}</span>
              <span>{t('footer.businessInfo.address')}</span>
            </div>
          </div>

          {/* Final Disclaimer */}
          <p className="mt-6 text-xs text-zinc-400 text-center leading-relaxed">
            {t('footer.finalDisclaimer')}
          </p>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export { Footer as default }
