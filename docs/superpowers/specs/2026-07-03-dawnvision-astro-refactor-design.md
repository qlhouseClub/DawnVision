# DawnVision 全栈重构 SDD（Software Design Document）

> 分支: `refactor/astro-react-ts`
> 创建日期: 2026-07-03
> 状态: 设计中
> 技术栈: Astro 5.x + React 18 + TypeScript + CSS Modules

---

## 1. 项目概述

DawnVision 是一份 AI 深度观察日刊（工作日每日16:30发布），当前运行于 GitHub Pages，使用纯 Python f-string 拼接 HTML 的方式构建。随着内容增长（7期63页）和访问量上升（法国区域突发4000+请求），现有架构暴露出严重的维护困难和性能问题。

### 1.1 重构目标

| 目标 | 衡量标准 |
|------|---------|
| 组件化模块化 | CSS从3079行单文件拆分为组件级scoped样式，JS从1118行巨石IIFE拆分为模块 |
| 性能优化 | 首屏JS ≈ 0KB（Astro零JS默认），CSS/JS压缩+hash缓存，LCP < 1.5s |
| 内容生产工具私有化 | Python工具链与Web项目完全分离，collect/draft/knowledge等不进入公开仓库 |
| 可维护性 | 新增一期只需输出一个JSON文件，无需修改任何模板代码 |
| 开发体验 | 热更新开发服务器、TypeScript类型安全、组件复用 |
| 零停机迁移 | 重构期间线上main分支不受影响，新分支本地验证完成后合并部署 |

### 1.2 非目标（本次不做）

- 不改变视觉设计语言（Klein蓝品牌色、排版风格、交互体验保持一致）
- 不引入后端服务（仍为纯静态站点，部署在GitHub Pages）
- 不改变内容生产流程（人工+LLM的选题写作模式不变）
- 不做用户系统/评论系统（保持静态发布）

---

## 2. 现有问题诊断（共50项）

### 2.1 Critical（必须修复，6项）

| # | 问题 | 修复方案 |
|---|------|---------|
| C1 | `--color-text-light` CSS变量未定义，100+处引用回退为无效值 | 在Design Token中明确定义 |
| C2 | `--font-sans` 错误指向PT Serif衬线体，且该字体未加载 | 改为Noto Sans SC无衬线字体栈，正确加载 |
| C3 | interactions.js中CSS双`!important`语法错误 | 删除重复声明 |
| C4 | 三套Google Translate抑制脚本冲突，50ms轮询性能浪费 | 统一为一套方案，移入React组件 |
| C5 | 文章页prev/next导航跨栏目跳转（封面→Cao），逻辑混乱 | 按文章类型分组，同栏目内导航 |
| C6 | issue-007重复内容（articles.html与issues/issue-007.html），SEO惩罚 | articles.html为规范URL，issue-NNN.html为归档，canonical正确指向 |

### 2.2 Major（强烈建议修复，14项）

| # | 问题 | 修复方案 |
|---|------|---------|
| M1 | 四级联动筛选器（年→月→半→期）过度设计，仅7期内容需3-4次点击 | **删除四级筛选器**，改为单一下拉选择器"Issue 007 · 2026.07.02"，1次点击切换 |
| M2 | CSS约1000行死代码（v3组件库写了未用、旧版masthead/cover/colophon/stats-bar等） | 组件迁移时按需引入，彻底删除死代码 |
| M3 | CSS重复定义（article-page__back定义两次、响应式断点重复3处） | Scoped CSS天然解决 |
| M4 | 三种页脚样式并存（home__footer/site-footer/footer） | 统一为Footer组件 |
| M5 | bg-blob背景5-6个大尺寸模糊圆+动画，低端设备GPU压力 | 减少到2-3个，降低blur，prefers-reduced-motion停止动画 |
| M6 | 点赞可无限刷，仅localStorage无后端 | 改为"标记喜欢"功能，本地存储已赞状态，不显示虚假计数 |
| M7 | 不蒜子阅读量统计不稳定 | 移除第三方统计依赖，保持简洁 |
| M8 | GT hack占JS 50%（~560行），维护成本极高 | 简化为浏览器原生翻译触发，移除GT Element |
| M9 | 首页H1用英文，中文SEO差，隐藏h2做关键词填充 | H1改为中文品牌标语，英文为装饰subtitle |
| M10 | 暗色模式不完整，仅覆盖legacy变量 | 通过CSS变量体系完整支持暗色模式 |
| M11 | sitemap.xml重复URL、缺失文章 | 用@astrojs/sitemap自动生成 |
| M12 | 焦点管理缺失（弹窗无focus trap） | React组件中实现完整可访问性 |
| M13 | 导航中英混用（Home/Articles/Cao/About） | 统一为中文导航：首页/文章/槽点/关于 |
| M14 | 打赏二维码路径计算脆弱 | 组件内统一路径管理 |

