#!/usr/bin/env node
/**
 * 静态产物断言 —— CI 门禁(nuxt generate 之后运行):
 * 1. 关键路由 HTML 存在且包含站点标题文本
 * 2. 各页面 payload 非空(防止"产物来自空数据库"回归,审查问题 #2)
 * 3. 论文/成员详情页已预渲染(member/1、papers/1 等)
 * 4. 论文预览图 manifest 与静态图片文件一一对应
 *
 * 用法:node scripts/assert-dist.mjs [outputDir]   (默认 .output/public)
 * 任一断言失败以非零码退出。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const outDir = resolve(process.argv[2] || '.output/public')
const failures = []

function mustExist(rel) {
  const abs = resolve(outDir, rel)
  if (!existsSync(abs)) failures.push(`缺少文件: ${rel}`)
  return abs
}

function readJson(rel) {
  const abs = mustExist(rel)
  if (!abs) return null
  try {
    return JSON.parse(readFileSync(abs, 'utf-8'))
  } catch {
    failures.push(`payload 不是合法 JSON: ${rel}`)
    return null
  }
}

// 1) 首页 HTML 骨架
const indexHtml = mustExist('index.html')
if (existsSync(indexHtml)) {
  const html = readFileSync(indexHtml, 'utf-8')
  if (!html.includes('机器学习与多组学分析研究团队')) {
    failures.push('index.html 缺少站点标题文本,页面可能为空')
  }
}

// 2) 各页面 payload 非空(内容来自数据库,空 payload = 空数据库产物)
function assertPayload(rel, check) {
  const json = readJson(rel)
  if (json && !check(json)) failures.push(`${rel} 内容为空(空数据库产物)`)
}

assertPayload('_payload.json', (j) => JSON.stringify(j).length > 200)
assertPayload('updates/_payload.json', (j) => {
  const s = JSON.stringify(j)
  // 用 seed 数据中的稳定标题做内容标记(防空库产物)
  return s.includes('自然科学基金') && s.includes('毒力因子') && s.length > 500
})
assertPayload('members/_payload.json', (j) => {
  const s = JSON.stringify(j)
  return s.includes('PI') && s.includes('李宏') && s.length > 500
})

// 3) 详情页已预渲染(动态路由被爬虫发现并生成)
for (const rel of ['member/1/index.html', 'papers/1/index.html', 'updates/index.html', 'members/index.html']) {
  mustExist(rel)
}

// 4) 论文预览图:manifest 中的每个 URL 都应有对应文件
const manifestRel = 'updates-images/manifest.json'
const manifest = readJson(manifestRel)
if (manifest) {
  const ids = Object.keys(manifest)
  if (!ids.length) failures.push('updates-images/manifest.json 为空,没有预生成任何预览图')
  for (const id of ids) {
    for (const img of manifest[id]) {
      const rel = img.url.replace(/^\//, '')
      const abs = resolve(outDir, rel)
      if (!existsSync(abs)) failures.push(`manifest 引用缺失图片: ${rel}`)
      else if (statSync(abs).size <= 0) failures.push(`manifest 引用的图片为空: ${rel}`)
    }
  }
} else {
  failures.push('缺少 updates-images/manifest.json(静态预览图未预生成)')
}

// 5) 静态环境下 payload 不得残留 /api/ 图片 URL
const updatesPayload = readJson('updates/_payload.json')
if (updatesPayload) {
  const s = JSON.stringify(updatesPayload)
  if (s.includes('/api/updates/')) failures.push('updates payload 含运行时 API URL,静态预览未生效')
}

if (failures.length) {
  console.error(`[assert-dist] 断言失败(${outDir}):`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`[assert-dist] 全部通过: ${outDir}`)
