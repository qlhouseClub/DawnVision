#!/usr/bin/env python3
"""
Dawn Vision 知识网络构建脚本（Obsidian专用）
============================================
用法: python tools/knowledge.py [--rebuild]

功能:
  1. 扫描所有文章，提取cognitive_notes标签和元数据
  2. 将标签映射到知识主题（knowledge-topics.json）
  3. 生成Obsidian兼容的Markdown文件到knowledge/和notes/目录
  4. 生成MOC索引文件 知识网络.md

注意:
  知识网络仅用于Obsidian本地知识库，不生成HTML、不发布到网站。
"""

import json
import sys
import re
import argparse
from datetime import datetime
from pathlib import Path
from collections import defaultdict

SITE_ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = SITE_ROOT / "articles"
CAO_DIR = SITE_ROOT / "cao"
KNOWLEDGE_DIR = SITE_ROOT / "knowledge"
NOTES_DIR = SITE_ROOT / "notes"  # Obsidian vault article notes
CONFIG_DIR = SITE_ROOT / "tools" / "config"
BASE_URL = "https://qlhouseclub.github.io/DawnVision"

LINK_STYLE = "color:var(--klein);text-decoration:underline;text-decoration-style:dotted;"
SPAN_STYLE = "color:var(--color-text-light);text-decoration:underline;text-decoration-style:dotted;cursor:default;"


def _normalize(s):
    """去除所有空白字符用于模糊匹配"""
    return re.sub(r'\s+', '', s)


