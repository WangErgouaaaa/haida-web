import { queryAll } from '../db/database'

/**
 * GET /api/updates —— 最新进展时间线
 * 查询参数:
 *   limit=n    只取前 n 条(默认全部)
 *   featured=1 只取首页重点进展(默认取最新一条 featured)
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const limit = query.limit ? Number(query.limit) : 0
  const featuredOnly = query.featured === '1'

  let sql = `
    SELECT id, date, title, preview_title, summary, category, category_zh, tags, featured, featured_badge, paper_file
    FROM updates
    WHERE visible = 1
  `
  if (featuredOnly) sql += ` AND featured = 1 `
  // 按时间倒序:最新动态排在最上面(用户要求以时间排序,不再以手工 sort_order 为准)
  sql += ` ORDER BY date DESC, id DESC`
  if (limit > 0) sql += ` LIMIT ${Math.min(limit, 100)}`

  return queryAll(sql)
})
