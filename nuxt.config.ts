// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  devtools: { enabled: false },
  // 保持经典目录结构(pages/layouts/server 在项目根),与 Nuxt 3 教程完全兼容
  srcDir: '.',

  css: ['~/assets/css/main.css', '~/assets/css/home.css'],

  // 论文阅读页依赖浏览器端 docx-preview,关闭 SSR,仅客户端渲染
  routeRules: {
    '/papers/**': { ssr: false },
  },

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
  },

  nitro: {
    // 让 node:sqlite 在打包后(部署)仍然可用
    externals: {
      inline: ['node:sqlite'],
    },
  },
})
