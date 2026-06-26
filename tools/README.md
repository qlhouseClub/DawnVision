# Dawn Vision Tools

四步全流程自动化系统：**采集 → 二创(Draft) → 处理+预览 → 验证+发布**

## 快速开始

```bash
# 一键查看当前状态
python tools/run.py status

# 全流程引导式执行
python tools/run.py full
```

## 完整工作流

每个工作日 14:00-16:30：

```
14:00  collect   采集RSS源 → raw-signals-YYYY-MM-DD.json
14:10  draft     选题 → 生成LLM Prompt → prompt-NNN-YYYY-MM-DD.md
14:15  [人工]    复制Prompt到Claude/ChatGPT → 获取JSON输出
15:00  [人工]    将JSON保存为 tools/data/issue-NNN.json
15:30  process   生成HTML → 本地预览 http://localhost:8080
16:00  [人工]    浏览器预览检查，必要时微调
16:30  publish   自动验证 → git add → commit → push
```

## 命令说明

### 1. 采集 collect

```bash
python tools/run.py collect              # 采集当天目标日期
python tools/run.py collect --add        # 采集后手动添加信号
python tools/collect.py --date 2026-06-29
```

**功能：**
- 从 `config/sources.json` 配置的14个RSS源采集AI相关资讯
- 按关键词过滤（匹配AI相关词汇），排除广告/软文
- 按优先级和封面关键词打分排序
- 自动去重，支持手动补充信号
- 输出：`tools/data/raw-signals-YYYY-MM-DD.json`

**信源覆盖：**
- 中文科技媒体：36氪、极客公园、量子位、机器之心、InfoQ中文、虎嗅
- 英文科技媒体：TechCrunch AI、The Verge AI、Ars Technica
- 官方博客：OpenAI、Google AI、Anthropic、GitHub Blog
- 社区：Hacker News

### 2. 二创 draft

```bash
python tools/run.py draft                # 交互式选题
python tools/run.py draft --auto         # 自动选题（Top1封面+6Brief+1Cao）
python tools/draft.py <signals.json> --issue-num 004
```

**功能：**
- 交互式/自动选题：1封面 + 6Brief + 1Cao
- 基于 `config/writing-style.md` 生成完整LLM Prompt
- Prompt包含：写作风格指南、选题信号、输出格式要求
- 输出：
  - `tools/data/prompt-NNN-YYYY-MM-DD.md` — 复制到Claude/ChatGPT用
  - `tools/data/issue-NNN.json` — 选题模板（需替换为LLM输出）

**Prompt核心要求（自动注入）：**
- 标题格式：`主题：判断/冲突`
- 禁止"近日""最近"开头
- 封面2000-2800字，Brief 700-900字，Cao 600-900字
- 关键数据加粗，pull-quote引用金句
- 结尾"明天见。"（Cao："今天就槽到这里，明天继续。"）
- 严格JSON输出

### 3. 处理 process

```bash
python tools/run.py process              # 生成HTML+启动预览
python tools/process.py <issue.json> --no-preview
```

**功能：**
- 读取 `issue-NNN.json`（LLM生成的完整内容）
- 生成8篇文章HTML到 `articles/` 和 `cao/`
- 更新 `articles.html`（最新一期列表页）
- 创建 `issues/issue-NNN.html` 归档页
- 更新 `index.html` 首页封面
- 更新 `cao.html` 槽点列表
- 更新 `sitemap.xml`
- 启动本地预览服务器（端口8080）

### 4. 验证+发布 publish

```bash
python tools/run.py verify               # 仅验证
python tools/run.py publish              # 验证+发布
python tools/publish.py --dry-run        # 空跑
python tools/publish.py -m "feat: Issue 004"
```

**验证项（7项）：**
1. HTML结构完整性（所有HTML文件）
2. 内部链接有效性
3. 每期文章数量（必须8篇：1+6+1）
4. Sitemap一致性
5. 导航链完整性
6. 占位文本检查
7. 文件编码与规范

通过后自动执行 `git add -A → commit → push`。

### 全流程引导 full

```bash
python tools/run.py full                 # 一步步引导
python tools/run.py full --auto          # 自动选题
python tools/run.py full --force         # 强制重新开始
```

自动执行 collect → draft，暂停等待人工LLM处理，再执行 process → 预览 → verify → publish。

### 状态 status

```bash
python tools/run.py status
```

查看当前工作流各步骤完成情况。

## 文件结构

```
tools/
├── run.py                # 一键入口（全流程调度）
├── collect.py            # 步骤1：RSS采集
├── draft.py              # 步骤2：选题+Prompt生成
├── process.py            # 步骤3：HTML生成+本地预览
├── publish.py            # 步骤4：验证+Git发布
├── sample-issue.json     # JSON输入格式示例
├── README.md             # 本文档
├── config/
│   ├── sources.json      # 信源配置（RSS列表+分类+关键词）
│   └── writing-style.md  # 写作风格指南（LLM Prompt注入）
└── data/                 # 工作数据（gitignore）
    ├── raw-signals-YYYY-MM-DD.json  # 采集的原始信号
    ├── prompt-NNN-YYYY-MM-DD.md     # LLM Prompt
    └── issue-NNN.json               # 本期内容（LLM输出）
```

## JSON输入格式

每一期的内容通过 `issue-NNN.json` 定义，结构参见 `sample-issue.json`：

- `issue`: `{number, date, date_display}`
- `cover`: 封面文章（1篇，2000-2800字）
- `briefs`: Brief资讯（6篇，700-900字/篇）
- `cao`: 槽点文章（1篇，600-900字）

每篇文章字段：slug、title、title_break、deck、keywords、og_description、body_html、sources、pull_quote、cognitive_notes等。

## 配置说明

### config/sources.json

- `rss_feeds`: RSS源列表，每个源配置名称、URL、优先级、关键词过滤
- `x_accounts`: 推荐监控的X(Twitter)账号
- `categories`: 文章分类定义（cover/brief/cao），Brief有12种预设标签
- `filter`: 过滤规则（排除词、去重阈值、封面偏好关键词）
- `schedule`: 时间安排（采集14:00/截止15:30/发布16:30）

### config/writing-style.md

完整的写作风格指南，包含：
- 标题规则（封面/Brief/Cao各自格式）
- 导语写作规范
- 正文结构要求
- Cao专属幽默风格
- 禁止事项清单
- 参考来源格式规范
- HTML标签使用规范
- SEO关键词要求

添加新信源或调整风格时，直接修改对应配置文件即可。

## 日常操作备忘

**每天发刊只需5条命令：**
```bash
python tools/run.py collect --add   # 采集+手动补充
python tools/run.py draft            # 选题，生成Prompt
# → 复制Prompt到Claude → 保存JSON到 data/issue-NNN.json
python tools/run.py process          # 生成页面
# → 浏览器检查 http://localhost:8080
python tools/run.py publish          # 验证并发布
```
