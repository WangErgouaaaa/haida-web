<script setup lang="ts">
// 论文在线阅读页:优先站内渲染官方 PDF(pdf.js,版式与出版社一致),
// 无 PDF 时回退 DOCX(docx-preview 浏览器端解析渲染)。
// 页面保持 SSR:静态构建时 /papers/:id 由服务端预渲染、论文文件路径内嵌到 payload,
// GitHub Pages 上浏览器直接读取 public/ 下的静态文件,不请求任何 /api。
// 注意:不要对该路由关闭 SSR,否则静态站会退化为客户端运行时请求 /api/* 而 404。
import type { PDFDocumentProxy } from 'pdfjs-dist'
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
// 是否使用官方 PDF 渲染(优先);pdfRendered/pdfTotal 用于懒加载进度
const pdfFile = ref('')
const pdfRendered = ref(0)
const pdfTotal = ref(0)

function formatDate(dateStr: string): string {
  return dateStr ? dateStr.replace(/-/g, '.') : ''
}

// 若论文是 DOCX,约定同目录同名 .pdf 为官方版式文件(存在时优先在线阅读与下载)
function siblingPdfOf(file: string): string {
  return /\.docx$/i.test(file) ? file.replace(/\.docx$/i, '.pdf') : ''
}

// ---------- PDF 渲染(pdf.js) ----------
const pdfState: {
  doc: PDFDocumentProxy | null
  task: { destroy: () => Promise<void> } | null
  observer: IntersectionObserver | null
  pages: { canvas: HTMLCanvasElement | null; rendered: boolean }[]
} = { doc: null, task: null, observer: null, pages: [] }

async function disposePdf() {
  pdfState.observer?.disconnect()
  pdfState.observer = null
  pdfState.pages = []
  pdfState.doc = null
  if (pdfState.task) {
    const task = pdfState.task
    pdfState.task = null
    try { await task.destroy() } catch { /* 忽略销毁错误 */ }
  }
}

async function renderPdfPages(arrayBuffer: ArrayBuffer) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  if (!GlobalWorkerOptions.workerSrc) {
    // 静态站:worker 由 Vite 资源管道输出到 _nuxt/,同源加载
    GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  }
  const task = getDocument({ data: arrayBuffer })
  const pdf = await task.promise
  pdfState.task = task
  pdfState.doc = pdf
  pdfTotal.value = pdf.numPages
  pdfRendered.value = 0

  // 先切换到正文分支使容器挂载,再执行渲染(与 DOCX 路径一致)
  status.value = 'ready'
  await nextTick()
  if (!container.value) throw new Error('渲染容器不可用')
  const host = container.value
  const style = getComputedStyle(host)
  const fitWidth = host.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  const dpr = window.devicePixelRatio || 1
  const frag = document.createDocumentFragment()
  const holders: HTMLElement[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const vp1 = page.getViewport({ scale: 1 })
    // 页面宽度适配容器,不超过 1.25 倍显示基准
    const scale = getPdfScale(vp1.width, fitWidth)
    const vp = page.getViewport({ scale: scale * dpr })
    const div = document.createElement('div')
    div.className = 'paper-pdf-page'
    div.dataset.page = String(i)
    div.style.width = `${Math.round(vp.width / dpr)}px`
    div.style.aspectRatio = `${vp1.width} / ${vp1.height}`
    frag.appendChild(div)
    holders.push(div)
    pdfState.pages.push({ canvas: null, rendered: false })
  }
  host.innerHTML = ''
  host.appendChild(frag)
  status.value = 'ready'

  // 视口内懒渲染,滚动时逐个绘制
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue
        io.unobserve(en.target)
        const n = Number((en.target as HTMLElement).dataset.page)
        renderPdfPage(pdf, n, dpr)
      }
    },
    { rootMargin: '1200px 0px' },
  )
  pdfState.observer = io
  for (const h of holders) io.observe(h)
}

async function renderPdfPage(pdf: PDFDocumentProxy, n: number, dpr: number) {
  const item = pdfState.pages[n - 1]
  if (!item || item.rendered) return
  item.rendered = true
  const holder = container.value?.querySelector<HTMLElement>(`.paper-pdf-page[data-page="${n}"]`)
  if (!holder) return
  try {
    const page = await pdf.getPage(n)
    const vp = page.getViewport({ scale: 1 })
    const scale = getPdfScale(vp.width, holder.clientWidth)
    const renderVp = page.getViewport({ scale: scale * dpr })
    const canvas = document.createElement('canvas')
    canvas.className = 'paper-pdf-canvas'
    canvas.width = Math.ceil(renderVp.width)
    canvas.height = Math.ceil(renderVp.height)
    item.canvas = canvas
    holder.appendChild(canvas)
    await page.render({ canvas, viewport: renderVp }).promise
    pdfRendered.value++
  } catch {
    holder.textContent = `第 ${n} 页渲染失败，请下载 PDF 查看。`
    holder.classList.add('paper-pdf-page-error')
  }
}

// ---------- DOCX 渲染(docx-preview,无 PDF 时的回退) ----------
async function renderDocx(file: string) {
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
    // 完全流式渲染:转换文档含大量分节符(每页一个 sectPr),分页模式会把内容
    // 摊成大量低填充率页面(实测平均填充率仅 19%),inWrapper=false 绕过分节骨架,连续展示
    inWrapper: false,
    breakPages: false,
  })
}

// ---------- 主流程:PDF 优先,DOCX 兜底 ----------
let renderSeq = 0
let lastRenderedFile = ''
async function renderPaper() {
  const file = paper.value?.paper_file
  if (!file) {
    status.value = 'error'
    errorMsg.value = '该条目暂无论文全文。'
    return
  }
  // watch 与 onMounted 会对同一文件重复触发,只渲染一次
  if (lastRenderedFile === file) return
  lastRenderedFile = file
  const seq = ++renderSeq
  status.value = 'loading'
  await disposePdf()
  const pdf = siblingPdfOf(file)
  if (pdf) {
    try {
      const resp = await fetch(fileUrl(pdf))
      if (resp.ok) {
        pdfFile.value = pdf
        const buf = await resp.arrayBuffer()
        if (seq !== renderSeq) return
        await renderPdfPages(buf)
        return
      }
    } catch { /* PDF 不可用则回退 DOCX */ }
  }
  pdfFile.value = ''
  try {
    if (seq !== renderSeq) return
    await renderDocx(file)
  } catch (e) {
    if (seq !== renderSeq) return
    status.value = 'error'
    errorMsg.value = e instanceof Error ? e.message : '论文渲染失败，可点击右上角下载后查看。'
  }
}

watch(
  () => paper.value?.paper_file,
  (file) => {
    // 渲染库是浏览器端库,SSR/预渲染阶段不执行(静态构建时页面已内嵌 payload)
    // 页面为 SSR(无 ssr:false),payload 在构建期已写入,浏览器端不触发 /api 请求
    if (import.meta.client && file) renderPaper()
  },
)

// DOM 挂载后首次渲染(页面保持 SSR,渲染在浏览器端执行)
onMounted(() => {
  if (paper.value?.paper_file) renderPaper()
})
onBeforeUnmount(() => { disposePdf() })

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
          :href="fileUrl(pdfFile || paper.paper_file)"
          download
        >下载 {{ pdfFile ? 'PDF' : 'DOCX' }} ↓</a>
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
        <p v-if="pdfFile && pdfRendered < pdfTotal" class="paper-pdf-progress">
          页面渲染中 {{ pdfRendered }}/{{ pdfTotal }}…
        </p>
      </div>
    </section>
  </div>
</template>
