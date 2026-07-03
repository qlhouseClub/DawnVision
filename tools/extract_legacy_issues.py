#!/usr/bin/env python3
"""
HTML → JSON 提取脚本
从 issue-001~003 的HTML文件中反向提取内容，生成符合Content Collection schema的JSON文件。

使用方法：
    cd tools
    python extract_legacy_issues.py
"""

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString

# 路径配置
PROJECT_ROOT = Path(__file__).parent.parent
ISSUES_DIR = PROJECT_ROOT / "issues"
ARTICLES_DIR = PROJECT_ROOT / "articles"
CAO_DIR = PROJECT_ROOT / "cao"
OUTPUT_DIR = PROJECT_ROOT / "web" / "src" / "content" / "issues"


def slug_from_filename(filename: str) -> str:
    """从 YYYY-MM-DD-slug.html 提取 slug"""
    name = filename.replace(".html", "")
    return name[11:]  # 去掉 "YYYY-MM-DD-"


def extract_pull_quote(content_div) -> dict | None:
    """从正文div中提取pull quote"""
    pq = content_div.select_one("div.pull-quote")
    if not pq:
        return None
    # 获取引用文本（去掉attr span）
    attr_span = pq.select_one("span.pull-quote__attr")
    attr_text = attr_span.get_text(strip=True) if attr_span else ""
    # 提取纯引用文本
    pq_copy = BeautifulSoup(str(pq), "html.parser")
    if attr_span:
        pq_copy.find("span", class_="pull-quote__attr").decompose()
    quote_text = pq_copy.get_text(strip=True).strip('"').strip('"').strip()
    return {"text": quote_text, "attr": attr_text}


def extract_sources(sources_div) -> list[dict]:
    """从article-sources提取来源列表"""
    sources = []
    if not sources_div:
        return sources
    ul = sources_div.select_one("ul.article-sources__list")
    if not ul:
        return sources
    for li in ul.find_all("li", recursive=False):
        a = li.find("a", href=True)
        if a:
            url = a.get("href", "")
            if url in ("", "#"):
                url = ""
            text = a.get_text(strip=True)
        else:
            span = li.find("span")
            text = span.get_text(strip=True) if span else li.get_text(strip=True)
            url = ""
        if text:
            sources.append({"text": text, "url": url})
    return sources


def extract_body_html(content_div) -> str:
    """提取正文HTML，保留内部标签结构"""
    if not content_div:
        return ""
    # 移除末尾的"明天见"段落和上下篇导航
    html = str(content_div.decode_contents())
    # 清理开头/结尾空白
    lines = html.split("\n")
    cleaned = []
    for line in lines:
        cleaned.append(line.rstrip())
    result = "\n".join(cleaned).strip()
    return result


def extract_footnote(footnote_div) -> tuple[str, str]:
    """从footnote提取cognitive_notes和source_summary"""
    if not footnote_div:
        return "", ""
    paragraphs = footnote_div.find_all("p")
    source_summary = ""
    cognitive_notes = ""
    for p in paragraphs:
        text = p.get_text(strip=True)
        if "基于 Dawn Vision 认知引擎" in text or "素材来源" in text:
            source_summary = text
        elif "相关入库笔记" in text:
            spans = p.find_all("span")
            notes = [s.get_text(strip=True) for s in spans]
            cognitive_notes = " · ".join(notes)
    return cognitive_notes, source_summary