### 2.3 Minor（顺手修复，30项）

| 类别 | 问题 |
|------|------|
| 错误页 | 仅有404，缺少403/500/502/503/504错误页 |
| 内联样式 | about.html 108行、404.html 92行内联CSS；文章页大量内联style |
| 排版 | 标题硬换行`<br>`、首段放大对短段落过度、h2间距过大、strong虚线下划线像链接 |
| 可访问性 | 缺少skip-link、focus-visible样式、prefers-reduced-motion支持 |
| 性能 | 字体未preload/font-display、无资源hash缓存、无CSS/JS压缩 |
| SEO | robots.txt不必要禁止interactions.js、favicon不完整、sitemap问题 |
| 交互 | 无URL来源可分享翻译状态、"明天见"等文案未i18n、标签中英双语冗长 |
| 其他 | about.html暴露手机号、空行不规范、inner-nav backdrop-filter无降级、首页Read More多一次点击 |

---

## 3. 架构设计

### 3.1 整体架构：工具层与展示层分离

```
DawnVision/
├── tools/                          # 本地内容生产工具（不发布、不公开）
│   ├── collect.py                  # RSS信号采集
│   ├── draft.py                    # 选题+LLM Prompt生成
│   ├── validate.py                 # JSON schema校验（原process.py简化）
│   ├── knowledge.py                # Obsidian知识网络生成（只读JSON，不解析HTML）
│   ├── config/
│   │   ├── sources.json            # RSS信源配置
│   │   ├── writing-style.md        # 写作风格指南
│   │   └── knowledge-topics.json   # 知识主题映射
│   └── data/
│       ├── raw-signals-*.json      # 采集信号（本地）
│       └── issue-NNN.json          # LLM生成的最终内容（同步到web项目）
│
├── web/                            # Astro Web项目（公开，部署到GitHub Pages）
│   ├── astro.config.mts
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   │   ├── assets/
│   │   │   ├── og-image.png
│   │   │   ├── reward-qr.webp
│   │   │   └── fonts/              # 自托管字体（可选）
│   │   └── favicon.svg
│   ├── src/
│   │   ├── content/
│   │   │   ├── issues/
│   │   │   │   └── issue-NNN.json  # 从tools/data同步的内容JSON
│   │   │   └── config.ts           # 站点配置
│   │   ├── layouts/
│   │   │   ├── BaseLayout.astro    # HTML基础骨架（head/SEO/fonts）
│   │   │   ├── ArticleLayout.astro # 文章详情页布局
│   │   │   └── ListingLayout.astro # 列表页布局
│   │   ├── components/
│   │   │   ├── Nav.astro           # 导航栏
│   │   │   ├── Footer.astro        # 页脚
│   │   │   ├── BackgroundBlobs.astro
│   │   │   ├── ArticleCard.astro
│   │   │   ├── CoverCard.astro
│   │   │   ├── CaoCard.astro
│   │   │   ├── IssueSelector.tsx   # 期数选择器（React，替代四级筛选）
│   │   │   ├── Pagination.astro
│   │   │   ├── PullQuote.astro
│   │   │   ├── ArticleSources.astro
│   │   │   ├── ArticleNav.astro    # 上一篇/下一篇
│   │   │   ├── LangButton.tsx      # 翻译按钮（React）
│   │   │   ├── LikeButton.tsx      # 点赞按钮（React）
│   │   │   ├── TipModal.tsx        # 打赏弹窗（React）
│   │   │   ├── NewContentNotify.tsx# 新内容通知（React）
│   │   │   └── SectionHeader.astro
│   │   ├── styles/
│   │   │   ├── tokens.css          # Design Tokens（CSS变量）
│   │   │   ├── global.css          # 全局reset/基础样式
│   │   │   └── typography.css      # 排版系统
│   │   ├── lib/
│   │   │   ├── issues.ts           # 内容加载/查询工具函数
│   │   │   └── i18n.ts             # 国际化字典
│   │   └── pages/
│   │       ├── index.astro         # 首页
│   │       ├── articles/
│   │       │   └── index.astro     # 最新期文章列表
│   │       ├── article/[...slug].astro  # 文章详情页（cover/brief统一）
│   │       ├── cao/
│   │       │   ├── index.astro     # Cao槽点列表
│   │       │   └── [...slug].astro # Cao详情页
│   │       ├── issues/
│   │       │   └── [number].astro  # Issue归档页
│   │       ├── about.astro         # 关于页
│   │       ├── knowledge/
│   │       │   ├── index.astro     # 知识网络索引
│   │       │   └── [slug].astro    # 知识主题页
│   │       ├── 404.astro           # 404页
│   │       ├── 500.astro           # 服务器错误页
│   │       └── 503.astro           # 服务不可用页
│   └── dist/                       # 构建输出（gitignore，部署用）
│
├── knowledge/                      # Obsidian知识网络（本地，不发布）
├── notes/                          # Obsidian文献笔记（本地，不发布）
├── .gitignore                      # 更新：忽略web/dist、tools/data/raw-signals、notes、knowledge
└── README.md
```

