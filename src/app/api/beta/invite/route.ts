// ============================================
// Beta Invite Code API
// Loop 9: 베타 초대코드 사용 및 검증
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/beta/invite
 * 초대코드 사용 및 크레딧 지급
 */
async function POSTHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, userId } = body

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'code and userId are required' },
        { status: 400 }
      )
    }

    // IP 및 User-Agent 추출
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // RPC 함수 호출
    const { data, error } = await supabase.rpc('use_beta_invite_code', {
      p_code: code.toUpperCase(),
      p_user_id: userId,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    })

    if (error) {
      safeLogger.error('[Beta Invite] RPC error', { error })
      return NextResponse.json(
        { error: 'Failed to process invite code' },
        { status: 500 }
      )
    }

    if (!data.success) {
      const errorMessages: Record<string, string> = {
        INVALID_OR_EXPIRED_CODE: '유효하지 않거나 만료된 초대코드입니다.',
        CODE_FULLY_USED: '초대코드 사용 한도에 도달했습니다.',
        ALREADY_USED_BY_USER: '이미 사용한 초대코드입니다.',
      }

      return NextResponse.json(
        {
          error: data.error,
          message: errorMessages[data.error] || '초대코드 처리 중 오류가 발생했습니다.'
        },
        { status: 400 }
      )
    }

    safeLogger.info('[Beta Invite] Code used successfully', {
      userId,
      code: code.substring(0, 10) + '***',
      credits: data.credits_granted,
      campaign: data.campaign,
    })

    return NextResponse.json({
      success: true,
      credits_granted: data.credits_granted,
      campaign: data.campaign,
      message: `${data.credits_granted} 크레딧이 지급되었습니다!`,
    })

  } catch (error) {
    safeLogger.error('[Beta Invite] Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/beta/invite?code=XXXX
 * 초대코드 유효성 검증 (사용하지 않음)
 */
async function GETHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'code parameter is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('beta_invite_codes')
      .select('code, campaign, bonus_credits, max_uses, used_count, expires_at, is_active')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { valid: false, message: '존재하지 않는 초대코드입니다.' },
        { status: 404 }
      )
    }

    // 유효성 검사
    const isExpired = data.expires_at && new Date(data.expires_at) < new Date()
    const isFullyUsed = data.max_uses && data.used_count >= data.max_uses
    const isValid = data.is_active && !isExpired && !isFullyUsed

    return NextResponse.json({
      valid: isValid,
      campaign: data.campaign,
      bonus_credits: data.bonus_credits,
      remaining_uses: data.max_uses ? data.max_uses - data.used_count : null,
      message: isValid
        ? `이 코드로 ${data.bonus_credits} 크레딧을 받을 수 있습니다.`
        : isExpired
          ? '만료된 초대코드입니다.'
          : isFullyUsed
            ? '사용 한도에 도달한 초대코드입니다.'
            : '비활성화된 초대코드입니다.',
    })

  } catch (error) {
    safeLogger.error('[Beta Invite] Validation error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
export const POST = withRateLimit(POSTHandler, { category: 'api' })