def parse_article_html(filepath: Path) -> dict:
    """解析单篇文章HTML，返回结构化数据"""
    html = filepath.read_text(encoding="utf-8-sig")
    soup = BeautifulSoup(html, "html.parser")

    # 从LD+JSON获取结构化数据
    ld_json = None
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            if isinstance(data, dict) and data.get("@type") in ("NewsArticle", "BlogPosting"):
                ld_json = data
                break
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and item.get("@type") in ("NewsArticle", "BlogPosting"):
                        ld_json = item
                        break
                if ld_json:
                    break
        except (json.JSONDecodeError, TypeError):
            continue

    # 标题
    title_el = soup.select_one("h1.article-page__hero-title")
    title = ""
    title_break = ""
    if title_el:
        title = title_el.get_text(strip=True).replace("\n", " ")
        title_break = title_el.decode_contents().strip()

    # Deck
    deck_el = soup.select_one("p.article-page__hero-deck")
    deck = deck_el.get_text(strip=True) if deck_el else ""

    # Keywords
    keywords_meta = soup.find("meta", attrs={"name": "keywords"})
    keywords = keywords_meta.get("content", "") if keywords_meta else ""
    if ld_json and ld_json.get("keywords"):
        kw = ld_json["keywords"]
        if isinstance(kw, list):
            keywords = ", ".join(kw)
        elif isinstance(kw, str):
            keywords = kw

    # OG description
    og_desc_meta = soup.find("meta", attrs={"property": "og:description"})
    og_description = og_desc_meta.get("content", "") if og_desc_meta else ""

    # Twitter description
    tw_desc_meta = soup.find("meta", attrs={"name": "twitter:description"})
    twitter_description = tw_desc_meta.get("content", "") if tw_desc_meta else None

    # Read time
    read_time = "约 5 分钟阅读"
    meta_rows = soup.select("div.article-page__meta-row")
    for row in meta_rows:
        text = row.get_text()
        m = re.search(r"约\s*(\d+)\s*分钟阅读", text)
        if m:
            read_time = f"约 {m.group(1)} 分钟阅读"
            break

    # Word count
    word_count = ld_json.get("wordCount", 800) if ld_json else 800
    if not isinstance(word_count, int):
        try:
            word_count = int(word_count)
        except (ValueError, TypeError):
            word_count = 800

    # Category (from meta tags)
    category = ""
    category_en = ""
    meta_tags = soup.select("span.article-page__meta-tag")
    tags = [t.get_text(strip=True) for t in meta_tags]
    # 尝试从标签中提取中英文分类
    for tag in tags:
        if tag not in ("Cover Story", "封面故事", "Deep Dive", "深度", "Cao槽点", "Cao!"):
            if not category:
                category = tag
            elif not category_en and re.match(r'^[A-Za-z]', tag):
                category_en = tag

    # 正文
    content_div = soup.select_one("div.article-page__content")
    body_html = extract_body_html(content_div)

    # Pull quote
    pull_quote = extract_pull_quote(content_div) if content_div else None

    # Sources
    sources_div = soup.select_one("div.article-sources")
    sources = extract_sources(sources_div)

    # Footnote
    footnote_div = soup.select_one("div.article-page__footnote")
    cognitive_notes, source_summary = extract_footnote(footnote_div)

    slug = slug_from_filename(filepath.name)

    result = {
        "slug": slug,
        "title": title,
        "title_break": title_break if title_break and "<br" in title_break else None,
        "deck": deck,
        "keywords": keywords,
        "og_description": og_description or deck[:200],
        "read_time": read_time,
        "word_count": word_count,
        "sources": sources,
        "body_html": body_html,
        "pull_quote": pull_quote,
        "cognitive_notes": cognitive_notes,
        "source_summary": source_summary,
    }

    if twitter_description:
        result["twitter_description"] = twitter_description

    return result, category, category_en


def parse_issue_page(issue_num: str) -> dict:
    """解析issue页面，获取期数元信息和文章列表"""
    filepath = ISSUES_DIR / f"issue-{issue_num}.html"
    html = filepath.read_text(encoding="utf-8-sig")
    soup = BeautifulSoup(html, "html.parser")

    # 从issue-filter的data属性获取期数信息
    filter_div = soup.select_one("div.issue-filter")
    if filter_div:
        data_issues = json.loads(filter_div.get("data-issues", "[]"))
        data_current = filter_div.get("data-current", issue_num)
        for iss in data_issues:
            if iss.get("num") == data_current:
                issue_meta = {
                    "number": iss["num"],
                    "date": iss["date"],
                    "date_display": iss["date_display"],
                }
                break
        else:
            issue_meta = {"number": issue_num, "date": "", "date_display": ""}
    else:
        issue_meta = {"number": issue_num, "date": "", "date_display": ""}

    # 提取封面文章链接
    cover_link = soup.select_one("a.cover-story-link")
    cover_slug = ""
    if cover_link:
        href = cover_link.get("href", "")
        cover_slug = slug_from_filename(Path(href).name)

    # 提取brief文章列表
    briefs = []
    for card in soup.select("a.article-card"):
        href = card.get("href", "")
        slug = slug_from_filename(Path(href).name)
        tag_el = card.select_one("span.article-card__tag")
        cat_text = tag_el.get_text(strip=True) if tag_el else ""
        # 尝试分离中英文分类
        parts = re.split(r'\s*·\s*', cat_text)
        category = parts[0] if parts else ""
        category_en = parts[-1] if len(parts) > 1 and re.match(r'^[A-Za-z]', parts[-1]) else ""
        briefs.append({"slug": slug, "category": category, "category_en": category_en})

    # 提取cao文章
    cao_slug = None
    cao_link = soup.select_one("a.cao-featured")
    if cao_link:
        href = cao_link.get("href", "")
        cao_slug = slug_from_filename(Path(href).name)
    else:
        # issue-001~003没有cao-section，通过日期匹配
        if issue_meta["date"]:
            date_prefix = issue_meta["date"]
            for cao_file in CAO_DIR.glob(f"{date_prefix}-*.html"):
                cao_slug = slug_from_filename(cao_file.name)
                break

    return {
        "issue": issue_meta,
        "cover_slug": cover_slug,
        "briefs_meta": briefs,
        "cao_slug": cao_slug,
    }


