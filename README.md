# haida-web-backend(海南大学机器学习与多组学分析研究团队官网后端)

> **本仓库为组装版**:由 [wangergouaaaa/haida-web](https://github.com/WangErgouaaaa/haida-web)(原静态前端)
> fork 后与 Nuxt 全栈后端组装而成,同时包含**完整源码**与**静态构建产物**(`dist/`)。
> - `dist/` 为 `nuxt generate` 产物(`baseURL=/haida-web/`),可直接部署到 GitHub Pages
> - 仓库根为可运行的 Nuxt 4 SSR 全栈项目(前端页面 + `/api/*` + SQLite)

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
| 数据库 | SQLite(Node 22.5+ 内置 `node:sqlite`) | 无需安装数据库服务,单文件即库 |
| API | Nitro `server/api/` | 文件即路由,SSR 时服务端直接查库 |
| 部署 | Node 服务器 / Docker | 见下方部署章节 |

> 为什么用 SQLite?零安装、零配置、文件即数据库,最适合课题组小规模站点。

## 快速开始

```bash
npm install
npm run db:seed     # 首次运行,写入示例数据(内容来自 haida-web 现有页面文案)
npm run dev         # http://localhost:3000
```

重置数据: `npm run db:reset` 后再 `npm run db:seed`。

## 目录结构

```
haida-web-backend/
├── nuxt.config.ts          # 配置:srcDir、CSS、数据库路径、node:sqlite 打包内联
├── assets/css/
│   ├── main.css            # 全局样式(导航/页脚/子页面,复刻 pages.css)
│   └── home.css            # 首页专属样式(hero 轮播/信号条/卡片,复刻 index.html)
├── layouts/default.vue     # 顶部导航 + 页脚(全站统一,品牌样式)
├── pages/
│   ├── index.vue           # 首页:hero 轮播 + 信号条 + 研究方向 + 最新进展 + 加入 CTA + 快捷导航
│   ├── research.vue        # 研究方向
│   ├── updates.vue         # 最新进展时间线
│   ├── members.vue         # 团队成员(按角色分组)
│   ├── member/[id].vue     # 成员详情页(教育背景/项目/论文/荣誉,来自 detail JSON)
│   ├── databases.vue       # 数据库(空状态)
│   ├── tools.vue           # 在线工具(空状态)
│   └── join.vue            # 加入我们
├── public/assets/          # 静态素材(院徽/helix/实验室图片)
├── server/
│   ├── db/
│   │   ├── schema.mjs      # 建表 SQL(唯一数据源)
│   │   ├── database.ts     # SQLite 连接封装(queryAll/queryOne/execute)
│   │   ├── seed.mjs        # 示例数据(直接编辑成课题组真实内容)
│   │   └── reset.mjs       # 重置数据库
│   └── api/                # 文件即路由
│       ├── settings.get.ts        # GET /api/settings     站点配置
│       ├── hero-slides.get.ts     # GET /api/hero-slides  首页轮播
│       ├── signals.get.ts         # GET /api/signals      首页信号条
│       ├── research-areas.get.ts  # GET /api/research-areas 研究方向
│       ├── updates.get.ts         # GET /api/updates      最新进展(?limit= &featured=)
│       ├── members.get.ts         # GET /api/members      成员(分组)
│       ├── members/[id].get.ts    # GET /api/members/:id  成员详情(含 detail sections)
│       ├── databases.get.ts       # GET /api/databases    数据库
│       └── tools.get.ts           # GET /api/tools        在线工具
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

- `members.role`:`PI` / `Postdoc` / `PhD` / `Master` / `RA` / `Alumni`(页面上按此分组)
- `updates.category`:`Research` / `Resource` / `Team` / `Project`,配套 `category_zh` 中文标签
- `updates.featured`=1 且 `featured_badge` 非空 → 显示在首页「重点进展」大图
- `hero_slides.visual`:`photo` / `network` / `heatmap` 三种视觉
- 所有表都有 `sort_order`(小的在前)与 `visible`(0=隐藏)
- 站点名称/页脚/各页 hero 文案/联系方式等改 `settings` 表(键值对)

## API 一览

| 端点 | 说明 |
|---|---|
| `GET /api/settings` | 站点配置键值对 |
| `GET /api/hero-slides` | 首页轮播(按 sort_order) |
| `GET /api/signals` | 首页信号条 |
| `GET /api/research-areas` | 研究方向 |
| `GET /api/updates` | 全部进展;`?limit=4` 取前 4;`?featured=1` 只取重点 |
| `GET /api/members` | 成员,按角色分组 `{ groups: [{role, items}] }` |
| `GET /api/databases` | 数据库列表 |
| `GET /api/tools` | 工具列表 |

## 部署

### 方案 A:云服务器(推荐)

```bash
npm ci
npm run db:seed    # 生产机首次初始化
npm run build      # 产出 .output/
node .output/server/index.mjs   # 或 pm2 start .output/server/index.mjs --name haida-web
```

数据库默认存 `data/haida.db`,**建议把 `data/` 挂到持久化磁盘**并设置:

```bash
export LAB_DB_PATH=/var/lib/haida-web/haida.db   # 覆盖数据库位置
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

### 方案 B:Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
ENV LAB_DB_PATH=/data/haida.db
VOLUME /data
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### 方案 C:纯静态(内容不常变时)

`npm run generate` 可导出纯静态 HTML,扔到 GitHub Pages / Nginx 静态目录即可。
**本仓库已内置构建产物 `dist/`**(`baseURL=/haida-web/`),直接把 `dist/` 部署到 GitHub Pages 即可:
- GitHub Pages → Settings → Pages → **Deploy from a branch** → 选择分支与目录 `/(root)`(将 `dist/` 内容置于仓库根)或配置子目录
- 或重新生成:`NUXT_APP_BASE_URL=/haida-web/ npm run generate` 后取 `.output/public/` 内容

注意:静态模式下 API 不工作,页面显示的是构建时的数据快照(当前静态站即此形态)。

## 后续可扩展

1. **管理后台**:加 `server/api/admin/*` + 登录(推荐 nuxt-auth-utils),用表单增删改
2. **换 MySQL**:修改 `server/db/database.ts` 的 `queryAll/queryOne/execute` 三个函数即可,API 层零改动
3. **内容审核**:`updates` 表加 `visible` 已支持隐藏,可扩展草稿/发布状态
