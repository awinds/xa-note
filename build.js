#!/usr/bin/env node

// 简单的构建脚本，确保依赖可用
console.log('🔧 XA Note - Cloudflare Pages 构建脚本')
console.log('📦 检查依赖...')

import fs from 'fs'
import path from 'path'

// 检查关键依赖是否存在
const requiredDeps = ['hono', 'nanoid']
const nodeModulesPath = './node_modules'

let allDepsFound = true

for (const dep of requiredDeps) {
  const depPath = path.join(nodeModulesPath, dep)
  if (fs.existsSync(depPath)) {
    console.log(`✅ ${dep} - 已安装`)
  } else {
    console.log(`❌ ${dep} - 未找到`)
    allDepsFound = false
  }
}

if (allDepsFound) {
  console.log('🎉 所有依赖检查完成，准备部署！')
  process.exit(0)
} else {
  console.log('❌ 缺少必要依赖，请运行 npm install')
  process.exit(1)
}