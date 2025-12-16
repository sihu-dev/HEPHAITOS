'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

// ============================================
// Icons
// ============================================

const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const RocketIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
)

const CodeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

// ============================================
// Doc Categories
// ============================================

const DOC_CATEGORIES = [
  {
    icon: RocketIcon,
    title: '시작하기',
    description: 'HEPHAITOS 설치 및 첫 번째 전략 만들기',
    links: [
      { label: '빠른 시작 가이드', href: '/docs/quickstart' },
      { label: '계정 설정', href: '/docs/account-setup' },
      { label: '증권사 연결', href: '/docs/broker-connect' },
    ],
  },
  {
    icon: BookIcon,
    title: '핵심 기능',
    description: '전략 빌더, 백테스트, 전략 분석 사용법',
    links: [
      { label: '전략 빌더 가이드', href: '/docs/strategy-builder' },
      { label: '백테스트 설정', href: '/docs/backtest' },
      { label: '전략 생성기', href: '/docs/ai-strategy' },
    ],
  },
  {
    icon: CodeIcon,
    title: 'API 문서',
    description: '개발자를 위한 API 레퍼런스',
    links: [
      { label: 'REST API', href: '/docs/api/rest' },
      { label: 'WebSocket API', href: '/docs/api/websocket' },
      { label: '인증', href: '/docs/api/auth' },
    ],
  },
  {
    icon: ShieldIcon,
    title: '보안 & 개인정보',
    description: '데이터 보호 및 보안 설정',
    links: [
      { label: '보안 가이드', href: '/docs/security' },
      { label: '개인정보 처리방침', href: '/docs/privacy' },
      { label: '이용약관', href: '/docs/terms' },
    ],
  },
]

// ============================================
// Main Page
// ============================================

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[24px] font-medium text-white mb-3">
            HEPHAITOS 문서
          </h1>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            데이터 기반 트레이딩 플랫폼의 모든 기능과 사용법을 안내합니다
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="문서 검색..."
              className="w-full h-12 px-4 pl-12 text-sm text-white bg-white/[0.04] border border-white/[0.06] rounded-lg focus:outline-none focus:border-white/[0.12]"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {DOC_CATEGORIES.map((category) => (
            <Card key={category.title} hover>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <category.icon />
                  </div>
                  <div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center justify-between p-2 rounded text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        <span>{link.label}</span>
                        <ArrowRightIcon />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <CardContent className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto mb-4">
              <ChatIcon />
            </div>
            <h3 className="text-[16px] text-white font-medium mb-2">
              도움이 필요하신가요?
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              문서에서 답을 찾지 못했다면 고객 지원팀에 문의하세요
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary">FAQ 보기</Button>
              <Button>문의하기</Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← 대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
