#!/usr/bin/env node
/**
 * 静态预览图预生成脚本 —— 在 `nuxt generate` 之前运行:
 *
 * 1. 从 SQLite 读取所有带论文文件的可见动态
 * 2. 用与运行时 API 完全相同的提取逻辑(DOCX word/media)选出关键图
 * 3. 写入 public/updates-images/<updateId>/<index>.<ext> + manifest.json
 *
 * 静态站点(GitHub Pages)没有 /api 运行时,页面 payload 中的预览图 URL
 * 直接指向这些静态文件;manifest.json 供服务端在生成 payload 时拼接 URL。
 *
 * 用法:npm run generate (脚本已串联,无需手动调用)
 */
import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  extractDocxMediaAsync,
  resolvePaperWithinRoot,
  STATIC_IMAGES_DIR,
  staticImageUrl,
} from '../server/lib/paper-extract.mjs'

const scriptDir = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = resolve(scriptDir, '..')

const dbPath = process.env.LAB_DB_PATH
  ? resolve(process.env.LAB_DB_PATH)
  : resolve(projectRoot, 'data', 'haida.db')
const publicRoot = resolve(projectRoot, 'public')
const outDir = resolve(publicRoot, STATIC_IMAGES_DIR)

if (!existsSync(dbPath)) {
  console.error(`[pregen-images] 数据库不存在: ${dbPath}\n请先运行 npm run db:seed`)
  process.exit(1)
}

// 清理旧产物,保证 manifest 与文件一一对应
if (existsSync(outDir)) {
  for (const entry of readdirSync(outDir)) rmSync(resolve(outDir, entry), { recursive: true, force: true })
}
mkdirSync(outDir, { recursive: true })

const db = new DatabaseSync(dbPath)
const rows = db
  .prepare('SELECT id, paper_file FROM updates WHERE visible = 1 AND paper_file != \'\'')
  .all()

const manifest = {}
let imageCount = 0
let failed = 0

for (const row of rows) {
  const id = Number(row.id)
  const paperFile = String(row.paper_file)
  const abs = resolvePaperWithinRoot(publicRoot, paperFile)

  if (!abs || !existsSync(abs)) {
    console.warn(`[pregen-images] update#${id} 论文文件不可用(路径非法或不存在): ${paperFile}`)
    failed++
    continue
  }
  const size = statSync(abs).size
  if (size <= 0) {
    console.warn(`[pregen-images] update#${id} 论文文件为空: ${paperFile}`)
    failed++
    continue
  }

  const entries = await extractDocxMediaAsync(await readFile(abs))
  if (!entries.length) {
    console.warn(`[pregen-images] update#${id} 未提取到可渲染图片: ${paperFile}`)
    failed++
    continue
  }

  const dir = resolve(outDir, String(id))
  mkdirSync(dir, { recursive: true })
  const images = []
  entries.forEach((e, i) => {
    const ext = extname(e.name).toLowerCase()
    const fileName = `${i}${ext}`
    writeFileSync(resolve(dir, fileName), e.data)
    images.push({ name: e.name, url: staticImageUrl(id, i, ext), size: e.size })
    imageCount++
  })
  manifest[String(id)] = images
  console.log(`[pregen-images] update#${id} → ${images.length} 张图 (${paperFile})`)
}

writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8')
console.log(
  `[pregen-images] 完成: ${rows.length} 条动态, ${imageCount} 张预览图, ${failed} 条失败; manifest → public/${STATIC_IMAGES_DIR}/manifest.json`,
)
