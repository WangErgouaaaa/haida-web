import { describe, expect, it } from 'vitest'
import { groupMembers } from '../server/lib/members'

const row = (role: string, name = role) => ({ role, name })

describe('groupMembers —— 成员角色分组', () => {
  it('标准角色按固定顺序输出', () => {
    const { groups, others } = groupMembers([row('PhD', 'a'), row('PI', 'b'), row('Master', 'c')])
    expect(groups.map((g) => g.role)).toEqual(['PI', 'PhD', 'Master'])
    expect(others).toEqual([])
  })

  it('自定义角色恒返回 others,即使标准角色齐全(审查问题 #8)', () => {
    const rows = [
      row('PI'), row('Postdoc'), row('PhD'), row('Master'), row('RA'), row('Alumni'),
      row('Researcher'), row('Researcher', 'second'),
    ]
    const { groups, others } = groupMembers(rows)
    expect(groups.map((g) => g.role)).toEqual(['PI', 'Postdoc', 'PhD', 'Master', 'RA', 'Alumni'])
    expect(others).toEqual([{ role: 'Researcher', items: [rows[6], rows[7]] }])
  })

  it('只有自定义角色时 groups 为空,others 照常返回', () => {
    const { groups, others } = groupMembers([row('Visitor')])
    expect(groups).toEqual([])
    expect(others).toEqual([{ role: 'Visitor', items: [{ role: 'Visitor', name: 'Visitor' }] }])
  })

  it('角色缺失归入 Other', () => {
    const { groups, others } = groupMembers([{ name: 'x' }, { name: 'y', role: null }])
    expect(groups).toEqual([])
    expect(others).toEqual([
      { role: 'Other', items: [{ name: 'x' }, { name: 'y', role: null }] },
    ])
  })

  it('空列表返回空分组', () => {
    const { groups, others } = groupMembers([])
    expect(groups).toEqual([])
    expect(others).toEqual([])
  })
})
