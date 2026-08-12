import { queryAll } from '../db/database'

/** GET /api/research-areas —— 研究方向(首页卡片 + 研究方向页) */
export default defineEventHandler(() => {
  return queryAll(
    `SELECT id, number, title_en, title_zh, description, methods, visual
     FROM research_areas
     WHERE visible = 1
     ORDER BY sort_order ASC, id ASC`,
  )
})
