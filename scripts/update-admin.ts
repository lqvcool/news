import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function updateAdmin() {
  try {
    // 先删除原有的admin@example.com用户
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })

    if (existingAdmin) {
      await prisma.user.delete({
        where: { email: 'admin@example.com' }
      })
      console.log('已删除原有的管理员账号: admin@example.com')
    }

    // 检查新邮箱是否已存在
    const existingNewAdmin = await prisma.user.findUnique({
      where: { email: 'lqvcool@163.com' }
    })

    if (existingNewAdmin) {
      // 如果新邮箱已存在，只更新密码
      const hashedPassword = await bcrypt.hash('lq898101', 10)

      const updatedAdmin = await prisma.user.update({
        where: { email: 'lqvcool@163.com' },
        data: {
          name: '系统管理员',
          passwordHash: hashedPassword,
          emailVerified: true
        }
      })

      console.log('管理员账号密码更新成功:')
      console.log('邮箱: lqvcool@163.com')
      console.log('密码: lq898101')
      console.log('用户ID:', updatedAdmin.id)
    } else {
      // 创建新的管理员账号
      const hashedPassword = await bcrypt.hash('lq898101', 10)

      const admin = await prisma.user.create({
        data: {
          email: 'lqvcool@163.com',
          name: '系统管理员',
          passwordHash: hashedPassword,
          emailVerified: true
        }
      })

      console.log('新管理员账号创建成功:')
      console.log('邮箱: lqvcool@163.com')
      console.log('密码: lq898101')
      console.log('用户ID:', admin.id)
    }

  } catch (error) {
    console.error('更新管理员账号失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdmin()