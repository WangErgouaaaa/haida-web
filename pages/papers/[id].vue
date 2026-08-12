<script setup lang="ts">
// 论文在线阅读页:站内渲染 DOCX(客户端渲染,routeRules 已对 /papers/** 关闭 SSR)
// 依赖 docx-preview 在浏览器中解析并分页渲染 Word 文档
useHead({ title: '论文阅读｜机器学习与多组学分析研究团队' })

interface UpdateDetail {
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

const route = useRoute()
const id = computed(() => Number(route.params.id))
const { data: paper } = await useFetch<UpdateDetail>(() => `/api/updates/${id.value}`)

// GitHub Pages 子路径部署: /files/... 需要带 baseURL
const baseURL = useRuntimeConfig().app.baseURL
const fileUrl = (p: string) => `${baseURL}${p.replace(/^\//, '')}`

const container = ref<HTMLElement | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMsg = ref('')
const zoom = ref(1)

function formatDate(dateStr: string): string {
  return dateStr ? dateStr.replace(/-/g, '.') : ''
}

async function renderPaper() {
  const file = paper.value?.paper_file
  if (!file) {
    status.value = 'error'
    errorMsg.value = '该条目暂无论文全文。'
    return
  }
  status.value = 'loading'
  try {
    const resp = await fetch(fileUrl(file))
    if (!resp.ok) throw new Error('论文文件加载失败')
    const blob = await resp.blob()
    const { renderAsync } = await import('docx-preview')
    // 先切换到正文分支使容器挂载,再执行渲染
    status.value = 'ready'
    await nextTick()
    if (!container.value) throw new Error('渲染容器不可用')
    container.value.innerHTML = ''
    await renderAsync(blob, container.value, undefined, {
      className: 'paper-docx',
      // 完全流式渲染:文档含大量分节符(每页一个 sectPr),分页模式会把内容
      // 摊成大量低填充率页面(实测平均填充率仅 19%),inWrapper=false 绕过分节骨架,连续展示
      inWrapper: false,
      breakPages: false,
    })
  } catch (e) {
    status.value = 'error'
    errorMsg.value = e instanceof Error ? e.message : '论文渲染失败，可点击右上角下载后查看。'
  }
}

watch(
  () => paper.value?.paper_file,
  (file) => {
    // docx-preview 是浏览器库,SSR/预渲染阶段不执行(静态构建时页面已内嵌 payload)
    if (import.meta.client && file) renderPaper()
  },
)

// DOM 挂载后首次渲染(ssr:false 下为客户端挂载)
onMounted(() => {
  if (paper.value?.paper_file) renderPaper()
})

function setZoom(v: number) {
  zoom.value = Math.min(1.6, Math.max(0.5, Math.round(v * 100) / 100))
}
function zoomIn() { setZoom(zoom.value + 0.2) }
function zoomOut() { setZoom(zoom.value - 0.2) }
</script>

<template>
  <div v-if="paper">
    <section class="page-hero">
      <div class="hero-inner">
        <span class="eyebrow">Papers · 论文阅读</span>
        <h1>{{ paper.title }}</h1>
        <p>
          <template v-if="paper.date">{{ formatDate(paper.date) }} · </template>
          <template v-if="paper.preview_title">{{ paper.preview_title }} · </template>
          {{ paper.tags || paper.category_zh || paper.category }}
        </p>
      </div>
    </section>

    <section class="content paper-content">
      <!-- 工具栏 -->
      <div class="paper-toolbar">
        <NuxtLink to="/updates" class="paper-btn">← 返回最新进展</NuxtLink>
        <div class="paper-toolbar-group">
          <button type="button" class="paper-btn" @click="zoomOut" :disabled="zoom <= 0.5">缩小</button>
          <span class="paper-zoom">{{ Math.round(zoom * 100) }}%</span>
          <button type="button" class="paper-btn" @click="zoomIn" :disabled="zoom >= 1.6">放大</button>
        </div>
        <a
          v-if="paper.paper_file"
          class="paper-btn paper-btn-primary"
          :href="fileUrl(paper.paper_file)"
          download
        >下载 DOCX ↓</a>
      </div>

      <!-- 加载中 -->
      <div v-if="status === 'loading'" class="paper-stage paper-stage-hint">
        <div class="paper-spinner" aria-hidden="true"></div>
        <p>论文渲染中，请稍候…</p>
      </div>

      <!-- 渲染失败 / 无论文 -->
      <div v-else-if="status === 'error'" class="empty-state">
        <div>
          <span class="status">PAPER · 不可用</span>
          <h2>暂时无法在线阅读</h2>
          <p>{{ errorMsg }}</p>
        </div>
      </div>

      <!-- 论文正文 -->
      <div v-else class="paper-stage">
        <div class="paper-docx-holder" :style="{ zoom }">
          <div ref="container" class="paper-docx-container"></div>
        </div>
      </div>
    </section>
  </div>
</template>
