# Dawn Vision

> 在噪音中看见信号 — AI时代的深度观察

Dawn Vision 是一个每日更新的 AI 资讯深度阅读站点。每个工作日从海量 AI 资讯中去噪、筛选、深度加工，输出可以直接读完的完整文章——不做信息搬运工，做噪音中的信号过滤器。

- **Focus · 焦点** — 每日一篇封面深度
- **Briefs · 资讯** — 6篇精简短讯
- **Cao! · 槽点** — 不定期吐槽专栏

每个工作日 16:30 CST 更新。

---

## 项目结构

```
DawnVision/
├── web/                    # Astro 前端项目（主站点）
│   ├── src/
│   │   ├── content/issues/ # 期数 JSON 数据（001.json ~ NNN.json）
│   │   ├── components/     # Astro 组件
│   │   ├── layouts/        # 布局模板
│   │   ├── pages/          # 页面路由
│   │   ├── styles/         # 全局样式和组件样式
│   │   └── scripts/        # 客户端交互脚本
│   ├── public/             # 静态资源（favicon、OG图、二维码等）
│   └── dist/               # 构建产物（astro build 输出）
├── tools/                  # 内容生产工具链（Python）
│   ├── collect.py          # RSS 信号采集
│   ├── draft.py            # 选题 + LLM Prompt 生成
│   ├── validate.py         # JSON schema 校验（替代旧 process.py）
│   ├── knowledge.py        # Obsidian 知识网络生成
│   ├── deploy.ps1          # 构建部署脚本
│   ├── config/             # 配置文件（信源、写作风格、知识主题映射）
│   └── data/               # 中间产物（raw signals、issue JSON）
├── knowledge/              # Obsidian 知识主题笔记（本地，不发布）
└── notes/                  # Obsidian 文章文献笔记（本地，不发布）
```

## 内容生产工作流

### 1. 采集信号
```bash
python tools/collect.py
```
从配置的 RSS 源采集当日 AI 资讯，输出到 `tools/data/raw-signals-YYYY-MM-DD.json`。

### 2. 生成选题和 Prompt
```bash
python tools/draft.py
```
基于采集信号进行选题，生成 LLM 写作 Prompt，输出到 `tools/data/prompt-NNN-*.md`。

### 3. LLM 写作 → 生成 issue JSON
LLM 根据 Prompt 生成完整的 `issue-NNN.json`，保存到 `tools/data/`。

### 4. 校验内容
```bash
python tools/validate.py tools/data/issue-NNN.json
```
校验 JSON schema、slug 唯一性、必填字段、字数范围等。校验通过后自动复制到 `web/src/content/issues/`。

校验全部 issue：
```bash
python tools/validate.py --all
```

### 5. 本地预览
```bash
cd web
npx astro dev
```
访问 http://localhost:4321 预览站点。

### 6. 构建部署
```powershell
# 仅构建
./tools/deploy.ps1 -NoDeploy

# 构建并部署
./tools/deploy.ps1
```

或手动构建：
```bash
cd web
npx astro build
```
构建产物输出到 `web/dist/`。

### 7. 知识网络（可选）
```bash
python tools/knowledge.py --rebuild
```
从 issue JSON 的 `cognitive_notes` 字段生成 Obsidian 兼容的 Markdown 笔记到 `knowledge/` 和 `notes/` 目录。

## 技术栈

- **前端框架**: [Astro 5](https://astro.build) — 静态站点生成
- **样式**: 原生 CSS（CSS Variables + 设计系统）
- **搜索**: [Pagefind](https://pagefind.app) — 静态站点全文搜索
- **字体**: Noto Serif SC + Source Serif 4 + PT Serif
- **部署**: GitHub Pages + Cloudflare CDN
- **分析**: Cloudflare Web Analytics + 百度统计
- **内容工具**: Python 3

## 设计系统

- **品牌色**: Klein Blue `#002FA7`
- **字体**: Source Serif 4 (英文) / Noto Serif SC (中文)
- **设计风格**: 编辑型排版、报纸式网格、Klein蓝品牌色、斜体标题