def load_topics():
    """加载知识主题配置，构建tag->slug映射"""
    with open(CONFIG_DIR / "knowledge-topics.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    tag_map = {}
    topic_map = {}
    norm_tag_map = {}
    for t in data["topics"]:
        topic_map[t["slug"]] = t
        for tag in t["tags"]:
            tag_map[tag] = t["slug"]
            norm_tag_map[_normalize(tag)] = t["slug"]
    return data["topics"], tag_map, norm_tag_map, topic_map


def find_topic_for_note(note, tag_map, norm_tag_map):
    """根据note文本查找对应的topic slug"""
    note_norm = _normalize(note)
    if note in tag_map:
        return tag_map[note]
    if note_norm in norm_tag_map:
        return norm_tag_map[note_norm]
    # 模糊包含匹配
    for tag, slug in tag_map.items():
        tag_norm = _normalize(tag)
        if tag_norm in note_norm or note_norm in tag_norm:
            return slug
    return None


def parse_article(filepath):
    """解析文章HTML，提取元数据"""
    text = filepath.read_text(encoding="utf-8")

    # 标题
    title_m = re.search(r'<h1[^>]*class="article-page__title"[^>]*>(.*?)</h1>', text, re.DOTALL)
    if not title_m:
        title_m = re.search(r'<h1[^>]*class="article-page__hero-title"[^>]*>(.*?)</h1>', text, re.DOTALL)
    title = re.sub(r'<[^>]+>', '', title_m.group(1)).strip() if title_m else filepath.stem

    # 日期
    date_m = re.search(r'(\d{4}-\d{2}-\d{2})', filepath.name)
    date = date_m.group(1) if date_m else ""

    # 类型
    path_str = str(filepath).replace("\\", "/")
    is_cao = "/cao/" in path_str
    article_type = "cao" if is_cao else "brief"
    if "Cover Story" in text[:3000] or "焦点" in text[:3000]:
        article_type = "cover"

    # 分类
    cat_m = re.search(r'<span class="article-page__hero-label">(.*?)</span>', text, re.DOTALL)
    category = re.sub(r'<[^>]+>', '', cat_m.group(1)).strip() if cat_m else ""

    # 认知笔记 - 提取纯文本标签（去除已有的HTML标签）
    notes = []
    notes_m = re.search(r'相关入库笔记[：:]\s*(.*?)</p>', text, re.DOTALL)
    if notes_m:
        notes_html = notes_m.group(1)
        # 去除所有HTML标签，只保留文本和分隔符
        notes_text = re.sub(r'<[^>]+>', '', notes_html)
        notes = [n.strip() for n in re.split(r'[·・]', notes_text) if n.strip()]

    # deck/导语
    deck_m = re.search(r'<p class="article-page__deck"[^>]*>(.*?)</p>', text, re.DOTALL)
    if not deck_m:
        deck_m = re.search(r'<p class="article-page__hero-deck"[^>]*>(.*?)</p>', text, re.DOTALL)
    deck = re.sub(r'<[^>]+>', '', deck_m.group(1)).strip() if deck_m else ""

    return {
        "path": filepath,
        "filename": filepath.name,
        "title": title,
        "date": date,
        "type": article_type,
        "category": category,
        "notes": notes,
        "deck": deck,
        "url": ("cao/" if is_cao else "articles/") + filepath.name
    }


def scan_all_articles():
    """扫描所有文章"""
    articles = []
    for f in sorted(ARTICLES_DIR.glob("*.html")):
        articles.append(parse_article(f))
    for f in sorted(CAO_DIR.glob("*.html")):
        articles.append(parse_article(f))
    return articles


def build_topic_articles_map(articles, tag_map, norm_tag_map):
    """构建 topic_slug -> [article, ...] 映射"""
    topic_articles = defaultdict(list)
    unmatched_tags = defaultdict(list)

    for art in articles:
        matched_topics = set()
        for note in art["notes"]:
            slug = find_topic_for_note(note, tag_map, norm_tag_map)
            if slug:
                matched_topics.add(slug)
            else:
                unmatched_tags[note].append(art["filename"])
        for slug in matched_topics:
            topic_articles[slug].append(art)

    return topic_articles, unmatched_tags


# ── HTML 生成 ──

def build_knowledge_page(topic, articles_in_topic, topic_map):
    """生成单个知识主题页面"""
    slug = topic["slug"]
    title = topic["title"]
    title_en = topic["title_en"]
    desc = topic["description"]
    related = topic.get("related", [])

    # 按日期排序（新→旧）
    articles_sorted = sorted(articles_in_topic, key=lambda a: a["date"], reverse=True)

    # 文章列表HTML
    article_items = []
    for art in articles_sorted:
        type_label = {"cover": "Focus", "brief": "Brief", "cao": "Cao!"}.get(art["type"], "Brief")
        article_items.append(f'''        <a href="../{art["url"]}" class="article-card" itemscope itemtype="https://schema.org/NewsArticle">
          <span class="article-card__tag">{art["date"]} · {type_label}</span>
          <h3 class="article-card__title" itemprop="headline">{art["title"]}</h3>
          <p class="article-card__excerpt" itemprop="description">{art["deck"][:100]}</p>
        </a>''')

    # 相关主题
    related_html = ""
    if related:
        related_items = []
        for rslug in related:
            if rslug in topic_map:
                rt = topic_map[rslug]
                related_items.append(f'<a href="{rslug}.html" class="knowledge-related__link">{rt["title"]} <span>→</span></a>')
        if related_items:
            related_html = f'''
            <div class="knowledge-related">
              <h3 class="section-label">Related <span>相关主题</span></h3>
              <div class="knowledge-related__list">
                {chr(10).join(related_items)}
              </div>
            </div>'''

    page_title = f"{title} · 知识网络 | Dawn Vision"
    canonical = f"{BASE_URL}/knowledge/{slug}.html"

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{page_title}</title>
  <meta name="description" content="{desc[:150]}">
  <meta name="keywords" content="Dawn Vision,{title},{title_en},AI知识,{','.join(topic['keywords'][:5])}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{canonical}">
  <meta property="og:title" content="{title} | Dawn Vision 知识网络">
  <meta property="og:description" content="{desc[:100]}">
  <meta property="og:site_name" content="Dawn Vision">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:image" content="{BASE_URL}/assets/og-image.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title} | Dawn Vision">
  <meta name="twitter:description" content="{desc[:80]}">
  <meta name="twitter:image" content="{BASE_URL}/assets/og-image.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;0,8..60,900;1,8..60,400;1,8..60,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23002FA7' width='100' height='100'/><text y='75' font-size='80' fill='white' font-family='serif'>D</text></svg>">
  <script src="../assets/interactions.js" defer></script>
  <style>
    .knowledge-topic-header {{ margin-bottom: clamp(40px,5vw,56px); padding-bottom: clamp(24px,3vw,40px); border-bottom: 1px solid var(--color-border-light); }}
    .knowledge-topic-label {{ font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: var(--klein); font-family: Georgia, serif; font-weight: 700; margin-bottom: 16px; display: block; }}
    .knowledge-topic-title {{ font-size: clamp(2rem,5vw,3.2rem); font-weight: 900; color: var(--ink); letter-spacing: -1px; line-height: 1.15; margin-bottom: 12px; }}
    .knowledge-topic-en {{ font-size: 0.85rem; font-style: italic; color: var(--gray-light); font-family: 'Source Serif 4', Georgia, serif; margin-bottom: 20px; display: block; }}
    .knowledge-topic-desc {{ font-size: 1.05rem; line-height: 1.75; color: var(--ink-soft); max-width: 680px; }}
    .knowledge-count {{ font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--gray-light); font-family: 'Source Serif 4', Georgia, serif; font-weight: 600; margin-top: 24px; }}
    .knowledge-related {{ margin-top: clamp(48px,6vw,72px); padding-top: clamp(32px,4vw,48px); border-top: 1px solid var(--color-border-light); }}
    .knowledge-related__list {{ display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 12px; margin-top: 20px; }}
    .knowledge-related__link {{ display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border: 1px solid var(--color-border-light); color: var(--ink); font-weight: 600; font-size: 0.9rem; transition: all 0.2s ease; text-decoration: none; border-bottom: 1px solid var(--color-border-light); }}
    .knowledge-related__link:hover {{ border-color: var(--klein); color: var(--klein); background: var(--color-brand-soft); border-bottom-color: var(--klein); }}
    .knowledge-related__link span {{ color: var(--klein); font-size: 1.1rem; }}
  </style>
