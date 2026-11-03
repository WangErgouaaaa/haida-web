import { queryAll } from '../db/database'

/** GET /api/databases —— 数据库资源 */
export default defineEventHandler(() => {
  return queryAll(
    `SELECT id, title, description, url, maintainer, tag, status
     FROM databases
     WHERE visible = 1
     ORDER BY sort_order ASC, id ASC`,
  )
})
