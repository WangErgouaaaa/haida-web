import { queryAll } from '../db/database'

/** GET /api/signals —— 首页信号条(研究框架/核心问题/技术路径) */
export default defineEventHandler(() => {
  return queryAll(
    `SELECT id, label, title, text
     FROM signals
     WHERE visible = 1
     ORDER BY sort_order ASC, id ASC`,
  )
})
