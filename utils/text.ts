/**
 * 文本安全工具 —— 数据库内容一律以纯文本渲染,杜绝存储型 XSS。
 * 只允许 <br> 这类显式换行标签被转换为换行符,其余 HTML 标签全部剥离。
 */

const BR_TAG = /<br\s*\/?>/gi

/** 剥离所有 HTML 标签(标签内属性一并删除),返回纯文本 */
function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

/**
 * 把数据库中的富文本安全地转换为多行纯文本:
 * 1. <br>/<br/>/<br /> → \n(保留内容作者想要的换行)
 * 2. 其余所有 HTML 标签被剥离(脚本/事件属性/内联样式全部失效)
 * 3. 输出经 Vue 模板插值 {{ }} 自动转义,双重防护
 */
export function sanitizeToText(input: string): string {
  if (!input) return ''
  const withBreaks = input.replace(BR_TAG, '\n')
  const text = stripTags(withBreaks)
  // 折叠 <br><br> 产生的连续空行,避免标题/摘要出现大段空白
  return text.replace(/\n{3,}/g, '\n\n').trim()
}
