/**
 * 论文关键图服务 —— 供 API 运行时提取论文预览图
 * - 安全校验委托给 paper-extract.mjs:路径包含性 / 扩展名白名单 / 大小上限
 * - 结果按文件 mtime + size 做内存缓存,DOCX 更新后自动失效
 */
import { stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import {
  IMAGE_MIME,
  readPaperMedia,
  resolvePaperWithinRoot,
  type MediaEntry,
} from './paper-extract.mjs'

export { IMAGE_MIME }

export interface PaperImage {
  name: string
  url: string
  size: number
}

interface CacheEntry {
  mtimeMs: number
  size: number
  images: Array<PaperImage & { data: Buffer }>
}

const cache = new Map<number, CacheEntry>()

/** 定位论文文件:优先项目 public/,部署产物回退 .output/public/ */
function paperRoots(): string[] {
  return [
    resolve(process.cwd(), 'public'),
    resolve(process.cwd(), '.output', 'public'),
  ]
}

/**
 * 返回论文的关键图列表(含二进制数据,供列表接口与图片接口共用)
 * 无论文文件、校验失败或无可用图片时返回 []
 */
export async function getPaperImageEntries(updateId: number, paperFile: string): Promise<Array<PaperImage & { data: Buffer }>> {
  if (!paperFile) return []

  // 在允许的根目录内解析并校验(路径包含性/扩展名/大小)
  let entries: MediaEntry[] | null = null
  let foundPath: string | null = null
  for (const root of paperRoots()) {
    const resolved = resolvePaperWithinRoot(root, paperFile)
    if (!resolved || !existsSync(resolved)) continue
    const media = await readPaperMedia(root, paperFile)
    entries = media
    foundPath = resolved
    break
  }
  if (!entries || !foundPath) return []

  const fileStat = await stat(foundPath)
  const hit = cache.get(updateId)
  if (hit && hit.mtimeMs === fileStat.mtimeMs && hit.size === fileStat.size) {
    return hit.images
  }

  const images: Array<PaperImage & { data: Buffer }> = entries.map((e, i) => ({
    name: e.name,
    url: `/api/updates/${updateId}/images/${i}`,
    size: e.size,
    data: e.data,
  }))

  cache.set(updateId, { mtimeMs: fileStat.mtimeMs, size: fileStat.size, images })
  return images
}

/** 论文关键图列表(不含二进制,供 JSON 接口返回) */
export async function getPaperImages(updateId: number, paperFile: string): Promise<PaperImage[]> {
  const entries = await getPaperImageEntries(updateId, paperFile)
  return entries.map(({ name, url, size }) => ({ name, url, size }))
}

/** 取图片扩展名对应的 MIME(未知类型回退 octet-stream) */
export function imageMimeFor(name: string): string {
  return IMAGE_MIME[extname(name).slice(1).toLowerCase()] ?? 'application/octet-stream'
}
