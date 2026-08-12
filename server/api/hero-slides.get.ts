import { queryAll } from '../db/database'

/** GET /api/hero-slides —— 首页 Hero 轮播 */
export default defineEventHandler(() => {
  return queryAll(
    `SELECT id, kicker, title, text, action1_text, action1_url, action2_text, action2_url, visual
     FROM hero_slides
     WHERE visible = 1
     ORDER BY sort_order ASC, id ASC`,
  )
})
