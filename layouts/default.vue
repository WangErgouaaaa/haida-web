<script setup lang="ts">
// 共享布局:顶部导航 + 页脚(复刻 haida-web 现有品牌样式)
const route = useRoute()

const nav = [
  { to: '/', label: '首页' },
  { to: '/research', label: '研究方向' },
  { to: '/updates', label: '最新进展' },
  { to: '/members', label: '团队成员' },
  { to: '/databases', label: '数据库' },
  { to: '/tools', label: '在线工具' },
  { to: '/join', label: '加入我们' },
]

const { data: settings } = await useFetch('/api/settings')
const siteName = computed(() => settings.value?.site_name || '机器学习与多组学分析研究团队')
const footerText = computed(() => settings.value?.site_footer_text || `${siteName.value} · 海南大学生命健康学院`)
const footerContact = computed(() => settings.value?.site_footer_contact || 'Contact · 中文 / EN')

function isActive(to: string): boolean {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

// GitHub Pages 子路径部署: 资源路径需要带 baseURL(/haida-web/)
const baseURL = useRuntimeConfig().app.baseURL
const assetUrl = (p: string) => `${baseURL}${p.replace(/^\//, '')}`
</script>

<template>
  <div>
    <header class="site-header">
      <nav class="site-nav" aria-label="主导航">
        <NuxtLink class="brand" to="/">
          <img :src="assetUrl('/assets/slhs-emblem.png')" alt="海南大学生命健康学院院徽">
          <strong>{{ siteName }}</strong>
        </NuxtLink>
        <div class="site-links">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            :class="{ active: isActive(item.to) }"
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >{{ item.label }}</NuxtLink>
          <span class="lang">EN</span>
        </div>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer class="site-footer">
      <div>
        <span>{{ footerText }}</span>
        <span>{{ footerContact }}</span>
      </div>
    </footer>
  </div>
</template>
