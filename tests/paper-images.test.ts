import { describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import JSZip from 'jszip'
import {
  isSafeRelativePaperPath,
  resolvePaperWithinRoot,
  extractDocxMediaAsync,
  readPaperMedia,
  staticImageUrl,
} from '../server/lib/paper-extract.mjs'

const root = join(tmpdir(), 'paper-images-test-root')

describe('isSafeRelativePaperPath —— 论文文件路径预校验', () => {
  it('合法相对路径通过', () => {
    expect(isSafeRelativePaperPath('files/papers/a.docx')).toBe(true)
    expect(isSafeRelativePaperPath('a.zip')).toBe(true)
    expect(isSafeRelativePaperPath('dir/sub/b.docx')).toBe(true)
  })

  it('拒绝目录逃逸、绝对路径、盘符、UNC、NUL', () => {
    for (const bad of [
      '../secret.docx',
      '..\\..\\etc\\passwd.docx',
      'C:\\windows\\system32\\a.docx',
      'C:/x.docx',
      '\\\\server\\share\\a.docx',
      '/etc/passwd.docx',
      'a\x00b.docx',
    ]) {
      expect(isSafeRelativePaperPath(bad), `should reject: ${bad}`).toBe(false)
    }
  })

  it('拒绝非 docx/zip 扩展名', () => {
    for (const bad of ['a.exe', 'a.sh', 'a.docx.exe', 'a', 'a.DOCX ', 'a.doc']) {
      expect(isSafeRelativePaperPath(bad), `should reject: ${bad}`).toBe(false)
    }
  })
})

describe('resolvePaperWithinRoot —— 规范化路径包含性检查', () => {
  it('目录内路径解析为根内的绝对路径', () => {
    const p = resolvePaperWithinRoot(root, 'files/papers/a.docx')
    expect(p).toBe(join(root, 'files', 'papers', 'a.docx'))
  })

  it('../ 逃逸被拒绝(审查问题 #4)', () => {
    expect(resolvePaperWithinRoot(root, '../outside.docx')).toBeNull()
    expect(resolvePaperWithinRoot(root, 'files/../../outside.docx')).toBeNull()
    expect(resolvePaperWithinRoot(root, '..\\..\\outside.docx')).toBeNull()
  })

  it('非法输入直接拒绝', () => {
    expect(resolvePaperWithinRoot(root, 'C:\\x.docx')).toBeNull()
    expect(resolvePaperWithinRoot(root, '')).toBeNull()
  })
})

describe('extractDocxMediaAsync / readPaperMedia —— 真实 zip 提取', () => {
  async function makeDocxWithImages(): Promise<Buffer> {
    const zip = new JSZip()
    zip.file('word/media/image1.png', Buffer.from('png-bytes-1'))
    zip.file('word/media/image2.png', Buffer.alloc(60 * 1024, 7)) // 60KB 大图
    zip.file('word/document.xml', '<w:document/>')
    return zip.generateAsync({ type: 'nodebuffer' })
  }

  it('只提取 word/media 下可渲染图片,按体积降序', async () => {
    const entries = await extractDocxMediaAsync(await makeDocxWithImages())
    expect(entries.length).toBe(2)
    const [largest, smallest] = entries
    expect(largest).toBeDefined()
    expect(smallest).toBeDefined()
    expect(largest!.size).toBeGreaterThanOrEqual(smallest!.size)
    expect(entries.map((e) => e.name)).toEqual(['image2.png', 'image1.png'])
  })

  it('readPaperMedia 拒绝目录外的论文文件', async () => {
    expect(await readPaperMedia(root, '../outside.docx')).toBeNull()
  })

  it('readPaperMedia 返回 null 当文件不存在', async () => {
    expect(await readPaperMedia(root, 'nope.docx')).toBeNull()
  })

  it('staticImageUrl 生成根相对 URL', () => {
    expect(staticImageUrl(1, 0, '.png')).toBe('/updates-images/1/0.png')
    expect(staticImageUrl(12, 3, 'jpg')).toBe('/updates-images/12/3.jpg')
  })
})

describe('readPaperMedia —— 临时目录端到端', () => {
  const dir = mkdtempSync(join(tmpdir(), 'paper-media-'))
  it('从临时目录读取合法 DOCX 并提取媒体', async () => {
    const zip = new JSZip()
    zip.file('word/media/fig1.png', Buffer.alloc(50 * 1024, 1))
    writeFileSync(join(dir, 'paper.docx'), await zip.generateAsync({ type: 'nodebuffer' }))

    const entries = await readPaperMedia(dir, 'paper.docx')
    expect(entries).not.toBeNull()
    expect(entries!.length).toBe(1)
    const first = entries![0]!
    expect(first.name).toBe('fig1.png')
  })
  it('清理临时目录', () => {
    rmSync(dir, { recursive: true, force: true })
  })
})