</head>
<body>

  <nav class="inner-nav" role="navigation" aria-label="主导航">
    <div class="inner-nav__inner">
      <div class="inner-nav__group">
        <a href="../index.html" class="inner-nav__link">Home</a>
        <a href="../articles.html" class="inner-nav__link">Articles</a>
      </div>
      <a href="../index.html" class="inner-nav__brand" aria-label="Dawn Vision 首页">
        Dawn Vision
        <small>Knowledge Network</small>
      </a>
      <div class="inner-nav__group">
        <a href="../cao.html" class="inner-nav__link">Cao</a>
        <a href="../about.html" class="inner-nav__link">About</a>
      </div>
    </div>
  </nav>

  <main class="container" role="main">
    <a href="index.html" class="article-page__back" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--gray-light);font-family:'Source Serif 4',Georgia,serif;font-weight:600;text-decoration:none;margin-bottom:24px;border-bottom:none;">← Knowledge Network</a>

    <header class="knowledge-topic-header">
      <span class="knowledge-topic-label">Knowledge Node · 知识节点</span>
      <h1 class="knowledge-topic-title">{title}</h1>
      <span class="knowledge-topic-en">{title_en}</span>
      <p class="knowledge-topic-desc">{desc}</p>
      <div class="knowledge-count">{len(articles_sorted)} 篇相关文章</div>
    </header>

    <section>
      <h2 class="section-label">Articles <span>相关文章</span></h2>
      <div class="article-grid">
{chr(10).join(article_items) if article_items else '        <p style="color:var(--gray-light);font-style:italic;">暂无相关文章</p>'}
      </div>
    </section>
{related_html}
  </main>

  <footer class="site-footer" role="contentinfo">
    <div class="container">
      <div class="site-footer__brand">Dawn Vision</div>
      <div class="site-footer__meta">© 2026 · Daily at 16:30 CST · Weekdays Only</div>
    </div>
  </footer>

