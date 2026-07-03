#!/usr/bin/env python3
"""
knowledge.py — Obsidian 知识网络生成工具

从 issue JSON 文件中读取 cognitive_notes，生成 Obsidian 兼容的 Markdown 文件。
不再解析 HTML，直接读 JSON 数据。

输出:
    knowledge/{slug}.md   — 知识主题笔记
    notes/{issue-num}-{slug}.md — 文章文献笔记
    知识网络.md            — MOC 索引

用法:
    python tools/knowledge.py            # 增量构建
    python tools/knowledge.py --rebuild  # 全量重建
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict

# ── 路径配置 ──
TOOLS_DIR = Path(__file__).parent
PROJECT_ROOT = TOOLS_DIR.parent
DATA_DIR = TOOLS_DIR / "data"
WEB_CONTENT_DIR = PROJECT_ROOT / "web" / "src" / "content" / "issues"
CONFIG_DIR = TOOLS_DIR / "config"
KNOWLEDGE_DIR = PROJECT_ROOT / "knowledge"
NOTES_DIR = PROJECT_ROOT / "notes"
MOC_FILE = PROJECT_ROOT / "知识网络.md"

TAG_SEPARATOR = " · "


def load_knowledge_topics():
    """加载知识主题映射配置"""
    config_file = CONFIG_DIR / "knowledge-topics.json"
    if not config_file.exists():
        return {}
    try:
        return json.loads(config_file.read_text(encoding='utf-8'))
    except Exception:
        return {}


def load_issues():
    """从 web/src/content/issues/ 加载所有 issue JSON"""
    issues = []
    if not WEB_CONTENT_DIR.exists():
        print(f"警告: 内容目录不存在 {WEB_CONTENT_DIR}")
        return issues

    for f in sorted(WEB_CONTENT_DIR.glob("*.json")):
        try:
            data = json.loads(f.read_text(encoding='utf-8'))
            issues.append(data)
        except Exception as e:
            print(f"警告: 无法加载 {f.name}: {e}")

    return issues


def get_all_articles(data):
    """从 issue 数据中提取所有文章对象及其类型和期号"""
    issue_num = data.get('issue', {}).get('number', '')
    issue_date = data.get('issue', {}).get('date_display', '')
    articles = []

    if data.get('cover'):
        articles.append({**data['cover'], '_type': 'cover', '_issue': issue_num, '_date': issue_date})
    for b in data.get('briefs', []):
        articles.append({**b, '_type': 'brief', '_issue': issue_num, '_date': issue_date})
    if data.get('cao'):
        articles.append({**data['cao'], '_type': 'cao', '_issue': issue_num, '_date': issue_date})

    return articles


def parse_cognitive_notes(notes_str):
    """解析认知笔记标签字符串，返回标签列表"""
    if not notes_str:
        return []
    # 按 TAG_SEPARATOR 分割
    tags = [t.strip() for t in notes_str.split(TAG_SEPARATOR)]
    return [t for t in tags if t]


def map_tags_to_topics(tags, topic_map):
    """将认知笔记标签映射到知识主题"""
    topics = set()
    unmatched = []

    for tag in tags:
        matched = False
        # 精确匹配
        if tag in topic_map:
            for topic in topic_map[tag] if isinstance(topic_map[tag], list) else [topic_map[tag]]:
                topics.add(topic)
            matched = True
        else:
            # 去空白归一化匹配
            tag_norm = re.sub(r'\s+', '', tag)
            for key, val in topic_map.items():
                if re.sub(r'\s+', '', key) == tag_norm:
                    for topic in val if isinstance(val, list) else [val]:
                        topics.add(topic)
                    matched = True
                    break
            # 模糊包含匹配
            if not matched:
                for key, val in topic_map.items():
                    if tag_norm in re.sub(r'\s+', '', key) or re.sub(r'\s+', '', key) in tag_norm:
                        for topic in val if isinstance(val, list) else [val]:
                            topics.add(topic)
                        matched = True
                        break
        if not matched:
            unmatched.append(tag)

    return sorted(topics), unmatched


def slugify_topic(topic):
    """将主题名转为文件安全的 slug"""
    return re.sub(r'[^\w\u4e00-\u9fff-]', '-', topic.lower()).strip('-')


def build_knowledge(issues, topic_map, rebuild=False):
    """构建知识网络"""
    # 收集所有文章及其标签
    article_topics = defaultdict(list)  # topic -> [article refs]
    topic_related = defaultdict(set)    # topic -> set of related topics
    article_data = []                   # all articles with metadata
    unmatched_tags = set()

    for issue in issues:
        for article in get_all_articles(issue):
            tags = parse_cognitive_notes(article.get('cognitive_notes', ''))
            topics, unmatched = map_tags_to_topics(tags, topic_map)

            for ut in unmatched:
                unmatched_tags.add(ut)

            ref = {
                'title': article.get('title', ''),
                'slug': article.get('slug', ''),
                'issue': article.get('_issue', ''),
                'date': article.get('_date', ''),
                'type': article.get('_type', ''),
                'tags': tags,
                'topics': topics,
            }
            article_data.append(ref)

            for t in topics:
                article_topics[t].append(ref)
                # 相关主题：同一篇文章中出现的主题互为相关
                for t2 in topics:
                    if t != t2:
                        topic_related[t].add(t2)

    # 创建目录
    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)
    NOTES_DIR.mkdir(parents=True, exist_ok=True)

    # 生成知识主题笔记
    for topic, arts in sorted(article_topics.items()):
        topic_slug = slugify_topic(topic)
        md = generate_topic_note(topic, arts, topic_related.get(topic, set()))
        (KNOWLEDGE_DIR / f"{topic_slug}.md").write_text(md, encoding='utf-8')

    # 生成文章文献笔记
    for art in article_data:
        if art['slug']:
            md = generate_article_note(art)
            (NOTES_DIR / f"{art['issue']}-{art['slug']}.md").write_text(md, encoding='utf-8')

    # 生成 MOC 索引
    moc = generate_moc(article_topics, unmatched_tags)
    MOC_FILE.write_text(moc, encoding='utf-8')

    print(f"\n知识网络构建完成:")
    print(f"  知识主题: {len(article_topics)} 个")
    print(f"  文章笔记: {len(article_data)} 篇")
    print(f"  未匹配标签: {len(unmatched_tags)} 个")
    if unmatched_tags:
        for ut in sorted(unmatched_tags):
            print(f"    - {ut}")
    print(f"\n输出目录:")
    print(f"  {KNOWLEDGE_DIR}/")
    print(f"  {NOTES_DIR}/")
    print(f"  {MOC_FILE}")


def generate_topic_note(topic, articles, related_topics):
    """生成单个知识主题的 Markdown 笔记"""
    lines = [
        "---",
        f"title: {topic}",
        "tags: [knowledge]",
        "---",
        "",
        f"# {topic}",
        "",
        "## 相关文章",
        "",
    ]

    # 按期号倒序排列
    for art in sorted(articles, key=lambda x: x['issue'] or '0', reverse=True):
        type_label = {'cover': '焦点', 'brief': '资讯', 'cao': '槽点'}.get(art['type'], '')
        lines.append(f"- [[{art['issue']}-{art['slug']}|{art['title']}]] ({type_label} · {art['date']})")

    if related_topics:
        lines.extend([
            "",
            "## 相关主题",
            "",
        ])
        for rt in sorted(related_topics):
            lines.append(f"- [[{slugify_topic(rt)}|{rt}]]")

    lines.extend([
        "",
        "---",
        f"*Dawn Vision 知识网络 · 自动生成*",
        "",
    ])

    return '\n'.join(lines)


def generate_article_note(art):
    """生成单篇文章的文献笔记"""
    type_label = {'cover': 'Focus · 焦点', 'brief': 'Brief · 资讯', 'cao': 'Cao! · 槽点'}.get(art['type'], '')

    lines = [
        "---",
        f"title: \"{art['title']}\"",
        f"issue: \"{art['issue']}\"",
        f"date: \"{art['date']}\"",
        f"type: \"{art['type']}\"",
        f"slug: \"{art['slug']}\"",
        "tags: [article-notes]",
        "---",
        "",
        f"# {art['title']}",
        "",
        f"> {type_label} · Issue {art['issue']} · {art['date']}",
        "",
        f"[阅读原文](/articles/{art['slug']})",
        "",
    ]

    if art['tags']:
        lines.extend([
            "## 认知笔记",
            "",
        ])
        for tag in art['tags']:
            topic_slug = slugify_topic(tag)
            lines.append(f"#{topic_slug} {tag}")
        lines.append("")

    if art['topics']:
        lines.extend([
            "## 关联主题",
            "",
        ])
        for t in art['topics']:
            lines.append(f"- [[{slugify_topic(t)}|{t}]]")
        lines.append("")

    lines.extend([
        "---",
        f"*Dawn Vision Issue {art['issue']} · 文献笔记*",
        "",
    ])

    return '\n'.join(lines)


def generate_moc(article_topics, unmatched_tags):
    """生成 MOC (Map of Content) 索引"""
    lines = [
        "---",
        "title: 知识网络",
        "tags: [MOC]",
        "---",
        "",
        "# Dawn Vision 知识网络",
        "",
        "> 穿越嘈杂，洞见留声。",
        "",
        "## 知识主题",
        "",
    ]

    for topic in sorted(article_topics.keys()):
        count = len(article_topics[topic])
        lines.append(f"- [[{slugify_topic(topic)}|{topic}]] ({count} 篇)")

    if unmatched_tags:
        lines.extend([
            "",
            "## 待分类标签",
            "",
        ])
        for ut in sorted(unmatched_tags):
            lines.append(f"- {ut}")

    lines.extend([
        "",
        "---",
        "",
        "```dataview",
        "TABLE title, date, type FROM \"notes\"",
        "SORT issue DESC",
        "LIMIT 50",
        "```",
        "",
        f"*共 {len(article_topics)} 个知识主题 · 自动生成*",
        "",
    ])

    return '\n'.join(lines)


def main():
    rebuild = '--rebuild' in sys.argv

    print("Dawn Vision 知识网络生成器")
    print("=" * 40)

    topic_map = load_knowledge_topics()
    if topic_map:
        print(f"已加载 {len(topic_map)} 个标签映射")

    issues = load_issues()
    if not issues:
        print("未找到任何 issue 数据，请先运行 validate.py")
        sys.exit(1)

    print(f"已加载 {len(issues)} 期内容")

    if rebuild:
        # 清理旧文件
        import shutil
        if KNOWLEDGE_DIR.exists():
            shutil.rmtree(KNOWLEDGE_DIR)
        if NOTES_DIR.exists():
            shutil.rmtree(NOTES_DIR)
        if MOC_FILE.exists():
            MOC_FILE.unlink()
        print("已清理旧文件，全量重建...")

    build_knowledge(issues, topic_map, rebuild)


if __name__ == '__main__':
    main()
