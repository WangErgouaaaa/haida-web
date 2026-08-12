/**
 * SQLite 连接封装(Node 22.5+ 内置 node:sqlite,零原生依赖)
 * - 懒加载单例,首次使用时自动建表
 * - 数据库路径默认 data/haida.db,可用环境变量 LAB_DB_PATH 覆盖
 */
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { SCHEMA } from './schema.mjs'

let _db: DatabaseSync | null = null

function resolveDbPath(): string {
  const configured = process.env.LAB_DB_PATH
  // Nitro 打包后 process.cwd() 是运行目录;优先用绝对路径
  const path = configured
    ? resolve(configured)
    : resolve(process.cwd(), 'data', 'haida.db')
  if (!existsSync(dirname(path))) {
    mkdirSync(dirname(path), { recursive: true })
  }
  return path
}

/**
 * 轻量迁移:为已存在的表补充新增列(SCHEMA 的 CREATE TABLE IF NOT EXISTS 不会改老表)
 * 每项: [表名, ALTER 语句]。列已存在时跳过。
 */
const MIGRATIONS: Array<[string, string]> = [
  ['updates', "ALTER TABLE updates ADD COLUMN paper_file TEXT NOT NULL DEFAULT ''"],
]

function runMigrations(db: DatabaseSync) {
  for (const [table, alterSql] of MIGRATIONS) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
    const colName = alterSql.match(/ADD COLUMN (\w+)/)?.[1]
    if (colName && !cols.some((c) => c.name === colName)) {
      db.exec(alterSql)
    }
  }
}

export function getDb(): DatabaseSync {
  if (_db) return _db
  const path = resolveDbPath()
  _db = new DatabaseSync(path)
  // 预渲染/SSR 会以多进程并发打开同一数据库:
  // busy_timeout 让 WAL/建表等写操作在锁竞争时等待而非立即报 SQLITE_BUSY(500)
  _db.exec('PRAGMA busy_timeout = 10000;')
  _db.exec('PRAGMA journal_mode = WAL;')
  // 首次启动自动建表
  _db.exec(SCHEMA)
  // 老库自动补列
  runMigrations(_db)
  return _db
}

/** 查询多行 */
export function queryAll<T = Record<string, unknown>>(sql: string, ...params: SQLInputValue[]): T[] {
  return getDb().prepare(sql).all(...params) as T[]
}

/** 查询单行 */
export function queryOne<T = Record<string, unknown>>(sql: string, ...params: SQLInputValue[]): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined
}

/** 写入(INSERT/UPDATE/DELETE),返回 lastInsertRowid / changes */
export function execute(sql: string, ...params: SQLInputValue[]) {
  return getDb().prepare(sql).run(...params)
}

export function closeDb() {
  _db?.close()
  _db = null
}
