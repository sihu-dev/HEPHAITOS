'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { DisclaimerBanner } from '@/components/ui/Disclaimer'
import { KeyboardShortcuts } from '@/components/dashboard/KeyboardShortcuts'
import { ShortcutsModal } from '@/components/ui/ShortcutsModal'
import { CommandPalette } from '@/components/ui/CommandPalette'

const Sidebar = dynamic(() => import('@/components/dashboard/Sidebar').then(m => m.Sidebar), { ssr: false })
const DashboardHeader = dynamic(() => import('@/components/dashboard/DashboardHeader').then(m => m.DashboardHeader), { ssr: false })

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <KeyboardShortcuts>
      <div className="min-h-screen bg-[#0D0D0F]">
        {/* 법적 필수 면책조항 배너 */}
        <DisclaimerBanner />
        <Sidebar />
        <div className="lg:pl-52">
          <DashboardHeader />
          <main id="main-content" className="px-6 py-4 pb-20 lg:pb-4" tabIndex={-1}>
            <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
      {/* Global Modals */}
      <CommandPalette />
      <ShortcutsModal />
    </KeyboardShortcuts>
  )
}
