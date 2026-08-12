import type { NitroErrorHandler } from 'nitropack'

/**
 * 全局错误处理器:只向 stderr 输出 5xx 服务端错误(含堆栈),供运行平台采集。
 * 不落盘 —— 4xx 属客户端错误,匿名扫描请求不值得记录;
 * 也不再使用 appendFileSync(同步 IO 会阻塞事件循环,且无轮转/大小上限,
 * 恶意打满 400 即可无限写盘)。日志收集与轮转交给部署平台负责。
 */
const errorHandler: NitroErrorHandler = function (error, event) {
  const status = error.statusCode || 500
  if (status < 500) return
  const url = event?.path || event?.node?.req?.url || '(unknown)'
  console.error(`[server-error] ${status} ${error.statusMessage || error.message} @ ${url}`)
  if (error.stack) console.error(error.stack)
}

export default errorHandler
