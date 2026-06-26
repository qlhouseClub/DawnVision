#!/usr/bin/env python3
"""
Dawn Vision 二创脚本（Draft）
=============================
用法:
  python tools/draft.py <raw-signals.json> [--issue-num 004] [--auto] [--out issue.json]

功能:
  1. 读取采集的原始信号
  2. 辅助选题（自动/交互）：选出1个封面话题、6个Brief话题、1个Cao话题
  3. 生成LLM Prompt（基于writing-style.md），输出到文件供复制到Claude/ChatGPT
  4. [可选] 如果配置了LLM API Key，自动调用生成（--auto模式）
  5. 校验输出JSON格式，生成符合process.py要求的issue-XXX.json

输出: tools/data/issue-XXX.json（直接供process.py使用）
"""

import json
import sys
import os
import re
import argparse
import textwrap
from datetime import datetime, timedelta, timezone
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = SITE_ROOT / "tools"
CONFIG_DIR = TOOLS_DIR / "config"
DATA_DIR = TOOLS_DIR / "data"
STYLE_PATH = CONFIG_DIR / "writing-style.md"
SOURCES_CONFIG = CONFIG_DIR / "sources.json"
CST = timezone(timedelta(hours=8))


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def next_issue_number():
    """自动推断下一期编号"""
    issues_dir = SITE_ROOT / "issues"
    existing = list(issues_dir.glob("issue-*.html"))
    if not existing:
        return "001"
    nums = [int(f.stem.split("-")[1]) for f in existing]
    return f"{max(nums)+1:03d}"


def next_workday():
    """获取下一个工作日日期"""
    now = datetime.now(CST)
    d = now + timedelta(days=1)
    while d.weekday() >= 5:  # Sat=5, Sun=6
        d += timedelta(days=1)
    return d.strftime("%Y-%m-%d"), d.strftime("%Y.%m.%d")


