import { queryOne } from '../../../../db/database'
import { getPaperImageEntries, imageMimeFor } from '../../../../lib/paper-images'

/**
 * GET /api/updates/:id/images/:index —— 返回论文第 index 张关键图的二进制内容
 * index 由列表接口给出(基于缓存的内部序号),天然避免路径穿越
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const index = Number(getRouterParam(event, 'index'))
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(index) || index < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid params' })
  }
  const row = queryOne<{ paper_file: string }>(
    `SELECT paper_file FROM updates WHERE id = ? AND visible = 1`,
    id,
  )
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Update not found' })
  }
  const images = await getPaperImageEntries(id, row.paper_file)
  const image = images[index]
  if (!image) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }
  setHeader(event, 'content-type', imageMimeFor(image.name))
  setHeader(event, 'cache-control', 'public, max-age=3600')
  return image.data
})
