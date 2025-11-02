import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AuthError } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
  }
}

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    // 将用户信息添加到请求对象
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = {
      userId: payload.userId,
      email: payload.email
    }

    return await handler(authenticatedRequest)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export function createSuccessResponse(data: any, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

export function createErrorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status })
}