### 3.2 数据流

```
collect.py → raw-signals-*.json
                  ↓
draft.py → prompt-NNN.md → [人工/LLM] → issue-NNN.json
                                              ↓
validate.py（schema校验）
                                              ↓
                     ┌────────────────────────┴───────────────────────┐
                     ↓                                                ↓
          knowledge.py（生成Obsidian笔记）              同步到 web/src/content/issues/
                     ↓                                                ↓
               knowledge/ notes/（本地）                   astro build
                                                              ↓
                                                         dist/ → GitHub Pages
```

### 3.3 URL 路由设计

| URL | 页面 | 说明 |
|-----|------|------|
| `/` | 首页 | Klein蓝全屏hero + 最新期teaser |
| `/articles` | 最新期文章列表 | 原articles.html，为规范URL |
| `/article/[slug]` | 文章详情页 | cover和brief统一路由，通过frontmatter type区分样式 |
| `/cao` | Cao槽点列表 | 所有Cao文章聚合 |
| `/cao/[slug]` | Cao详情页 | |
| `/issues/[number]` | Issue归档页 | 如/issues/007，canonical指向/articles |
| `/about` | 关于页 | |
| `/knowledge` | 知识网络索引 | |
| `/knowledge/[slug]` | 知识主题页 | |
| `/404` | 404页 | Astro自动处理 |

**关键变更**：
- 文章URL从 `articles/2026-07-02-slug.html` 改为 `/article/slug`（更简洁，不暴露日期在URL中）
- Cao URL从 `cao/2026-07-02-slug.html` 改为 `/cao/slug`
- 列表页从 `articles.html` 改为 `/articles`（无.html后缀更现代）
- 旧URL通过redirect或Astro的动态路由兼容处理

---

## 4. 组件设计

### 4.1 布局组件（Astro，零JS）

#### BaseLayout.astro
- 职责：HTML文档骨架，包含`<head>`（meta/OG/JSON-LD/fonts/CSS）、GT反重定向脚本（简化版）
- Props: `title`, `description`, `ogImage`, `canonical`, `type`('website'|'article')
- 自动注入结构化数据（JSON-LD）

#### ArticleLayout.astro
- 继承BaseLayout
- 包含：Nav + ArticleHero + ArticleMeta + ArticleContent + ArticleNav + Sources + Footer
- Props: `article`, `issue`, `prev`, `next`

#### ListingLayout.astro
- 继承BaseLayout
- 包含：Nav + IssueSelector + CaoSection + CoverCard + ArticleGrid + Pagination + Footer

### 4.2 UI组件（Astro，零JS）

