import { SkeletonStats, SkeletonChart, SkeletonList } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-5 w-24 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-4 w-32 bg-white/[0.04] rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-8 w-20 bg-white/[0.06] rounded animate-pulse" />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Stats Skeleton */}
      <SkeletonStats count={4} />

      {/* Chart Skeleton */}
      <SkeletonChart />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="h-4 w-20 bg-white/[0.06] rounded animate-pulse" />
          <SkeletonList items={3} />
        </div>
        <div className="space-y-4">
          <div className="h-4 w-20 bg-white/[0.06] rounded animate-pulse" />
          <SkeletonList items={4} />
        </div>
      </div>
    </div>
  )
}
