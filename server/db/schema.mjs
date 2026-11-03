// 数据库 Schema 单源文件(被 database.ts 与 seed.mjs 共同引用)
// 做成 .mjs 模块而不是 .sql 文件,是为了避免 Nitro 编译后路径失效
export const SCHEMA = `
-- ============================================================
-- 机器学习与多组学分析研究团队 网站 Schema(SQLite)
-- 设计对标 lab-site:主站所有动态内容都来自这几张表
-- ============================================================

-- 站点设置(站点名、学院、联系方式等)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- 首页 Hero 轮播(每张幻灯片:标题、文案、按钮、视觉类型)
CREATE TABLE IF NOT EXISTS hero_slides (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kicker      TEXT NOT NULL DEFAULT '',       -- 顶部小标签,如 "One Health · 同一健康"
  title       TEXT NOT NULL DEFAULT '',       -- 大标题(可含 <br>)
  text        TEXT NOT NULL DEFAULT '',       -- 副标题段落
  action1_text TEXT NOT NULL DEFAULT '',
  action1_url  TEXT NOT NULL DEFAULT '',
  action2_text TEXT NOT NULL DEFAULT '',
  action2_url  TEXT NOT NULL DEFAULT '',
  visual      TEXT NOT NULL DEFAULT 'photo',  -- photo / network / heatmap
  sort_order  INTEGER NOT NULL DEFAULT 0,
  visible     INTEGER NOT NULL DEFAULT 1
);

-- 首页信号条(研究框架/核心问题/技术路径 三项)
CREATE TABLE IF NOT EXISTS signals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  label       TEXT NOT NULL DEFAULT '',       -- 小标签,如 "研究框架 · Framework"
  title       TEXT NOT NULL DEFAULT '',       -- 粗体,如 "同一健康"
  text        TEXT NOT NULL DEFAULT '',       -- 说明,如 "连接宿主、媒介/环境与病原"
  sort_order  INTEGER NOT NULL DEFAULT 0,
  visible     INTEGER NOT NULL DEFAULT 1
);

-- 研究方向(首页卡片 + 研究方向页)
CREATE TABLE IF NOT EXISTS research_areas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  number      TEXT NOT NULL DEFAULT '',       -- 序号,如 "01"
  title_en    TEXT NOT NULL DEFAULT '',       -- 英文名,如 "Surveillance"
  title_zh    TEXT NOT NULL DEFAULT '',       -- 中文标题
  description TEXT NOT NULL DEFAULT '',       -- 简介
  methods     TEXT NOT NULL DEFAULT '',       -- 方法标签,如 "比较基因组学 · 群体遗传学 · 机器学习"
  visual      TEXT NOT NULL DEFAULT 'surveillance', -- 卡片视觉: surveillance / evolution / onehealth
  sort_order  INTEGER NOT NULL DEFAULT 0,
  visible     INTEGER NOT NULL DEFAULT 1
);

-- 最新进展(时间线,首页取前 4 条,featured 为首页重点)
CREATE TABLE IF NOT EXISTS updates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL,                  -- 日期 YYYY-MM-DD
  title       TEXT NOT NULL,                  -- 时间线条目标题
  preview_title TEXT NOT NULL DEFAULT '',     -- 预览浮层标题
  summary     TEXT NOT NULL DEFAULT '',       -- 预览浮层简介
  category    TEXT NOT NULL DEFAULT 'Research', -- Research / Resource / Team / Project
  category_zh TEXT NOT NULL DEFAULT '',       -- 论文 / 数据资源 / 团队动态 / 项目
  tags        TEXT NOT NULL DEFAULT '',       -- 标签,如 "病原监测 · 机器学习 · 多组学"
  featured    INTEGER NOT NULL DEFAULT 0,     -- 1 = 首页重点进展(最新一条 featured 展示)
  featured_badge TEXT NOT NULL DEFAULT '',    -- 重点进展角标,如 "重点进展 · 2026.07"
  paper_file  TEXT NOT NULL DEFAULT '',       -- 论文文件路径(public/papers/xxx.docx),空表示无在线阅读
  sort_order  INTEGER NOT NULL DEFAULT 0,     -- 小的在前
  visible     INTEGER NOT NULL DEFAULT 1
);

-- 团队成员
CREATE TABLE IF NOT EXISTS members (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,                  -- 中文名
  name_en     TEXT NOT NULL DEFAULT '',       -- 英文名
  role        TEXT NOT NULL,                  -- PI / Postdoc / PhD / Master / RA / Alumni
  position    TEXT NOT NULL DEFAULT '',       -- 详细职位说明
  email       TEXT NOT NULL DEFAULT '',
  website     TEXT NOT NULL DEFAULT '',       -- 个人主页
  bio         TEXT NOT NULL DEFAULT '',       -- 简介
  photo       TEXT NOT NULL DEFAULT '',       -- 照片路径(public/assets/members/xxx.png),空则显示文字头像
  avatar_text TEXT NOT NULL DEFAULT '',       -- 无照片时的头像占位文字,如 "PI" / 姓氏
  detail      TEXT NOT NULL DEFAULT '',       -- 个人详情页完整资料(JSON: {sections:[{title,items[]}]})
  sort_order  INTEGER NOT NULL DEFAULT 0,
  visible     INTEGER NOT NULL DEFAULT 1
);

-- 数据库资源
CREATE TABLE IF NOT EXISTS databases (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL DEFAULT '',
  maintainer  TEXT NOT NULL DEFAULT '',       -- 维护人
  tag         TEXT NOT NULL DEFAULT '',       -- 分类标签
  status      TEXT NOT NULL DEFAULT 'online', -- online / building
  sort_order  INTEGER NOT NULL DEFAULT 0,
  visible     INTEGER NOT NULL DEFAULT 1
);

-- 在线工具
CREATE TABLE IF NOT EXISTS tools (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL DEFAULT '',
  maintainer  TEXT NOT NULL DEFAULT '',
  tag         TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'online', -- online / building
  sort_order  INTEGER NOT NULL DEFAULT 0,
  visible     INTEGER NOT NULL DEFAULT 1
);
`
