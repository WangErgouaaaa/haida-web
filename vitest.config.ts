import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // 只测纯逻辑模块与集成脚本,不扫描 Nuxt 页面(它们依赖自动导入)
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
})
