<script setup lang="ts">
// 加入我们页:招生信息 + 联系方式(数据来自数据库 settings)
useHead({ title: '加入我们｜机器学习与多组学分析研究团队' })

const { data: settings } = await useFetch('/api/settings')
const heroTitle = computed(() => settings.value?.join_hero_title || '和我们一起研究生命数据')
const heroText = computed(() => settings.value?.join_hero_text || '欢迎对病原生物信息学、机器学习和多组学研究感兴趣的同学联系团队。')
const whatTitle = computed(() => settings.value?.join_what_title || '研究与学习机会')
const whatText = computed(() => settings.value?.join_what_text || '')
const whatMethods = computed(() => settings.value?.join_what_methods || '本科生科研 · 研究生培养 · 合作交流')
const contactTitle = computed(() => settings.value?.join_contact_title || '联系方式')
const contactText = computed(() => settings.value?.join_contact_text || '招生要求、联系邮箱与办公地点将在信息确认后补充。')
const contactAddress = computed(() => settings.value?.join_contact_address || '海南大学生命健康学院')
const contactEmail = computed(() => settings.value?.site_contact_email || '')
</script>

<template>
  <div>
    <section class="page-hero">
      <div class="hero-inner">
        <span class="eyebrow">Join Us · 加入我们</span>
        <h1>{{ heroTitle }}</h1>
        <p>{{ heroText }}</p>
      </div>
    </section>

    <section class="content">
      <div class="join-panel">
        <article class="card">
          <span class="number">What we do</span>
          <h2>{{ whatTitle }}</h2>
          <p>{{ whatText }}</p>
          <div class="method-list">{{ whatMethods }}</div>
        </article>
        <aside class="contact-box">
          <h2>{{ contactTitle }}</h2>
          <p>{{ contactText }}</p>
          <p v-if="contactEmail">邮箱：<a :href="`mailto:${contactEmail}`" style="color:#bec9e2">{{ contactEmail }}</a></p>
          <p>{{ contactAddress }}</p>
        </aside>
      </div>
    </section>
  </div>
</template>
