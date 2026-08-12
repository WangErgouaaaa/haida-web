import { appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { NitroErrorHandler } from 'nitropack'

/**
 * 全局错误处理器:把未被 Nuxt 页面错误页捕获的服务端错误完整记录到
 * server-error.log(consola 会截断长行,这里直接写文件),便于定位 500 根因。
 */
const errorHandler: NitroErrorHandler = function (error, event) {
  const url = event?.path || event?.node?.req?.url || '(unknown)'
  const detail = [
    `[server-error] ${error.statusCode || 500} ${error.statusMessage || error.message} @ ${url}`,
    error.cause ? `[server-error] cause: ${error.cause}` : '',
    String(error.stack || error),
  ].join('\n')
  try {
    appendFileSync(resolve(process.cwd(), 'server-error.log'), `${detail}\n\n`)
  } catch {
    /* 日志写入失败不阻断请求 */
  }
  console.error(`[server-error] ${error.statusCode || 500} ${error.message} @ ${url}`)
}

export default errorHandler
