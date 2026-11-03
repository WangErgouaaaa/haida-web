/**
 * API 查询参数校验助手 —— 纯函数,可单测
 */

/**
 * 解析 limit 参数(正整数,1..max):
 * - 缺省(undefined/null/'') → 返回 0,表示不限
 * - 非法值(非整数、<=0、>max、NaN) → 抛 RangeError,由调用方转 400
 */
export function parseLimitParam(raw: unknown, max = 100): number {
  if (raw === undefined || raw === null || raw === '') return 0
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`limit must be a positive integer, got "${String(raw)}"`)
  }
  if (value > max) {
    throw new RangeError(`limit must not exceed ${max}, got ${value}`)
  }
  return value
}
