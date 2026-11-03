import { queryOne } from '../../db/database'

/**
 * GET /api/updates/:id —— 单条动态详情(含论文文件路径)
 */
export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid update id' })
  }
  const row = queryOne<Record<string, unknown>>(
    `SELECT id, date, title, preview_title, summary, category, category_zh, tags, featured, featured_badge, paper_file
     FROM updates
     WHERE id = ? AND visible = 1`,
    id,
  )
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Update not found' })
  }
  return row
})
