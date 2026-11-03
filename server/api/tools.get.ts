import { queryAll } from '../db/database'

/** GET /api/tools —— 在线工具 */
export default defineEventHandler(() => {
  return queryAll(
    `SELECT id, title, description, url, maintainer, tag, status
     FROM tools
     WHERE visible = 1
     ORDER BY sort_order ASC, id ASC`,
  )
})
