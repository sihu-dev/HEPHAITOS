// ============================================
// User Profile Server Actions
// 사용자 프로필 및 온보딩 관련 Server Actions
// ============================================

'use server'

import {
  getUserProfile,
  updateUserProfile,
  completeOnboarding,
  saveOnboardingProgress,
  isOnboardingCompleted,
  type UserProfile,
  type OnboardingData,
} from '@/lib/services/user-profile'
import { withAuth, validateRequired } from './utils/action-wrapper'
import { revalidateUserProfile, revalidateDashboard } from './utils/revalidation'
import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Actions
// ============================================

/**
 * 사용자 프로필 조회
 * @example
 * const result = await getUserProfileAction()
 * if (result.success) {
 *   console.log(result.data)
 * }
 */
export const getUserProfileAction = withAuth(
  async (userId: string): Promise<UserProfile | null> => {
    return await getUserProfile(userId)
  },
  'getUserProfileAction'
)

/**
 * 사용자 프로필 업데이트
 * @example
 * const result = await updateUserProfileAction({
 *   nickname: 'NewNickname',
 *   investmentStyle: 'aggressive'
 * })
 * if (result.success) {
 *   console.log('Updated:', result.data)
 * }
 */
export const updateUserProfileAction = withAuth(
  async (
    userId: string,
    updates: Partial<OnboardingData>
  ): Promise<UserProfile> => {
    // Validation
    if (updates.nickname !== undefined) {
      if (!updates.nickname || updates.nickname.trim().length === 0) {
        throw new Error('닉네임을 입력해주세요')
      }
      if (updates.nickname.length > 20) {
        throw new Error('닉네임은 20자 이내로 입력해주세요')
      }
    }

    // Sanitize
    const sanitized: Partial<OnboardingData> = {}
    if (updates.nickname) sanitized.nickname = updates.nickname.trim()
    if (updates.investmentStyle) sanitized.investmentStyle = updates.investmentStyle
    if (updates.experience) sanitized.experience = updates.experience
    if (updates.interests) sanitized.interests = updates.interests
    if (updates.painPoints) sanitized.painPoints = updates.painPoints

    // Update
    const updated = await updateUserProfile(userId, sanitized)

    if (!updated) {
      throw new Error('프로필 업데이트에 실패했습니다')
    }

    // Revalidate
    await revalidateUserProfile(userId)
    await revalidateDashboard()

    safeLogger.info('[updateUserProfileAction] Profile updated', {
      userId,
      updates: Object.keys(sanitized),
    })

    return updated
  },
  'updateUserProfileAction'
)

/**
 * 온보딩 완료
 * @example
 * const result = await completeOnboardingAction({
 *   nickname: 'MyNickname',
 *   investmentStyle: 'moderate',
 *   experience: 'intermediate',
 *   interests: ['stocks', 'crypto'],
 *   painPoints: ['volatility', 'timing']
 * })
 * if (result.success) {
 *   console.log('Onboarding completed')
 * }
 */
export const completeOnboardingAction = withAuth(
  async (userId: string, data: OnboardingData): Promise<UserProfile> => {
    // Validation
    const nicknameError = validateRequired(data.nickname, '닉네임')
    if (nicknameError) {
      throw new Error(nicknameError.error)
    }

    if (data.nickname.length > 20) {
      throw new Error('닉네임은 20자 이내로 입력해주세요')
    }

    const investmentStyleError = validateRequired(data.investmentStyle, '투자 성향')
    if (investmentStyleError) {
      throw new Error(investmentStyleError.error)
    }

    const experienceError = validateRequired(data.experience, '경험 수준')
    if (experienceError) {
      throw new Error(experienceError.error)
    }

    // Sanitize
    const sanitized: OnboardingData = {
      nickname: data.nickname.trim(),
      investmentStyle: data.investmentStyle,
      experience: data.experience,
      interests: data.interests ?? [],
      painPoints: data.painPoints ?? [],
    }

    // Complete onboarding
    const profile = await completeOnboarding(userId, sanitized)

    // Revalidate
    await revalidateUserProfile(userId)
    await revalidateDashboard()

    safeLogger.info('[completeOnboardingAction] Onboarding completed', {
      userId,
      nickname: profile.nickname,
      investmentStyle: profile.investmentStyle,
    })

    return profile
  },
  'completeOnboardingAction'
)

/**
 * 온보딩 진행 상태 저장 (중간 저장)
 * @example
 * const result = await saveOnboardingProgressAction(2, {
 *   nickname: 'MyNickname'
 * })
 * if (result.success) {
 *   console.log('Progress saved')
 * }
 */
export const saveOnboardingProgressAction = withAuth(
  async (
    userId: string,
    step: number,
    partialData: Partial<OnboardingData>
  ): Promise<{ saved: true }> => {
    // Validation
    if (step < 0 || step > 6) {
      throw new Error('유효하지 않은 단계입니다')
    }

    // Sanitize
    const sanitized: Partial<OnboardingData> = {}
    if (partialData.nickname) sanitized.nickname = partialData.nickname.trim()
    if (partialData.investmentStyle) sanitized.investmentStyle = partialData.investmentStyle
    if (partialData.experience) sanitized.experience = partialData.experience
    if (partialData.interests) sanitized.interests = partialData.interests
    if (partialData.painPoints) sanitized.painPoints = partialData.painPoints

    // Save progress
    await saveOnboardingProgress(userId, step, sanitized)

    safeLogger.info('[saveOnboardingProgressAction] Progress saved', {
      userId,
      step,
    })

    return { saved: true }
  },
  'saveOnboardingProgressAction'
)

/**
 * 온보딩 완료 여부 확인
 * @example
 * const result = await checkOnboardingStatusAction()
 * if (result.success) {
 *   console.log('Completed:', result.data.completed)
 * }
 */
export const checkOnboardingStatusAction = withAuth(
  async (userId: string): Promise<{ completed: boolean }> => {
    const completed = await isOnboardingCompleted(userId)

    return { completed }
  },
  'checkOnboardingStatusAction'
)
