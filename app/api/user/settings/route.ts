import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const userSettingsSchema = z.object({
  selectedSources: z.array(z.string()).optional(),
  pushTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为 HH:MM').optional(),
  pushFrequency: z.enum(['daily', 'weekly', 'custom']).optional(),
  emailFormat: z.enum(['html', 'text']).optional(),
  keywordsFilter: z.array(z.string()).optional(),
  categoriesFilter: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
})

async function handleGetUserSettings(request: AuthenticatedRequest) {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: request.user!.userId }
    })

    // 如果设置不存在，创建默认设置
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: request.user!.userId,
          selectedSources: JSON.stringify([]),
          keywordsFilter: JSON.stringify([]),
          categoriesFilter: JSON.stringify([])
        }
      })
    }

    // 解析JSON字段
    const parsedSettings = {
      ...settings,
      selectedSources: JSON.parse(settings.selectedSources || '[]'),
      keywordsFilter: JSON.parse(settings.keywordsFilter || '[]'),
      categoriesFilter: JSON.parse(settings.categoriesFilter || '[]')
    }

    return NextResponse.json({
      success: true,
      data: { settings: parsedSettings }
    })

  } catch (error) {
    console.error('获取用户设置错误:', error)
    return NextResponse.json(
      { error: '获取用户设置失败' },
      { status: 500 }
    )
  }
}

async function handleUpdateUserSettings(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const validatedData = userSettingsSchema.parse(body)

    // 查找现有设置
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId: request.user!.userId }
    })

    const updateData: any = {}

    // 处理各个字段
    if (validatedData.selectedSources !== undefined) {
      updateData.selectedSources = JSON.stringify(validatedData.selectedSources)
    }

    if (validatedData.pushTime !== undefined) {
      updateData.pushTime = validatedData.pushTime
    }

    if (validatedData.pushFrequency !== undefined) {
      updateData.pushFrequency = validatedData.pushFrequency
    }

    if (validatedData.emailFormat !== undefined) {
      updateData.emailFormat = validatedData.emailFormat
    }

    if (validatedData.keywordsFilter !== undefined) {
      updateData.keywordsFilter = JSON.stringify(validatedData.keywordsFilter)
    }

    if (validatedData.categoriesFilter !== undefined) {
      updateData.categoriesFilter = JSON.stringify(validatedData.categoriesFilter)
    }

    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive
    }

    let settings

    if (existingSettings) {
      // 更新现有设置
      settings = await prisma.userSettings.update({
        where: { userId: request.user!.userId },
        data: updateData
      })
    } else {
      // 创建新设置
      settings = await prisma.userSettings.create({
        data: {
          userId: request.user!.userId,
          selectedSources: updateData.selectedSources || JSON.stringify([]),
          pushTime: updateData.pushTime || '08:00',
          pushFrequency: updateData.pushFrequency || 'daily',
          emailFormat: updateData.emailFormat || 'html',
          keywordsFilter: updateData.keywordsFilter || JSON.stringify([]),
          categoriesFilter: updateData.categoriesFilter || JSON.stringify([]),
          isActive: updateData.isActive !== undefined ? updateData.isActive : true
        }
      })
    }

    // 解析JSON字段返回
    const parsedSettings = {
      ...settings,
      selectedSources: JSON.parse(settings.selectedSources || '[]'),
      keywordsFilter: JSON.parse(settings.keywordsFilter || '[]'),
      categoriesFilter: JSON.parse(settings.categoriesFilter || '[]')
    }

    return NextResponse.json({
      success: true,
      data: { settings: parsedSettings },
      message: '设置保存成功'
    })

  } catch (error) {
    console.error('更新用户设置错误:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '更新设置失败' },
      { status: 500 }
    )
  }
}

export const GET = (request: NextRequest) => withAuth(request, handleGetUserSettings)
export const PUT = (request: NextRequest) => withAuth(request, handleUpdateUserSettings)