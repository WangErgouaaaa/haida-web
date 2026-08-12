<script setup lang="ts">
// 最新进展页:完整时间线(数据来自数据库)
useHead({ title: '最新进展｜机器学习与多组学分析研究团队' })

interface UpdateItem {
  id: number
  date: string
  title: string
  preview_title: string
  summary: string
  category: string
  category_zh: string
  tags: string
  featured: number
  featured_badge: string
  paper_file: string
}
const { data: updates } = await useFetch<UpdateItem[]>('/api/updates')
const { data: settings } = await useFetch('/api/settings')
const heroTitle = computed(() => settings.value?.updates_hero_title || '记录研究、资源与团队的新进展')
const heroText = computed(() => settings.value?.updates_hero_text || '按论文、项目、数据资源和团队动态分类，记录团队的最新动态。')

// 日期显示: "2026.07.18"
function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.')
}

/* ---------- 论文链接悬浮预览窗 ---------- */
interface PaperImageItem {
  name: string
  url: string
  size: number
}

const tip = reactive({
  show: false,
  x: 0,
  y: 0,
  forId: 0,
  loading: false,
  images: [] as PaperImageItem[],
  title: '',
  summary: '',
})

// 图片列表按论文 id 做会话级缓存,避免反复请求
const imgCache = new Map<number, Promise<PaperImageItem[]>>()

function fetchPaperImages(id: number): Promise<PaperImageItem[]> {
  let p = imgCache.get(id)
  if (!p) {
    p = $fetch<{ images: PaperImageItem[] }>(`/api/updates/${id}/images`)
      .then((r) => r.images)
      .catch(() => [])
    imgCache.set(id, p)
  }
  return p
}

const POP_W = 480 // 与 CSS 中 .paper-preview-pop 的 width 保持一致
const POP_H_EST = 230 // 估算高度:图片条 + 标题,用于视口边界钳制
const GAP = 16

function positionTip(e: MouseEvent) {
  let x = e.clientX + GAP
  if (x + POP_W > window.innerWidth - GAP) x = e.clientX - POP_W - GAP
  let y = e.clientY + GAP
  if (y + POP_H_EST > window.innerHeight - GAP) y = e.clientY - POP_H_EST - GAP
  tip.x = Math.max(GAP, x)
  tip.y = Math.max(GAP, y)
}

function onPaperEnter(up: UpdateItem, e: MouseEvent) {
  tip.forId = up.id
  tip.title = up.preview_title || up.title
  tip.summary = up.summary
  tip.show = true
  tip.loading = true
  tip.images = []
  positionTip(e)
  fetchPaperImages(up.id).then((imgs) => {
    // 防止快速在多个链接间移动时,旧请求结果覆盖新链接
    if (tip.forId !== up.id) return
    tip.loading = false
    tip.images = imgs
  })
}

function onPaperMove(e: MouseEvent) {
  if (tip.show) positionTip(e)
}

function onPaperLeave() {
  tip.show = false
  tip.forId = 0
  tip.loading = false
  tip.images = []
}
</script>

<template>
  <div>
    <section class="page-hero">
      <div class="hero-inner">
        <span class="eyebrow">Latest · 最新进展</span>
        <h1>{{ heroTitle }}</h1>
        <p>{{ heroText }}</p>
      </div>
    </section>

    <section class="content">
      <h2 class="section-title">近期动态</h2>
      <div v-if="updates?.length" class="timeline">
        <article v-for="up in updates" :key="up.id">
          <time>{{ formatDate(up.date) }}</time>
          <div>
            <h2>
              <NuxtLink
                v-if="up.paper_file"
                :to="`/papers/${up.id}`"
                class="paper-title-link"
                @mouseenter="onPaperEnter(up, $event)"
                @mousemove="onPaperMove($event)"
                @mouseleave="onPaperLeave"
              >{{ up.title }}</NuxtLink>
              <template v-else>{{ up.title }}</template>
            </h2>
            <p>{{ up.summary }}</p>
            <NuxtLink
              v-if="up.paper_file"
              :to="`/papers/${up.id}`"
              class="paper-read-link"
              @mouseenter="onPaperEnter(up, $event)"
              @mousemove="onPaperMove($event)"
              @mouseleave="onPaperLeave"
            >在线阅读全文 →</NuxtLink>
          </div>
          <span>{{ up.category_zh || up.category }}</span>
        </article>
      </div>
      <div v-else class="empty-state">
        <div>
          <span class="status">UPDATES · 更新中</span>
          <h2>最新进展即将发布</h2>
          <p>这里将展示论文、项目或阶段性成果的简要介绍。</p>
        </div>
      </div>
    </section>

    <!-- 论文链接悬浮预览窗 -->
    <Teleport to="body">
      <div
        v-if="tip.show"
        class="paper-preview-pop"
        role="tooltip"
        :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
      >
        <div v-if="tip.loading" class="paper-preview-state">正在加载论文图片…</div>
        <div v-else-if="tip.images.length" class="paper-preview-imgs">
          <img
            v-for="img in tip.images.slice(0, 3)"
            :key="img.url"
            :src="img.url"
            :alt="tip.title"
            loading="lazy"
          >
        </div>
        <div v-else class="paper-preview-state">该论文暂无预览图</div>
        <div class="paper-preview-cap">
          <strong>{{ tip.title }}</strong>
          <span v-if="tip.summary">{{ tip.summary }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
