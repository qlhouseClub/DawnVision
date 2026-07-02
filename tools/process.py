#!/usr/bin/env python3
"""
Dawn Vision 流程一：处理 + 简报 + 本地预览
==========================================
用法: python tools/process.py <issue.json> [--no-preview]

输入: 一个JSON文件，包含本期8篇文章的完整内容（1封面+6Brief+1Cao）
输出:
  1. 生成8篇文章HTML到 articles/ 和 cao/ 目录
  2. 更新 articles.html（最新一期列表页）
  3. 创建 issues/issue-NNN.html 归档页
  4. 更新 index.html 封面文章区块
  5. 更新 cao.html 槽点列表
  6. 更新 sitemap.xml
  7. 启动本地预览服务器（端口8080）
"""

import json
import sys
import os
import re
import subprocess
import argparse
from datetime import datetime
from pathlib import Path

# ============================================================
# 配置
# ============================================================
BASE_URL = "https://qlhouseclub.github.io/DawnVision"
SITE_ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = SITE_ROOT / "articles"
CAO_DIR = SITE_ROOT / "cao"
ISSUES_DIR = SITE_ROOT / "issues"
TOOLS_DIR = SITE_ROOT / "tools"
PUBLISH_TIME = "16:30:00+08:00"
LOCAL_PORT = 8080

# ============================================================
# HTML 模板生成函数
# ============================================================

BG_BLOBS = '''<div class="bg-blobs">
    <div class="bg-blob bg-blob--1"></div>
    <div class="bg-blob bg-blob--2"></div>
    <div class="bg-blob bg-blob--3"></div>
    <div class="bg-blob bg-blob--4"></div>
    <div class="bg-blob bg-blob--5"></div>
  </div>'''

def build_article_head(title, description, keywords, canonical_url, og_title, og_desc, twitter_desc, published_time, article_type="NewsArticle", section="AI深度观察", word_count=800):
    """生成文章页面的<head>部分"""
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  
  
  
  <script>
/* Anti-redirect guard: block cached old GT scripts from auto-redirecting */
(function(){
  window.__dvAllowTranslate = true; /* we load GT ourselves */
  window.googleTranslateElementInit = function(){ /* placeholder, overridden by interactions.js */ };
  var isGT = function(u){ return typeof u==='string' && /translate\.google(apis)?\.com/.test(u); };
  var _a=window.location.assign, _r=window.location.replace, _o=window.open;
  window.location.assign = function(u){ if(isGT(u) && !window.__dvAllowTranslate){ console.warn('[DV] Blocked auto GT redirect'); return; } return _a.call(window.location,u); };
  window.location.replace = function(u){ if(isGT(u) && !window.__dvAllowTranslate){ console.warn('[DV] Blocked auto GT redirect'); return; } return _r.call(window.location,u); };
  window.open = function(){ if(isGT(arguments[0]) && !window.__dvAllowTranslate){ console.warn('[DV] Blocked auto GT popup'); return null; } return _o.apply(window,arguments); };
})();
</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} | Dawn Vision</title>
  <meta name="description" content="{description}">
  <meta name="keywords" content="Dawn Vision, {keywords}">
  <meta name="author" content="Dawn Vision">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{canonical_url}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{canonical_url}">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{og_desc}">
  <meta property="og:site_name" content="Dawn Vision">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:image" content="{BASE_URL}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="article:published_time" content="{published_time}">
  <meta property="article:author" content="Dawn Vision">
  <meta property="article:section" content="{section}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{twitter_desc}">
  <meta name="twitter:image" content="{BASE_URL}/assets/og-image.png">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "{article_type}",
    "headline": "{og_title}",
    "description": "{og_desc}",
    "datePublished": "{published_time}",
    "dateModified": "{published_time}",
    "author": {{"@type": "Organization", "name": "Dawn Vision"}},
    "publisher": {{
      "@type": "Organization",
      "name": "Dawn Vision",
      "url": "{BASE_URL}/",
      "logo": {{"@type": "ImageObject", "url": "{BASE_URL}/assets/og-image.png"}}
    }},
    "inLanguage": "zh-CN",
    "image": "{BASE_URL}/assets/og-image.png",
    "wordCount": {word_count}
  }}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;0,8..60,900;1,8..60,400;1,8..60,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/style.css?v=18">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23002FA7' width='100' height='100'/><text y='75' font-size='80' fill='white' font-family='serif'>D</text></svg>">
  <script src="../assets/interactions.js?v=18" defer></script>
</head>'''


def build_nav(active="articles"):
    """生成内页导航（与现有页面一致）"""
    active_class = lambda page: " inner-nav__link--active" if page == active else ""
    active_aria = lambda page: ' aria-current="page"' if page == active else ""
    return f'''<nav class="inner-nav" role="navigation" aria-label="主导航">
  <div class="inner-nav__inner">
    <div class="inner-nav__group">
      <a href="../index.html" class="inner-nav__link">Home</a>
      <a href="../articles.html" class="inner-nav__link{active_class('articles')}"{active_aria('articles')}>Articles</a>
    </div>
    <a href="../index.html" class="inner-nav__brand" aria-label="Dawn Vision 首页">
      Dawn Vision
      <small>Daily Briefing</small>
    </a>
    <div class="inner-nav__group">
      <a href="../cao.html" class="inner-nav__link{active_class('cao')}"{active_aria('cao')}>Cao</a>
      <a href="../about.html" class="inner-nav__link">About</a>
    </div>
  </div>
