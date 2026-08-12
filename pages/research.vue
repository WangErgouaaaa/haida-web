<script setup lang="ts">
// 研究方向页:核心方向卡片(数据来自数据库)
useHead({ title: '研究方向｜机器学习与多组学分析研究团队' })

interface ResearchArea {
  id: number
  number: string
  title_en: string
  title_zh: string
  description: string
  methods: string
  visual: string
}
const { data: areas } = await useFetch<ResearchArea[]>('/api/research-areas')
const { data: settings } = await useFetch('/api/settings')
const heroTitle = computed(() => settings.value?.research_hero_title || '从多源生命数据中理解病原传播、演化与互作')
const heroText = computed(() => settings.value?.research_hero_text || '围绕“同一健康”理念，连接宿主、媒介/环境与病原，为疾病监测、预警及防控提供新的研究视角。')
</script>

<template>
  <div>
    <section class="page-hero">
      <div class="hero-inner">
        <span class="eyebrow">Research · 研究方向</span>
        <h1>{{ heroTitle }}</h1>
        <p>{{ heroText }}</p>
      </div>
    </section>

    <section class="content">
      <h2 class="section-title">核心研究方向</h2>
      <div class="card-grid">
        <article v-for="area in areas" :key="area.id" class="card">
          <span class="number">{{ area.number }} · {{ area.title_en }}</span>
          <h3>{{ area.title_zh }}</h3>
          <p>{{ area.description }}</p>
          <div class="method-list">{{ area.methods }}</div>
        </article>
      </div>
    </section>
  </div>
</template>
