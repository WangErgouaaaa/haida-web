import { queryAll } from '../db/database'
import { groupMembers } from '../lib/members'

/** GET /api/members —— 全部成员,按角色分组(标准角色 + 自定义角色恒返回) */
export default defineEventHandler(() => {
  const rows = queryAll<{
    id: number
    name: string
    name_en: string
    role: string
    position: string
    email: string
    website: string
    bio: string
    photo: string
    avatar_text: string
    sort_order: number
  }>(
    `SELECT id, name, name_en, role, position, email, website, bio, photo, avatar_text, sort_order
     FROM members
     WHERE visible = 1
     ORDER BY sort_order ASC, id ASC`,
  )
  return groupMembers(rows)
})
