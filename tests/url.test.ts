import { describe, expect, it } from 'vitest'
import { sanitizeUrl } from '../utils/url'

describe('sanitizeUrl —— 数据库 URL 防点击型 XSS', () => {
  it('放行 https 外部链接', () => {
    expect(sanitizeUrl('https://slhs.hainanu.edu.cn/info/1022/19443.htm')).toBe('https://slhs.hainanu.edu.cn/info/1022/19443.htm')
  })

  it('放行 http 外部链接', () => {
    expect(sanitizeUrl('http://example.com/tool')).toBe('http://example.com/tool')
  })

  it('放行大写协议头', () => {
    expect(sanitizeUrl('HTTPS://example.com')).toBe('HTTPS://example.com')
  })

  it('放行站内根相对路径(内部链接)', () => {
    expect(sanitizeUrl('/join')).toBe('/join')
    expect(sanitizeUrl('/assets/research/paper.pdf')).toBe('/assets/research/paper.pdf')
  })

  it('去除首尾空白后判断', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
  })

  it('拒绝 javascript: 协议(点击型 XSS 载荷)', () => {
    expect(sanitizeUrl('javascript:alert(2)')).toBe('')
    expect(sanitizeUrl('JAVASCRIPT:alert(2)')).toBe('')
  })

  it('拒绝 data: 与 vbscript: 协议', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('')
  })

  it('拒绝混淆变体(实体编码/制表符/前导空白)', () => {
    expect(sanitizeUrl('javascript&#58;alert(1)')).toBe('')
    expect(sanitizeUrl('\tjavascript:alert(1)')).toBe('')
    expect(sanitizeUrl('java\tscript:alert(1)')).toBe('')
  })

  it('拒绝无协议相对路径(防止 href 相对解析)', () => {
    expect(sanitizeUrl('foo/bar')).toBe('')
  })

  it('拒绝裸协议头(无主机名)', () => {
    expect(sanitizeUrl('https://')).toBe('')
    expect(sanitizeUrl('http://')).toBe('')
  })

  it('拒绝协议相对 URL //host', () => {
    expect(sanitizeUrl('//evil.example.com')).toBe('')
  })

  it('空输入返回空串', () => {
    expect(sanitizeUrl('')).toBe('')
    expect(sanitizeUrl(undefined as unknown as string)).toBe('')
  })
})