| 组件 | Props | 职责 |
|------|-------|------|
| Nav.astro | `active`('home'|'articles'|'cao'|'about') | 顶部导航栏，sticky+backdrop-blur，响应式 |
| Footer.astro | - | 页脚，统一站点信息 |
| BackgroundBlobs.astro | `variant`('home'|'hero'|'cao') | 背景装饰，2-3个blob，支持reduced-motion |
| ArticleCard.astro | `article`, `issueDate`, `prefix` | Brief文章卡片（tag+title+excerpt） |
| CoverCard.astro | `article`, `issueDate`, `prefix` | 封面焦点卡片（大尺寸） |
| CaoCard.astro | `article`, `issueDate`, `prefix` | Cao槽点推荐卡片（蓝色背景） |
| Pagination.astro | `current`, `issues`, `prefix` | 数字分页+上一期/下一期 |
| PullQuote.astro | `text`, `attr` | 金句引用块 |
| ArticleSources.astro | `sources` | 参考来源列表（有URL为链接，无URL为文本） |
| ArticleNav.astro | `prev`, `next`, `type` | 上一篇/下一篇导航，同栏目内 |
| SectionHeader.astro | `label`, `title` | 区块标题（如"Focus · 焦点"） |

### 4.3 交互组件（React/TS，客户端JS）

| 组件 | 职责 | JS体积估算 |
|------|------|-----------|
| IssueSelector.tsx | **替代四级联动筛选器**：单一下拉选择器，列出所有期数（"Issue 007 · 2026.07.02"），选择后跳转 | ~2KB |
| LangButton.tsx | 语言切换按钮，浏览器原生翻译触发，显示翻译中状态，EN/CN切换 | ~3KB |
| LikeButton.tsx | 点赞/喜欢按钮，本地存储已赞状态，无虚假计数，点击动画 | ~1KB |
| TipModal.tsx | 打赏弹窗，focus trap，ESC关闭，二维码显示 | ~2KB |
| NewContentNotify.tsx | 新内容通知横幅，轮询version.json，slide-in动画 | ~2KB |

**总JS预算**：所有交互组件gzip后 < 15KB（相比当前interactions.js ~35KB gzip大幅减少）

---

## 5. 设计系统

### 5.1 Design Tokens（tokens.css）

```css
:root {
  /* 颜色 */
  --color-brand: #002FA7;      /* Klein蓝 */
  --color-brand-soft: #1a3fb5;
  --color-brand-faint: rgba(0, 47, 167, 0.08);
  --color-bg: #ffffff;
  --color-bg-alt: #f8f8f8;
  --color-text: #0a0a0a;
  --color-text-soft: #333333;
  --color-text-muted: #666666;
  --color-text-faint: #999999;
  --color-text-light: var(--color-text-faint); /* 修复C1 */
  --color-border: rgba(0, 0, 0, 0.1);
  --color-accent: #e09540;     /* 保留一个暖色调accent */

  /* 字体 */
  --font-serif: 'Source Serif 4', 'Noto Serif SC', Georgia, serif;
  --font-sans: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; /* 修复C2 */
  --font-mono: 'JetBrains Mono', monospace;

  /* 字号 */
  --fs-xs: clamp(0.75rem, 0.7rem + 0.2vw, 0.8rem);
  --fs-sm: clamp(0.8rem, 0.75rem + 0.2vw, 0.875rem);
  --fs-base: clamp(0.95rem, 0.9rem + 0.2vw, 1rem);
  --fs-lg: clamp(1.1rem, 1rem + 0.4vw, 1.25rem);
  --fs-xl: clamp(1.3rem, 1.1rem + 0.8vw, 1.6rem);
  --fs-2xl: clamp(1.6rem, 1.3rem + 1.2vw, 2.2rem);
  --fs-3xl: clamp(2rem, 1.5rem + 2vw, 3rem);
  --fs-hero: clamp(2.5rem, 2rem + 3vw, 5rem);

  /* 间距 */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 24px;
  --sp-6: 32px;
  --sp-7: 48px;
  --sp-8: 64px;
  --sp-9: 96px;

  /* 布局 */
  --container: min(1200px, 92vw);
  --article-width: min(720px, 92vw);
  --radius: 8px;
  --radius-lg: 16px;

  /* 动画 */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --duration: 0.25s;

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0a0a0a;
    --color-bg-alt: #141414;
    --color-text: #f0f0f0;
    --color-text-soft: #ccc;
    --color-text-muted: #999;
    --color-text-faint: #666;
    --color-border: rgba(255,255,255,0.1);
  }
}
```

