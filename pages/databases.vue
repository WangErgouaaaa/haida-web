<script setup lang="ts">
// 数据库页:资源卡片列表(数据来自数据库,无数据时显示空状态)
useHead({ title: '数据库｜机器学习与多组学分析研究团队' })

interface DatabaseItem {
  id: number
  title: string
  description: string
  url: string
  maintainer: string
  tag: string
  status: string
}
const { data: databases } = await useFetch<DatabaseItem[]>('/api/databases')
const { data: settings } = await useFetch('/api/settings')
const heroTitle = computed(() => settings.value?.databases_hero_title || '面向病原生物信息学的数据资源')
const heroText = computed(() => settings.value?.databases_hero_text || '发布团队建设和维护的数据库，为每个资源提供独立介绍、版本记录与访问入口。')
</script>

<template>
  <div>
    <section class="page-hero">
      <div class="hero-inner">
        <span class="eyebrow">Databases · 数据库</span>
        <h1>{{ heroTitle }}</h1>
        <p>{{ heroText }}</p>
      </div>
    </section>

    <section class="content">
      <h2 class="section-title">团队数据库</h2>
      <div v-if="databases?.length" class="resource-grid">
        <article v-for="db in databases" :key="db.id" class="resource-card">
          <span class="status" :class="{ building: db.status === 'building' }">
            {{ db.status === 'building' ? '建设中' : '已上线' }}
          </span>
          <h3>{{ db.title }}</h3>
          <p>{{ db.description }}</p>
          <div class="resource-meta">
            <span>{{ db.tag }}<template v-if="db.maintainer"> · {{ db.maintainer }}</template></span>
            <a v-if="db.url" :href="db.url" target="_blank" rel="noopener">访问 ↗</a>
          </div>
        </article>
      </div>
      <div v-else class="empty-state">
        <div>
          <span class="status">DATABASES · 建设中</span>
          <h2>数据库资源将在这里发布</h2>
          <p>正式上线后，本页会展示数据库简介、数据范围、更新日期、引用方式和访问链接。</p>
        </div>
      </div>
    </section>
  </div>
</template>
