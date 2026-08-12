<script setup lang="ts">
// 首页:hero 轮播 + 信号条 + 研究方向卡片 + 最新进展 + 加入 CTA + 快捷导航
// 所有内容来自数据库 API,通过 seed 脚本初始化
import { sanitizeToText } from '~/utils/text'

useHead({ title: '机器学习与多组学分析研究团队 | 海南大学生命健康学院' })

interface HeroSlide {
  id: number
  kicker: string
  title: string
  text: string
  action1_text: string
  action1_url: string
  action2_text: string
  action2_url: string
  visual: string
}
interface Signal { id: number; label: string; title: string; text: string }
interface ResearchArea {
  id: number
  number: string
  title_en: string
  title_zh: string
  description: string
  methods: string
  visual: string
}
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
}

const { data: slides } = await useFetch<HeroSlide[]>('/api/hero-slides')
const { data: signals } = await useFetch<Signal[]>('/api/signals')
const { data: areas } = await useFetch<ResearchArea[]>('/api/research-areas')
const { data: featured } = await useFetch<UpdateItem[]>('/api/updates?featured=1&limit=1')
const { data: updates } = await useFetch<UpdateItem[]>('/api/updates?limit=4')
const { data: settings } = await useFetch('/api/settings')

const featuredUpdate = computed(() => featured.value?.[0] || null)
const siteName = computed(() => settings.value?.site_name || '机器学习与多组学分析研究团队')
const joinText = computed(() => settings.value?.site_join_text || '')
const joinCtaText = computed(() => settings.value?.join_cta_text || '了解招生信息 →')

// 日期显示: "07.18"
function formatDate(dateStr: string): string {
  const d = dateStr.split('-')
  return d.length === 3 ? `${d[1]}.${d[2]}` : dateStr
}

// 研究方向卡片配图: 按 number 唯一映射(03/04 的 visual 均为 onehealth, 需区分)
const baseURL = useRuntimeConfig().app.baseURL
const assetUrl = (p: string) => `${baseURL}${p.replace(/^\//, '')}`
const researchImages: Record<string, string> = {
  '01': assetUrl('/assets/research/surveillance.jpg'),
  '02': assetUrl('/assets/research/evolution.jpg'),
  '03': assetUrl('/assets/research/onehealth.png'),
  '04': assetUrl('/assets/research/resistance.jpg'),
}
function researchImage(area: ResearchArea): string {
  return researchImages[area.number] || researchImages['01'] || ''
}

// ---------- 客户端交互(轮播/浮层/滚动显现) ----------
const rootEl = ref<HTMLElement | null>(null)
let slidesEls: HTMLElement[] = []
let dotsEls: HTMLElement[] = []
let pauseBtn: HTMLElement | null = null
let active = 0
let running = true
let timer: ReturnType<typeof setInterval> | undefined

function showSlide(index: number) {
  const total = slidesEls.length
  if (!total) return
  active = (index + total) % total
  slidesEls.forEach((el, i) => el.classList.toggle('active', i === active))
  dotsEls.forEach((dot, i) => {
    dot.classList.toggle('active', i === active)
    dot.setAttribute('aria-current', i === active ? 'true' : 'false')
  })
}
function startCarousel() {
  clearInterval(timer)
  if (running) timer = setInterval(() => showSlide(active + 1), 7000)
}