### 5.2 废弃旧变量

删除所有legacy别名（`--klein`, `--paper`, `--ink`, `--serif`, `--sans`等），统一使用新命名体系。

### 5.3 排版规范

- **标题**：Source Serif 4（衬线），中文回退Noto Serif SC
- **正文**：Source Serif 4，1.75行高，每行65-75字符
- **辅助文字**（meta、标签、导航）：Noto Sans SC（无衬线）
- **代码**：JetBrains Mono

---

## 6. 期数选择器重构（关键UX决策）

### 6.1 废弃四级联动

**原因**：
- 7期内容需要3-4次点击，底部分页只需1次
- "半"（H1/H2上半月/下半月）概念对用户无意义（日刊不需要按月半分组）
- 年份只有2026一个选项
- 月份硬编码12个月，空月份造成困惑

### 6.2 新设计：单一下拉 + 底部分页

**顶部**：一个下拉选择器 `<select>`，选项格式为 `Issue 007 · 2026.07.02`，按时间倒序排列，1次点击切换。
**底部**：保留数字分页（`1 2 3 4 5 6 [7]`）+ 上一期/下一期导航。

这样兼顾了两种使用场景：
- 知道期号/日期的用户 → 顶部下拉
- 想逐期浏览的用户 → 底部导航或数字分页

---

## 7. 翻译功能重构

### 7.1 废弃方案

- ~~Google Translate Element~~ → 移除（560行hack代码、CORS问题、UI污染）
- ~~内联anti-GT脚本~~ → 移除
- ~~MutationObserver + 50ms轮询~~ → 移除

### 7.2 新方案：浏览器原生翻译

利用Chrome/Edge内置翻译能力：
1. 设置 `<html lang="zh-CN">`
2. 右下角EN/CN切换按钮
3. 点击"EN"时，通过 `document.documentElement.lang = "en"` 触发浏览器翻译提示
4. 点击"CN"时恢复 `lang="zh-CN"` 触发恢复
5. 翻译中状态显示"..."在按钮上
6. 对Safari/Firefox用户显示提示（建议使用Chrome/Edge）

**优势**：零额外依赖、零JS hack、浏览器原生能力、性能零开销
**JS体积**：从~560行减少到~50行

---

## 8. 错误页设计

### 8.1 需要的错误页

| 页面 | 场景 | 设计 |
|------|------|------|
| 404 | 页面不存在 | Klein蓝背景，大字"404"，文案"这页穿越到未来了"，返回首页/最新期链接 |
| 500 | 服务器内部错误 | 灰色背景，"服务器开小差了"，返回首页链接 |
| 502/503/504 | 服务不可用/网关错误 | 统一"暂时无法访问"页面，重试+首页链接 |

GitHub Pages 静态托管下：
- 404.html 由GitHub Pages自动使用
- 500/502/503/504 主要用于本地开发和未来可能的服务端渲染场景
- 这些页面在Astro中作为静态页面构建，风格统一

---

## 9. 内容生产工具分离

### 9.1 工具链改造

**process.py 大幅简化 → validate.py**：
- 移除所有HTML生成代码（f-string模板、build_*函数）
- 保留/改造为：JSON schema校验、slug唯一性检查、必填字段验证
- 输出：通过/失败 + 错误详情
- 不再写入任何HTML文件

**knowledge.py 改造**：
- 不再解析HTML提取数据
- 直接读取 `issue-NNN.json` 中的 `cognitive_notes` 字段
- 输出Obsidian Markdown文件到 `knowledge/` 和 `notes/`
- 输出路径保持在DawnVision根目录（不进入web/）

**publish.py 改造 → deploy脚本**：
- 进入web/目录执行 `astro build`
- 将dist/推送到gh-pages分支或直接覆盖main分支根目录
- 执行验证：构建产物检查、链接检查

### 9.2 .gitignore 更新

