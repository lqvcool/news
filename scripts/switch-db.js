#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, '../prisma');
const mainSchema = path.join(schemaDir, 'schema.prisma');
const sqliteSchema = path.join(schemaDir, 'schema.sqlite.prisma');
const postgresqlSchema = path.join(schemaDir, 'schema.postgresql.prisma');

const command = process.argv[2];

if (command === 'sqlite') {
  // 切换到SQLite（本地开发）
  console.log('切换到SQLite（本地开发）...');
  if (fs.existsSync(sqliteSchema)) {
    fs.copyFileSync(sqliteSchema, mainSchema);
    console.log('✅ 已切换到SQLite配置');
  } else {
    console.error('❌ SQLite schema文件不存在');
  }
} else if (command === 'postgresql') {
  // 切换到PostgreSQL（生产环境）
  console.log('切换到PostgreSQL（生产环境）...');
  // 当前的schema.prisma已经是PostgreSQL版本
  console.log('✅ 已切换到PostgreSQL配置');
} else if (command === 'status') {
  // 查看当前配置
  const currentSchema = fs.readFileSync(mainSchema, 'utf8');
  const isPostgreSQL = currentSchema.includes('provider = "postgresql"');
  const isSQLite = currentSchema.includes('provider = "sqlite"');

  console.log('当前数据库配置:');
  if (isPostgreSQL) {
    console.log('✅ PostgreSQL (生产环境)');
  } else if (isSQLite) {
    console.log('✅ SQLite (本地开发)');
  } else {
    console.log('❓ 未知配置');
  }
} else {
  console.log('用法:');
  console.log('  node scripts/switch-db.js sqlite     - 切换到SQLite（本地开发）');
  console.log('  node scripts/switch-db.js postgresql - 切换到PostgreSQL（生产环境）');
  console.log('  node scripts/switch-db.js status     - 查看当前配置');
}