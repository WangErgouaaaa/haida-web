<script setup lang="ts">
// 成员详情页:完整个人资料(教育背景/项目/论文/荣誉等,数据来自数据库 detail JSON)
import { sanitizeUrl } from '~/utils/url'

const route = useRoute()
const id = String(route.params.id)

interface MemberDetail {
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
  detail: { sections: { title: string; items: string[] }[] } | null
}

const { data: member } = await useFetch<MemberDetail>(`/api/members/${id}`)
const { data: settings } = await useFetch('/api/settings')

if (!member.value) {
  throw createError({ statusCode: 404, statusMessage: '成员不存在' })
}

useHead({
  title: computed(() => `${member.value?.name || ''}｜机器学习与多组学分析研究团队`),
})
const siteName = computed(() => settings.value?.site_name || '机器学习与多组学分析研究团队')

// GitHub Pages 子路径部署: 数据库中的 /assets/... 路径需要带 baseURL
const baseURL = useRuntimeConfig().app.baseURL
const assetUrl = (p: string) => (p.startsWith('/') ? `${baseURL}${p.slice(1)}` : p)
// 数据库 URL 一律经 sanitizeUrl 净化,非法 scheme(javascript: 等)置空,不渲染链接
const safeWebsite = computed(() => sanitizeUrl(member.value?.website || ''))
</script>

<template>
  <div v-if="member">
    <section class="page-hero">
      <div class="hero-inner">
        <span class="eyebrow">People · 团队成员</span>
        <h1>{{ member.name }}<template v-if="member.name_en"> · {{ member.name_en }}</template></h1>
        <p>{{ member.position }}<template v-if="member.role"> · {{ member.role }}</template></p>
      </div>
    </section>

    <section class="content">
      <!-- 成员概要卡 -->
      <div class="member-head">
        <div v-if="member.photo" class="avatar-photo avatar-photo-lg">
          <img :src="assetUrl(member.photo)" :alt="member.name">
        </div>
        <div v-else class="avatar avatar-lg">{{ member.avatar_text || member.name.charAt(0) }}</div>
        <div class="member-head-copy">
          <h2 class="member-head-name">{{ member.name }}<template v-if="member.name_en"> · {{ member.name_en }}</template></h2>
          <p class="member-head-position">{{ member.position }}</p>
          <p class="member-head-bio">{{ member.bio }}</p>
          <div class="member-head-links">
            <a v-if="member.email" class="member-email" :href="`mailto:${member.email}`">{{ member.email }}</a>
            <a v-if="safeWebsite" class="member-email" :href="safeWebsite" target="_blank" rel="noopener">学院官网主页 ↗</a>
            <NuxtLink to="/members" class="member-email back-link">← 返回团队成员</NuxtLink>          </div>
        </div>
      </div>

      <!-- 详情分节 -->
      <div v-if="member.detail?.sections?.length" class="member-sections">
        <section v-for="sec in member.detail.sections" :key="sec.title" class="member-section">
          <h3 class="member-section-title">{{ sec.title }}</h3>
          <ul v-if="sec.items?.length" class="member-section-list">
            <li v-for="(item, i) in sec.items" :key="i">{{ item }}</li>
          </ul>
        </section>
      </div>
      <div v-else class="empty-state">
        <div>
          <span class="status">PROFILE · 更新中</span>
          <h2>个人详情资料整理中</h2>
          <p>教育背景、科研项目与论文列表将陆续补充。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 成员概要卡 */
.member-head {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 34px;
  align-items: start;
  margin-bottom: 60px;
  padding: 40px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,.92);
  box-shadow: 0 18px 45px rgba(8, 31, 76, .07);
}

.avatar-photo-lg {
  width: 150px;
  height: 150px;
}

.avatar-lg {
  width: 150px;
  height: 150px;
  font-size: 40px;
}

.member-head-name {
  margin: 0 0 6px;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 32px;
  line-height: 1.2;
}

.member-head-position {
  margin: 0 0 14px;
  color: var(--blue);
  font-size: 16px;
  font-weight: 700;
}

.member-head-bio {
  margin: 0 0 18px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.8;
}

.member-head-links {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
}

.back-link {
  margin-left: auto;
  font-weight: 700;
}

.back-link:hover { text-decoration: underline; }

/* 详情分节 */
.member-sections {
  display: grid;
  gap: 34px;
}

.member-section {
  padding: 34px 40px;
  border: 1px solid var(--line);
  background: var(--paper);
}

.member-section-title {
  margin: 0 0 18px;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--blue-soft);
  color: var(--blue);
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 22px;
  line-height: 1.3;
}

.member-section-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.member-section-list li {
  position: relative;
  padding-left: 18px;
  color: #3d4651;
  font-size: 15px;
  line-height: 1.85;
  overflow-wrap: break-word;
}

.member-section-list li::before {
  content: "";
  position: absolute;
  top: .68em;
  left: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--blue);
}

@media (max-width: 900px) {
  .member-head { grid-template-columns: 1fr; text-align: center; justify-items: center; }
  .member-head-links { justify-content: center; }
  .back-link { margin-left: 0; }
  .member-section { padding: 26px 22px; }
}
</style>