```gitignore
# 内容生产中间产物
tools/data/raw-signals-*.json
tools/data/prompt-*.md

# Obsidian本地知识库（不发布）
knowledge/
notes/
知识网络.md

# Astro构建产物
web/dist/
web/node_modules/
web/.astro/

# 复盘文档（本地）
DawnVision_*_retrospective.*
```

### 9.3 数据同步机制

`issue-NNN.json` 由LLM生成后保存到 `tools/data/`，然后通过简单的复制命令同步到 `web/src/content/issues/`。可以在validate.py中添加自动复制逻辑。

---

## 10. 性能策略

| 策略 | 实现方式 | 预期效果 |
|------|---------|---------|
| 零JS默认 | Astro岛屿架构，非交互组件零JS | 首屏JS ~0KB |
| CSS Scoped | 组件级CSS，仅加载当前页面用到的样式 | CSS从3079行→按需加载，预计gzip < 15KB |
| 资源压缩 | Astro内置CSS/JS/HTML压缩 | 减少30-40%体积 |
| Hash缓存 | Astro自动添加content hash到资源文件名 | 永久缓存策略，更新自动失效 |
| 字体优化 | preload + font-display:optional + 子集化 | 减少FOIT/FOUT |
| 图片优化 | Astro内置图片优化（待确认是否引入） | 自动WebP/AVIF、懒加载 |
| 移除死代码 | 迁移时不引入未使用的CSS | CSS减少约1000行 |
| 减少JS依赖 | React runtime仅加载交互岛屿 | gzip < 15KB JS |
| 移除轮询 | 删除GT 50ms setInterval | 减少CPU/GPU使用 |
| 优化动画 | bg-blob减少+reduced-motion | 低端设备流畅 |

### 10.1 性能预算

| 指标 | 目标 |
|------|------|
| 首屏JS（列表页/首页） | < 5KB gzip（仅LangButton + NewContentNotify） |
| 首屏JS（文章页） | < 10KB gzip（加LikeButton + TipModal） |
| CSS总量 | < 20KB gzip |
| LCP（Largest Contentful Paint） | < 1.5s |
| CLS（Cumulative Layout Shift） | < 0.1 |
| TTI（Time to Interactive） | < 2s |

---

## 11. SEO策略

| 项目 | 实现方式 |
|------|---------|
| 语义化HTML | 正确使用h1-h6、article、nav、main、aside、header、footer |
| Meta标签 | BaseLayout统一生成title/description/keywords |
| Open Graph | 每页面og:title/description/image/type/url |
| Twitter Cards | summary_large_image卡片 |
| JSON-LD | NewsArticle/BlogPosting/WebSite结构化数据 |
| Canonical URL | 正确设置canonical，解决重复内容 |
| Sitemap | @astrojs/sitemap自动生成 |
| Robots.txt | Astro public/目录中维护 |
| H1中文 | 首页H1使用中文品牌标语 |
| 干净URL | 无.html后缀，语义化slug |

---

## 12. 开发阶段规划

### Phase 0：基础设施（预计0.5天）
- [ ] 创建web/目录，初始化Astro+React+TS项目
- [ ] 配置astro.config.mts（GitHub Pages base路径、sitemap集成、redirects）
- [ ] 配置tsconfig、package.json
- [ ] 迁移静态资源（og-image、reward-qr、favicon）
- [ ] 建立tokens.css + global.css
- [ ] 定义Content Collections schema（zod验证issue JSON）
- [ ] 将现有issue-004~007.json放入src/content/issues/，添加type字段
- [ ] 编写HTML→JSON提取脚本，从issue-001~003的HTML文件反向生成JSON
- [ ] 配置旧URL重定向（见14.2节）

### Phase 1：布局与基础组件（预计1天）
- [ ] BaseLayout.astro（head/SEO/fonts/GT简化脚本）
- [ ] Nav.astro + Footer.astro
- [ ] BackgroundBlobs.astro
- [ ] SectionHeader.astro
- [ ] 验证：能渲染一个带导航和页脚的空白页面

### Phase 2：首页（预计0.5天）
- [ ] index.astro：Klein蓝全屏hero + teaser + 首页blobs
- [ ] 修复H1中文SEO问题
- [ ] Read More直接链接封面文章
- [ ] 验证：首页视觉与现有版本一致

