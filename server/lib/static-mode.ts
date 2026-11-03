/**
 * 静态构建模式判定 + 静态预览图 manifest 读取
 *
 * 静态模式(nuxt generate):页面 payload 中的论文预览图 URL 指向预生成的
 * 静态文件(public/updates-images/),而不是运行时不存在的 /api/... 接口。
 * SSR/开发模式:保持运行时 API URL。
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PaperImage } from './paper-images'
import { STATIC_IMAGES_DIR } from './paper-extract.mjs'

/**
 * 当前进程是否为静态构建(nuxt generate / --prerender):
 * - 环境变量 NUXT_PUBLIC_STATIC_PREVIEWS=1 显式开启
 * - 或命令行参数含 generate(nuxi generate 的构建/预渲染阶段都在同一进程)
 */
export function isStaticBuild(): boolean {
  return (
    process.env.NUXT_PUBLIC_STATIC_PREVIEWS === '1' ||
    process.argv.includes('generate') ||
    process.argv.includes('--prerender')
  )
}

/** manifest 文件位置(与 pregen-images.mjs 的输出保持一致) */
export function staticManifestPath(): string {
  return resolve(process.cwd(), 'public', STATIC_IMAGES_DIR, 'manifest.json')
}

type Manifest = Record<string, PaperImage[]>

let _manifest: Manifest | null | undefined

async function loadManifest(): Promise<Manifest | null> {
  if (_manifest !== undefined) return _manifest
  const path = staticManifestPath()
  if (!existsSync(path)) {
    _manifest = null
    return _manifest
  }
  try {
    _manifest = JSON.parse(await readFile(path, 'utf-8')) as Manifest
  } catch {
    _manifest = null
  }
  return _manifest
}

/** 静态模式下某条动态的论文预览图列表(manifest 缺失或未预生成时返回 []) */
export async function getStaticImagesFor(updateId: number): Promise<PaperImage[]> {
  const manifest = await loadManifest()
  if (!manifest) return []
  return manifest[String(updateId)] ?? []
}

/** 仅供测试:清空 manifest 缓存 */
export function resetStaticImagesCache(): void {
  _manifest = undefined
}
