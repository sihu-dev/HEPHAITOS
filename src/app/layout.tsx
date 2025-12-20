import type { Metadata } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import { Suspense } from 'react'
import '@/styles/globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'HEPHAITOS - 트레이딩 시스템 빌더',
    template: '%s | HEPHAITOS',
  },
  description: '코딩 없이, 나만의 트레이딩 시스템을 만드세요. 데이터 기반 전략 빌더로 백테스트부터 실전 운용까지.',
  keywords: ['트레이딩', '투자', '전략', '빌더', '노코드', '백테스트', '자동매매', 'trading', 'strategy'],
  authors: [{ name: 'HEPHAITOS', url: 'https://hephaitos.io' }],
  creator: 'HEPHAITOS',
  publisher: 'HEPHAITOS',
  metadataBase: new URL('https://hephaitos.io'),
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'HEPHAITOS - 트레이딩 시스템 빌더',
    description: '코딩 없이, 나만의 트레이딩 시스템을 만드세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'HEPHAITOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HEPHAITOS - 트레이딩 시스템 빌더',
    description: '코딩 없이, 나만의 트레이딩 시스템을 만드세요.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="dark">
      <body className={`${inter.variable} ${ibmPlexMono.variable} antialiased`}>
        {/* Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-md focus:outline-none focus:ring-2 focus:ring-white"
        >
          메인 콘텐츠로 건너뛰기
        </a>

        {/* Aurora Background */}
        <div className="aurora-bg" aria-hidden="true" />

        {/* Noise Overlay */}
        <div className="noise-overlay" aria-hidden="true" />

        {/* Main Content */}
        <div className="relative z-10 min-h-screen">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  )
}
