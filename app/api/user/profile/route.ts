import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { findUserById, prisma } from '@/lib/auth'
import { updateProfileSchema } from '@/lib/validations'
import { z } from 'zod'

async function handleGetProfile(request: AuthenticatedRequest) {
  try {
    const user = await findUserById(request.user!.userId)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { user }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}

async function handleUpdateProfile(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: request.user!.userId },
      data: {
        ...(validatedData.name && { name: validatedData.name })
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: '用户信息更新成功'
    })
  } catch (error) {
    console.error('Update profile error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '更新用户信息失败' },
      { status: 500 }
    )
  }
}

export const GET = (request: NextRequest) => withAuth(request, handleGetProfile)
export const PUT = (request: NextRequest) => withAuth(request, handleUpdateProfile)