onMounted(() => {
  const root = rootEl.value
  if (!root) return
  slidesEls = [...root.querySelectorAll<HTMLElement>('.v4-slide')]
  dotsEls = [...root.querySelectorAll<HTMLElement>('.hero-dot')]
  pauseBtn = root.querySelector('.hero-pause')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  running = !reduceMotion

  dotsEls.forEach((dot, i) => dot.addEventListener('click', () => { showSlide(i); startCarousel() }))
  pauseBtn?.addEventListener('click', () => {
    running = !running
    if (pauseBtn) {
      pauseBtn.textContent = running ? '暂停' : '播放'
      pauseBtn.setAttribute('aria-label', running ? '暂停轮播' : '播放轮播')
    }
    startCarousel()
  })
  if (!running && pauseBtn) {
    pauseBtn.textContent = '播放'
    pauseBtn.setAttribute('aria-label', '播放轮播')
  }
  showSlide(0)
  startCarousel()

  // 更新浮层(桌面 hover 展开 / 移动端点击展开)
  const rows = [...root.querySelectorAll<HTMLElement>('.update-row')]
  const closeUpdates = (except?: HTMLElement) => rows.forEach((row) => {
    if (row !== except) row.setAttribute('aria-expanded', 'false')
  })
  rows.forEach((row) => {
    row.addEventListener('click', () => {
      const willOpen = row.getAttribute('aria-expanded') !== 'true'
      closeUpdates(row)
      row.setAttribute('aria-expanded', String(willOpen))
    })
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        row.setAttribute('aria-expanded', 'false')
        row.blur()
      }
    })
  })
  document.addEventListener('click', (event) => {
    if (!(event.target as HTMLElement).closest?.('.update-row')) closeUpdates()
  })

  // 滚动显现
  const reveals = root.querySelectorAll<HTMLElement>('.v4-reveal')
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('visible'))
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: .18 })
    reveals.forEach((el) => observer.observe(el))
  }
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div ref="rootEl" class="v4-page">
    <!-- Hero 轮播 -->
    <header class="v4-hero" id="v4-home" aria-label="团队重点内容轮播">
      <section
        v-for="(slide, i) in slides"
        :key="slide.id"
        class="v4-slide"
        :class="[`slide-${slide.visual}`, { active: i === 0 }]"
      >
        <div v-if="slide.visual === 'photo'" class="hero-accent"></div>
        <!-- network 视觉 -->
        <svg v-if="slide.visual === 'network'" viewBox="0 0 900 660" aria-hidden="true">
          <rect width="900" height="660" fill="#081a3a"/>
          <g stroke="#27436f"><path d="M0 110H900M0 220H900M0 330H900M0 440H900M0 550H900"/><path d="M150 0V660M300 0V660M450 0V660M600 0V660M750 0V660"/></g>
          <g fill="none" stroke-width="3">
            <path d="M90 500C190 460 210 280 330 335S490 520 590 405 710 150 840 205" stroke="#bec9e2"/>
            <path d="M90 535C205 560 230 420 350 470S540 300 640 345 760 455 840 390" stroke="#6f8cc5"/>
            <path d="M90 450C210 330 260 425 370 280S545 210 650 275 760 280 840 140" stroke="#3f65ad"/>
          </g>
        </svg>
        <!-- heatmap 视觉 -->
        <svg v-if="slide.visual === 'heatmap'" viewBox="0 0 900 660" aria-hidden="true">
          <rect width="900" height="660" fill="#0e2346"/>
          <g transform="translate(210 105)">
            <g fill="#2d4f83"><rect x="0" y="0" width="72" height="66"/><rect x="228" y="228" width="72" height="66"/><rect x="380" y="76" width="72" height="66"/></g>
            <g fill="#bec9e2"><rect x="76" y="0" width="72" height="66"/><rect x="304" y="152" width="72" height="66"/><rect x="0" y="304" width="72" height="66"/></g>
            <g fill="#7c96c5"><rect x="152" y="76" width="72" height="66"/><rect x="380" y="228" width="72" height="66"/><rect x="228" y="304" width="72" height="66"/></g>
            <g fill="#4d6eaa"><rect x="228" y="0" width="72" height="66"/><rect x="0" y="152" width="72" height="66"/><rect x="304" y="304" width="72" height="66"/></g>
            <g fill="#203c6e"><rect x="304" y="0" width="72" height="66"/><rect x="76" y="152" width="72" height="66"/><rect x="152" y="228" width="72" height="66"/></g>
          </g>
        </svg>
        <div class="v4-hero-copy">
          <span class="v4-kicker">{{ slide.kicker }}</span>
          <h3>{{ sanitizeToText(slide.title) }}</h3>
          <p>{{ slide.text }}</p>
          <div class="v4-actions">
            <NuxtLink v-if="slide.action1_text" :to="slide.action1_url">{{ slide.action1_text }}</NuxtLink>
            <NuxtLink v-if="slide.action2_text" :to="slide.action2_url">{{ slide.action2_text }}</NuxtLink>
          </div>
        </div>
      </section>

      <div class="hero-controls">
        <button
          v-for="(slide, i) in slides"
          :key="`dot-${slide.id}`"
          class="hero-dot"
          :class="{ active: i === 0 }"
          type="button"
          :aria-label="`显示第 ${i + 1} 张`"
        ></button>
        <button class="hero-pause" type="button" aria-label="暂停轮播">暂停</button>
      </div>
    </header>

    <!-- 信号条 -->
    <section v-if="signals?.length" class="v4-signal">
      <div v-for="s in signals" :key="s.id" class="signal-item">
        <small>{{ s.label }}</small>
        <strong>{{ s.title }}</strong>
        <span>{{ s.text }}</span>
      </div>
    </section>

    <!-- 研究方向 -->
    <section class="v4-section v4-wide v4-reveal" id="v4-research">
      <div class="v4-section-head">
        <div><span class="v4-kicker">Research</span><h4>我们关注的问题</h4></div>
        <NuxtLink to="/research">查看研究方向 →</NuxtLink>
      </div>
      <div class="research-grid">
        <article v-for="area in areas" :key="area.id" class="research-card">
          <div class="research-card-copy">
            <div class="research-card-meta"><b>{{ area.number }}</b><span>{{ area.title_en }}</span></div>
            <h5>{{ area.title_zh }}</h5>
            <p>{{ area.description }}</p>
          </div>
          <div class="research-card-visual">
            <img :src="researchImage(area)" :alt="area.title_zh" loading="lazy" />
          </div>
        </article>
      </div>
    </section>

    <!-- 最新进展 -->
    <section class="v4-section latest-focus v4-reveal" id="v4-latest">
      <div class="v4-inner">
        <div class="v4-section-head">
          <div><span class="v4-kicker">Latest</span><h4>最新进展</h4></div>
          <NuxtLink to="/updates">查看全部 →</NuxtLink>
        </div>
        <div class="latest-grid">
          <article v-if="featuredUpdate" class="featured-update">
            <div>
              <span>{{ featuredUpdate.featured_badge || '重点进展' }}</span>
              <h5>{{ featuredUpdate.preview_title || featuredUpdate.title }}</h5>
            </div>
          </article>
          <div class="update-list">
            <button
              v-for="(up, i) in updates"
              :key="up.id"
              class="update-row"
              type="button"
              :aria-expanded="false"
              :aria-controls="`preview-${i + 1}`"
            >
              <time>{{ formatDate(up.date) }}</time>
              <strong>{{ up.title }}</strong>
              <span class="update-preview" :id="`preview-${i + 1}`">
                <span>{{ up.category }} · {{ up.category_zh }}</span>
                <b>{{ up.preview_title }}</b>
                <p>{{ up.summary }}</p>
                <small>{{ up.tags }}</small>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 加入 CTA -->
    <section class="v4-join v4-inner v4-reveal" id="v4-join">
      <div>
        <h4>和我们一起研究生命数据</h4>
        <p>{{ joinText }}</p>
      </div>
      <NuxtLink to="/join">{{ joinCtaText }}</NuxtLink>
    </section>

    <!-- 快捷导航 -->
    <nav class="v4-quick-dock" aria-label="页面快捷导航">
      <div class="dock-identity" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <g stroke="currentColor" stroke-width="1.7">
            <path d="M10 10 24 16 38 9M10 24l14-8 14 9M10 38l14-8 14 7M24 16v14M10 10v28M38 9v28"/>
            <circle cx="10" cy="10" r="3" fill="currentColor"/><circle cx="10" cy="24" r="3" fill="currentColor"/><circle cx="10" cy="38" r="3" fill="currentColor"/>
            <circle cx="24" cy="16" r="3" fill="currentColor"/><circle cx="24" cy="30" r="3" fill="currentColor"/>
            <circle cx="38" cy="9" r="3" fill="currentColor"/><circle cx="38" cy="25" r="3" fill="currentColor"/><circle cx="38" cy="37" r="3" fill="currentColor"/>
          </g>
        </svg>
        <span>ML × OMICS</span>
      </div>
      <NuxtLink to="/" class="active" aria-current="page"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></svg><span>概览</span></NuxtLink>
      <NuxtLink to="/research"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m7.5 11 9-4M7.5 13l9 4"/></svg><span>研究</span></NuxtLink>
      <NuxtLink to="/updates"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-7"/></svg><span>进展</span></NuxtLink>
      <NuxtLink to="/join"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.7-4 2.5-6 5.5-6s4.8 2 5.5 6M18 10v6M15 13h6"/></svg><span>加入</span></NuxtLink>
    </nav>
  </div>
</template>
