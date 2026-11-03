# haida-web-backend(海南大学机器学习与多组学分析研究团队官网)

对标 [lab-site](https://github.com/zzdlab) 技术方案搭建的课题组网站全栈项目:
**Nuxt 4 SSR + SQLite(Node 内置,零原生依赖) + Nitro 文件即路由 API**。
前端视觉复刻现有静态站 [haida-web](https://wangergouaaaa.github.io/haida-web/),
所有动态内容(轮播、研究方向、最新进展、成员、数据库、工具、联系方式)全部由数据库驱动,
通过 `/api/*` 提供只读 JSON 接口。

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 渲染 | Nuxt 4 SSR | 服务端渲染,SEO 友好,首屏快 |
| 样式 | 原生 CSS | 复刻 haida-web 现有设计(`assets/css/main.css` + `home.css`) |
| 数据库 | SQLite(Node 22.19+ 内置 `node:sqlite`) | 无需安装数据库服务,单文件即库 |
| API | Nitro `server/api/` | 文件即路由,SSR 时服务端直接查库 |
| 部署 | GitHub Pages(静态,CI 自动构建) | 见下方部署章节 |

> 为什么用 SQLite?零安装、零配置、文件即数据库,最适合课题组小规模站点。

## 快速开始

环境要求: **Node.js 22.19+（22.x）、24.11+（24.x）或 26+**。这是当前 Nuxt 的要求,也满足 `pdfjs-dist` 的 Node 22.13+ 要求;CI 使用 Node.js 22。

```bash
npm install
npm run db:seed     # 首次运行,写入示例数据(内容来自 haida-web 现有页面文案)
npm run dev         # http://localhost:3000
```

重置数据: `npm run db:reset` 后再 `npm run db:seed`。

常用脚本:

| 命令 | 说明 |
|---|---|
| `npm run dev` | 开发服务器(SSR,实时查库) |
| `npm run db:seed` | 初始化/幂等填充数据库(已有数据时跳过) |
| `npm run generate` | **静态构建**:预生成论文预览图 → `nuxt generate`(产出 `.output/public/`) |
| `npm run build` | SSR 构建(云服务器部署用) |
| `npm run typecheck` | 类型检查(vue-tsc) |
| `npm test` | 单元 + 集成测试(vitest) |
| `npm run db:reset` | 清空数据库 |

## 目录结构

```
haida-web-backend/
├── nuxt.config.ts          # 配置:srcDir、CSS、数据库路径、staticPreviews 构建期判定
├── assets/css/
│   ├── main.css            # 全局样式(导航/页脚/子页面,复刻 pages.css)
│   └── home.css            # 首页专属样式(hero 轮播/信号条/卡片,复刻 index.html)
├── layouts/default.vue     # 顶部导航 + 页脚(全站统一,品牌样式)
├── pages/
│   ├── index.vue           # 首页:hero 轮播 + 信号条 + 研究方向 + 最新进展 + 加入 CTA + 快捷导航
│   ├── research.vue        # 研究方向
│   ├── updates.vue         # 最新进展时间线(论文悬浮预览图随 payload 下发)
│   ├── members.vue         # 团队成员(按角色分组,自定义角色恒展示)
│   ├── member/[id].vue     # 成员详情页(静态构建时自动预渲染)
│   ├── papers/[id].vue     # PDF 优先的论文在线阅读,无 PDF 时回退 DOCX
│   ├── databases.vue       # 数据库(空状态)
│   ├── tools.vue           # 在线工具(空状态)
│   └── join.vue            # 加入我们
├── utils/text.ts           # sanitizeToText:数据库内容安全文本化(防存储型 XSS)
├── public/assets/          # 静态素材(院徽/helix/实验室图片)
├── public/files/papers/    # 论文 DOCX 原文(可选附同名 PDF 官方版式)
├── server/
│   ├── db/
│   │   ├── schema.mjs      # 建表 SQL(唯一数据源)
│   │   ├── database.ts     # SQLite 连接封装(queryAll/queryOne/execute)
│   │   ├── seed.mjs        # 示例数据(直接编辑成课题组真实内容)
│   │   └── reset.mjs       # 重置数据库
│   ├── lib/                # 纯函数库(可单测)
│   │   ├── paper-extract.mjs  # DOCX 媒体提取核心(路径包含性/扩展名/大小校验)
│   │   ├── paper-images.ts    # 论文关键图服务(缓存 + URL 映射)
│   │   ├── static-mode.ts     # 静态构建判定 + 预览图 manifest 读取
│   │   ├── query.ts           # limit 等查询参数校验
│   │   └── members.ts         # 成员角色分组(标准角色 + 自定义角色)
│   └── api/                # 文件即路由
│       ├── settings.get.ts        # GET /api/settings     站点配置
│       ├── hero-slides.get.ts     # GET /api/hero-slides  首页轮播
│       ├── signals.get.ts         # GET /api/signals      首页信号条
│       ├── research-areas.get.ts  # GET /api/research-areas 研究方向
│       ├── updates.get.ts         # GET /api/updates      最新进展(?limit= &featured= &with_images=)
│       ├── updates/[id].get.ts    # GET /api/updates/:id  单条动态详情
│       ├── updates/[id]/images.get.ts       # GET /api/updates/:id/images       论文关键图列表
│       ├── updates/[id]/images/[index].get.ts # GET .../images/:index            图片二进制
│       ├── members.get.ts         # GET /api/members      成员(分组,others 恒返回)
│       ├── members/[id].get.ts    # GET /api/members/:id  成员详情(含 detail sections)
│       ├── databases.get.ts       # GET /api/databases    数据库
│       └── tools.get.ts           # GET /api/tools        在线工具
├── scripts/
│   ├── pregen-images.mjs   # 静态构建前预生成论文预览图 + manifest
│   └── assert-dist.mjs     # CI 产物断言(路由/payload 非空/预览图完整)
├── tests/                  # vitest 单元 + 集成测试
├── .github/workflows/
│   ├── ci.yml              # PR/推送:typecheck + test + generate + 断言
│   └── deploy.yml          # main 推送:构建并发布 GitHub Pages
└── data/haida.db           # SQLite 数据文件(git 忽略)
```

## 数据流(与 lab-site 一致)

```
页面组件 useFetch('/api/xxx')
        ↓ (SSR 阶段)
Nitro server/api/*.get.ts
        ↓
server/db/database.ts(SQLite 查询)
        ↓
数据以 HTML 直接输出(SSR 渲染,浏览器无需二次请求)
```

静态构建(`nuxt generate`)时,上述数据流在构建机执行一次,结果写入各路由的
`_payload.json`;浏览器加载页面直接使用 payload,**不再请求任何 /api 接口**。
论文预览图同理:`scripts/pregen-images.mjs` 在构建前把 DOCX 关键图导出为
`public/updates-images/`,payload 中的图片 URL 直接指向静态文件。

## 如何添加内容(不用改代码)

所有内容都在数据库里,用任一 SQLite 工具(如 [DB Browser for SQLite](https://sqlitebrowser.org/))或命令行:

```bash
# 添加一条最新进展
sqlite3 data/haida.db "INSERT INTO updates (date, title, preview_title, summary, category, category_zh, tags, sort_order) VALUES ('2026-08-01', '标题', '预览标题', '简介...', 'Research', '论文', '标签', 0);"

# 添加一位成员(带个人详情页)
sqlite3 data/haida.db "INSERT INTO members (name, name_en, role, position, email, bio, photo, avatar_text, detail, sort_order) VALUES ('张三', 'San Zhang', 'PhD', '博士研究生', 'zhang@example.edu.cn', '简介...', '', '张', '{\"sections\":[{\"title\":\"教育背景\",\"items\":[\"2018-2023, XX大学, 博士\"]}]}', 1);"

# 发布一个数据库(空状态立即消失)
sqlite3 data/haida.db "INSERT INTO databases (title, description, url, maintainer, tag, sort_order) VALUES ('MyDB', '描述...', 'https://...', '张三', '病原', 0);"

# 隐藏某成员(visible=0 不再显示,不删除)
sqlite3 data/haida.db "UPDATE members SET visible=0 WHERE id=5;"
```

常用字段约定:

- `members.role`:标准角色 `PI` / `Postdoc` / `PhD` / `Master` / `RA` / `Alumni` 按固定顺序分组,
  其他自定义角色一律显示在「others」分组(**不再丢失**)
- `updates.category`:`Research` / `Resource` / `Team` / `Project`,配套 `category_zh` 中文标签
- `updates.paper_file`:相对 `public/` 的 DOCX 路径(如 `files/papers/xxx.docx`),
  页面自动生成论文阅读页 + 悬浮预览图;仅支持 `.docx`/`.zip`,路径不可逃逸 `public/`
- **官方版式 PDF(推荐)**:在 DOCX 同目录放同名 `.pdf`(如 `files/papers/xxx.pdf`),
  论文阅读页会**优先用 pdf.js 渲染 PDF**(版式与出版社一致),DOCX 仅作兜底与预览图提取;
  下载按钮也会自动切换为下载 PDF。PDF 渲染为浏览器端懒加载,不影响静态构建。
- `updates.featured`=1 且 `featured_badge` 非空 → 显示在首页「重点进展」大图
- `hero_slides.visual`:`photo` / `network` / `heatmap` 三种视觉
- **安全约定**:所有数据库文本都以纯文本渲染,`<br>` 自动转成换行,其余 HTML 一律剥离
- 所有表都有 `sort_order`(小的在前)与 `visible`(0=隐藏)
- 站点名称/页脚/各页 hero 文案/联系方式等改 `settings` 表(键值对)

## API 一览

| 端点 | 说明 |
|---|---|
| `GET /api/settings` | 站点配置键值对 |
| `GET /api/hero-slides` | 首页轮播(按 sort_order) |
| `GET /api/signals` | 首页信号条 |
| `GET /api/research-areas` | 研究方向 |
| `GET /api/updates` | 全部进展;`?limit=4` 取前 4(正整数,非法值返回 400);`?featured=1` 只取重点;`?with_images=1` 附带论文预览图列表 |
| `GET /api/updates/:id` | 单条动态详情(含 `paper_file`) |
| `GET /api/updates/:id/images` | 论文关键图列表(SSR 运行时) |
| `GET /api/updates/:id/images/:index` | 关键图二进制 |
| `GET /api/members` | 成员,按角色分组 `{ groups: [...], others: [...] }` |
| `GET /api/members/:id` | 成员详情(含 detail sections) |
| `GET /api/databases` | 数据库列表 |
| `GET /api/tools` | 工具列表 |

## 部署

### 方案 A:GitHub Pages(推荐,自动)

静态站点由 CI 自动构建并发布,**不需要人工搬运任何文件**:

1. **一次性设置**:仓库 Settings → Pages → Source 选择 **"GitHub Actions"**
   (部署工作流 `.github/workflows/deploy.yml` 会把构建产物直接发布到 Pages)
2. 推送 `main` 分支即触发:
   `npm ci → db:seed(全新数据库) → typecheck → test → generate(/haida-web/after/) → 产物断言 → 发布`
3. 产物断言(`scripts/assert-dist.mjs`)会在发布前拦截三类问题:
   路由缺失、**payload 为空(空数据库产物)**、预览图不完整,失败则不会发布

同一份 Pages 产物保留三个入口:

- `/haida-web/` 与 `/haida-web/before/`:固定的 PR 前版本 `019bcb0`。
- `/haida-web/after/`:当前 `main` 的 Nuxt 版本,随合并和推送自动更新。

手动运行 `Deploy before and after comparison` 也会复用同一发布流程,不会恢复过期的 PR 快照。

`dist/` 与 `public/updates-images/` 均为构建产物,已 git 忽略,不入库。

### 方案 B:云服务器(SSR,可选)

数据库默认存 `data/haida.db`,**建议把 `data/` 挂到持久化磁盘**并设置:

```bash
npm ci
npm run db:seed    # 生产机首次初始化
npm run build      # 产出 .output/
export LAB_DB_PATH=/var/lib/haida-web/haida.db   # 覆盖数据库位置
node .output/server/index.mjs   # 或 pm2 start .output/server/index.mjs --name haida-web
```

前置 Nginx 反向代理:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
```

> 注意:SSR 模式下内容来自运行时数据库,请确保数据有持久化与备份;若不需要在线更新内容,
> 优先使用方案 A,零运维且免数据库风险。

### 本地预览静态产物

```bash
npm run db:seed && npm run generate
npx serve .output/public   # 或任意静态服务器,检查 ./haida-web/ 子路径表现
```

## 后续可扩展

1. **管理后台**:加 `server/api/admin/*` + 登录(推荐 nuxt-auth-utils),用表单增删改
   (内容入库后需重新 `npm run generate` 并推送,静态站内容随代码更新)
2. **换 MySQL**:修改 `server/db/database.ts` 的 `queryAll/queryOne/execute` 三个函数即可,API 层零改动
3. **内容审核**:`updates` 表加 `visible` 已支持隐藏,可扩展草稿/发布状态
