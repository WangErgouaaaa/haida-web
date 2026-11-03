/**
 * 类型声明:server/lib/paper-extract.mjs(纯 ESM,无 TS 源码)
 * 使 TS/vue-tsc 能对 .mjs 导入做类型检查。
 */

export interface MediaEntry {
  name: string
  size: number
  data: Buffer
}

export declare const IMAGE_MIME: Record<string, string>
export declare const PAPER_EXTENSIONS: ReadonlySet<string>
export declare const MAX_IMAGES: number
export declare const MIN_BYTES: number
export declare const MAX_PAPER_BYTES: number
export declare const STATIC_IMAGES_DIR: string

export declare function isSafeRelativePaperPath(paperFile: string): boolean
export declare function resolvePaperWithinRoot(root: string, paperFile: string): string | null
export declare function extractDocxMediaAsync(buffer: Buffer): Promise<MediaEntry[]>
export declare function readPaperMedia(root: string, paperFile: string): Promise<MediaEntry[] | null>
export declare function staticImageUrl(updateId: number, index: number, ext: string): string
