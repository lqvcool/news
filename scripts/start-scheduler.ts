import { taskScheduler } from '../lib/scheduler'
import { prisma } from '../lib/prisma'

async function startScheduler() {
  try {
    console.log('🚀 启动 NewsHub 调度器...')

    // 连接数据库
    await prisma.$connect()
    console.log('✓ 数据库连接成功')

    // 启动所有已启用的定时任务
    taskScheduler.startAllTasks()
    console.log('✓ 定时任务已启动')

    // 显示任务状态
    const tasks = taskScheduler.getTaskStatus()
    console.log('\n📋 当前任务状态:')
    tasks.forEach(task => {
      const status = task.enabled ? '✅ 已启用' : '❌ 已禁用'
      const running = task.running ? ' (运行中)' : ''
      console.log(`  ${task.name}: ${status} - ${task.schedule}${running}`)
    })

    console.log('\n✅ 调度器启动完成，按 Ctrl+C 停止')

    // 监听进程退出信号
    process.on('SIGINT', () => {
      console.log('\n🛑 正在停止调度器...')
      taskScheduler.shutdown()
      prisma.$disconnect()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('\n🛑 正在停止调度器...')
      taskScheduler.shutdown()
      prisma.$disconnect()
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ 调度器启动失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  startScheduler()
}

export { startScheduler }