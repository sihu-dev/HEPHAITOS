'use client'

import { AuroraBackground } from '@/components/layout/AuroraBackground'
import { Navbar } from '@/components/layout/Navbar'
import { InteractiveHeroV2 } from '@/components/landing/InteractiveHeroV2'
import { TrustBadge } from '@/components/landing/TrustBadge'
import { PainPointCards } from '@/components/landing/PainPointCards'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { SocialProofSection } from '@/components/landing/SocialProofSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { FAQSection } from '@/components/landing/FAQSection'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/layout/Footer'
import { StickyCTA } from '@/components/landing/StickyCTA'

// Force dynamic rendering - prevent SSG
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <main className="relative bg-[#0D0D0F]">
      {/* Aurora Background Effect */}
      <AuroraBackground />

      <Navbar />

      {/* Firebase Studio Style Interactive Hero */}
      <InteractiveHeroV2 />

      <TrustBadge />
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
