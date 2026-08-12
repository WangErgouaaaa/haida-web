// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  devtools: { enabled: false },
  // 保持经典目录结构(pages/layouts/server 在项目根),与 Nuxt 3 教程完全兼容
  srcDir: '.',

  css: ['~/assets/css/main.css', '~/assets/css/home.css'],

  app: {
    // GitHub Pages 部署在 /haida-web/ 子路径, 用环境变量 NUXT_APP_BASE_URL 覆盖(dev 时为 '/')
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: '机器学习与多组学分析研究团队 | 海南大学生命健康学院',
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '海南大学生命健康学院机器学习与多组学分析研究团队：聚焦人兽共患病原的传播、演化与宿主互作，以机器学习和多组学分析服务疾病监测、预警及防控。' },
      ],
      link: [{ rel: 'icon', type: 'image/png', href: `${process.env.NUXT_APP_BASE_URL || ''}assets/slhs-emblem.png` }],
    },
  },

  // SQLite 文件默认放在项目根 data/ 下,可通过环境变量覆盖(部署时指向持久化磁盘)
  runtimeConfig: {
    dbPath: process.env.LAB_DB_PATH || 'data/haida.db',
    public: {
      // 静态构建(nuxt generate)时页面内嵌的论文预览图 URL 指向预生成静态文件;
      // SSR/开发模式为运行时 API URL。构建期判定,随客户端 bundle 一起固化。
      staticPreviews: process.env.NUXT_PUBLIC_STATIC_PREVIEWS === '1' || process.argv.includes('generate'),
    },
  },

  nitro: {
    // 让 node:sqlite 在打包后(部署)仍然可用
    externals: {
      inline: ['node:sqlite'],
    },
    errorHandler: '~/server/error-handler.ts',
    prerender: {
      // 默认并发 = CPU 数 × 4。预渲染时 /x 与 /haida-web/x 共享同一 payload
      // 缓存键,多 worker 并发写同一缓存文件,在 Windows 上触发 rename EPERM(偶发 500)。
      // 35 条路由串行仅需数秒,换取确定性构建。
      concurrency: 1,
    },
  },
})
