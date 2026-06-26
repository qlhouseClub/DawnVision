#!/usr/bin/env python3
"""
Dawn Vision 采集脚本
====================
用法:
  python tools/collect.py [--date 2026-06-27] [--add] [--output signals.json]

功能:
  1. 从配置的RSS源采集AI相关资讯
  2. 按关键词过滤、去重、按优先级排序
  3. 支持手动添加信号(--add)
  4. 输出结构化的原始信号JSON，供draft.py使用

输出: tools/data/raw-signals-YYYY-MM-DD.json
"""

import json
import sys
import os
import re
import argparse
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path
from html import unescape

# ============================================================
# 配置
# ============================================================
SITE_ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = SITE_ROOT / "tools"
CONFIG_DIR = TOOLS_DIR / "config"
DATA_DIR = TOOLS_DIR / "data"
CONFIG_PATH = CONFIG_DIR / "sources.json"
CST = timezone(timedelta(hours=8))


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def strip_html(text):
    """移除HTML标签，解码实体"""
    text = unescape(text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def fetch_rss(feed_config, max_age_hours=48):
    """抓取单个RSS源，返回文章列表"""
    url = feed_config["url"]
    name = feed_config["name"]
    keywords = [k.lower() for k in feed_config.get("keywords", [])]
    exclude_kw = [k for k in load_config()["filter"]["exclude_keywords"]]

    signals = []
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "identity",
            "Connection": "close"
        })
        timeout = 25 if feed_config.get("language") == "zh" else 15
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            # 尝试解码
            charset = resp.headers.get_content_charset() or "utf-8"
            try:
                text = raw.decode(charset, errors="replace")
            except (LookupError, UnicodeDecodeError):
                text = raw.decode("utf-8", errors="replace")

        # 清理可能导致XML解析失败的内容
        text = re.sub(r'&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)', '&amp;', text)
        # 移除控制字符
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)

        try:
            root = ET.fromstring(text.encode("utf-8"))
        except ET.ParseError:
            # 尝试用lxml风格容错：包裹在rfeed标签中
            try:
                text_fixed = f"<root>{text}</root>"
                root = ET.fromstring(text_fixed.encode("utf-8"))
            except ET.ParseError:
                print(f"   ⚠️  {name}: XML解析失败，跳过")
                return signals

        items = []
        # RSS 2.0
        ns = {"atom": "http://www.w3.org/2005/Atom", "content": "http://purl.org/rss/1.0/modules/content/"}
        for item in root.iter("item"):
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            desc = item.findtext("description", "")
            pub_date = item.findtext("pubDate", "")
            content_encoded = item.findtext("content:encoded", "", ns)
            items.append({"title": title, "link": link, "desc": desc, "pub_date": pub_date, "content": content_encoded})

        # Atom
        if not items:
            ns_atom = "http://www.w3.org/2005/Atom"
            for entry in root.findall(f"{{{ns_atom}}}entry"):
                title = entry.findtext(f"{{{ns_atom}}}title", "")
                link_el = entry.find(f"{{{ns_atom}}}link")
                link = link_el.get("href", "") if link_el is not None else ""
                desc = entry.findtext(f"{{{ns_atom}}}summary", "") or entry.findtext(f"{{{ns_atom}}}content", "")
                pub_date = entry.findtext(f"{{{ns_atom}}}updated", "")
                items.append({"title": title, "link": link, "desc": desc, "pub_date": pub_date, "content": ""})

        now = datetime.now(CST)
        for it in items:
            title = strip_html(it["title"])
            desc = strip_html(it["desc"] or it["content"])
            link = it["link"].strip()
            if not title or not link:
                continue

            # 排除关键词
            title_lower = title.lower()
            desc_lower = desc.lower()
            if any(ek in title_lower or ek in desc_lower for ek in exclude_kw):
                continue

            # 关键词过滤（如果源有关键词配置，需匹配至少一个）
            if keywords:
                text_lower = title_lower + " " + desc_lower
                if not any(kw.lower() in text_lower for kw in keywords):
                    continue

            # 解析发布时间
            pub_dt = parse_date(it["pub_date"])
            if pub_dt:
                age_hours = (now - pub_dt).total_seconds() / 3600
                if age_hours > max_age_hours:
                    continue
                pub_str = pub_dt.strftime("%Y-%m-%d %H:%M")
            else:
                pub_str = ""

            signals.append({
                "source": name,
                "source_url": url,
                "title": title,
                "url": link,
                "summary": desc[:300],
                "pub_date": pub_str,
                "category_hint": feed_config.get("category", "general"),
                "priority": feed_config.get("priority", 3)
            })

    except Exception as e:
        print(f"   ⚠️  {name}: 抓取失败 - {e}")

    return signals


