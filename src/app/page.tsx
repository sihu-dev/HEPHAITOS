'use client'

import nextDynamic from 'next/dynamic'
import { Navbar } from '@/components/layout/Navbar'
import { SupabaseHero } from '@/components/landing/SupabaseHero'
import { Footer } from '@/components/layout/Footer'

// ========== Dynamic Imports - Below the fold ==========
// Code splitting: Load components only when needed
const PainPointCards = nextDynamic(
  () => import('@/components/landing/PainPointCards').then(mod => ({ default: mod.PainPointCards })),
  { ssr: true }
)
const FeaturesSection = nextDynamic(
  () => import('@/components/landing/FeaturesSection').then(mod => ({ default: mod.FeaturesSection })),
  { ssr: true }
)
const HowItWorksSection = nextDynamic(
  () => import('@/components/landing/HowItWorksSection').then(mod => ({ default: mod.HowItWorksSection })),
  { ssr: true }
)
const SocialProofSection = nextDynamic(
  () => import('@/components/landing/SocialProofSection').then(mod => ({ default: mod.SocialProofSection })),
  { ssr: true }
)
const PricingSection = nextDynamic(
  () => import('@/components/landing/PricingSection').then(mod => ({ default: mod.PricingSection })),
  { ssr: true }
)
const FAQSection = nextDynamic(
  () => import('@/components/landing/FAQSection').then(mod => ({ default: mod.FAQSection })),
  { ssr: true }
)
const CTASection = nextDynamic(
  () => import('@/components/landing/CTASection').then(mod => ({ default: mod.CTASection })),
  { ssr: true }
)
const StickyCTA = nextDynamic(
  () => import('@/components/landing/StickyCTA').then(mod => ({ default: mod.StickyCTA })),
  { ssr: false }
)

// Force dynamic rendering - prevent SSG
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <main className="relative bg-[#0D0D0F]">
      <Navbar />

      {/* Supabase Style Hero - Centered, Bold, Minimal */}
      <SupabaseHero />

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