</body>
</html>'''
    return html


def build_knowledge_index(topics, topic_articles, topic_map):
    """生成知识网络索引页 knowledge/index.html"""
    sorted_topics = sorted(topics, key=lambda t: len(topic_articles.get(t["slug"], [])), reverse=True)

    cards = []
    for t in sorted_topics:
        arts = topic_articles.get(t["slug"], [])
        count = len(arts)
        cards.append(f'''        <a href="{t["slug"]}.html" class="article-card knowledge-index-card">
          <span class="article-card__tag">{count} 篇 · {t["title_en"]}</span>
          <h3 class="article-card__title">{t["title"]}</h3>
          <p class="article-card__excerpt">{t["description"][:90]}</p>
        </a>''')

    total_topics = len(sorted_topics)
    total_links = sum(len(topic_articles.get(t["slug"], [])) for t in sorted_topics)

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>知识网络 | Dawn Vision — AI深度观察的认知图谱</title>
  <meta name="description" content="Dawn Vision 知识网络：按主题聚合AI深度文章，建立概念间的关联，形成可追溯的认知图谱。">
  <meta name="keywords" content="Dawn Vision,AI知识库,知识网络,AI Agent,大模型,AI编程,具身智能">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{BASE_URL}/knowledge/index.html">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{BASE_URL}/knowledge/index.html">
  <meta property="og:title" content="知识网络 | Dawn Vision">
  <meta property="og:description" content="按主题聚合AI深度文章，建立概念间的关联，形成可追溯的认知图谱。">
  <meta property="og:site_name" content="Dawn Vision">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:image" content="{BASE_URL}/assets/og-image.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="知识网络 | Dawn Vision">
  <meta name="twitter:description" content="按主题聚合AI深度文章">
  <meta name="twitter:image" content="{BASE_URL}/assets/og-image.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;0,8..60,900;1,8..60,400;1,8..60,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23002FA7' width='100' height='100'/><text y='75' font-size='80' fill='white' font-family='serif'>D</text></svg>">
  <script src="../assets/interactions.js" defer></script>
  <style>
    .knowledge-index-hero {{ margin-bottom: clamp(48px,6vw,72px); padding-bottom: clamp(32px,4vw,48px); border-bottom: 1px solid var(--color-border-light); }}
    .knowledge-index-label {{ font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: var(--klein); font-family: Georgia, serif; font-weight: 700; margin-bottom: 16px; display: block; }}
    .knowledge-index-title {{ font-size: clamp(2.4rem,6vw,4rem); font-weight: 900; color: var(--ink); letter-spacing: -2px; line-height: 1.1; margin-bottom: 16px; }}
    .knowledge-index-desc {{ font-size: 1.05rem; line-height: 1.75; color: var(--ink-soft); max-width: 640px; }}
    .knowledge-index-meta {{ font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--gray-light); font-family: 'Source Serif 4',Georgia,serif; font-weight: 600; margin-top: 24px; }}
    .knowledge-index-card {{ transition: all 0.2s ease; }}
    .knowledge-index-card:hover {{ border-color: var(--klein); transform: translateY(-2px); }}
  </style>
</head>
<body>

  <nav class="inner-nav" role="navigation" aria-label="主导航">
    <div class="inner-nav__inner">
      <div class="inner-nav__group">
        <a href="../index.html" class="inner-nav__link">Home</a>
        <a href="../articles.html" class="inner-nav__link">Articles</a>
      </div>
      <a href="../index.html" class="inner-nav__brand" aria-label="Dawn Vision 首页">
        Dawn Vision
        <small>Knowledge Network</small>
      </a>
      <div class="inner-nav__group">
        <a href="../cao.html" class="inner-nav__link">Cao</a>
        <a href="../about.html" class="inner-nav__link">About</a>
      </div>
    </div>
  </nav>

  <main class="container" role="main">
    <header class="knowledge-index-hero">
      <span class="knowledge-index-label">Knowledge Network · 知识网络</span>
      <h1 class="knowledge-index-title">在噪音中<br>建立连接</h1>
      <p class="knowledge-index-desc">每日文章中的认知笔记汇聚为知识节点。每一个节点连接相关文章与相邻主题，形成可追溯、可生长的认知图谱。不是信息的堆叠，是信号的网络。</p>
      <div class="knowledge-index-meta">{total_topics} 个知识节点 · {total_links} 条文章关联</div>
    </header>

    <section>
      <h2 class="section-label">Topics <span>知识节点</span></h2>
      <div class="article-grid">
{chr(10).join(cards)}
      </div>
    </section>
  </main>

  <footer class="site-footer" role="contentinfo">
    <div class="container">
      <div class="site-footer__brand">Dawn Vision</div>
      <div class="site-footer__meta">© 2026 · Daily at 16:30 CST · Weekdays Only</div>
    </div>
  </footer>

</body>
</html>'''
    return html


