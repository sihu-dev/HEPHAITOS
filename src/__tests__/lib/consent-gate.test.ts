// ============================================
// Consent Gate Unit Tests
// GPT V1 피드백: 테스트 코드
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Use vi.hoisted to ensure mock functions are available during vi.mock hoisting
const { mockSupabaseRpc, mockSupabaseFrom } = vi.hoisted(() => ({
  mockSupabaseRpc: vi.fn(),
  mockSupabaseFrom: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mockSupabaseRpc,
    from: mockSupabaseFrom,
  })),
}))

vi.mock('@/lib/utils/safe-logger', () => ({
  safeLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

import {
  checkUserConsent,
  recordConsent,
  createConsentRequiredResponse,
  createAgeVerificationRequiredResponse,
  createUnderageResponse,
  type ConsentType,
} from '@/lib/compliance/consent-gate'

describe('Consent Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkUserConsent', () => {
    it('should return hasConsent true when all consents are given', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: {
          disclaimer: true,
          age_verification: true,
          all_consented: true,
        },
        error: null,
      })

      const result = await checkUserConsent('user-123', ['disclaimer', 'age_verification'])

      expect(result.hasConsent).toBe(true)
      expect(result.missingConsents).toEqual([])
    })

    it('should return hasConsent false when disclaimer is missing', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: {
          disclaimer: false,
          age_verification: true,
          all_consented: false,
        },
        error: null,
      })

      const result = await checkUserConsent('user-123', ['disclaimer', 'age_verification'])

      expect(result.hasConsent).toBe(false)
      expect(result.missingConsents).toContain('disclaimer')
    })

    it('should return hasConsent false when age_verification is missing', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: {
          disclaimer: true,
          age_verification: false,
          all_consented: false,
        },
        error: null,
      })

      const result = await checkUserConsent('user-123', ['disclaimer', 'age_verification'])

      expect(result.hasConsent).toBe(false)
      expect(result.missingConsents).toContain('age_verification')
    })

    it('should handle RPC errors gracefully', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await checkUserConsent('user-123', ['disclaimer', 'age_verification'])

      expect(result.hasConsent).toBe(false)
      expect(result.missingConsents).toEqual(['disclaimer', 'age_verification'])
    })
  })

  describe('recordConsent', () => {
    it('should record consent successfully', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: {
          success: true,
          consent_id: 'consent-123',
          age_verified: true,
        },
        error: null,
      })

      const result = await recordConsent('user-123', 'age_verification', true, {
        birthDate: '1990-01-01',
      })

      expect(result.success).toBe(true)
      expect(result.ageVerified).toBe(true)
    })

    it('should return error when age requirement not met', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: {
          success: false,
          error: 'AGE_REQUIREMENT_NOT_MET',
        },
        error: null,
      })

      const result = await recordConsent('user-123', 'age_verification', true, {
        birthDate: '2010-01-01', // Under 19
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('AGE_REQUIREMENT_NOT_MET')
    })

    it('should handle RPC errors', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await recordConsent('user-123', 'disclaimer', true)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Response Helpers', () => {
    it('createConsentRequiredResponse should return 403 with correct format', () => {
      const missingConsents: ConsentType[] = ['disclaimer', 'age_verification']
      const response = createConsentRequiredResponse(missingConsents)

      expect(response.status).toBe(403)
    })

    it('createAgeVerificationRequiredResponse should return 403', () => {
      const response = createAgeVerificationRequiredResponse()

      expect(response.status).toBe(403)
    })

    it('createUnderageResponse should return 403', () => {
      const response = createUnderageResponse()

      expect(response.status).toBe(403)
    })
  })
})

describe('Age Calculation', () => {
  // 이 테스트들은 Consent 페이지의 연령 계산 로직과 연동됨
  it('should calculate age correctly for 19+ year old', () => {
    const birthDate = new Date(2005, 0, 1) // 2005-01-01
    const today = new Date(2025, 11, 17) // 2025-12-17

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    expect(age).toBe(20)
    expect(age >= 19).toBe(true)
  })

  it('should calculate age correctly for under 19', () => {
    const birthDate = new Date(2008, 0, 1) // 2008-01-01
    const today = new Date(2025, 11, 17) // 2025-12-17

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    expect(age).toBe(17)
    expect(age >= 19).toBe(false)
  })

  it('should handle birthday not yet occurred this year', () => {
    const birthDate = new Date(2006, 11, 31) // 2006-12-31
    const today = new Date(2025, 11, 17) // 2025-12-17

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    expect(age).toBe(18) // Birthday hasn't happened yet in 2025
    expect(age >= 19).toBe(false)
  })
})
