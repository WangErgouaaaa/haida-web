import { queryAll } from '../db/database'
import { parseLimitParam } from '../lib/query'
import { getPaperImages } from '../lib/paper-images'
import { isStaticBuild, getStaticImagesFor } from '../lib/static-mode'

/**
 * GET /api/updates —— 最新进展时间线
 * 查询参数:
 *   limit=n      只取前 n 条(正整数,1-100;缺省为全部)
 *   featured=1   只取首页重点进展
 *   with_images=1 每条附带论文关键图列表(静态构建时返回预生成静态 URL)
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  let limit: number
  try {
    limit = parseLimitParam(query.limit)
  } catch (e) {
    throw createError({
      statusCode: 400,
      statusMessage: e instanceof Error ? e.message : 'Invalid limit',
    })
  }
  const featuredOnly = query.featured === '1'
  const withImages = query.with_images === '1'

  let sql = `
    SELECT id, date, title, preview_title, summary, category, category_zh, tags, featured, featured_badge, paper_file
    FROM updates
    WHERE visible = 1
  `
  if (featuredOnly) sql += ` AND featured = 1 `
  // 按时间倒序:最新动态排在最上面(用户要求以时间排序,不再以手工 sort_order 为准)
  sql += ` ORDER BY date DESC, id DESC`
  const params: number[] = []
  if (limit > 0) {
    sql += ` LIMIT ?`
    params.push(limit)
  }

  const rows = queryAll<Record<string, unknown>>(sql, ...params)

  if (!withImages) return rows

  // 静态构建:读取预生成 manifest 中的静态 URL;SSR:运行时实时提取
  const staticMode = isStaticBuild()
  const items: Array<Record<string, unknown>> = []
  for (const row of rows) {
    const id = Number(row.id)
    const paperFile = String(row.paper_file || '')
    const images = paperFile
      ? staticMode
        ? await getStaticImagesFor(id)
        : await getPaperImages(id, paperFile)
      : []
    items.push({ ...row, images })
  }
  return items
})
