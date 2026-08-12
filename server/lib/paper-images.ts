/**
 * 论文关键图提取 —— 从 DOCX(本质是 zip)中解出 word/media/ 下的图片
 * - 关键图启发式:过滤掉过小的图片(期刊 logo / 图标通常 < 40KB),按体积取最大的前几张
 * - 只保留浏览器可直接渲染的格式(png/jpg/gif/webp/bmp/svg),排除 emf/wmf/tif 等矢量或专用格式
 * - 结果按文件 mtime + size 做内存缓存,DOCX 更新后自动失效
 */
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import JSZip from 'jszip'

export interface PaperImage {
  name: string
  url: string
  size: number
}

interface PaperImageEntry extends PaperImage {
  data: Buffer
}

interface CacheEntry {
  mtimeMs: number
  size: number
  images: PaperImageEntry[]
}

const cache = new Map<number, CacheEntry>()

/** 单篇论文最多取 4 张关键图 */
const MAX_IMAGES = 4
/** 小于该体积的图片视为 logo/图标,不作为关键图 */
const MIN_BYTES = 40 * 1024

export const IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
}

/** 定位论文文件:优先项目 public/,部署产物回退 .output/public/ */
function resolvePaperPath(paperFile: string): string {
  const candidates = [
    resolve(process.cwd(), 'public', paperFile),
    resolve(process.cwd(), '.output', 'public', paperFile),
  ]
  return candidates.find((p) => existsSync(p)) ?? candidates[0]
}

/**
 * 返回论文的关键图列表(含二进制数据,供列表接口与图片接口共用)
 * 无论文文件或无可用图片时返回 []
 */
export async function getPaperImageEntries(updateId: number, paperFile: string): Promise<PaperImageEntry[]> {
  if (!paperFile) return []

  const abs = resolvePaperPath(paperFile)
  if (!existsSync(abs)) return []

  const fileStat = await stat(abs)
  const hit = cache.get(updateId)
  if (hit && hit.mtimeMs === fileStat.mtimeMs && hit.size === fileStat.size) {
    return hit.images
  }

  const zip = await JSZip.loadAsync(await readFile(abs))
  const media = zip.folder('word/media')

  const entries: Array<{ name: string; size: number; data: Buffer }> = []
  if (media) {
    const files = Object.values(media.files).filter((f) => !f.dir)
    for (const f of files) {
      const ext = extname(f.name).slice(1).toLowerCase()
      if (!IMAGE_MIME[ext]) continue // emf/wmf/tif 等浏览器无法直接渲染,跳过
      const data = await f.async('nodebuffer')
      entries.push({ name: basename(f.name), size: data.length, data })
    }
  }

  // 关键图筛选:优先取 >= MIN_BYTES 的"大图";大图不足 2 张时退回全部
  const big = entries.filter((e) => e.size >= MIN_BYTES)
  const pool = big.length >= 2 ? big : entries
  pool.sort((a, b) => b.size - a.size)

  const images = pool.slice(0, MAX_IMAGES).map((e, i) => ({
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
