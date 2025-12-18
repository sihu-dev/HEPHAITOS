'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

// Database row types for type safety
interface PricingDisplayRow {
  package_id: string
  name: string
  name_ko: string
  credits: number
  bonus_credits: number
  price_krw: number
  price_usd: number
  is_popular: boolean
  is_highlighted: boolean
  display_order: number
  total_credits: number
  per_credit_krw: number
  per_credit_usd: number
}

interface FeaturePricingRow {
  feature_id: string
  feature_name: string
  feature_name_ko: string
  credit_cost: number
  category: 'copy' | 'learn' | 'build' | 'other'
  description?: string
  description_ko?: string
}

export interface CreditPackage {
  packageId: string
  name: string
  nameKo: string
  credits: number
  bonusCredits: number
  priceKrw: number
  priceUsd: number
  isPopular: boolean
  isHighlighted: boolean
  displayOrder: number
  totalCredits: number
  perCreditKrw: number
  perCreditUsd: number
}

export interface FeaturePricing {
  featureId: string
  featureName: string
  featureNameKo: string
  creditCost: number
  category: 'copy' | 'learn' | 'build' | 'other'
  description?: string
  descriptionKo?: string
}

export function usePricing() {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [features, setFeatures] = useState<FeaturePricing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPricing = async () => {
      // Skip fetching if Supabase is not configured
      if (!isSupabaseConfigured) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) {
          setIsLoading(false)
          return
        }

        // Fetch credit packages
        const { data: packagesData, error: packagesError } = await supabase
          .from('pricing_display')
          .select('*')
          .order('display_order')

        if (packagesError) {
          throw packagesError
        }

        // Fetch feature pricing
        const { data: featuresData, error: featuresError } = await supabase
          .from('feature_pricing')
          .select('*')
          .eq('is_active', true)
          .order('display_order')

        if (featuresError) {
          throw featuresError
        }

        // Map to camelCase with explicit typing
        const packages = (packagesData as PricingDisplayRow[] | null) || []
        setPackages(
          packages.map((pkg) => ({
            packageId: pkg.package_id,
            name: pkg.name,
            nameKo: pkg.name_ko,
            credits: pkg.credits,
            bonusCredits: pkg.bonus_credits,
            priceKrw: pkg.price_krw,
            priceUsd: pkg.price_usd,
            isPopular: pkg.is_popular,
            isHighlighted: pkg.is_highlighted,
            displayOrder: pkg.display_order,
            totalCredits: pkg.total_credits,
            perCreditKrw: pkg.per_credit_krw,
            perCreditUsd: pkg.per_credit_usd,
          }))
        )

        const features = (featuresData as FeaturePricingRow[] | null) || []
        setFeatures(
          features.map((feature) => ({
            featureId: feature.feature_id,
            featureName: feature.feature_name,
            featureNameKo: feature.feature_name_ko,
            creditCost: feature.credit_cost,
            category: feature.category,
            description: feature.description,
            descriptionKo: feature.description_ko,
          }))
        )

        setIsLoading(false)
      } catch (err) {
        console.error('[Pricing] Error fetching pricing:', err)
        setError(err instanceof Error ? err.message : 'Failed to load pricing')
        setIsLoading(false)
      }
    }

    fetchPricing()
  }, [])

  return { packages, features, isLoading, error }
}
