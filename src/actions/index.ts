// ============================================
// Server Actions Index
// 모든 Server Actions의 중앙 export
// ============================================

export {
  getStrategiesAction,
  getStrategyAction,
  createStrategyAction,
  updateStrategyAction,
  deleteStrategyAction,
  changeStrategyStatusAction,
  type GetStrategiesOptions,
  type CreateStrategyInput,
  type UpdateStrategyInput,
} from './strategies'

export {
  getUserProfileAction,
  updateUserProfileAction,
  completeOnboardingAction,
  saveOnboardingProgressAction,
  checkOnboardingStatusAction,
} from './user-profile'

export type { ActionResponse } from './utils/action-wrapper'
