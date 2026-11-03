import { describe, expect, it } from 'vitest'
import { parseLimitParam } from '../server/lib/query'

describe('parseLimitParam —— limit 参数校验', () => {
  it('缺省返回 0(不限)', () => {
    expect(parseLimitParam(undefined)).toBe(0)
    expect(parseLimitParam(null)).toBe(0)
    expect(parseLimitParam('')).toBe(0)
  })

  it('合法正整数原样返回', () => {
    expect(parseLimitParam('5')).toBe(5)
    expect(parseLimitParam('1')).toBe(1)
    expect(parseLimitParam('100')).toBe(100)
    expect(parseLimitParam(42)).toBe(42)
  })

  it('小数/负数/零/非数字一律抛错(审查问题 #7:?limit=2.9 曾导致 SQLite 500)', () => {
    for (const bad of ['2.9', '-1', '0', 'abc', '1e3', 'NaN', 'Infinity']) {
      expect(() => parseLimitParam(bad)).toThrow(RangeError)
    }
  })

  it('超过上限抛错', () => {
    expect(() => parseLimitParam('101')).toThrow(RangeError)
    expect(() => parseLimitParam('1000')).toThrow(RangeError)
  })
})
