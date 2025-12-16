// ============================================
// API Middleware Exports
// ============================================

export {
  withRateLimit,
  checkRateLimit,
  checkUserRateLimit,
  getCategoryFromPath,
  type RateLimitCategory,
  type RateLimitOptions,
} from './rate-limit'

export {
  withErrorHandler,
  withApiMiddleware,
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequestBody,
  validateQueryParams,
  type ApiHandlerOptions,
  type ApiResponse,
} from './error-handler'