def build_issue_json(issue_num: str) -> dict:
    """构建完整的issue JSON"""
    print(f"  解析 issue-{issue_num}.html ...")
    issue_info = parse_issue_page(issue_num)
    issue_date = issue_info["issue"]["date"]

    # 解析封面文章
    print(f"    封面: {issue_info['cover_slug']}")
    cover_file = None
    for f in ARTICLES_DIR.glob(f"{issue_date}-{issue_info['cover_slug']}.html"):
        cover_file = f
        break
    if not cover_file:
        # 尝试glob匹配
        matches = list(ARTICLES_DIR.glob(f"*-{issue_info['cover_slug']}.html"))
        cover_file = matches[0] if matches else None
    if cover_file:
        cover_data, _, _ = parse_article_html(cover_file)
    else:
        print(f"    [警告] 未找到封面文章文件: {issue_info['cover_slug']}")
        cover_data = {"slug": issue_info["cover_slug"], "title": "", "deck": "", "body_html": "", "sources": [], "word_count": 800, "read_time": "约 8 分钟阅读", "keywords": "", "og_description": "", "pull_quote": None, "cognitive_notes": "", "source_summary": ""}

    # 解析brief文章
    briefs = []
    for brief_meta in issue_info["briefs_meta"]:
        print(f"    Brief: {brief_meta['slug']}")
        brief_file = None
        matches = list(ARTICLES_DIR.glob(f"*-{brief_meta['slug']}.html"))
        brief_file = matches[0] if matches else None
        if brief_file:
            brief_data, cat, cat_en = parse_article_html(brief_file)
            brief_data["category"] = brief_meta["category"] or cat or ""
            brief_data["category_en"] = brief_meta["category_en"] or cat_en or ""
            briefs.append(brief_data)
        else:
            print(f"    [警告] 未找到brief文章文件: {brief_meta['slug']}")

    # 解析cao文章
    cao_data = None
    if issue_info["cao_slug"]:
        print(f"    Cao: {issue_info['cao_slug']}")
        cao_file = None
        matches = list(CAO_DIR.glob(f"*-{issue_info['cao_slug']}.html"))
        cao_file = matches[0] if matches else None
        if cao_file:
            cao_data, _, _ = parse_article_html(cao_file)
        else:
            print(f"    [警告] 未找到cao文章文件: {issue_info['cao_slug']}")

    result = {
        "issue": issue_info["issue"],
        "cover": cover_data,
        "briefs": briefs,
        "cao": cao_data,
    }
    return result


def main():
    print("=" * 60)
    print("Dawn Vision: Legacy Issues HTML → JSON 提取工具")
    print("=" * 60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for num in ["001", "002", "003"]:
        print(f"\n处理 Issue {num} ...")
        issue_json = build_issue_json(num)
        output_file = OUTPUT_DIR / f"{num}.json"
        output_file.write_text(json.dumps(issue_json, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  ✓ 已写入: {output_file}")

    # 验证输出
    print("\n" + "=" * 60)
    print("验证输出文件：")
    for f in sorted(OUTPUT_DIR.glob("*.json")):
        with open(f, encoding="utf-8") as fp:
            data = json.load(fp)
        n_briefs = len(data.get("briefs", []))
        has_cao = "有" if data.get("cao") else "无"
        print(f"  {f.name}: Issue {data['issue']['number']} ({data['issue']['date_display']}) - 1 cover + {n_briefs} briefs + {has_cao} cao")

    print("\n✓ 完成！现在可以运行 astro build 验证。")


if __name__ == "__main__":
    main()
