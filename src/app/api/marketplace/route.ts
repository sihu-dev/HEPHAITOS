// ============================================
// Strategy Marketplace API
// Loop 20: 전략 마켓플레이스 v1
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================
// Types
// ============================================

interface MarketplaceListing {
  id: string
  title: string
  description: string
  category: string
  risk_level: string
  timeframe: string
  tags: string[]
  pricing_type: string
  price_credits: number
  monthly_credits: number
  verified_return: number | null
  verified_win_rate: number | null
  verified_sharpe: number | null
  copy_count: number
  rating_avg: number
  rating_count: number
  creator_name: string
  creator_verified: boolean
  featured: boolean
  created_at: string
}

// ============================================
// GET /api/marketplace
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'listings'
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'popular'
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const listingId = searchParams.get('listingId')
    const creatorId = searchParams.get('creatorId')

    switch (type) {
      case 'listings': {
        // 전략 목록 조회
        const { data, error } = await supabase.rpc('get_popular_listings', {
          p_category: category,
          p_sort_by: sortBy,
          p_limit: limit,
          p_offset: offset,
        })

        if (error) throw error

        return NextResponse.json({
          type: 'listings',
          listings: data,
          pagination: { limit, offset },
        })
      }

      case 'listing': {
        // 단일 리스팅 상세
        if (!listingId) {
          return NextResponse.json({ error: 'listingId required' }, { status: 400 })
        }

        const { data, error } = await supabase
          .from('strategy_listings')
          .select(`
            *,
            creator:creator_profiles!creator_id(
              display_name,
              verified,
              avatar_url,
              total_sales,
              avg_rating,
              follower_count
            )
          `)
          .eq('id', listingId)
          .eq('status', 'approved')
          .single()

        if (error || !data) {
          return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
        }

        // 조회수 증가
        await supabase
          .from('strategy_listings')
          .update({ view_count: data.view_count + 1 })
          .eq('id', listingId)

        return NextResponse.json({
          type: 'listing',
          listing: data,
        })
      }

      case 'reviews': {
        // 리뷰 목록
        if (!listingId) {
          return NextResponse.json({ error: 'listingId required' }, { status: 400 })
        }

        const { data, error } = await supabase
          .from('strategy_reviews')
          .select(`
            id,
            rating,
            title,
            content,
            verified_purchase,
            helpful_count,
            created_at,
            user:auth.users!user_id(raw_user_meta_data)
          `)
          .eq('listing_id', listingId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1)

        if (error) throw error

        return NextResponse.json({
          type: 'reviews',
          reviews: data,
        })
      }

      case 'categories': {
        // 카테고리 통계
        const { data, error } = await supabase
          .from('category_stats')
          .select('*')

        if (error) throw error

        return NextResponse.json({
          type: 'categories',
          categories: data,
        })
      }

      case 'stats': {
        // 마켓플레이스 통계
        const { data, error } = await supabase
          .from('marketplace_stats')
          .select('*')
          .single()

        if (error) throw error

        return NextResponse.json({
          type: 'stats',
          stats: data,
        })
      }

      case 'leaderboard': {
        // 크리에이터 리더보드
        const { data, error } = await supabase
          .from('creator_leaderboard')
          .select('*')
          .limit(limit)

        if (error) throw error

        return NextResponse.json({
          type: 'leaderboard',
          creators: data,
        })
      }

      case 'creator': {
        // 크리에이터 프로필
        if (!creatorId) {
          return NextResponse.json({ error: 'creatorId required' }, { status: 400 })
        }

        const { data: profile, error: profileError } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', creatorId)
          .single()

        if (profileError || !profile) {
          return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        const { data: listings, error: listingsError } = await supabase
          .from('strategy_listings')
          .select('*')
          .eq('creator_id', creatorId)
          .eq('status', 'approved')
          .order('copy_count', { ascending: false })

        if (listingsError) throw listingsError

        return NextResponse.json({
          type: 'creator',
          profile,
          listings,
        })
      }

      case 'featured': {
        // 추천 전략
        const { data, error } = await supabase
          .from('strategy_listings')
          .select(`
            *,
            creator:creator_profiles!creator_id(
              display_name,
              verified,
              avatar_url
            )
          `)
          .eq('status', 'approved')
          .eq('featured', true)
          .order('copy_count', { ascending: false })
          .limit(10)

        if (error) throw error

        return NextResponse.json({
          type: 'featured',
          listings: data,
        })
      }

      case 'search': {
        // 검색
        const query = searchParams.get('q')
        if (!query) {
          return NextResponse.json({ error: 'Query required' }, { status: 400 })
        }

        const { data, error } = await supabase
          .from('strategy_listings')
          .select(`
            *,
            creator:creator_profiles!creator_id(
              display_name,
              verified
            )
          `)
          .eq('status', 'approved')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .order('copy_count', { ascending: false })
          .limit(limit)

        if (error) throw error

        return NextResponse.json({
          type: 'search',
          query,
          listings: data,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[Marketplace API] GET error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST /api/marketplace
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // TODO: 인증 확인
    const userId = body.userId // 실제로는 세션에서 가져와야 함

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    switch (action) {
      case 'create_listing': {
        const {
          title,
          description,
          strategy_prompt,
          category,
          risk_level,
          timeframe,
          tags = [],
          pricing_type = 'free',
          price_credits = 0,
          monthly_credits = 0,
        } = body

        if (!title || !description || !strategy_prompt || !category || !risk_level || !timeframe) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('create_strategy_listing', {
          p_user_id: userId,
          p_title: title,
          p_description: description,
          p_strategy_prompt: strategy_prompt,
          p_category: category,
          p_risk_level: risk_level,
          p_timeframe: timeframe,
          p_tags: tags,
          p_pricing_type: pricing_type,
          p_price_credits: price_credits,
          p_monthly_credits: monthly_credits,
        })

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'create_listing',
          result: data,
        })
      }

      case 'purchase': {
        const { listingId, purchaseType = 'one_time' } = body

        if (!listingId) {
          return NextResponse.json({ error: 'listingId required' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('purchase_strategy', {
          p_user_id: userId,
          p_listing_id: listingId,
          p_purchase_type: purchaseType,
        })

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'purchase',
          result: data,
        })
      }

      case 'review': {
        const { listingId, rating, title, content } = body

        if (!listingId || !rating) {
          return NextResponse.json({ error: 'listingId and rating required' }, { status: 400 })
        }

        if (rating < 1 || rating > 5) {
          return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('create_strategy_review', {
          p_user_id: userId,
          p_listing_id: listingId,
          p_rating: rating,
          p_title: title || null,
          p_content: content || null,
        })

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'review',
          result: data,
        })
      }

      case 'bookmark': {
        const { listingId, remove = false } = body

        if (!listingId) {
          return NextResponse.json({ error: 'listingId required' }, { status: 400 })
        }

        if (remove) {
          const { error } = await supabase
            .from('strategy_bookmarks')
            .delete()
            .eq('user_id', userId)
            .eq('listing_id', listingId)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('strategy_bookmarks')
            .upsert({
              user_id: userId,
              listing_id: listingId,
            })

          if (error) throw error
        }

        return NextResponse.json({
          success: true,
          action: 'bookmark',
          removed: remove,
        })
      }

      case 'follow': {
        const { creatorId, unfollow = false } = body

        if (!creatorId) {
          return NextResponse.json({ error: 'creatorId required' }, { status: 400 })
        }

        if (creatorId === userId) {
          return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
        }

        if (unfollow) {
          const { error } = await supabase
            .from('creator_followers')
            .delete()
            .eq('follower_id', userId)
            .eq('creator_id', creatorId)

          if (error) throw error

          // 팔로워 수 감소
          await supabase.rpc('decrement_follower_count', { p_creator_id: creatorId })
        } else {
          const { error } = await supabase
            .from('creator_followers')
            .upsert({
              follower_id: userId,
              creator_id: creatorId,
            })

          if (error) throw error

          // 팔로워 수 증가
          await supabase
            .from('creator_profiles')
            .update({ follower_count: supabase.rpc('increment_count', { row_id: creatorId }) })
            .eq('user_id', creatorId)
        }

        return NextResponse.json({
          success: true,
          action: 'follow',
          unfollowed: unfollow,
        })
      }

      case 'update_listing': {
        const { listingId, updates } = body

        if (!listingId || !updates) {
          return NextResponse.json({ error: 'listingId and updates required' }, { status: 400 })
        }

        // 본인 리스팅인지 확인
        const { data: listing, error: checkError } = await supabase
          .from('strategy_listings')
          .select('creator_id')
          .eq('id', listingId)
          .single()

        if (checkError || !listing || listing.creator_id !== userId) {
          return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        const { error } = await supabase
          .from('strategy_listings')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
            status: 'pending_review', // 수정 시 재검토
          })
          .eq('id', listingId)

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'update_listing',
        })
      }

      case 'update_profile': {
        const { displayName, bio, twitterHandle, youtubeChannel, websiteUrl } = body

        const { error } = await supabase
          .from('creator_profiles')
          .upsert({
            user_id: userId,
            display_name: displayName,
            bio,
            twitter_handle: twitterHandle,
            youtube_channel: youtubeChannel,
            website_url: websiteUrl,
            updated_at: new Date().toISOString(),
          })

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'update_profile',
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[Marketplace API] POST error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
