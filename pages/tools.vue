<script setup lang="ts">
// 在线工具页:工具卡片列表(数据来自数据库,无数据时显示空状态)
useHead({ title: '在线工具｜机器学习与多组学分析研究团队' })

interface ToolItem {
  id: number
  title: string
  description: string
  url: string
  maintainer: string
  tag: string
  status: string
}
const { data: tools } = await useFetch<ToolItem[]>('/api/tools')
const { data: settings } = await useFetch('/api/settings')
const heroTitle = computed(() => settings.value?.tools_hero_title || '让分析方法可以直接使用')
const heroText = computed(() => settings.value?.tools_hero_text || '连接团队开发的 Webserver、分析流程和软件工具。')
</script>

<template>
  <div>
    <section class="page-hero">
      <div class="hero-inner">
        <span class="eyebrow">Webserver &amp; Tools · 在线工具</span>
        <h1>{{ heroTitle }}</h1>
        <p>{{ heroText }}</p>
      </div>
    </section>

    <section class="content">
      <h2 class="section-title">分析工具</h2>
      <div v-if="tools?.length" class="resource-grid">
        <article v-for="tool in tools" :key="tool.id" class="resource-card">
          <span class="status" :class="{ building: tool.status === 'building' }">
            {{ tool.status === 'building' ? '建设中' : '已上线' }}
          </span>
          <h3>{{ tool.title }}</h3>
          <p>{{ tool.description }}</p>
          <div class="resource-meta">
            <span>{{ tool.tag }}<template v-if="tool.maintainer"> · {{ tool.maintainer }}</template></span>
            <a v-if="tool.url" :href="tool.url" target="_blank" rel="noopener">访问 ↗</a>
          </div>
        </article>
      </div>
      <div v-else class="empty-state">
        <div>
          <span class="status">TOOLS · 建设中</span>
          <h2>Webserver 与分析工具将在这里发布</h2>
          <p>每个工具可拥有独立入口，并展示功能说明、输入输出示例、使用文档和版本信息。</p>
        </div>
      </div>
    </section>
  </div>
</template>
