# Dawn Vision Tools

AI驱动的全流程日报系统。**核心工作流由AI主编（即本助手）自动完成**，本地Python脚本仅作为HTML生成和Git发布的执行工具。

## 核心工作流（AI自动执行）

每个工作日，AI主编会在定时日程触发下自动完成全流程：

```
14:00  AI自动执行：采集→选题→二创写作→生成JSON→process.py→本地预览
16:20  AI自动执行：验证→列出文章→询问用户确认→发布
```

**用户只需要做两件事：**
1. 在14:00后预览 http://localhost:8080/ ，如需调整告诉AI
2. 在16:20回复"y"确认发布

## 手动命令（备用/调试）

如果需要手动触发某一步：

```bash
python tools/run.py status              # 查看当前状态
python tools/run.py collect             # 仅RSS采集
python tools/run.py process <issue.json> # 仅生成HTML+预览
python tools/run.py verify              # 仅验证
python tools/run.py publish             # 验证+发布
python tools/run.py full                # 全流程引导
```

## 文件结构

```
tools/
├── run.py                # 一键入口
├── collect.py            # RSS采集脚本（AI会调用）
├── draft.py              # 选题+Prompt生成（备用，AI直接二创不需要）
├── process.py            # HTML生成+本地预览（AI会调用）
├── publish.py            # 验证+Git发布（AI会调用）
├── sample-issue.json     # JSON输入格式示例
├── README.md             # 本文档
├── config/
│   ├── sources.json      # 信源配置（RSS+Web搜索query+分类体系）
│   └── writing-style.md  # 写作风格指南
└── data/                 # 工作数据目录（gitignore）
    ├── raw-signals-*.json  # RSS采集原始信号
    └── issue-NNN.json     # 本期完整内容（AI生成）
```

## 信源覆盖

RSS源（14个）：
- 中文：36氪、量子位、InfoQ中文、爱范儿
- 英文：TechCrunch AI、The Verge AI、Ars Technica
- 官方博客：OpenAI、Google AI、Anthropic、Google DeepMind、GitHub Blog
- 社区：Hacker News、Indie Hackers

Web搜索方向（6组）：
- zh_core / en_core：中英文核心AI新闻
- ai_design：AI设计/创意工具/视频/图片生成
- ai_newmedia：AI新媒体/内容创作/自媒体案例
- ai_solopreneur：AI轻创业/一人公司/indie hacker
- vertical：垂直领域（编程/具身/算力/监管/协议/微信生态）

## 文章分类（Brief 14种）

大模型商业、AI编程工具、AI Agent工程、AI商业化、算力基建、Agent协议、具身智能、AI监管、**AI新媒体**、**AI设计创意**、**AI轻创业**、AI视频多模态、微信生态、AI电商

## 定时日程

| 时间 | 任务 | 谁执行 |
|------|------|--------|
| 14:00 | 采集+选题+写作+生成HTML+预览 | AI自动 |
| 16:20 | 验证+询问确认+发布 | AI自动（需用户确认发布） |
