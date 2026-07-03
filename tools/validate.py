#!/usr/bin/env python3
"""
validate.py — Dawn Vision 内容校验工具

替代旧版 process.py，仅做 JSON schema 校验和数据完整性检查，不再生成 HTML。
校验通过后自动将 issue JSON 复制到 web/src/content/issues/ 目录。

用法:
    python tools/validate.py <issue.json>          # 校验并复制
    python tools/validate.py <issue.json> --no-copy # 仅校验不复制
    python tools/validate.py --all                 # 校验 tools/data/ 下所有 issue-*.json
"""

import json
import re
import shutil
import sys
from pathlib import Path
from datetime import datetime

# ── 路径配置 ──
TOOLS_DIR = Path(__file__).parent
PROJECT_ROOT = TOOLS_DIR.parent
DATA_DIR = TOOLS_DIR / "data"
WEB_CONTENT_DIR = PROJECT_ROOT / "web" / "src" / "content" / "issues"

# ── 校验规则 ──
SLUG_PATTERN = re.compile(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$')
REQUIRED_ARTICLE_FIELDS = ['slug', 'title', 'deck', 'body_html', 'read_time']
OPTIONAL_ARTICLE_FIELDS = ['title_break', 'title_short', 'keywords', 'og_description',
                           'twitter_description', 'word_count', 'sources', 'pull_quote',
                           'cognitive_notes', 'source_summary']
BRIEF_REQUIRED = ['category']
BRIEF_OPTIONAL = ['category_en']
CAO_OPTIONAL = ['footnote_tip']

# 字数范围
WORD_COUNT_RANGES = {
    'cover': (1500, 3000),
    'brief': (500, 1200),
    'cao': (400, 1200),
}

# Brief 数量
EXPECTED_BRIEF_COUNT = 6


def log_ok(msg):
    print(f"  ✓ {msg}")


def log_err(msg):
    print(f"  ✗ {msg}")


def log_warn(msg):
    print(f"  ⚠ {msg}")


def validate_slug(slug, context):
    """校验 slug 格式"""
    if not slug:
        return False, "slug 不能为空"
    if not SLUG_PATTERN.match(slug):
        return False, f"slug 格式不正确: '{slug}' (应只含小写字母、数字、连字符)"
    if len(slug) > 80:
        return False, f"slug 过长: {len(slug)} 字符 (最大80)"
    return True, None


def validate_article(article, article_type, errors, warnings):
    """校验单篇文章"""
    prefix = f"[{article_type}]"

    # 必填字段
    for field in REQUIRED_ARTICLE_FIELDS:
        if field not in article or not article[field]:
            errors.append(f"{prefix} 缺少必填字段: {field}")

    # slug 校验
    slug = article.get('slug', '')
    ok, err = validate_slug(slug, article_type)
    if not ok:
        errors.append(f"{prefix} {err}")

    # title 长度
    title = article.get('title', '')
    if title:
        if len(title) < 5:
            warnings.append(f"{prefix} 标题过短 ({len(title)}字): {title}")
        if len(title) > 100:
            warnings.append(f"{prefix} 标题过长 ({len(title)}字)")

    # deck 长度
    deck = article.get('deck', '')
    if deck:
        if len(deck) < 20:
            warnings.append(f"{prefix} deck 过短 ({len(deck)}字)")
        if len(deck) > 200:
            warnings.append(f"{prefix} deck 过长 ({len(deck)}字)")

    # body_html 检查
    body = article.get('body_html', '')
    if body:
        if '<p>' not in body:
            warnings.append(f"{prefix} body_html 中没有 <p> 标签")
        if 'TODO' in body or 'FIXME' in body or '占位' in body:
            warnings.append(f"{prefix} body_html 中包含 TODO/FIXME/占位 文本")
        # 字数检查
        word_count = article.get('word_count', 0)
        actual_chars = len(re.sub(r'<[^>]+>', '', body))
        if word_count:
            min_w, max_w = WORD_COUNT_RANGES.get(article_type, (0, 99999))
            if word_count < min_w:
                warnings.append(f"{prefix} word_count ({word_count}) 低于建议最小值 ({min_w})")
            if word_count > max_w:
                warnings.append(f"{prefix} word_count ({word_count}) 超过建议最大值 ({max_w})")

    # sources 校验
    sources = article.get('sources', [])
    if sources:
        for i, src in enumerate(sources):
            if not src.get('text'):
                errors.append(f"{prefix} sources[{i}] 缺少 text")

    # pull_quote 校验
    pq = article.get('pull_quote')
    if pq is not None:
        if not pq.get('text'):
            errors.append(f"{prefix} pull_quote 缺少 text")

    # Brief 特有字段
    if article_type == 'brief':
        for field in BRIEF_REQUIRED:
            if field not in article or not article[field]:
                errors.append(f"{prefix} Brief 缺少必填字段: {field}")

    # read_time 格式
    rt = article.get('read_time', '')
    if rt and '分钟阅读' not in rt and 'min' not in rt.lower():
        warnings.append(f"{prefix} read_time 格式异常: '{rt}'")

    return slug


def validate_issue(data, filepath):
    """校验完整的 issue JSON"""
    errors = []
    warnings = []
    slugs = set()

    print(f"\n{'='*60}")
    print(f"校验: {filepath.name}")
    print(f"{'='*60}")

    # issue 元信息
    issue = data.get('issue', {})
    if not issue.get('number'):
        errors.append("issue.number 缺失")
    else:
        log_ok(f"期号: Issue {issue['number']}")
    if not issue.get('date'):
        errors.append("issue.date 缺失")
    if not issue.get('date_display'):
        warnings.append("issue.date_display 缺失，将使用 date 字段")

    # Cover 文章
    cover = data.get('cover')
    if not cover:
        errors.append("缺少 cover 封面文章")
    else:
        slug = validate_article(cover, 'cover', errors, warnings)
        if slug:
            slugs.add(slug)
            log_ok(f"Cover: {cover.get('title', '?')[:40]}...")

    # Briefs
    briefs = data.get('briefs', [])
    if len(briefs) != EXPECTED_BRIEF_COUNT:
        warnings.append(f"Brief 数量为 {len(briefs)}，建议 {EXPECTED_BRIEF_COUNT} 篇")
    for i, brief in enumerate(briefs):
        slug = validate_article(brief, 'brief', errors, warnings)
        if slug:
            if slug in slugs:
                errors.append(f"slug 重复: '{slug}' (出现在多个文章中)")
            slugs.add(slug)
        cat = brief.get('category', '?')
        cat_en = brief.get('category_en', '')
        log_ok(f"Brief {i+1}: [{cat}{' · '+cat_en if cat_en else ''}] {brief.get('title', '?')[:35]}...")

    # Cao（可选）
    cao = data.get('cao')
    if cao:
        slug = validate_article(cao, 'cao', errors, warnings)
        if slug:
            if slug in slugs:
                errors.append(f"slug 重复: '{slug}'")
            slugs.add(slug)
            log_ok(f"Cao: {cao.get('title', '?')[:40]}...")
    else:
        log_warn("本期无 Cao 专栏（可选）")

    # 检查现有文件中的 slug 冲突
    if WEB_CONTENT_DIR.exists():
        issue_num = issue.get('number', '')
        for existing in WEB_CONTENT_DIR.glob("*.json"):
            if existing.name == f"{issue_num}.json":
                continue
            try:
                existing_data = json.loads(existing.read_text(encoding='utf-8'))
                for article in get_all_articles(existing_data):
                    s = article.get('slug', '')
                    if s and s in slugs:
                        errors.append(f"slug 与已存在的 {existing.name} 冲突: '{s}'")
            except (json.JSONDecodeError, Exception):
                pass

    # 输出结果
    print(f"\n{'─'*60}")
    if errors:
        print(f"发现 {len(errors)} 个错误:")
        for e in errors:
            log_err(e)
    if warnings:
        print(f"发现 {len(warnings)} 个警告:")
        for w in warnings:
            log_warn(w)
    if not errors and not warnings:
        log_ok("所有检查通过！")
    elif not errors:
        print(f"\n校验通过（{len(warnings)} 个警告）")
    else:
        print(f"\n校验失败（{len(errors)} 个错误，{len(warnings)} 个警告）")

    return len(errors) == 0


def get_all_articles(data):
    """从 issue 数据中提取所有文章对象"""
    articles = []
    if data.get('cover'):
        articles.append(data['cover'])
    for b in data.get('briefs', []):
        articles.append(b)
    if data.get('cao'):
        articles.append(data['cao'])
    return articles


def copy_to_web_content(filepath, data):
    """将校验通过的 JSON 复制到 web 内容目录"""
    issue_num = data.get('issue', {}).get('number', '')
    if not issue_num:
        log_err("无法复制：缺少 issue.number")
        return False

    WEB_CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    dest = WEB_CONTENT_DIR / f"{issue_num}.json"

    shutil.copy2(filepath, dest)
    log_ok(f"已复制到: web/src/content/issues/{dest.name}")
    return True


def validate_file(filepath, copy=True):
    """校验单个文件"""
    filepath = Path(filepath)
    if not filepath.exists():
        print(f"文件不存在: {filepath}")
        return False

    try:
        data = json.loads(filepath.read_text(encoding='utf-8'))
    except json.JSONDecodeError as e:
        print(f"JSON 解析失败: {filepath.name} — {e}")
        return False

    ok = validate_issue(data, filepath)

    if ok and copy:
        copy_to_web_content(filepath, data)

    return ok


def validate_all(copy=True):
    """校验 data/ 目录下所有 issue 文件"""
    files = sorted(DATA_DIR.glob("issue-*.json"))
    if not files:
        print(f"未找到 issue 文件: {DATA_DIR}/issue-*.json")
        return False

    all_ok = True
    for f in files:
        ok = validate_file(f, copy=copy)
        if not ok:
            all_ok = False

    return all_ok


def main():
    args = sys.argv[1:]
    no_copy = '--no-copy' in args
    do_all = '--all' in args

    # 清理标志参数
    args = [a for a in args if a not in ('--no-copy', '--all')]

    if do_all:
        ok = validate_all(copy=not no_copy)
    elif args:
        ok = validate_file(args[0], copy=not no_copy)
    else:
        print(__doc__)
        print(f"数据目录: {DATA_DIR}")
        print(f"Web内容目录: {WEB_CONTENT_DIR}")
        sys.exit(1)

    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
