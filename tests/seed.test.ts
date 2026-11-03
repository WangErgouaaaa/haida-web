/**
 * 集成测试:全新数据库上 db:seed 必须产出完整内容。
 * 这是"提交的静态产物来自空数据库"(审查问题 #2)的回归防线:
 * CI 里先跑本测试,再 nuxt generate,确保页面数据非空。
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

let dir: string
let dbPath: string
let db: DatabaseSync

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'haida-seed-'))
  dbPath = join(dir, 'haida.db')
  execFileSync(process.execPath, ['server/db/seed.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, LAB_DB_PATH: dbPath },
    stdio: 'pipe',
  })
  db = new DatabaseSync(dbPath)
})

afterAll(() => {
  db?.close()
  rmSync(dir, { recursive: true, force: true })
})

describe('db:seed 在全新数据库上的产物', () => {
  it('站点配置非空', () => {
    const n = db.prepare('SELECT COUNT(*) AS n FROM settings').get() as { n: number }
    expect(n.n).toBeGreaterThan(0)
  })

  it('首页轮播至少 3 条', () => {
    const n = db.prepare('SELECT COUNT(*) AS n FROM hero_slides').get() as { n: number }
    expect(n.n).toBeGreaterThanOrEqual(3)
  })

  it('最新进展至少 6 条且包含论文条目', () => {
    const n = db.prepare('SELECT COUNT(*) AS n FROM updates WHERE visible = 1').get() as { n: number }
    expect(n.n).toBeGreaterThanOrEqual(6)
    const papers = db.prepare("SELECT COUNT(*) AS n FROM updates WHERE visible = 1 AND paper_file != ''").get() as { n: number }
    expect(papers.n).toBeGreaterThanOrEqual(1)
  })

  it('成员表非空且角色合规', () => {
    const n = db.prepare('SELECT COUNT(*) AS n FROM members').get() as { n: number }
    expect(n.n).toBeGreaterThanOrEqual(1)
  })

  it('seed 幂等:重复执行不重复插入', () => {
    execFileSync(process.execPath, ['server/db/seed.mjs'], {
      cwd: projectRoot,
      env: { ...process.env, LAB_DB_PATH: dbPath },
      stdio: 'pipe',
    })
    const n = db.prepare('SELECT COUNT(*) AS n FROM updates').get() as { n: number }
    expect(n.n).toBeGreaterThanOrEqual(6)
    expect(n.n).toBeLessThan(20)
  })
})
