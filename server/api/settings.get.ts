import { queryAll } from '../db/database'

/** GET /api/settings —— 站点级配置(名称/学院/联系方式等) */
export default defineEventHandler(() => {
  const rows = queryAll<{ key: string; value: string }>('SELECT key, value FROM settings')
  const out: Record<string, string> = {}
  for (const row of rows) out[row.key] = row.value
  return out
})
