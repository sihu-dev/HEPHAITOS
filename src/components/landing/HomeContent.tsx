'use client'

import nextDynamic from 'next/dynamic'
import { Navbar } from '@/components/layout/Navbar'
import { SupabaseHero } from '@/components/landing/SupabaseHero'
import { Footer } from '@/components/layout/Footer'

// ========== Skeleton Loader ==========
function SectionSkeleton() {
  return (
    <div className="py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mx-auto mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-zinc-900 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ========== Dynamic Imports - Below the fold ==========
// Performance: ssr: false for below-the-fold components
const TradingAgentWorkflow = nextDynamic(
  () => import('@/components/landing/TradingAgentWorkflow').then(mod => ({ default: mod.TradingAgentWorkflow })),
  { ssr: false, loading: () => <SectionSkeleton /> }
)
const PainPointCards = nextDynamic(
  () => import('@/components/landing/PainPointCards').then(mod => ({ default: mod.PainPointCards })),
  { ssr: false, loading: () => <SectionSkeleton /> }
)
const FeaturesSection = nextDynamic(
  () => import('@/components/landing/FeaturesSection').then(mod => ({ default: mod.FeaturesSection })),
  { ssr: false, loading: () => <SectionSkeleton /> }
)
const HowItWorksSection = nextDynamic(
  () => import('@/components/landing/HowItWorksSection').then(mod => ({ default: mod.HowItWorksSection })),
  { ssr: false, loading: () => <SectionSkeleton /> }
)
const SocialProofSection = nextDynamic(
  () => import('@/components/landing/SocialProofSection').then(mod => ({ default: mod.SocialProofSection })),
  { ssr: false, loading: () => <SectionSkeleton /> }
)
const PricingSection = nextDynamic(
  () => import('@/components/landing/PricingSection').then(mod => ({ default: mod.PricingSection })),
  { ssr: false, loading: () => <SectionSkeleton /> }
)
const FAQSection = nextDynamic(
  () => import('@/components/landing/FAQSection').then(mod => ({ default: mod.FAQSection })),
  { ssr: false, loading: () => <SectionSkeleton /> }
)
const CTASection = nextDynamic(
  () => import('@/components/landing/CTASection').then(mod => ({ default: mod.CTASection })),
  { ssr: false, loading: () => <SectionSkeleton /> }
)
const StickyCTA = nextDynamic(
  () => import('@/components/landing/StickyCTA').then(mod => ({ default: mod.StickyCTA })),
  { ssr: false }
)

export function HomeContent() {
  return (
    <main className="relative bg-background-primary">
      <Navbar />

      {/* Supabase Style Hero - Centered, Bold, Minimal */}
      <SupabaseHero />

      {/* Trading Agent Workflow - Claude Solutions Agents Style */}
      <TradingAgentWorkflow />

      <PainPointCards />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />

      {/* Sticky CTA - appears after scrolling past hero */}
      <StickyCTA />
    </main>
  )
}