### Phase 3：列表页（预计1天）
- [ ] ArticleCard.astro + CoverCard.astro + CaoCard.astro
- [ ] Pagination.astro
- [ ] IssueSelector.tsx（新的单一下拉选择器，替代四级筛选）
- [ ] ListingLayout.astro
- [ ] articles/index.astro（最新期列表）
- [ ] issues/[number].astro（归档页）
- [ ] 验证：列表页功能完整，期数切换正常

### Phase 4：文章详情页（预计1天）
- [ ] ArticleLayout.astro
- [ ] PullQuote.astro + ArticleSources.astro + ArticleNav.astro
- [ ] article/[...slug].astro（cover/brief统一路由）
- [ ] cao/[slug].astro
- [ ] 修复prev/next导航（同栏目内）
- [ ] 修复内联style→语义化class
- [ ] 验证：文章阅读体验与现有一致

### Phase 5：交互功能迁移（预计1天）
- [ ] LangButton.tsx（浏览器原生翻译，替代560行GT hack）
- [ ] LikeButton.tsx（改为标记喜欢，防止重复点赞）
- [ ] TipModal.tsx（打赏弹窗+focus trap+ESC关闭）
- [ ] NewContentNotify.tsx（新内容通知）
- [ ] 验证：所有交互功能正常工作

### Phase 6：Cao列表 + 关于 + 知识网络（预计0.5天）
- [ ] cao/index.astro（Cao列表页，从Content Collection聚合）
- [ ] about.astro（移除内联CSS，移除手机号，组件化）
- [ ] knowledge/index.astro + knowledge/[slug].astro
- [ ] 验证：所有页面正常访问

### Phase 7：错误页（预计0.5天）
- [ ] 404.astro
- [ ] 500.astro + 502.astro + 503.astro + 504.astro（统一错误模板）
- [ ] 验证：错误页正常显示

### Phase 8：内容工具链重构（预计0.5天）
- [ ] validate.py（替代process.py，仅做JSON校验）
- [ ] knowledge.py改造（读JSON而非HTML）
- [ ] deploy脚本（astro build + 发布）
- [ ] 更新.gitignore
- [ ] 写README文档说明新工作流
- [ ] 验证：能从JSON到站点的完整流程

### Phase 9：构建优化与SEO（预计0.5天）
- [ ] 配置@astrojs/sitemap
- [ ] 字体preload + font-display
- [ ] 验证所有SEO标签
- [ ] favicon多尺寸
- [ ] robots.txt更新
- [ ] 暗色模式完整测试
- [ ] prefers-reduced-motion支持
- [ ] skip-link可访问性
- [ ] 验证：Lighthouse评分 > 95

### Phase 10：全量验证（预计0.5天）
- [ ] 所有页面视觉对比（截图对比现有版本）
- [ ] 所有交互功能测试
- [ ] 响应式测试（375px/768px/1200px）
- [ ] 暗色模式测试
- [ ] 翻译功能测试
- [ ] 性能Lighthouse测试
- [ ] 内部链接完整性检查
- [ ] 跨浏览器测试（Chrome/Edge/Firefox/Safari）
- [ ] 期数切换全链路验证
- [ ] 修复所有发现的bug

**总预计时间**：约7天（实际可根据进度调整）

---

## 13. 验证标准

### 13.1 功能完整性

- [ ] 首页视觉与现有版本一致
- [ ] 文章列表页：封面卡片、Brief网格、Cao推荐、期数选择、分页
- [ ] 文章详情页：hero、meta、正文、引用块、来源、上下篇导航、点赞、打赏
- [ ] Cao列表和详情页
- [ ] 期数切换（下拉+分页+上下期）全部正常
- [ ] 语言切换EN/CN正常工作
- [ ] 新内容通知正常显示
- [ ] 打赏弹窗正常
- [ ] 关于页正常
- [ ] 知识网络正常
- [ ] 错误页正常显示

### 13.2 视觉一致性

- [ ] Klein蓝品牌色正确
- [ ] 排版（字体、字号、行高）与现有一致
- [ ] 间距、圆角、阴影一致
- [ ] 响应式布局一致
- [ ] 暗色模式正常
- [ ] 动画/过渡效果流畅

