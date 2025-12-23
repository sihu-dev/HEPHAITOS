// ============================================
// Supabase Server Client
// ============================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Check if Supabase is configured
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const isConfigured = USE_SUPABASE && SUPABASE_URL && SUPABASE_ANON_KEY

// Server client with user session (for authenticated routes)
export async function createServerSupabaseClient() {
  if (!isConfigured) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Handle cookie setting in Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Handle cookie removal in Server Component
          }
        },
      },
    }
  )
}

// Singleton admin client (bypasses RLS)
let adminClient: ReturnType<typeof createServerClient<Database>> | null = null

export function createAdminClient() {
  if (!isConfigured || !SUPABASE_SERVICE_KEY) {
    return null
  }

  if (!adminClient) {
    adminClient = createServerClient<Database>(
      SUPABASE_URL!,
      SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }
  return adminClient
}

// Helper: Get current user with error handling
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// Helper: Get user with profile
export async function getUserWithProfile() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}
