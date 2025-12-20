// ============================================
// Strategy Copy API
// Loop 13: 전략 복사
// ============================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { safeLogger } from '@/lib/utils/safe-logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/strategies/copy
 * 공개 전략 복사
 */
export async function POST(req: Request) {
  try {
    const { strategyId } = await req.json()
    const userId = await requireUserId(req)

    // RPC로 전략 복사
    const { data, error } = await supabaseAdmin.rpc('copy_strategy', {
      p_source_strategy_id: strategyId,
      p_user_id: userId,
    })

    if (error) {
      console.error('[Strategy Copy] RPC error:', error)
      return NextResponse.json({ error: 'COPY_FAILED' }, { status: 500 })
    }

    return NextResponse.json({
      newStrategyId: data,
      message: '전략이 복사되었습니다. 나만의 전략으로 수정해보세요!',
    })
  } catch (error) {
    console.error('[Strategy Copy] POST error:', error)
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

/**
 * 사용자 인증 (Supabase Auth)
 */
async function requireUserId(req: Request): Promise<string> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    safeLogger.warn('[Strategy Copy] Unauthorized access attempt')
    throw new Error('UNAUTHORIZED')
  }

  return user.id
}
