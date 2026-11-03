/**
 * 论文 DOCX 媒体提取核心 —— 纯 ESM JavaScript 模块,同时被三处复用:
 * 1. server/lib/paper-images.ts   (SSR/运行时 API 提取)
 * 2. scripts/pregen-images.mjs    (静态构建前预生成预览图)
 * 3. 单元测试
 * 不依赖 Nuxt 自动导入,不包含 TS 语法(类型见 paper-extract.d.mts),
 * 任何 Node 22+ 版本可直接 import。
 */
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import JSZip from 'jszip'

/** 浏览器可直接渲染的图片格式 */
export const IMAGE_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
}

/** 允许读取的论文文件扩展名(仅 Word 文档及其 zip 变体) */
export const PAPER_EXTENSIONS = new Set(['.docx', '.zip'])

/** 单篇论文最多取 4 张关键图 */
export const MAX_IMAGES = 4
/** 小于该体积的图片视为 logo/图标,不作为关键图 */
export const MIN_BYTES = 40 * 1024
/** 论文文件大小上限:100MB,防止超大文件拖垮内存/IO */
export const MAX_PAPER_BYTES = 100 * 1024 * 1024

/** 静态预览图输出目录名(相对 public/) */
export const STATIC_IMAGES_DIR = 'updates-images'

/**
 * 校验 paperFile 是否是可安全定位的相对路径:
 * - 非空、非绝对路径、无盘符/UNC 前缀
 * - 无 NUL 字节
 * - 扩展名在白名单内(docx/zip)
 */
export function isSafeRelativePaperPath(paperFile) {
  if (typeof paperFile !== 'string' || paperFile.length === 0) return false
  if (paperFile.includes('\0')) return false
  // 绝对路径、盘符(C:)、UNC(\\server)、POSIX 根(/x)一律拒绝
  if (isAbsolute(paperFile)) return false
  if (/^[a-zA-Z]:/.test(paperFile) || paperFile.startsWith('\\\\')) return false
  // 拒绝任何 .. 路径段(../x、a/../../b 等目录逃逸形式)
  const segments = paperFile.split(/[\\/]+/)
  if (segments.some((seg) => seg === '..')) return false
  const ext = extname(paperFile).toLowerCase()
  return PAPER_EXTENSIONS.has(ext)
}

/**
 * 把 paperFile 安全解析到 root 目录内:
 * - 规范化后必须仍位于 root 之内(拒绝 ../ 逃逸)
 * - 通过则返回绝对路径,否则返回 null
 */
export function resolvePaperWithinRoot(root, paperFile) {
  if (!isSafeRelativePaperPath(paperFile)) return null
  const rootNorm = resolve(root)
  const candidate = resolve(rootNorm, paperFile)
  const rel = relative(rootNorm, candidate)
  const contained = rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
  return contained ? candidate : null
}

/**
 * 从 DOCX(本质是 zip)中解出 word/media/ 下的图片并做关键图筛选:
 * 只保留浏览器可渲染格式,过滤过小图片,按体积取最大的前 MAX_IMAGES 张。
 * 返回按体积降序的图片条目。
 */
export async function extractDocxMediaAsync(buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const media = zip.folder('word/media')

  const entries = []
  if (media) {
    const files = Object.values(media.files).filter((f) => !f.dir)
    for (const f of files) {
      const ext = extname(f.name).slice(1).toLowerCase()
      if (!IMAGE_MIME[ext]) continue // emf/wmf/tif 等浏览器无法直接渲染,跳过
      const data = await f.async('nodebuffer')
      entries.push({ name: f.name.split('/').pop() ?? f.name, size: data.length, data })
    }
  }

  // 关键图筛选:优先取 >= MIN_BYTES 的"大图";大图不足 2 张时退回全部
  const big = entries.filter((e) => e.size >= MIN_BYTES)
  const pool = big.length >= 2 ? big : entries
  pool.sort((a, b) => b.size - a.size)

  return pool.slice(0, MAX_IMAGES)
}

/**
 * 读取并提取论文关键图(含所有校验):
 * 1. 路径包含性检查(拒绝 ../ 逃逸)
 * 2. 扩展名白名单(docx/zip)
 * 3. 文件大小上限(100MB)
 * 文件不存在或校验失败返回 null。
 */
export async function readPaperMedia(root, paperFile) {
  const abs = resolvePaperWithinRoot(root, paperFile)
  if (!abs || !existsSync(abs)) return null
  const fileStat = await stat(abs)
  if (fileStat.size <= 0 || fileStat.size > MAX_PAPER_BYTES) return null
  return extractDocxMediaAsync(await readFile(abs))
}

/** 静态预览图的 URL(根相对,渲染时由页面补 baseURL) */
export function staticImageUrl(updateId, index, ext) {
  return `/${STATIC_IMAGES_DIR}/${updateId}/${index}.${String(ext).replace(/^\./, '')}`
}
