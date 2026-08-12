/**
 * URL 安全工具 —— 数据库内容一律不得直接作为 href 渲染。
 * 只放行 http/https 外部链接与站内根相对路径(/xxx),
 * 其余 scheme(javascript:/data:/vbscript: 等)一律拒绝,杜绝点击型 XSS。
 */

const EXTERNAL_RE = /^https?:\/\/\S/i
// 站内相对路径:以单个 / 开头(排除 //host 协议相对 URL,它会解析为外部 http(s) 地址)
const INTERNAL_RE = /^\/(?!\/)/

/**
 * 校验并放行安全的链接地址:
 * 1. `https://...` / `http://...` → 原样返回(不区分大小写,拒绝裸 `https://`)
 * 2. `/internal/path` → 原样返回(站内相对路径,含 baseURL 子路径部署场景)
 * 3. 其余(javascript:/data:/vbscript:/mailto: 及无协议相对路径)→ 返回空串,
 *    调用方应据此隐藏链接而非渲染 `href=""`
 */
export function sanitizeUrl(input: string): string {
  if (!input) return ''
  const url = input.trim()
  if (INTERNAL_RE.test(url)) return url
  if (EXTERNAL_RE.test(url)) return url
  return ''
}