def update_article_notes_links(articles, tag_map, norm_tag_map, topic_map):
    """更新文章中的认知笔记：将<span>转为可点击<a>链接（幂等）"""
    updated = 0
    for art in articles:
        if not art["notes"]:
            continue
        path = art["path"]
        text = path.read_text(encoding="utf-8")

        # 判断相对路径前缀
        path_str = str(path).replace("\\", "/")
        if "/cao/" in path_str or "/articles/" in path_str:
            rel_prefix = "../knowledge/"
        else:
            rel_prefix = "knowledge/"

        def replace_notes(m):
            prefix = m.group(1)
            content = m.group(2)
            suffix = m.group(3)

            # 先提取所有现有笔记文本（去除已有的a/span标签）
            # 用·分割，每个segment可能包含HTML标签
            segments = re.split(r'(·|・)', content)
            new_parts = []
            for seg in segments:
                if seg in ('·', '・'):
                    new_parts.append(' · ')
                    continue
                # 提取纯文本note
                note_text = re.sub(r'<[^>]+>', '', seg).strip()
                if not note_text:
                    new_parts.append(seg)
                    continue
                # 查找对应主题
                slug = find_topic_for_note(note_text, tag_map, norm_tag_map)
                if slug and slug in topic_map:
                    new_parts.append(f'<a href="{rel_prefix}{slug}.html" style="{LINK_STYLE}">{note_text}</a>')
                else:
                    new_parts.append(f'<span style="{SPAN_STYLE}">{note_text}</span>')

            return prefix + ''.join(new_parts) + suffix

        new_text, count = re.subn(
            r'(相关入库笔记[：:]\s*)(.*?)(</p>)',
            replace_notes,
            text,
            flags=re.DOTALL
        )

        if count > 0 and new_text != text:
            path.write_text(new_text, encoding="utf-8")
            updated += 1

    return updated


# ── Obsidian Markdown 生成 ──

def build_topic_md(topic, articles_in_topic, topic_map, article_note_slugs):
    """生成知识主题的Obsidian Markdown笔记"""
    slug = topic["slug"]
    title = topic["title"].replace('"', "'")
    title_en = topic["title_en"].replace('"', "'")
    desc = topic["description"]
    keywords = topic.get("keywords", [])
    related = topic.get("related", [])

    articles_sorted = sorted(articles_in_topic, key=lambda a: a["date"], reverse=True)

    # YAML frontmatter
    fm_tags = ["知识节点", "DawnVision"] + [f"topic/{kw}" for kw in keywords[:5]]
    fm_tag_str = ", ".join(fm_tags)

    # 文章列表（使用wikilink链接到article notes）
    article_links = []
    for art in articles_sorted:
        note_slug = article_note_slugs.get(art["filename"], art["filename"].replace(".html", ""))
        type_label = {"cover": "封面", "brief": "Brief", "cao": "Cao!"}.get(art["type"], "Brief")
        article_links.append(f"- [[{note_slug}|{art['title']}]] ({art['date']} · {type_label})")

    # 相关主题
    related_links = []
    for rslug in related:
        if rslug in topic_map:
            rt = topic_map[rslug]
            related_links.append(f"- [[{rslug}|{rt['title']}]]")

    md = f"""---
title: "{title}"
title_en: "{title_en}"
type: knowledge-topic
tags: [{fm_tag_str}]
created: 2026-06-30
source: DawnVision
url: {BASE_URL}/knowledge/{slug}.html
---

# {title}

*{title_en}*

{desc}

## 相关文章

{chr(10).join(article_links) if article_links else '_暂无相关文章_'}

## 相关主题

{chr(10).join(related_links) if related_links else '_暂无关联主题_'}

---

> 本笔记由 Dawn Vision 知识网络自动生成。访问网站版：[{BASE_URL}/knowledge/{slug}.html]({BASE_URL}/knowledge/{slug}.html)
"""
    return md