def select_topics_interactive(signals, cover_candidates, config):
    """交互式选题"""
    topics = {"cover": None, "briefs": [], "cao": None}
    cat_config = config["categories"]
    used_titles = set()

    print("\n" + "="*60)
    print("📋 选题阶段")
    print("="*60)

    # 1. 封面选题
    print("\n📌 选择封面话题 (Focus):")
    print("   候选封面信号：")
    for i, s in enumerate(cover_candidates[:8], 1):
        print(f"   {i}. [{s['source']}] {s['title'][:70]}")
    print(f"   {len(cover_candidates[:8])+1}. 手动输入")
    print(f"   {len(cover_candidates[:8])+2}. 从全部信号中选")

    while True:
        choice = input(f"\n   请选择 [1-{len(cover_candidates[:8])+2}]: ").strip()
        try:
            idx = int(choice)
            if 1 <= idx <= len(cover_candidates[:8]):
                topics["cover"] = cover_candidates[idx-1]
                used_titles.add(cover_candidates[idx-1]["title"])
                break
            elif idx == len(cover_candidates[:8])+1:
                title = input("   封面标题: ").strip()
                url = input("   URL: ").strip()
                summary = input("   摘要: ").strip()
                topics["cover"] = {"title": title, "url": url, "summary": summary, "source": "手动"}
                used_titles.add(title)
                break
            elif idx == len(cover_candidates[:8])+2:
                # 显示全部信号
                for i, s in enumerate(signals, 1):
                    print(f"   {i:3d}. [{s['source'][:10]:10s}] {s['title'][:60]}")
                sub = int(input("   选择编号: "))
                topics["cover"] = signals[sub-1]
                used_titles.add(signals[sub-1]["title"])
                break
        except (ValueError, IndexError):
            print("   无效输入，请重试")

    print(f"   ✅ 封面: {topics['cover']['title'][:60]}")

    # 2. Brief选题
    print("\n📎 选择6个Brief话题:")
    available = [s for s in signals if s["title"] not in used_titles]
    print(f"   可用信号 {len(available)} 条，推荐不同类别:")

    # 按类别分组展示
    categories = cat_config["brief"]["tags"]
    for i, s in enumerate(available[:40], 1):
        print(f"   {i:2d}. [{s['source'][:10]:10s}] {s['title'][:55]}")

    selected_briefs = []
    while len(selected_briefs) < 6:
        choice = input(f"   Brief {len(selected_briefs)+1}/6 (编号或输入m手动): ").strip()
        if choice.lower() == 'm':
            title = input("   标题: ").strip()
            url = input("   URL: ").strip()
            summary = input("   摘要: ").strip()
            cat_idx = input("   分类序号 (见categories列表): ").strip()
            tag = categories[int(cat_idx)-1] if cat_idx.isdigit() and 0 < int(cat_idx) <= len(categories) else categories[0]
            selected_briefs.append({
                "title": title, "url": url, "summary": summary, "source": "手动",
                "tag": tag
            })
            used_titles.add(title)
        else:
            try:
                idx = int(choice)
                if 1 <= idx <= len(available[:40]):
                    b = available[idx-1]
                    if b["title"] not in used_titles:
                        # 选择分类标签
                        print("   分类标签:")
                        for ti, t in enumerate(categories, 1):
                            print(f"     {ti}. {t['zh']}")
                        tc = input("   选择分类 [1-12，默认1]: ").strip()
                        tag = categories[int(tc)-1] if tc.isdigit() and 0 < int(tc) <= len(categories) else categories[0]
                        b["tag"] = tag
                        selected_briefs.append(b)
                        used_titles.add(b["title"])
                    else:
                        print("   已选过，请选其他")
            except (ValueError, IndexError):
                print("   无效输入")

    topics["briefs"] = selected_briefs
    for i, b in enumerate(selected_briefs, 1):
        print(f"   ✅ Brief {i}: {b['title'][:50]}")

    # 3. Cao选题
    print("\n😂 选择Cao槽点话题:")
    print("   Cao话题特征：荒诞/搞笑/翻车/反差/讽刺")
    print("   可用信号:")
    available_cao = [s for s in signals if s["title"] not in used_titles]
    for i, s in enumerate(available_cao[:20], 1):
        print(f"   {i:2d}. [{s['source'][:10]:10s}] {s['title'][:55]}")
    print(f"   {len(available_cao[:20])+1}. 手动输入")

    while True:
        choice = input(f"   选择: ").strip()
        if choice == str(len(available_cao[:20])+1):
            title = input("   标题: ").strip()
            url = input("   URL: ").strip()
            summary = input("   摘要: ").strip()
            topics["cao"] = {"title": title, "url": url, "summary": summary, "source": "手动"}
            break
        else:
            try:
                idx = int(choice)
                if 1 <= idx <= len(available_cao[:20]):
                    topics["cao"] = available_cao[idx-1]
                    break
            except (ValueError, IndexError):
                print("   无效输入")

    print(f"   ✅ Cao: {topics['cao']['title'][:60]}")
    return topics


