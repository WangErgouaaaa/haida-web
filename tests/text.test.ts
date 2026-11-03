import { describe, expect, it } from 'vitest'
import { sanitizeToText } from '../utils/text'

describe('sanitizeToText —— 数据库内容安全文本化', () => {
  it('剥离 <script> 脚本标签', () => {
    expect(sanitizeToText('标题<script>alert(1)</script>')).toBe('标题alert(1)')
  })

  it('剥离带事件属性的标签(存储型 XSS 载荷)', () => {
    const payload = '<img src=x onerror=alert(document.cookie)>点击'
    expect(sanitizeToText(payload)).toBe('点击')
  })

  it('把 <br> 系列标签转为换行', () => {
    expect(sanitizeToText('第一行<br>第二行')).toBe('第一行\n第二行')
    expect(sanitizeToText('a<br/>b<br />c')).toBe('a\nb\nc')
  })

  it('剥离标签内联样式,仅保留文本', () => {
    expect(sanitizeToText('<b style="color:red">加粗</b>文本')).toBe('加粗文本')
  })

  it('折叠连续换行,避免大段空白', () => {
    expect(sanitizeToText('a<br><br><br><br>b')).toBe('a\n\nb')
  })

  it('空输入返回空串', () => {
    expect(sanitizeToText('')).toBe('')
    expect(sanitizeToText(undefined as unknown as string)).toBe('')
  })
})