</nav>'''


def build_sources_html(sources):
    """生成参考来源HTML"""
    items = []
    for s in sources:
        if s.get("url"):
            items.append(f'        <li><a href="{s["url"]}" target="_blank" rel="noopener noreferrer nofollow">{s["text"]}</a></li>')
        else:
            items.append(f'        <li><span style="color:var(--color-text-light);text-decoration:underline;text-decoration-style:dotted;cursor:default;">{s["text"]}</span></li>')
    return "\n".join(items)


def build_pull_quote(pq):
    """生成引用块HTML"""
    if not pq:
        return ""
    return f'''      <div class="pull-quote">
        "{pq["text"]}"
        <span class="pull-quote__attr">{pq["attr"]}</span>
      </div>'''


def build_cover_article(data, issue, prev_cover_slug=None):
    """生成封面文章HTML"""
    date = issue["date"]
    date_display = issue["date_display"]
    issue_num = issue["number"]
    slug = data["slug"]
    filename = f"{date}-{slug}.html"
    url = f"{BASE_URL}/articles/{filename}"
    published = f"{date}T{PUBLISH_TIME}"

    next_slug = data.get("next_article_slug", "")
    next_link = f'{date}-{next_slug}.html' if next_slug else f'../cao/{date}-{data.get("cao_slug", "")}.html'
    if not next_slug and not data.get("cao_slug"):
        next_link = "../articles.html"

    head = build_article_head(
        title=f'{data["title"]} | Dawn Vision — AI深度观察',
        description=data["deck"],
        keywords=data["keywords"],
        canonical_url=url,
        og_title=data["title"],
        og_desc=data["og_description"],
        twitter_desc=data.get("twitter_description", data["og_description"]),
        published_time=published,
        article_type="NewsArticle",
        section="AI深度观察",
        word_count=data["word_count"]
    )

    # 封面文章hero区域不同 - 有"Focus · 焦点"标签
    hero_label = "Focus · 焦点"
    sources_html = build_sources_html(data["sources"])
    pull_quote_html = build_pull_quote(data.get("pull_quote"))

    # 上一篇链接
    prev_link_html = ""
    if prev_cover_slug:
        # 上一期的封面
        prev_date = get_prev_issue_date(date)
        prev_link_html = f'<a href="{prev_date}-{prev_cover_slug}.html" style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-text-light); text-decoration: none;">← 上一期封面</a>'
    else:
        prev_link_html = '<span style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-text-light); opacity: 0.3;">创刊号</span>'

    html = f'''{head}
<body>
{build_nav("articles")}
<main role="main">
<div class="article-page__hero">
{BG_BLOBS}
  <div class="article-page__hero-inner">
    <a href="../articles.html" class="article-page__back">← Back to Articles</a>
    <h1 class="article-page__hero-title">{data["title_break"]}</h1>
    <p class="article-page__hero-deck">{data["deck"]}</p>
  </div>
</div>
<article class="article-page">
  <div class="container--narrow">
    <div class="article-page__meta">
    <div class="article-page__meta-row">
      <span>Dawn Vision 编辑部</span>
      <span>{data["read_time"]}</span>
    </div>
    <div class="article-page__meta-row article-page__meta-row--tags">
      {' '.join(f'<span class="article-page__meta-tag">{t.strip()}</span>' for t in hero_label.split('·') if t.strip())}
    </div>
    <div class="article-page__meta-row article-page__meta-row--issue">
      <span>{date_display} · Issue {issue_num}</span>
    </div>
  </div>
    <div class="article-page__content">
{data["body_html"]}
{pull_quote_html}
      <hr>
      <p>明天见。</p>
    </div>
    <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--color-border-light); display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
      {prev_link_html}
      <a href="{next_link}" style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-text-light); text-decoration: none;">下一篇 →</a>
    </div>
    <div class="article-sources">
      <div class="article-sources__label">Sources · 参考来源</div>
      <ul class="article-sources__list">
{sources_html}
      </ul>
      <p class="article-sources__note">声明：本文为 Dawn Vision 基于公开信息的二次创作与独立分析，标题、观点、行文均为原创，仅供参考，不构成任何投资建议或决策依据。如有侵权请联系删除。</p>
    </div>
    <div class="article-page__footnote">
      <p>{data["source_summary"]}</p>
      <p>相关入库笔记：{data["cognitive_notes"]}</p>
    </div>
  </div>
</article>
</main>
<footer class="site-footer"><div class="container"><div class="site-footer__brand">Dawn Vision</div><div class="site-footer__meta">© 2026 · Daily at 16:30 CST · Weekdays Only</div></div></footer>
</body>
</html>'''
    return filename, html


def build_brief_article(data, issue, idx, total_briefs, prev_slug, next_slug):
    """生成Brief文章HTML"""
    date = issue["date"]
    date_display = issue["date_display"]
    issue_num = issue["number"]
    slug = data["slug"]
    filename = f"{date}-{slug}.html"
    url = f"{BASE_URL}/articles/{filename}"
    published = f"{date}T{PUBLISH_TIME}"

    head = build_article_head(
        title=data["title"],
        description=data["deck"],
        keywords=data["keywords"],
        canonical_url=url,
        og_title=data["title"],
        og_desc=data["og_description"],
        twitter_desc=data.get("twitter_description", data["og_description"]),
        published_time=published,
        article_type="NewsArticle",
        section=data.get("category", "Brief资讯"),
        word_count=data["word_count"]
    )

    hero_label = f'{data["category_en"]} · {data["category"]}'
    sources_html = build_sources_html(data["sources"])
    pull_quote_html = build_pull_quote(data.get("pull_quote"))

    # 导航链接
    if idx == 0:
        # 第一篇brief，上一篇是封面
        prev_link = f"{date}-{data.get('cover_slug', '')}.html"
        prev_text = "← 上一篇"
    else:
        prev_link = f"{date}-{prev_slug}.html"
        prev_text = "← 上一篇"

    if idx == total_briefs - 1:
        # 最后一篇brief，下一篇是cao
        next_link = f"../cao/{date}-{data.get('cao_slug', '')}.html"
        next_text = "槽点 →"
    else:
        next_link = f"{date}-{next_slug}.html"
        next_text = "下一篇 →"

    html = f'''{head}