def generate_llm_prompt(issue_num, date, date_display, topics, style_guide, config):
    """生成给LLM的完整Prompt"""
    cover = topics["cover"]
    briefs = topics["briefs"]
    cao = topics["cao"]

    # 格式化源信号
    def fmt_signal(s, idx=""):
        return f"""  - [{idx}] {s.get('source', '?')}: {s['title']}
    URL: {s.get('url', '(无)')}
    摘要: {s.get('summary', '(无)')[:200]}"""

    brief_signals_text = "\n".join(fmt_signal(b, i+1) for i, b in enumerate(briefs))

    # 分类标签列表
    tags = config["categories"]["brief"]["tags"]
    tags_text = "\n".join(f'    "{t["zh"]}" / "{t["en"]}"' for t in tags)

    prompt = f"""你是 Dawn Vision（AI深度观察日刊）的主编。请根据以下原始资讯信号，进行深度二创加工，输出一期完整的Dawn Vision内容。

## 本期信息
- 期号: Issue {issue_num}
- 日期: {date_display}
- 发布时间: 16:30 CST

## 写作风格指南（必须严格遵守）
{style_guide}

## 选题规划

### 【封面故事 Focus】
{fmt_signal(cover)}

写作要求：2000-2800字，深度分析，有独立判断，不是信息罗列。需要3-5个H2小节，包含pull-quote引用。

### 【Brief 资讯 x 6】
{brief_signals_text}

每篇Brief分类标签从以下选择（每篇选一个最合适的）：
{tags_text}

写作要求：每篇700-900字，聚焦单一话题，有数据支撑，有判断。需要2-3个H2小节，可包含pull-quote。

### 【Cao! 槽点】
{fmt_signal(cao)}

写作要求：600-900字，幽默吐槽风格，口语化，有金句，结尾给1-3条实用提醒。

## 输出格式

严格输出JSON，不要输出任何其他文字（包括markdown代码块标记）。JSON结构如下：

{{
  "issue": {{
    "number": "{issue_num}",
    "date": "{date}",
    "date_display": "{date_display}"
  }},
  "cover": {{
    "slug": "英文短横线slug（如 wechat-alipay-agent-war）",
    "title": "完整标题，格式：主题：判断/冲突",
    "title_short": "首页用短标题（冒号前部分）",
    "title_break": "用于hero区域的换行标题，用<br>换行",
    "deck": "导语80-100字，包含关键数据/冲突点",
    "keywords": "逗号分隔关键词，以Dawn Vision开头",
    "og_description": "OG分享描述，60字以内",
    "twitter_description": "Twitter卡片描述",
    "read_time": "约 10 分钟阅读",
    "word_count": 字数（整数）,
    "sources": [
      {{"text": "来源名 - 文章描述", "url": "URL或空字符串"}}
    ],
    "body_html": "正文HTML（从第一个<p>开始，到<hr>前结束。包含<h2>小节、<strong>加粗关键数据、pull-quote引用块）",
    "pull_quote": {{"text": "金句", "attr": "—— 出处"}},
    "cognitive_notes": "标签1 · 标签2 · 标签3",
    "source_summary": "本文基于 Dawn Vision 认知引擎处理的 X 个源信号自动生成，经编辑部人工审核。素材来源：XXX。"
  }},
  "briefs": [
    {{
      "slug": "英文短横线slug",
      "category": "中文分类名",
      "category_en": "英文分类名",
      "title": "完整标题",
      "title_break": "换行标题",
      "deck": "导语50-70字",
      "keywords": "关键词",
      "og_description": "OG描述",
      "read_time": "约 5 分钟阅读",
      "word_count": 字数,
      "sources": [
        {{"text": "来源 - 描述", "url": "URL或空"}}
      ],
      "body_html": "正文HTML",
      "pull_quote": {{"text": "金句", "attr": "—— 出处"}},
      "cognitive_notes": "标签",
      "source_summary": "本文基于 Dawn Vision 认知引擎处理的 X 个源信号生成，经编辑部人工审核。"
    }}
  ],
  "cao": {{
    "slug": "英文短横线slug",
    "title": "完整标题",
    "title_break": "换行标题",
    "deck": "导语60-80字，幽默风格",
    "keywords": "关键词",
    "og_description": "OG描述",
    "read_time": "约 4 分钟阅读",
    "word_count": 字数,
    "sources": [
      {{"text": "来源 - 描述", "url": "URL或空"}}
    ],
    "body_html": "正文HTML，幽默风格，结尾给提醒",
    "pull_quote": {{"text": "金句", "attr": "—— 出处"}},
    "cognitive_notes": "标签",
    "source_summary": "本文基于 Dawn Vision 认知引擎处理的公开信息整理，素材来源：XXX。",
    "footnote_tip": "温馨提示：实用提醒内容。"
  }}
}}

## 重要提醒
1. body_html中的段落用<p>标签，小节用<h2>，关键数据用<strong>加粗
2. 所有数据必须有来源依据，禁止编造
3. 标题要观点鲜明，不要平铺直叙
4. 禁止用"近日""最近""据悉"开头
5. 封面/Brief结尾写"明天见。"，Cao结尾写"今天就槽到这里，明天继续。"
6. slug用英文小写+短横线，不要太长（3-6个单词）
7. 6篇Brief要覆盖不同分类，避免同类话题重复
8. JSON必须是合法格式，双引号，无 trailing commas
"""
    return prompt


