// ============================================
// Supabase Client (Browser)
// ============================================

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// Check if Supabase environment variables are configured
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'

export const isSupabaseConfigured = Boolean(USE_SUPABASE && SUPABASE_URL && SUPABASE_ANON_KEY)

export function createClient() {
  if (!isSupabaseConfigured) {
    // Return null when Supabase is not configured
    // This allows the app to run without Supabase for development/demo
    return null
  }
  return createBrowserClient<Database>(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!
  )
}

// Singleton client for client components
let browserClient: ReturnType<typeof createClient> | undefined

export function getSupabaseBrowserClient() {
  if (browserClient === undefined) {
    browserClient = createClient()
  }
  return browserClient
}