def build_article_note_md(art, topic_slugs, topic_map, prev_slug=None, next_slug=None):
    """生成文章的Obsidian Markdown笔记（文献笔记）"""
    slug = art["filename"].replace(".html", "")
    title = art["title"].replace('"', "'")
    date = art["date"]
    deck = art["deck"]
    article_type = art["type"]
    notes = art["notes"]

    type_label = {"cover": "封面文章", "brief": "Brief", "cao": "Cao!"}.get(article_type, "Brief")
    fm_type = {"cover": "cover", "brief": "brief", "cao": "cao"}.get(article_type, "brief")

    # 关联到知识主题
    topic_links = []
    for tslug in topic_slugs:
        if tslug in topic_map:
            t = topic_map[tslug]
            topic_links.append(f"- [[{tslug}|{t['title']}]]")

    # 认知笔记标签（作为inline tags）
    note_tags = " ".join([f"#note/{_normalize_tag(n)}" for n in notes[:8]])

    # 前后文章导航
    nav_links = []
    if prev_slug:
        nav_links.append(f"← [[{prev_slug}]]")
    if next_slug:
        nav_links.append(f"[[{next_slug}]] →")
    nav_html = " | ".join(nav_links) if nav_links else ""

    md = f"""---
title: "{title}"
date: {date}
type: {fm_type}
issue: DawnVision
tags: [DawnVision, 文章, {fm_type}]
source_url: {BASE_URL}/{art['url']}
---

# {title}

> {type_label} · {date}

{deck}

## 入库知识

{chr(10).join(topic_links) if topic_links else '_待关联_'}

## 认知笔记

{note_tags}

{nav_html}

---

> 阅读全文：[{BASE_URL}/{art['url']}]({BASE_URL}/{art['url']})
"""
    return md


def _normalize_tag(tag):
    """将中文标签转为合法的Obsidian tag（去除空格和特殊字符）"""
    return re.sub(r'[^\w\u4e00-\u9fff]', '', tag)


def build_md_index(topics, topic_articles, topic_map, articles=None):
    """生成知识网络MOC（Map of Content）的Markdown索引"""
    sorted_topics = sorted(topics, key=lambda t: len(topic_articles.get(t["slug"], [])), reverse=True)

    topic_links = []
    for t in sorted_topics:
        count = len(topic_articles.get(t["slug"], []))
        topic_links.append(f"- [[{t['slug']}|{t['title']}]] ({count}篇)")

    # 最近文章（显式链接，不依赖Dataview插件）
    article_links = []
    if articles:
        sorted_arts = sorted(articles, key=lambda a: a["date"], reverse=True)[:12]
        for art in sorted_arts:
            slug = art["filename"].replace(".html", "")
            type_label = {"cover": "封面", "brief": "Brief", "cao": "Cao!"}.get(art["type"], "")
            article_links.append(f"- [[{slug}|{art['title']}]] ({art['date']} · {type_label})")

    md = f"""---
title: "Dawn Vision 知识网络"
type: MOC
tags: [DawnVision, 知识网络, MOC]
created: 2026-06-30
---

# Dawn Vision 知识网络

> 在噪音中建立连接。

每日文章中的认知笔记汇聚为知识节点，形成可追溯、可生长的认知图谱。

## 项目文档

- [[README|项目主页]]
- [[writing-style|写作风格指南]]

## 知识节点

{chr(10).join(topic_links)}

## 最近文章

{chr(10).join(article_links) if article_links else '_暂无文章_'}

```dataview
TABLE date, type FROM "notes" SORT date DESC LIMIT 20
```

---

> 访问网站：[{BASE_URL}/knowledge/index.html]({BASE_URL}/knowledge/index.html)
"""
    return md