<body>
{build_nav("articles")}
<main role="main">
<div class="article-page__hero">
{BG_BLOBS}
  <div class="article-page__hero-inner">
    <a href="../articles.html" class="article-page__back">← Back to Articles</a>
    <h1 class="article-page__hero-title">{data["title_break"]}</h1>
    <p class="article-page__hero-deck">{data["deck"]}</p>
  </div>
</div>
<article class="article-page">
  <div class="container--narrow">
    <div class="article-page__meta">
    <div class="article-page__meta-row">
      <span>Dawn Vision 编辑部</span>
      <span>{data["read_time"]}</span>
    </div>
    <div class="article-page__meta-row article-page__meta-row--tags">
      {' '.join(f'<span class="article-page__meta-tag">{t.strip()}</span>' for t in hero_label.split('·') if t.strip())}
    </div>
    <div class="article-page__meta-row article-page__meta-row--issue">
      <span>{date_display} · Issue {issue_num}</span>
    </div>
  </div>
    <div class="article-page__content">
{data["body_html"]}
{pull_quote_html}
      <hr>
      <p>明天见。</p>
    </div>
    <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--color-border-light); display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
      <a href="{prev_link}" style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-text-light); text-decoration: none;">{prev_text}</a>
      <a href="{next_link}" style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-text-light); text-decoration: none;">{next_text}</a>
    </div>
    <div class="article-sources">
      <div class="article-sources__label">Sources · 参考来源</div>
      <ul class="article-sources__list">
{sources_html}
      </ul>
      <p class="article-sources__note">声明：本文为 Dawn Vision 基于公开信息的二次创作与独立分析，标题、观点、行文均为原创，仅供参考。</p>
    </div>
    <div class="article-page__footnote">
      <p>{data["source_summary"]}</p>
      <p>相关入库笔记：{data["cognitive_notes"]}</p>
    </div>
  </div>
</article>
</main>
<footer class="site-footer"><div class="container"><div class="site-footer__brand">Dawn Vision</div><div class="site-footer__meta">© 2026 · Daily at 16:30 CST · Weekdays Only</div></div></footer>
</body>
</html>'''
    return filename, html


def build_cao_article(data, issue, last_brief_slug):
    """生成Cao文章HTML"""
    date = issue["date"]
    date_display = issue["date_display"]
    issue_num = issue["number"]
    slug = data["slug"]
    filename = f"{date}-{slug}.html"
    url = f"{BASE_URL}/cao/{filename}"
    published = f"{date}T{PUBLISH_TIME}"

    head = build_article_head(
        title=f'{data["title"]} | Dawn Vision — AI吐槽',
        description=data["deck"],
        keywords=data["keywords"],
        canonical_url=url,
        og_title=data["title"],
        og_desc=data["og_description"],
        twitter_desc=data.get("twitter_description", data["og_description"]),
        published_time=published,
        article_type="BlogPosting",
        section="Cao槽点",
        word_count=data["word_count"]
    )

    sources_html = build_sources_html(data["sources"])
    pull_quote_html = build_pull_quote(data.get("pull_quote"))
    footnote_tip = data.get("footnote_tip", "")

    html = f'''{head}
<body>
{build_nav("cao")}
<main role="main">
<div class="article-page__hero">
{BG_BLOBS}
  <div class="article-page__hero-inner">
    <a href="../cao.html" class="article-page__back">← Back to Cao!</a>
    <h1 class="article-page__hero-title">{data["title_break"]}</h1>
    <p class="article-page__hero-deck">{data["deck"]}</p>
  </div>
</div>
<article class="article-page">
  <div class="container--narrow">
    <div class="article-page__meta">
      <div class="article-page__meta-row">
        <span>Dawn Vision 编辑部</span>
        <span>{data["read_time"]}</span>
      </div>
      <div class="article-page__meta-row article-page__meta-row--issue">
        <span>{date_display} · Issue {issue_num}</span>
      </div>
    </div>
    <div class="article-page__content">
{data["body_html"]}
{pull_quote_html}
      <hr>
      <p>今天就槽到这里，明天继续。</p>
    </div>
    <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--color-border-light); display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
      <a href="../articles/{date}-{last_brief_slug}.html" style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-text-light); text-decoration: none;">← 上一篇</a>
      <a href="../articles.html" style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-brand); text-decoration: none;">深度文章 →</a>
    </div>
    <div class="article-sources">
      <div class="article-sources__label">Sources · 参考来源</div>
      <ul class="article-sources__list">
{sources_html}
      </ul>
      <p class="article-sources__note">声明：本文为 Dawn Vision 基于公开信息的二次创作与独立分析，以幽默吐槽风格呈现，标题、观点、行文均为原创，仅供娱乐参考，不构成任何技术建议或决策依据。如有侵权请联系删除。</p>
    </div>
    <div class="article-page__footnote">
      <p>{data["source_summary"]}</p>
      <p>相关入库笔记：{data.get("cognitive_notes", "AI翻车现场 · Agent失控案例库")}</p>
      <p>{footnote_tip}</p>
    </div>
  </div>
