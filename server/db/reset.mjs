#!/usr/bin/env node
/** 删除数据库文件(重置到空白状态),然后重新跑 npm run db:seed 即可获得全新示例数据 */
import { rmSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const DB_PATH = process.env.LAB_DB_PATH
  ? resolve(process.env.LAB_DB_PATH)
  : resolve(process.cwd(), 'data', 'haida.db')

for (const suffix of ['', '-journal', '-wal', '-shm']) {
  const f = DB_PATH + suffix
  if (existsSync(f)) rmSync(f)
}
console.log('[reset] 数据库已重置')