def parse_date(date_str):
    """尝试解析多种日期格式"""
    if not date_str:
        return None
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",      # RFC 822 (RSS)
        "%a, %d %b %Y %H:%M:%S %Z",
        "%Y-%m-%dT%H:%M:%S%z",            # ISO 8601 (Atom)
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=CST)
            return dt.astimezone(CST)
        except ValueError:
            continue
    return None


def dedup_signals(signals):
    """简单去重：标题相似度"""
    seen_titles = set()
    unique = []
    for s in signals:
        # 规范化标题用于比较
        norm = re.sub(r'[^\w\u4e00-\u9fff]', '', s["title"].lower())
        if norm in seen_titles:
            continue
        seen_titles.add(norm)
        unique.append(s)
    return unique


def score_signal(signal, config):
    """给信号打分用于排序"""
    score = 0
    score += (4 - signal["priority"]) * 10  # priority 1最高

    # 封面关键词加分
    cover_kw = config["filter"].get("cover_preference", [])
    title = signal["title"]
    for kw in cover_kw:
        if kw in title:
            score += 15
            break

    # 官方博客/AI垂直媒体加分
    cat = signal["category_hint"]
    if cat == "official_blog":
        score += 20
    elif cat == "ai_media":
        score += 10

    return score


def add_manual_signal(signals):
    """交互式添加手动信号"""
    print("\n✏️  手动添加信号（空标题结束）：")
    while True:
        title = input("  标题: ").strip()
        if not title:
            break
        url = input("  URL: ").strip()
        source = input("  来源 (如: 36氪): ").strip() or "手动添加"
        summary = input("  摘要: ").strip()
        category = input("  分类提示 (cover/brief/cao): ").strip() or "brief"

        signals.append({
            "source": source,
            "source_url": "",
            "title": title,
            "url": url,
            "summary": summary,
            "pub_date": datetime.now(CST).strftime("%Y-%m-%d %H:%M"),
            "category_hint": "manual_" + category,
            "priority": 1
        })
        print(f"   ✅ 已添加: {title[:40]}...")
    return signals


def main():
    parser = argparse.ArgumentParser(description="Dawn Vision 资讯采集")
    parser.add_argument("--date", help="目标日期 (YYYY-MM-DD)，默认今天")
    parser.add_argument("--add", action="store_true", help="手动添加信号")
    parser.add_argument("--output", help="输出文件路径")
    parser.add_argument("--max-age", type=int, default=48, help="最大文章年龄(小时)")
    parser.add_argument("--no-rss", action="store_true", help="跳过RSS采集")
    args = parser.parse_args()

    target_date = args.date or datetime.now(CST).strftime("%Y-%m-%d")
    config = load_config()

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print(f"{'='*60}")
    print(f"Dawn Vision 资讯采集")
    print(f"{'='*60}")
    print(f"目标日期: {target_date}")
    print()

    all_signals = []

    # RSS采集
    if not args.no_rss:
        feeds = config["rss_feeds"]
        print(f"📡 从 {len(feeds)} 个RSS源采集...")
        for feed in feeds:
            signals = fetch_rss(feed, max_age_hours=args.max_age)
            print(f"   {feed['name']}: {len(signals)} 条相关信号")
            all_signals.extend(signals)

    # 手动添加
    if args.add:
        all_signals = add_manual_signal(all_signals)

    # 去重
    all_signals = dedup_signals(all_signals)
    print(f"\n🔍 去重后共 {len(all_signals)} 条信号")

    # 排序
    all_signals.sort(key=lambda s: score_signal(s, config), reverse=True)

    # 分类建议
    cover_candidates = [s for s in all_signals if any(kw in s["title"] for kw in config["filter"]["cover_keywords"])]

    # 输出
    output = {
        "date": target_date,
        "collected_at": datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S"),
        "total_signals": len(all_signals),
        "cover_candidates": cover_candidates[:5],
        "signals": all_signals
    }

    if args.output:
        out_path = Path(args.output)
    else:
        out_path = DATA_DIR / f"raw-signals-{target_date}.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n📊 封面候选 ({len(cover_candidates)} 条Top5):")
    for i, s in enumerate(cover_candidates[:5], 1):
        print(f"   {i}. [{s['source']}] {s['title'][:60]}")

    print(f"\n📋 全部信号 ({len(all_signals)} 条):")
    for i, s in enumerate(all_signals[:30], 1):
        print(f"   {i:2d}. [{s['source'][:10]:10s}] {s['title'][:55]}")
    if len(all_signals) > 30:
        print(f"   ... 还有 {len(all_signals)-30} 条")

    print(f"\n💾 已保存到: {out_path}")
    print(f"   下一步: python tools/draft.py {out_path}")


if __name__ == "__main__":
    main()
