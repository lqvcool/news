import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // 检查是否已存在admin@example.com用户
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })

    if (existingAdmin) {
      console.log('管理员账号已存在:')
      console.log('邮箱: admin@example.com')
      console.log('密码: admin123456')
      return
    }

    // 创建管理员账号
    const hashedPassword = await bcrypt.hash('admin123456', 10)

    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: '系统管理员',
        passwordHash: hashedPassword,
        emailVerified: true
      }
    })

    console.log('管理员账号创建成功:')
    console.log('邮箱: admin@example.com')
    console.log('密码: admin123456')
    console.log('用户ID:', admin.id)

  } catch (error) {
    console.error('创建管理员账号失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()