def generate_markdown_files(topics, articles, topic_articles, topic_map, tag_map, norm_tag_map):
    """生成所有Obsidian兼容的Markdown文件"""
    NOTES_DIR.mkdir(parents=True, exist_ok=True)
    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)

    # 构建 article filename -> note slug 映射
    article_note_slugs = {}
    article_topics = defaultdict(list)  # article filename -> [topic_slugs]

    # 按日期排序，构建prev/next关系
    articles_sorted = sorted(articles, key=lambda a: (a["date"], a["filename"]))
    prev_next = {}
    for i, art in enumerate(articles_sorted):
        prev_slug = articles_sorted[i-1]["filename"].replace(".html", "") if i > 0 else None
        next_slug = articles_sorted[i+1]["filename"].replace(".html", "") if i < len(articles_sorted)-1 else None
        prev_next[art["filename"]] = (prev_slug, next_slug)

    for art in articles:
        note_slug = art["filename"].replace(".html", "")
        article_note_slugs[art["filename"]] = note_slug
        matched = set()
        for note in art["notes"]:
            slug = find_topic_for_note(note, tag_map, norm_tag_map)
            if slug:
                matched.add(slug)
        article_topics[art["filename"]] = list(matched)

    # 生成知识主题MD文件
    md_count = 0
    for t in topics:
        slug = t["slug"]
        arts = topic_articles.get(slug, [])
        md = build_topic_md(t, arts, topic_map, article_note_slugs)
        out = KNOWLEDGE_DIR / f"{slug}.md"
        out.write_text(md, encoding="utf-8")
        md_count += 1

    # 生成文章笔记MD文件
    for art in articles:
        slug = art["filename"].replace(".html", "")
        topics_for_art = article_topics.get(art["filename"], [])
        prev_slug, next_slug = prev_next.get(art["filename"], (None, None))
        md = build_article_note_md(art, topics_for_art, topic_map, prev_slug, next_slug)
        out = NOTES_DIR / f"{slug}.md"
        out.write_text(md, encoding="utf-8")
        md_count += 1

    # 生成MOC索引
    index_md = build_md_index(topics, topic_articles, topic_map, articles)
    (SITE_ROOT / "知识网络.md").write_text(index_md, encoding="utf-8")
    md_count += 1

    return md_count


def main():
    parser = argparse.ArgumentParser(description="Dawn Vision 知识网络构建")
    parser.add_argument("--rebuild", action="store_true", help="重建所有知识页面")
    args = parser.parse_args()

    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)

    print(f"{'='*60}")
    print("Dawn Vision 知识网络构建")
    print(f"{'='*60}")

    topics, tag_map, norm_tag_map, topic_map = load_topics()
    print(f"📚 加载 {len(topics)} 个知识主题, {len(tag_map)} 个标签映射")

    articles = scan_all_articles()
    print(f"📄 扫描 {len(articles)} 篇文章")

    topic_articles, unmatched = build_topic_articles_map(articles, tag_map, norm_tag_map)
    matched_count = sum(len(v) for v in topic_articles.values())
    print(f"🔗 建立 {matched_count} 个文章-主题关联")

    if unmatched:
        print(f"\n⚠️  未匹配标签 ({len(unmatched)} 个):")
        for tag, files in sorted(unmatched.items(), key=lambda x: -len(x[1])):
            print(f"   - {tag} ({len(files)}篇)")

    # 生成Obsidian Markdown文件（知识网络仅用于Obsidian，不发布到网站）
    print(f"\n📓 生成Obsidian Markdown文件...")
    md_count = generate_markdown_files(topics, articles, topic_articles, topic_map, tag_map, norm_tag_map)
    print(f"   ✅ 生成了 {md_count} 个MD文件 (知识主题+文章笔记+MOC索引)")

    print(f"\n{'='*60}")
    print(f"✅ 知识网络构建完成 (Obsidian MD模式)")
    print(f"   {len(topics)} 个知识节点, {matched_count} 条关联")
    print(f"   Obsidian入口: 知识网络.md")
    print(f"   注意: 知识网络不发布到网站，仅用于Obsidian")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
