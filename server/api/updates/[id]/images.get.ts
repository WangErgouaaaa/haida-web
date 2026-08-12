import { queryOne } from '../../../db/database'
import { getPaperImages } from '../../../lib/paper-images'

/**
 * GET /api/updates/:id/images —— 该条动态对应论文的关键图列表
 * 返回: { images: [{ name, url, size }] } (url 可直接用于 <img src>)
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid update id' })
  }
  const row = queryOne<{ paper_file: string }>(
    `SELECT paper_file FROM updates WHERE id = ? AND visible = 1`,
    id,
  )
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Update not found' })
  }
  const images = await getPaperImages(id, row.paper_file)
  return { images }
})
