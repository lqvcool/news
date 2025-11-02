import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const country = searchParams.get('country')
    const active = searchParams.get('active')

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (country) {
      where.country = country
    }

    if (active !== null) {
      where.active = active === 'true'
    }

    const sources = await prisma.newsSource.findMany({
      where,
      select: {
        id: true,
        name: true,
        url: true,
        type: true,
        category: true,
        country: true,
        active: true,
        createdAt: true
      },
      orderBy: [
        { country: 'asc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: { sources }
    })

  } catch (error) {
    console.error('Get news sources error:', error)
    return NextResponse.json(
      { error: '获取新闻源失败' },
      { status: 500 }
    )
  }
}