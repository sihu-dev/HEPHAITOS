'use client'


import dynamicImport from 'next/dynamic'
import { PageLoading } from '@/components/ui'

// Force dynamic rendering - prevent SSG

// Loading component for strategy builder
const StrategyBuilderLoading = () => (
  <PageLoading message="Loading Strategy Builder..." />
)

const StrategyBuilder = dynamicImport(
  () => import('@/components/strategy-builder/StrategyBuilder').then(m => m.StrategyBuilder),
  { ssr: false, loading: StrategyBuilderLoading }
)

export function StrategyBuilderContent() {
  return (
    <div className="h-[calc(100vh-120px)]">
      <StrategyBuilder />
    </div>
  )
}
