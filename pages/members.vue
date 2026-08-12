<script setup lang="ts">
// 团队成员页:按角色分组的成员网格(数据来自数据库)
useHead({ title: '团队成员｜机器学习与多组学分析研究团队' })

interface Member {
  id: number
  name: string
  name_en: string
  role: string
  position: string
  email: string
  website: string
  bio: string
  photo: string
  avatar_text: string
}
interface MemberGroup { role: string; items: Member[] }
const { data } = await useFetch<{ groups: MemberGroup[]; others: MemberGroup[] }>('/api/members')
const { data: settings } = await useFetch('/api/settings')
const heroTitle = computed(() => settings.value?.members_hero_title || '共同探索生命数据中的规律')
const heroText = computed(() => settings.value?.members_hero_text || '团队成员信息持续更新中。')

// GitHub Pages 子路径部署: 数据库中的 /assets/... 路径需要带 baseURL
const baseURL = useRuntimeConfig().app.baseURL
const assetUrl = (p: string) => (p.startsWith('/') ? `${baseURL}${p.slice(1)}` : p)
</script>

<template>
  <div>
    <section class="page-hero">
      <div class="hero-inner">
        <span class="eyebrow">People · 团队成员</span>
        <h1>{{ heroTitle }}</h1>
        <p>{{ heroText }}</p>
      </div>
    </section>

    <section class="content">
      <template v-for="group in data?.groups" :key="group.role">
        <h2 class="section-title">{{ group.role }}</h2>
        <div class="profile-grid">
          <article v-for="m in group.items" :key="m.id" class="profile">
            <div v-if="m.photo" class="avatar-photo">
              <img :src="assetUrl(m.photo)" :alt="m.name">
            </div>
            <div v-else class="avatar">{{ m.avatar_text || m.name.charAt(0) }}</div>
            <h2>{{ m.name }}<template v-if="m.name_en"> · {{ m.name_en }}</template></h2>
            <p v-if="m.position" class="prose">{{ m.position }}</p>
            <p>{{ m.bio }}</p>
            <a v-if="m.email" class="member-email" :href="`mailto:${m.email}`">{{ m.email }}</a>
            <NuxtLink class="member-email" :to="`/member/${m.id}`">个人主页 ↗</NuxtLink>
          </article>
        </div>
      </template>

      <div v-if="!data?.groups?.length" class="empty-state">
        <div>
          <span class="status">PEOPLE · 建设中</span>
          <h2>成员信息即将发布</h2>
          <p>本页将展示课题组成员的姓名、研究方向、教育背景与联系方式。</p>
        </div>
      </div>
    </section>
  </div>
</template>
