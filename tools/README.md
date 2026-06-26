# Dawn Vision Tools

双流程发布系统：处理+预览 → 验证+发布

## 工作流

```
采集模板 → 大模型二创（生成issue-XXX.json）→ process.py → 本地预览确认 → publish.py → 上线
```

## 流程一：处理 + 简报 + 本地预览

```bash
python tools/process.py <issue.json>
```

功能：
- 读取JSON格式的本期内容
- 生成8篇文章HTML（1封面 + 6Brief + 1Cao）
- 更新 articles.html（最新一期列表页）
- 创建 issues/issue-NNN.html 归档页
- 更新 index.html 封面
- 更新 cao.html 槽点列表
- 更新 sitemap.xml
- 自动启动本地预览服务器（端口8080）

选项：
- `--no-preview`：不启动预览服务器
- `--dry-run`：仅打印输出，不写入文件

输入格式参见 `sample-issue.json`。

## 流程二：验证 + 发布

```bash
python tools/publish.py
```

功能：
- 验证所有HTML文件结构完整性
- 检查内部链接有效性
- 验证每期文章数量（8篇）
- 检查sitemap一致性
- 验证导航链
- 检查占位文本
- 通过验证后执行 git add → commit → push

选项：
- `--skip-verify`：跳过验证直接发布
- `--verify-only`：仅验证不发布
- `--dry-run`：验证通过但不实际推送
- `--message "msg"`：自定义commit message

## 文件结构

```
tools/
├── process.py        # 流程一：内容处理+页面生成+预览
├── publish.py        # 流程二：验证+Git发布
├── sample-issue.json # 输入格式示例
└── README.md         # 本文档
```

## JSON输入格式

每一期的内容通过一个JSON文件定义，包含：

- `issue`: 期号、日期信息
- `cover`: 封面文章（1篇）
- `briefs`: Brief资讯（6篇）
- `cao`: 槽点文章（1篇）

每篇文章需要提供：slug、标题、导语(deck)、关键词、正文HTML、参考来源、阅读时间、字数等。

## 写作风格指南（二创要求）

基于Dawn Vision已发布文章的风格：

1. **标题**：观点鲜明，制造悬念或冲突，用冒号分隔主题和判断
2. **导语(Deck)**：一句话概括核心论点+数据点或冲突点，50-100字
3. **正文结构**：
   - 开头用场景或数据点切入，拒绝"近日""最近"等开头
   - 2-4个H2小节，每节有明确的论点
   - 关键数据用`<strong>`加粗
   - 适时使用pull-quote（金句引用）
   - 结尾给出判断或预测，不是简单总结
4. **Cao风格**：
   - 口语化、幽默、吐槽感
   - 用"朋友们""你品你细品"等拉近距离
   - 讽刺但不刻薄，有趣但有料
   - 结尾给实用提醒
5. **通用**：
   - "明天见。"作为文章结尾
   - Cao用"今天就槽到这里，明天继续。"
   - 文末附参考来源 + 认知引擎处理说明