### 13.3 性能指标

- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 95
- [ ] Lighthouse SEO > 95
- [ ] Lighthouse Best Practices > 95
- [ ] 首屏JS < 10KB gzip
- [ ] CSS < 20KB gzip

### 13.4 代码质量

- [ ] TypeScript无错误
- [ ] 无死代码
- [ ] 组件props类型完整
- [ ] 无内联style
- [ ] CSS无重复定义
- [ ] 无legacy变量引用

---

## 14. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Astro学习曲线 | 开发效率 | Astro组件语法简单（类HTML+JSX），React部分用熟悉的TSX |
| 内容迁移遗漏 | 页面缺失 | Content Collections + zod schema校验确保数据完整 |
| GitHub Pages路由 | 客户端路由404 | 使用静态输出（output: 'static'），所有页面预渲染 |
| 视觉还原偏差 | 品牌不一致 | 逐页面截图对比，Phase 10全量验证 |
| 旧URL失效 | SEO/书签丢失 | 保留旧URL通过redirect或Astro动态路由兼容 |
| 翻译功能体验下降 | 国际用户 | 浏览器原生翻译质量优于GT Element，且无UI污染 |
| 工具链改造影响发布 | 日常更新中断 | 重构期间main分支保持可用，完成后一次性切换 |

### 14.1 旧内容迁移（Issue 001-003）

Issue 004-007有完整JSON源文件（含body_html），可直接放入Content Collections。
Issue 001-003仅有生成的HTML文件，需要反向提取内容生成JSON。

方案：编写Python提取脚本，从articles/和cao/目录下的001-003期HTML文件中解析出：
- title, deck, slug, body_html, sources, pull_quote
- category/category_en（brief文章）
- 按目录和页面结构区分cover/brief/cao类型
- 期数信息从HTML中的"Issue NNN | YYYY.MM.DD"正则提取

提取后人工校验body_html的完整性，确保无内容丢失。

### 14.2 URL兼容与重定向策略

新旧URL映射：

| 旧URL | 新URL | 处理方式 |
|-------|-------|---------|
| `/index.html` | `/` | Astro自动处理 |
| `/articles.html` | `/articles` | Astro redirect生成meta refresh页面 |
| `/articles/2026-07-02-{slug}.html` | `/article/{slug}` | 动态路由+redirect |
| `/cao.html` | `/cao` | Astro redirect |
| `/cao/2026-07-02-{slug}.html` | `/cao/{slug}` | 动态路由+redirect |
| `/issues/issue-007.html` | `/issues/007` | 动态路由+redirect |
| `/about.html` | `/about` | Astro redirect |
| `/404.html` | `/404` | Astro自动处理 |

实现方式：使用Astro的`redirects`配置，静态输出模式下会生成包含meta refresh和canonical link的HTML重定向页面。搜索引擎会将权重转移到新URL。

同时在GitHub Pages层面，利用Astro生成的redirect页面确保旧链接可访问（不会出现404）。

---

## 15. 技术选型理由

### 为什么选Astro而非Next.js/Nuxt？

1. **内容站点最优**：DawnVision是内容阅读站点，非Web App，Astro的"零JS默认"岛屿架构完美匹配
2. **性能极致**：首屏零JS，比Next.js SSG少了~42KB React runtime
3. **多框架支持**：交互部分用React/TS，非交互部分用Astro组件，性能和开发体验兼得
4. **Content Collections**：原生支持JSON/MD内容集合，zod schema校验，完美替代Python模板
5. **GitHub Pages零配置**：`output: 'static'` 直接输出纯静态文件
6. **生态完整**：sitemap、图片优化、SEO集成一应俱全
7. **渐进迁移友好**：可以一页一页迁移，不要求一次性重写

### 为什么不保留纯Python方案？

1. f-string拼HTML无法组件化，维护成本随页面数线性增长
2. 无CSS scoping，3079行全局CSS难以维护
3. 无热更新，每次修改Python代码需重新生成
4. 无TypeScript，JS代码无类型安全
5. 正则替换维护index.html/cao.html脆弱易出错