def main():
    parser = argparse.ArgumentParser(description="Dawn Vision 二创Draft")
    parser.add_argument("signals", help="raw-signals JSON文件路径")
    parser.add_argument("--issue-num", help="期号，如004（默认自动推断）")
    parser.add_argument("--date", help="目标日期 YYYY-MM-DD（默认下一个工作日）")
    parser.add_argument("--auto", action="store_true", help="自动选题（不交互，选Top1封面+Top6Brief+1Cao）")
    parser.add_argument("--out", help="输出文件路径")
    parser.add_argument("--prompt-only", action="store_true", help="只生成Prompt文件，不输出issue JSON模板")
    args = parser.parse_args()

    signals_path = Path(args.signals)
    if not signals_path.exists():
        # Try data dir
        signals_path = DATA_DIR / args.signals
        if not signals_path.exists():
            print(f"❌ 信号文件不存在: {args.signals}")
            sys.exit(1)

    raw = load_json(signals_path)
    config = load_json(SOURCES_CONFIG)
    style_guide = STYLE_PATH.read_text(encoding="utf-8")

    issue_num = args.issue_num or next_issue_number()
    if args.date:
        date = args.date
        date_display = date.replace("-", ".")
    else:
        date, date_display = next_workday()

    signals = raw["signals"]
    cover_candidates = raw.get("cover_candidates", signals[:10])

    print(f"{'='*60}")
    print(f"Dawn Vision 二创 Draft")
    print(f"{'='*60}")
    print(f"期号: Issue {issue_num}")
    print(f"日期: {date_display}")
    print(f"信号数: {len(signals)}")
    print()

    # 选题
    if args.auto:
        # 自动选题
        topics = {
            "cover": cover_candidates[0] if cover_candidates else signals[0],
            "briefs": [],
            "cao": None
        }
        # Briefs: 跳过封面，选接下来6个不同类别的
        used = {topics["cover"]["title"]}
        tags = config["categories"]["brief"]["tags"]
        for s in signals:
            if s["title"] not in used and len(topics["briefs"]) < 6:
                tag_idx = len(topics["briefs"]) % len(tags)
                s["tag"] = tags[tag_idx]
                topics["briefs"].append(s)
                used.add(s["title"])
        # Cao: 选第一个有趣的（标题含翻车/事故/道歉/暴涨/暴跌/荒诞/搞笑/删库/Bug等关键词）
        cao_keywords = ["翻车", "事故", "道歉", "暴涨", "暴跌", "荒诞", "搞笑", "删库", "Bug", "bug", "傻", "疯", "离谱", "笑话", "闹剧"]
        for s in signals:
            if s["title"] not in used:
                if any(kw in s["title"] for kw in cao_keywords):
                    topics["cao"] = s
                    break
        if not topics["cao"]:
            # 选最后一个
            for s in reversed(signals):
                if s["title"] not in used:
                    topics["cao"] = s
                    break
        print("🤖 自动选题完成")
    else:
        topics = select_topics_interactive(signals, cover_candidates, config)

    # 生成Prompt
    prompt = generate_llm_prompt(issue_num, date, date_display, topics, style_guide, config)

    prompt_path = DATA_DIR / f"prompt-{issue_num}-{date}.md"
    prompt_path.write_text(prompt, encoding="utf-8")
    print(f"\n📝 LLM Prompt已生成: {prompt_path}")
    print(f"   将此Prompt复制到Claude/ChatGPT，获取JSON输出")

    if args.prompt_only:
        print("\n✅ Prompt-only模式，完成。")
        print(f"   获取LLM输出后，保存为 {DATA_DIR}/issue-{issue_num}.json")
        print(f"   然后运行: python tools/process.py {DATA_DIR}/issue-{issue_num}.json")
        return

    # 生成空的issue JSON模板（供用户填写/替换为LLM输出）
    template = {
        "issue": {"number": issue_num, "date": date, "date_display": date_display},
        "_INSTRUCTIONS": "请将LLM返回的JSON替换此文件内容，然后运行 python tools/process.py " + str(DATA_DIR / f"issue-{issue_num}.json"),
        "cover": {"_placeholder": True, "title": topics["cover"]["title"], "source_url": topics["cover"].get("url", "")},
        "briefs": [{"_placeholder": True, "title": b["title"], "tag": b.get("tag", {}).get("zh", ""), "source_url": b.get("url", "")} for b in topics["briefs"]],
        "cao": {"_placeholder": True, "title": topics["cao"]["title"], "source_url": topics["cao"].get("url", "")}
    }

    out_path = Path(args.out) if args.out else DATA_DIR / f"issue-{issue_num}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(template, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"📋 选题模板已保存: {out_path}")
    print(f"\n👉 下一步:")
    print(f"   1. 打开 {prompt_path}，复制全部内容到Claude/ChatGPT")
    print(f"   2. 将LLM返回的JSON覆盖保存到 {out_path}")
    print(f"   3. 运行: python tools/process.py {out_path}")
    print(f"   4. 本地预览确认后: python tools/publish.py")


if __name__ == "__main__":
    main()
