import { queryOne } from '../../db/database'

/** GET /api/members/:id —— 单个成员完整信息(含详情 sections) */
export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid member id' })
  }
  const row = queryOne<Record<string, unknown>>(
    `SELECT id, name, name_en, role, position, email, website, bio, photo, avatar_text, detail
     FROM members
     WHERE id = ? AND visible = 1`,
    id,
  )
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' })
  }
  let detail: unknown = null
  try {
    detail = JSON.parse(String(row.detail || ''))
  } catch {
    detail = null
  }
  return { ...row, detail }
})
