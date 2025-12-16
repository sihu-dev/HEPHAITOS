import { NextRequest, NextResponse } from 'next/server'
import type { Strategy, ApiResponse } from '@/types'
import {
  findStrategyById,
  updateStrategy,
  deleteStrategy,
} from '@/lib/mock-data'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/strategies/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Use shared mock data
    const strategy = findStrategyById(id)

    if (!strategy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Strategy with id ${id} not found`,
          },
        },
        { status: 404 }
      )
    }

    const response: ApiResponse<Strategy> = {
      success: true,
      data: strategy,
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch strategy',
        },
      },
      { status: 500 }
    )
  }
}

// PUT /api/strategies/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Validate input
    if (body.name && typeof body.name === 'string') {
      body.name = body.name.slice(0, 100) // Limit name length
    }
    if (body.description && typeof body.description === 'string') {
      body.description = body.description.slice(0, 500) // Limit description
    }

    const updatedStrategy = updateStrategy(id, body)

    if (!updatedStrategy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Strategy with id ${id} not found`,
          },
        },
        { status: 404 }
      )
    }

    const response: ApiResponse<Strategy> = {
      success: true,
      data: updatedStrategy,
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update strategy',
        },
      },
      { status: 500 }
    )
  }
}

// DELETE /api/strategies/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const deleted = deleteStrategy(id)

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Strategy with id ${id} not found`,
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete strategy',
        },
      },
      { status: 500 }
    )
  }
}

// PATCH /api/strategies/[id] - For partial updates (e.g., status change)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Validate status if provided
    const validStatuses = ['draft', 'backtesting', 'ready', 'running', 'paused', 'stopped']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
        },
        { status: 400 }
      )
    }

    const updatedStrategy = updateStrategy(id, body)

    if (!updatedStrategy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Strategy with id ${id} not found`,
          },
        },
        { status: 404 }
      )
    }

    const response: ApiResponse<Strategy> = {
      success: true,
      data: updatedStrategy,
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update strategy',
        },
      },
      { status: 500 }
    )
  }
}
