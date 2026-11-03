/**
 * 成员角色分组 —— 纯函数,可单测。
 * 标准角色按固定顺序输出到 groups;任何不在标准角色表内的自定义角色,
 * 一律按出现顺序归入 others(不再依赖"标准角色缺失"这种隐性条件)。
 */

/** 标准角色展示顺序 */
export const STANDARD_ROLES = ['PI', 'Postdoc', 'PhD', 'Master', 'RA', 'Alumni'] as const

export interface MemberRow {
  role?: string | null
}

export interface MemberGroup {
  role: string
  items: MemberRow[]
}

export interface MemberGroups {
  groups: MemberGroup[]
  others: MemberGroup[]
}

export function groupMembers<T extends MemberRow>(rows: T[]): MemberGroups {
  const groups = new Map<string, T[]>()
  for (const row of rows) {
    const role = String(row.role || 'Other')
    if (!groups.has(role)) groups.set(role, [])
    groups.get(role)!.push(row)
  }

  const standard: MemberGroup[] = STANDARD_ROLES
    .filter((r) => groups.has(r))
    .map((r) => ({ role: r, items: groups.get(r)! }))

  // 自定义角色恒返回:只要数据库里出现了标准角色以外的角色,就按出现顺序列出
  const custom: MemberGroup[] = [...groups.entries()]
    .filter(([role]) => !(STANDARD_ROLES as readonly string[]).includes(role))
    .map(([role, items]) => ({ role, items }))

  return { groups: standard, others: custom }
}
