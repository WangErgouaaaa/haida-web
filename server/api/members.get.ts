import { queryAll } from '../db/database'

/** GET /api/members —— 全部成员,按角色分组(与 lab-site 一致) */
export default defineEventHandler(() => {
  const rows = queryAll<Record<string, unknown>>(
    `SELECT id, name, name_en, role, position, email, website, bio, photo, avatar_text, sort_order
     FROM members
     WHERE visible = 1
     ORDER BY sort_order ASC, id ASC`,
  )
  const order = ['PI', 'Postdoc', 'PhD', 'Master', 'RA', 'Alumni']
  const groups = new Map<string, typeof rows>()
  for (const row of rows) {
    const role = String(row.role || 'Other')
    if (!groups.has(role)) groups.set(role, [])
    groups.get(role)!.push(row)
  }
  return {
    groups: order.filter((r) => groups.has(r)).map((r) => ({ role: r, items: groups.get(r)! })),
    others: order.filter((r) => !groups.has(r)).length ? [...groups.entries()].filter(([r]) => !order.includes(r)).map(([role, items]) => ({ role, items })) : [],
  }
})
