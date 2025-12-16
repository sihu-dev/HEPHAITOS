// ============================================
// Supabase Module Exports
// ============================================

// Client
export { createClient, getSupabaseBrowserClient } from './client'

// Server
export {
  createServerSupabaseClient,
  createAdminClient,
  getCurrentUser,
  getUserWithProfile,
} from './server'

// Middleware
export { updateSession } from './middleware'

// Types
export * from './types'