</article>
</main>
<footer class="site-footer"><div class="container"><div class="site-footer__brand">Dawn Vision</div><div class="site-footer__meta">© 2026 · Daily at 16:30 CST · Weekdays Only</div></div></footer>
</body>
</html>'''
    return filename, html


# ============================================================
# 列表页生成函数
# ============================================================

def get_all_issues_structured(current_num=None, current_date=None):
    """获取所有期数的结构化数据，返回列表按旧到新排序
    每项: {num, date, date_display, year, month, day, half, url, is_latest}
    half: 'H1'=上半月(1-15日), 'H2'=下半月(16-31日)
    注意：current_num/current_date用于在生成流程中标识当前正在处理的期数，
    最新一期的URL设为articles.html。
    """
    issues = []
    if ISSUES_DIR.exists():
        for issue_file in sorted(ISSUES_DIR.glob("issue-*.html")):
            num = issue_file.stem.split("-")[1]
            try:
                content = issue_file.read_text(encoding="utf-8")
                date_match = re.search(r'Issue\s+(\d+)\s*\|\s*(\d{4})\.(\d{2})\.(\d{2})', content)
                if date_match:
                    n, y, m, d = date_match.groups()
                    date_str = f"{y}.{m}.{d}"
                    day = int(d)
                    half = "H1" if day <= 15 else "H2"
                    issues.append({
                        "num": n.zfill(3),
                        "date": f"{y}-{m}-{d}",
                        "date_display": date_str,
                        "year": y,
                        "month": m,
                        "day": d,
                        "half": half,
                        "url": f"issues/issue-{n}.html",
                        "is_latest": False,
                    })
            except:
                pass

    # 如果提供了当前期信息，更新或添加
    if current_num and current_date:
        y, m, d = current_date.split(".")
        cur_n = str(current_num).zfill(3)
        day = int(d)
        half = "H1" if day <= 15 else "H2"
        found = False
        for i in issues:
            if i["num"] == cur_n:
                # 更新已有期数据
                i["date"] = current_date.replace(".", "-")
                i["date_display"] = current_date
                i["year"] = y
                i["month"] = m
                i["day"] = d
                i["half"] = half
                found = True
                break
        if not found:
            issues.append({
                "num": cur_n,
                "date": current_date.replace(".", "-"),
                "date_display": current_date,
                "year": y,
                "month": m,
                "day": d,
                "half": half,
                "url": "articles.html",
                "is_latest": True,
            })

    # 最新一期URL指向articles.html
    if issues:
        latest = max(issues, key=lambda x: int(x["num"]))
        latest["url"] = "articles.html"
        latest["is_latest"] = True
        # 确保归档页中不是最新的都指向issues/
        for i in issues:
            if i["num"] != latest["num"]:
                i["url"] = f"issues/issue-{int(i['num'])}.html"
                i["is_latest"] = False

    # 按期数排序（旧→新）
    issues.sort(key=lambda x: int(x["num"]))
    return issues


def build_issue_filter(current_issue_num, current_date_display, is_latest=False, prefix=""):
    """生成四级联动期数筛选器：年/月/上半下半/期数"""
    # 获取所有期数数据
    all_issues = get_all_issues_structured(current_issue_num, current_date_display)

    # 当前期的元数据
    cur_num = str(current_issue_num).zfill(3)
    cur = None
    for i in all_issues:
        if i["num"] == cur_num:
            cur = i
            break
    if not cur:
        # fallback
        y, m, d = current_date_display.split(".")
        cur = {"year": y, "month": m, "half": "H1" if int(d) <= 15 else "H2", "num": cur_num, "url": "articles.html" if is_latest else f"issues/issue-{cur_num}.html"}

    # 收集所有年份、月份（从数据中）
    years = sorted(set(i["year"] for i in all_issues), reverse=True)
    months = [f"{mm:02d}" for mm in range(1, 13)]
    halves = [("H1", "上半月"), ("H2", "下半月")]

    # 构建期数JSON数据供JS使用（URL加前缀）
    issues_for_json = []
    for i in all_issues:
        item = dict(i)
        if prefix and not item["url"].startswith(prefix):
            item["url"] = prefix + item["url"]
        issues_for_json.append(item)
    issues_json = json.dumps(issues_for_json, ensure_ascii=False)

    return f'''    <div class="issue-filter" data-issues='{issues_json}' data-current="{cur_num}">
      <span class="issue-filter__current">Issue {cur_num}</span>
      <div class="issue-filter__row">
        <select class="issue-filter__select" data-filter="year" aria-label="选择年份">
          <option value="">年</option>
          {"".join(f'<option value="{y}"{" selected" if y == cur["year"] else ""}>{y}</option>' for y in years)}
        </select>
        <select class="issue-filter__select" data-filter="month" aria-label="选择月份">
          <option value="">月</option>
          {"".join(f'<option value="{m}"{" selected" if m == cur["month"] else ""}>{int(m)}月</option>' for m in months)}
        </select>
        <select class="issue-filter__select" data-filter="half" aria-label="选择上/下半">
          <option value="">半</option>
          {"".join(f'<option value="{h}"{" selected" if h == cur["half"] else ""}>{label}</option>' for h, label in halves)}
        </select>
        <select class="issue-filter__select" data-filter="issue" aria-label="选择期数">
          <option value="">期</option>
        </select>
      </div>
    </div>'''


def build_pagination(all_issues, current_num, prefix=""):
    """生成底部分页：上一期/下一期 + 页码列表"""
    cur_idx = None
    for idx, i in enumerate(all_issues):
        if i["num"] == str(current_num).zfill(3):
            cur_idx = idx
            break

    if cur_idx is None:
        return ""

    total = len(all_issues)
    prev_issue = all_issues[cur_idx - 1] if cur_idx > 0 else None
    next_issue = all_issues[cur_idx + 1] if cur_idx < total - 1 else None

    # 构建分页按钮
    page_items = []
    if total <= 7:
        # 少量页面全部显示
        for idx in range(total):
            i = all_issues[idx]
            active = ' pagination__num--active' if idx == cur_idx else ''
            page_items.append(f'<a href="{prefix}{i["url"]}" class="pagination__num{active}" aria-label="Issue {i["num"]}">{int(i["num"])}</a>')
    else:
        start = max(0, cur_idx - 2)
        end = min(total, cur_idx + 3)
        if start > 0:
            first = all_issues[0]
            page_items.append(f'<a href="{prefix}{first["url"]}" class="pagination__num" aria-label="Issue {first["num"]}">{int(first["num"])}</a>')
            if start > 1:
                page_items.append('<span class="pagination__ellipsis">…</span>')
        for idx in range(start, end):
            i = all_issues[idx]
            active = ' pagination__num--active' if idx == cur_idx else ''
            page_items.append(f'<a href="{prefix}{i["url"]}" class="pagination__num{active}" aria-label="Issue {i["num"]}">{int(i["num"])}</a>')
        if end < total:
            if end < total - 1:
                page_items.append('<span class="pagination__ellipsis">…</span>')
            last = all_issues[-1]
            page_items.append(f'<a href="{prefix}{last["url"]}" class="pagination__num" aria-label="Issue {last["num"]}">{int(last["num"])}</a>')

    prev_html = ''
    if prev_issue:
        prev_html = f'<a href="{prefix}{prev_issue["url"]}" class="pagination__nav pagination__nav--prev" aria-label="上一期 Issue {prev_issue["num"]}">← Issue {int(prev_issue["num"])}</a>'
    else:
        prev_html = '<span class="pagination__nav pagination__nav--disabled">← 已是最早</span>'

    next_html = ''
    if next_issue:
        next_html = f'<a href="{prefix}{next_issue["url"]}" class="pagination__nav pagination__nav--next" aria-label="下一期 Issue {next_issue["num"]}">Issue {int(next_issue["num"])} →</a>'
    else:
        next_html = '<span class="pagination__nav pagination__nav--disabled">已是最新 →</span>'

    return f'''    <nav class="pagination" role="navigation" aria-label="期数分页">
      {prev_html}
      <div class="pagination__pages">
        {"".join(page_items)}
      </div>
      {next_html}
    </nav>'''


def build_listing_page(issue, cover, briefs, cao, is_latest=False):
    """生成文章列表页（articles.html或issue-NNN.html）"""
    date = issue["date"]
    date_display = issue["date_display"]
    issue_num = issue["number"]
    prefix = "" if is_latest else "../"

    # Brief卡片HTML
    brief_cards = []
    for b in briefs:
        article_url = f"articles/{date}-{b['slug']}.html" if is_latest else f"../articles/{date}-{b['slug']}.html"
        brief_cards.append(f'''        <a href="{article_url}" class="article-card" itemscope itemtype="https://schema.org/NewsArticle">
          <span class="article-card__tag">{b["category"]} · {b["category_en"]}</span>
          <h3 class="article-card__title" itemprop="headline">{b["title"]}</h3>
          <p class="article-card__excerpt" itemprop="description">{b["deck"]}</p>
        </a>''')

    cover_url = f"articles/{date}-{cover['slug']}.html" if is_latest else f"../articles/{date}-{cover['slug']}.html"
    cao_url = f"cao/{date}-{cao['slug']}.html" if is_latest else f"../cao/{date}-{cao['slug']}.html"
    cao_list_url = "cao.html" if is_latest else "../cao.html"

    if is_latest:
        page_title = "AI 深度文章 | Dawn Vision — 穿越嘈杂，洞见留声"
        page_h1 = "Dawn Vision · 深度文章"
        canonical_url = f"{BASE_URL}/articles.html"
        meta_desc = "Dawn Vision 深度文章栏目，每日更新 AI 前沿深度分析。涵盖 AI Agent、大模型竞赛、AI 商业化、具身智能、AI 编程、一人公司创业等话题。不是信息搬运，是噪音中的信号过滤器。"
        meta_keywords = "Dawn Vision, AI文章, AI深度分析, AI Agent, 大模型, 人工智能资讯"
        og_url = f"{BASE_URL}/articles.html"
        jsonld_name = "AI 深度文章 | Dawn Vision"
    else:
        page_title = f"Issue {issue_num} | {date_display} | Dawn Vision — AI 深度观察"
        page_h1 = f"Dawn Vision · Issue {issue_num}"
        if issue_num == "001":
            page_h1 += " · 创刊号"
        canonical_url = f"{BASE_URL}/issues/issue-{issue_num}.html"
        meta_desc = f"Dawn Vision 第{issue_num}期（{date_display}）：{cover['deck'][:80]}..."
        meta_keywords = f"Dawn Vision,AI日报,Issue {issue_num}"
        og_url = f"{BASE_URL}/issues/issue-{issue_num}.html"
        jsonld_name = f"Dawn Vision Issue {issue_num} — {date_display}"

    # 四级联动筛选器
    issue_filter_html = build_issue_filter(issue_num, date_display, is_latest, prefix)

    # 获取所有期数用于分页
    all_issues = get_all_issues_structured(issue_num, date_display)
    pagination_html = build_pagination(all_issues, issue_num, prefix)

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{page_title}</title>
  <meta name="description" content="{meta_desc}">
  <meta name="keywords" content="{meta_keywords}">
  <meta name="author" content="Dawn Vision">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{canonical_url}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{og_url}">
  <meta property="og:title" content="{'AI 深度文章 | Dawn Vision' if is_latest else f'Issue {issue_num} | Dawn Vision'}">
  <meta property="og:description" content="{'每个工作日深度解读AI前沿，去噪筛选，深度加工。' if is_latest else cover['deck'][:80]}">
  <meta property="og:site_name" content="Dawn Vision">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:image" content="{BASE_URL}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{'AI 深度文章 | Dawn Vision' if is_latest else f'Issue {issue_num} | Dawn Vision'}">
  <meta name="twitter:description" content="穿越嘈杂，洞见留声。">
  <meta name="twitter:image" content="{BASE_URL}/assets/og-image.png">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "{jsonld_name}",
    "description": "{meta_desc}",
    "url": "{canonical_url}",
    "inLanguage": "zh-CN",
    "numberOfItems": 8,
    "publisher": {{
      "@type": "Organization",
      "name": "Dawn Vision",
      "logo": {{"@type": "ImageObject", "url": "{BASE_URL}/assets/og-image.png"}}
    }}
  }}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;0,8..60,900;1,8..60,400;1,8..60,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{prefix}assets/style.css?v=18">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23002FA7' width='100' height='100'/><text y='75' font-size='80' fill='white' font-family='serif'>D</text></svg>">
  <script src="{prefix}assets/interactions.js?v=18" defer></script>
</head>
<body>

  <nav class="inner-nav" role="navigation" aria-label="主导航">
    <div class="inner-nav__inner">
      <div class="inner-nav__group">
        <a href="{prefix}index.html" class="inner-nav__link">Home</a>
        <a href="{prefix}articles.html" class="inner-nav__link inner-nav__link--active" aria-current="page">Articles</a>
      </div>
      <a href="{prefix}index.html" class="inner-nav__brand" aria-label="Dawn Vision 首页">
        Dawn Vision
        <small>Daily Briefing</small>
      </a>
      <div class="inner-nav__group">
        <a href="{prefix}cao.html" class="inner-nav__link">Cao</a>
        <a href="{prefix}about.html" class="inner-nav__link">About</a>
      </div>
    </div>
  </nav>

  <main role="main">
    <div class="container">
{issue_filter_html}
    </div>

  <!-- Cao! 槽点区前置到封面文章上方 -->
  <div class="cao-section">
    {BG_BLOBS}
    <div class="cao-section__inner">
      <h2 class="cao-section__title">Cao! <span>槽点!</span></h2>
      <a href="{cao_url}" class="cao-featured" itemscope itemtype="https://schema.org/NewsArticle">
        <h3 class="cao-section__article-title" itemprop="headline">{cao["title"]}</h3>
        <p class="cao-section__article-deck" itemprop="description">{cao["deck"]}</p>
        <span class="cao-section__article-meta">{cao["read_time"]} <span class="arrow">→</span></span>
      </a>
      <div class="cao-section__more">
        <a href="{cao_list_url}" class="cao-more-link">View All Cao! →</a>
      </div>
    </div>
  </div>

    <div class="container">
    <section style="margin-bottom: clamp(48px, 6vw, 72px); margin-top: clamp(48px, 6vw, 72px);">
      <h2 class="section-label">Focus <span>焦点</span></h2>
      <a href="{cover_url}" class="cover-story-link" itemscope itemtype="https://schema.org/NewsArticle">
        <h3 class="cover-story-title" itemprop="headline">{cover["title"]}</h3>
        <p class="cover-story-deck" itemprop="description">{cover["deck"]}</p>
        <meta itemprop="datePublished" content="{date}">
        <span class="cover-story-byline">Dawn Vision · {cover["read_time"]} <span style="color: var(--klein); margin-left: 6px;">→</span></span>
      </a>
    </section>

    <section style="margin-bottom: clamp(48px, 6vw, 72px);">
      <h2 class="section-label">Brief <span>资讯</span></h2>
      <div class="article-grid">
{chr(10).join(brief_cards)}
      </div>
    </section>

{pagination_html}
    </div>
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


def build_index_page(issue, cover):
    """更新首页teaser区块，与现有home__teaser结构一致"""
    date = issue["date"]
    date_display = issue["date_display"]

    index_path = SITE_ROOT / "index.html"
    content = index_path.read_text(encoding="utf-8")

    # 替换home__teaser整个article块
    new_teaser = f'''    <article class="home__teaser" itemscope itemtype="https://schema.org/NewsArticle">
      <div class="home__teaser-label">Focus · 焦点</div>
      <h2 class="home__teaser-title" itemprop="headline">{cover["title_short"] if "title_short" in cover else cover["title"].split("：")[0] if "：" in cover["title"] else cover["title"]}</h2>
      <p class="home__teaser-deck" itemprop="description">{cover["deck"][:100]}</p>
      <meta itemprop="datePublished" content="{date}">
      <meta itemprop="author" content="Dawn Vision 编辑部">
      <meta itemprop="publisher" content="Dawn Vision">
      <a href="articles.html" class="btn-more" itemprop="url">Read More <span class="arrow">→</span></a>
    </article>'''

    # 用正则替换整个teaser块
    content = re.sub(
        r'    <article class="home__teaser"[^>]*>.*?</article>',
        new_teaser,
        content,
        flags=re.DOTALL
    )

    # 更新foundingDate保持不变（已经是2026-06-24）
    return content


def build_cao_page(issue, cao):
    """更新cao.html，在cao-listing顶部插入新条目（幂等：已存在则跳过）"""
    date = issue["date"]
    date_display = issue["date_display"]
    issue_num = issue["number"]

    cao_path = SITE_ROOT / "cao.html"
    content = cao_path.read_text(encoding="utf-8")

    cao_url = f"cao/{date}-{cao['slug']}.html"

    # 幂等检查：如果该cao条目URL已存在，先移除旧条目再重新插入（支持内容更新）
    # 匹配整个 <a>...</a> 块
    existing_pattern = re.compile(
        r'\s*<a href="' + re.escape(cao_url) + r'" class="cao-list__item".*?</a>\s*',
        re.DOTALL
    )
    content = existing_pattern.sub('\n', content)

    new_item = f'''      <a href="{cao_url}" class="cao-list__item" itemscope itemtype="https://schema.org/NewsArticle">
        <div class="cao-list__meta">Issue {issue_num} · {date_display}</div>
        <h3 class="cao-list__title" itemprop="headline">{cao["title"]}</h3>
        <p class="cao-list__excerpt" itemprop="description">{cao["deck"]}</p>
      </a>'''

    # 在 <div class="cao-listing"> 后第一个<a>标签前插入
    content = re.sub(
        r'(<div class="cao-listing">\s*)',
        r'\1' + '\n' + new_item + '\n',
        content,
        count=1
    )

    # 更新numberOfItems
    existing_count = len(re.findall(r'class="cao-list__item"', content))
    content = re.sub(
        r'"numberOfItems"\s*:\s*\d+',
        f'"numberOfItems": {existing_count}',
        content
    )

    return content


def update_sitemap(issue, cover, briefs, cao):
    """更新sitemap.xml，添加新一期所有URL（幂等：已存在则替换）"""
    date = issue["date"]
    issue_num = issue["number"]
    sitemap_path = SITE_ROOT / "sitemap.xml"
    content = sitemap_path.read_text(encoding="utf-8")

    new_urls = []

    # 封面
    new_urls.append(f'''  <url>
    <loc>{BASE_URL}/articles/{date}-{cover["slug"]}.html</loc>
    <lastmod>{date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>''')

    # Briefs
    for b in briefs:
        new_urls.append(f'''  <url>
    <loc>{BASE_URL}/articles/{date}-{b["slug"]}.html</loc>
    <lastmod>{date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>''')

    # Cao
    new_urls.append(f'''  <url>
    <loc>{BASE_URL}/cao/{date}-{cao["slug"]}.html</loc>
    <lastmod>{date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>''')

    # Issue archive page
    new_urls.append(f'''  <url>
    <loc>{BASE_URL}/issues/issue-{issue_num}.html</loc>
    <lastmod>{date}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.6</priority>
  </url>''')

    # 更新主页和列表页的lastmod
    content = re.sub(
        r'(<loc>https://qlhouseclub\.github\.io/DawnVision/</loc>\s*<lastmod>)[^<]+',
        r'\g<1>' + date,
        content
    )
    content = re.sub(
        r'(<loc>https://qlhouseclub\.github\.io/DawnVision/articles\.html</loc>\s*<lastmod>)[^<]+',
        r'\g<1>' + date,
        content
    )
    content = re.sub(
        r'(<loc>https://qlhouseclub\.github\.io/DawnVision/cao\.html</loc>\s*<lastmod>)[^<]+',
        r'\g<1>' + date,
        content
    )

    # 幂等：先移除已存在的同期Issue URL块（防止重复插入）
    issue_block_pattern = re.compile(
        r'\n*  <!-- Issue ' + str(issue_num) + r' Articles.*?-->\s*(?:<url>.*?</url>\s*)+',
        re.DOTALL
    )
    content = issue_block_pattern.sub('\n', content)

    # 在</urlset>前插入新URL块（按时间倒序，插在第一个<!-- Issue注释前面）
    date_display_formatted = issue["date_display"]
    insert_block = f"\n  <!-- Issue {issue_num} Articles ({date_display_formatted}) -->\n" + "\n".join(new_urls) + "\n"

    # 找到第一个Issue注释的位置，在其前面插入
    first_issue_comment = re.search(r'\n  <!-- Issue \d+ Articles', content)
    if first_issue_comment:
        pos = first_issue_comment.start()
        content = content[:pos] + insert_block + content[pos:]
    else:
        content = content.replace("</urlset>", insert_block + "</urlset>")

    return content


def date_display_to_hyphen(display):
    """2026.06.26 -> 2026-06-26"""
    return display.replace(".", "-")


def get_prev_issue_date(date_str):
    """简单获取前一天日期（仅支持工作日连续发布场景）"""
    from datetime import timedelta
    d = datetime.strptime(date_str, "%Y-%m-%d")
    prev = d - timedelta(days=1)
    return prev.strftime("%Y-%m-%d")


# ============================================================
# 主流程
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Dawn Vision 流程一：处理+简报+本地预览")
    parser.add_argument("input", help="本期内容JSON文件路径")
    parser.add_argument("--no-preview", action="store_true", help="不启动本地预览服务器")
    parser.add_argument("--dry-run", action="store_true", help="仅生成不写入文件")
    args = parser.parse_args()

    # 读取输入JSON
    input_path = Path(args.input)
    if not input_path.is_absolute():
        input_path = Path.cwd() / input_path
    if not input_path.exists():
        print(f"❌ 输入文件不存在: {input_path}")
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        issue_data = json.load(f)

    issue = issue_data["issue"]
    cover = issue_data["cover"]
    briefs = issue_data["briefs"]
    cao = issue_data["cao"]

    date = issue["date"]
    issue_num = issue["number"]

    print(f"{'='*60}")
    print(f"Dawn Vision 流程一：处理 + 简报")
    print(f"{'='*60}")
    print(f"期数: Issue {issue_num}")
    print(f"日期: {issue['date_display']}")
    print(f"封面: {cover['title']}")
    print(f"Brief数: {len(briefs)}")
    print(f"Cao: {cao['title']}")
    print()

    # 验证文章数量
    if len(briefs) != 6:
        print(f"⚠️  警告：Brief文章数量为{len(briefs)}，期望为6篇")
    total = 1 + len(briefs) + 1
    if total != 8:
        print(f"⚠️  警告：总文章数为{total}，期望为8篇")

    # 注入关联slug
    cover_slug = cover["slug"]
    cao_slug = cao["slug"]
    cover["cao_slug"] = cao_slug
    for i, b in enumerate(briefs):
        b["cover_slug"] = cover_slug
        b["cao_slug"] = cao_slug

    generated_files = []

    # 1. 生成封面文章
    print("📝 生成封面文章...")
    cover_filename, cover_html = build_cover_article(cover, issue)
    if not args.dry_run:
        (ARTICLES_DIR / cover_filename).write_text(cover_html, encoding="utf-8")
    generated_files.append(f"articles/{cover_filename}")
    print(f"   ✅ articles/{cover_filename}")

    # 2. 生成Brief文章
    print("📝 生成Brief文章...")
    for i, b in enumerate(briefs):
        prev_slug = briefs[i-1]["slug"] if i > 0 else cover_slug
        next_slug = briefs[i+1]["slug"] if i < len(briefs) - 1 else None
        brief_filename, brief_html = build_brief_article(
            b, issue, i, len(briefs), prev_slug, next_slug or ""
        )
        if not args.dry_run:
            (ARTICLES_DIR / brief_filename).write_text(brief_html, encoding="utf-8")
        generated_files.append(f"articles/{brief_filename}")
        print(f"   ✅ articles/{brief_filename}")

    # 3. 生成Cao文章
    print("📝 生成Cao文章...")
    last_brief_slug = briefs[-1]["slug"] if briefs else cover_slug
    cao_filename, cao_html = build_cao_article(cao, issue, last_brief_slug)
    if not args.dry_run:
        (CAO_DIR / cao_filename).write_text(cao_html, encoding="utf-8")
    generated_files.append(f"cao/{cao_filename}")
    print(f"   ✅ cao/{cao_filename}")

    # 4. 生成最新文章列表页 articles.html
    print("📋 更新文章列表页...")
    articles_html = build_listing_page(issue, cover, briefs, cao, is_latest=True)
    if not args.dry_run:
        (SITE_ROOT / "articles.html").write_text(articles_html, encoding="utf-8")
    generated_files.append("articles.html")
    print(f"   ✅ articles.html")

    # 5. 生成Issue归档页
    print("📋 创建Issue归档页...")
    issue_filename = f"issue-{issue_num}.html"
    issue_html = build_listing_page(issue, cover, briefs, cao, is_latest=False)
    if not args.dry_run:
        (ISSUES_DIR / issue_filename).write_text(issue_html, encoding="utf-8")
    generated_files.append(f"issues/{issue_filename}")
    print(f"   ✅ issues/{issue_filename}")

    # 6. 更新首页
    print("🏠 更新首页...")
    index_html = build_index_page(issue, cover)
    if not args.dry_run:
        (SITE_ROOT / "index.html").write_text(index_html, encoding="utf-8")
    generated_files.append("index.html")
    print(f"   ✅ index.html")

    # 7. 更新Cao列表页
    print("😂 更新Cao列表页...")
    cao_page_html = build_cao_page(issue, cao)
    if not args.dry_run:
        (SITE_ROOT / "cao.html").write_text(cao_page_html, encoding="utf-8")
    generated_files.append("cao.html")
    print(f"   ✅ cao.html")

    # 8. 更新sitemap
    print("🗺️  更新Sitemap...")
    sitemap_html = update_sitemap(issue, cover, briefs, cao)
    if not args.dry_run:
        (SITE_ROOT / "sitemap.xml").write_text(sitemap_html, encoding="utf-8")
    generated_files.append("sitemap.xml")
    print(f"   ✅ sitemap.xml")

    # 9. 构建知识网络关联（仅生成Obsidian MD文件，不发布到网站）
    print("🔗 构建Obsidian知识网络...")
    if not args.dry_run:
        try:
            import subprocess
            result = subprocess.run(
                [sys.executable, str(TOOLS_DIR / "knowledge.py"), "--rebuild"],
                capture_output=True, text=True, cwd=str(SITE_ROOT)
            )
            if result.returncode == 0:
                print(f"   ✅ Obsidian知识网络已更新")
            else:
                print(f"   ⚠️  知识网络构建异常: {result.stderr[:200]}")
        except Exception as e:
            print(f"   ⚠️  知识网络构建失败: {e}")

    print()
    print(f"{'='*60}")
    print(f"✅ 处理完成！共生成 {len(generated_files)} 个文件")
    print(f"{'='*60}")

    # 本地预览
    if not args.no_preview and not args.dry_run:
        print()
        print("🚀 启动本地预览服务器...")
        print(f"   地址: http://localhost:{LOCAL_PORT}/")
        print(f"   按 Ctrl+C 停止服务器")
        print()
        try:
            os.chdir(SITE_ROOT)
            subprocess.run([sys.executable, "-m", "http.server", str(LOCAL_PORT)], check=True)
        except KeyboardInterrupt:
            print("\n🛑 预览服务器已停止")


if __name__ == "__main__":
    main()
