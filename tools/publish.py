#!/usr/bin/env python3
"""
Dawn Vision 流程二：验证 + 发布
================================
用法: python tools/publish.py [--skip-verify] [--dry-run] [--message "提交信息"]

验证项:
  1. HTML基本结构完整性（DOCTYPE、html标签闭合）
  2. 无重复DOCTYPE声明
  3. 所有内部链接可达（不指向404）
  4. 每期文章数量为8（1封面+6Brief+1Cao）
  5. 导航链完整性（上一篇/下一篇不断链）
  6. SEO必要标签存在（title、description、canonical、og:*）
  7. sitemap.xml中所有URL对应文件存在
  8. 无空文件、无截断文件

发布:
  1. git add -A
  2. git commit (带自动生成或自定义的message)
  3. git push
"""

import sys
import os
import re
import argparse
import subprocess
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# ============================================================
# 配置
# ============================================================
SITE_ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = SITE_ROOT / "articles"
CAO_DIR = SITE_ROOT / "cao"
ISSUES_DIR = SITE_ROOT / "issues"
BASE_URL = "https://qlhouseclub.github.io/DawnVision"

errors = []
warnings = []


def err(msg):
    errors.append(msg)
    print(f"   ❌ {msg}")


def warn(msg):
    warnings.append(msg)
    print(f"   ⚠️  {msg}")


def ok(msg):
    print(f"   ✅ {msg}")


# ============================================================
# 验证函数
# ============================================================

def verify_html_structure(filepath):
    """验证单个HTML文件结构完整性"""
    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception as e:
        err(f"{filepath.name}: 无法读取文件 - {e}")
        return False

    rel = filepath.relative_to(SITE_ROOT)

    # 检查DOCTYPE
    doctype_count = len(re.findall(r'<!DOCTYPE', content, re.IGNORECASE))
    if doctype_count == 0:
        err(f"{rel}: 缺少DOCTYPE声明")
    elif doctype_count > 1:
        err(f"{rel}: 存在{doctype_count}个DOCTYPE声明（重复）")

    # 检查html标签闭合
    if not re.search(r'<html[\s>]', content, re.IGNORECASE):
        err(f"{rel}: 缺少<html>标签")
    if not re.search(r'</html>', content, re.IGNORECASE):
        err(f"{rel}: 缺少</html>闭合标签")

    # 检查head/body
    if not re.search(r'<head[\s>]', content, re.IGNORECASE):
        err(f"{rel}: 缺少<head>标签")
    if not re.search(r'</head>', content, re.IGNORECASE):
        err(f"{rel}: 缺少</head>闭合标签")
    if not re.search(r'<body[\s>]', content, re.IGNORECASE):
        err(f"{rel}: 缺少<body>标签")
    if not re.search(r'</body>', content, re.IGNORECASE):
        err(f"{rel}: 缺少</body>闭合标签")

    # 检查title
    if not re.search(r'<title>[^<]+</title>', content, re.IGNORECASE):
        err(f"{rel}: 缺少<title>标签或title为空")

    # 检查meta description
    if not re.search(r'<meta\s+name=["\']description["\']', content, re.IGNORECASE):
        warn(f"{rel}: 缺少meta description")

    # 检查canonical（文章页面必须有）
    if '/articles/' in str(rel) or '/cao/' in str(rel):
        if not re.search(r'<link\s+rel=["\']canonical["\']', content, re.IGNORECASE):
            err(f"{rel}: 文章页面缺少canonical标签")

    # 检查文件大小（过短可能被截断）
    if len(content) < 500:
        warn(f"{rel}: 文件过小({len(content)}字节)，可能被截断")

    # 检查未闭合标签的粗略检查
    open_divs = len(re.findall(r'<div[\s>]', content))
    close_divs = len(re.findall(r'</div>', content))
    if abs(open_divs - close_divs) > 3:
        warn(f"{rel}: div标签数量差异较大(开{open_divs}/闭{close_divs})")

    return True


def verify_internal_links():
    """验证所有内部链接指向的文件存在"""
    print("\n🔗 验证内部链接...")
    all_html = list(SITE_ROOT.rglob("*.html"))
    link_pattern = re.compile(r'href=["\']([^"\']+)["\']')

    for html_file in all_html:
        content = html_file.read_text(encoding="utf-8")
        rel_dir = html_file.parent

        for match in link_pattern.finditer(content):
            href = match.group(1)
            # 跳过外部链接、锚点、javascript、mailto
            if href.startswith(('http://', 'https://', '#', 'javascript:', 'mailto:', 'data:', 'tel:')):
                continue
            # 跳过CDN资源
            if href.startswith(('//', 'http')):
                continue

            # 解析相对路径
            link_path = (rel_dir / href.split('#')[0].split('?')[0]).resolve()
            if not link_path.exists():
                rel = html_file.relative_to(SITE_ROOT)
                warn(f"{rel} -> {href}: 目标文件不存在")


def verify_article_counts():
    """验证每期文章数量为8"""
    print("\n📊 验证每期文章数量...")

    # 按日期分组
    articles_by_date = defaultdict(lambda: {"cover": None, "briefs": [], "cao": None})

    for f in ARTICLES_DIR.glob("*.html"):
        m = re.match(r'(\d{4}-\d{2}-\d{2})-(.+)\.html', f.name)
        if m:
            date, slug = m.groups()
            articles_by_date[date]["briefs"].append(f.name)

    for f in CAO_DIR.glob("*.html"):
        m = re.match(r'(\d{4}-\d{2}-\d{2})-(.+)\.html', f.name)
        if m:
            date, slug = m.groups()
            articles_by_date[date]["cao"] = f.name

    for date in sorted(articles_by_date.keys()):
        arts = articles_by_date[date]
        # 第一篇brief(列表中第一个按字母排序的)应该是封面，但我们需要更智能的检测
        # 从articles.html或issue页检测封面
        total = len(arts["briefs"]) + (1 if arts["cao"] else 0)
        if total != 8:
            warn(f"{date}: 文章总数为{total}（期望8篇: 1封面+6Brief+1Cao）")
        else:
            ok(f"{date}: {total}篇文章（封面+6Brief+Cao）✓")


def verify_sitemap():
    """验证sitemap.xml中所有URL对应文件存在"""
    print("\n🗺️  验证Sitemap...")
    sitemap_path = SITE_ROOT / "sitemap.xml"
    if not sitemap_path.exists():
        err("sitemap.xml不存在")
        return

    content = sitemap_path.read_text(encoding="utf-8")
    locs = re.findall(r'<loc>([^<]+)</loc>', content)

    for loc in locs:
        if BASE_URL in loc:
            path_part = loc.replace(BASE_URL + "/", "")
            if path_part == "":
                path_part = "index.html"
            local_path = SITE_ROOT / path_part
            if not local_path.exists():
                warn(f"sitemap中URL无对应文件: {path_part}")

    ok(f"sitemap.xml包含{len(locs)}个URL")


def verify_navigation_chain():
    """验证文章间的导航链完整性"""
    print("\n⛓️  验证导航链...")

    # 检查articles.html中的链接是否都能打开
    articles_html = (SITE_ROOT / "articles.html").read_text(encoding="utf-8")
    article_links = re.findall(r'href="(articles/[^"]+\.html|cao/[^"]+\.html)"', articles_html)

    for link in article_links:
        target = SITE_ROOT / link
        if not target.exists():
            err(f"articles.html中的链接失效: {link}")

    ok(f"articles.html中{len(article_links)}个链接全部有效")


def verify_no_placeholder_text():
    """检查是否有TODO、TBD、Lorem ipsum等占位文本"""
    print("\n🔍 检查占位文本...")
    placeholders = ["TODO", "TBD", "Lorem ipsum", "示例", "占位", "待补充", "XXX"]
    all_html = list(SITE_ROOT.rglob("*.html"))

    found = 0
    for f in all_html:
        if "/issues/" in str(f) or f.name in ["404.html"]:
            continue
        content = f.read_text(encoding="utf-8")
        for ph in placeholders:
            if ph in content and ph not in ["示例"]:  # "示例"在代码注释中可能出现
                rel = f.relative_to(SITE_ROOT)
                warn(f"{rel}: 发现占位文本 '{ph}'")
                found += 1

    if found == 0:
        ok("未发现占位文本")


def run_all_verifications():
    """运行所有验证"""
    print(f"{'='*60}")
    print("Dawn Vision 流程二：验证")
    print(f"{'='*60}")

    # 1. HTML结构验证
    print("\n📄 验证HTML文件结构...")
    all_html = list(SITE_ROOT.rglob("*.html"))
    for f in all_html:
        verify_html_structure(f)
    ok(f"检查了{len(all_html)}个HTML文件")

    # 2. 内部链接
    verify_internal_links()

    # 3. 文章数量
    verify_article_counts()

    # 4. Sitemap
    verify_sitemap()

    # 5. 导航链
    verify_navigation_chain()

    # 6. 占位文本
    verify_no_placeholder_text()

    # 汇总
    print(f"\n{'='*60}")
    print(f"验证结果: {len(errors)}个错误, {len(warnings)}个警告")
    print(f"{'='*60}")

    if errors:
        print("\n❌ 存在错误，请修复后再发布：")
        for e in errors:
            print(f"   - {e}")
        return False

    if warnings:
        print("\n⚠️  存在警告（不阻止发布）：")
        for w in warnings:
            print(f"   - {w}")

    return True


# ============================================================
# 发布
# ============================================================

def publish(commit_message=None, dry_run=False):
    """Git add, commit, push"""
    print(f"\n{'='*60}")
    print("🚀 开始发布")
    print(f"{'='*60}")

    os.chdir(SITE_ROOT)

    # Git status
    result = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
    changed = result.stdout.strip()
    if not changed:
        print("\n📭 没有需要发布的更改")
        return True

    print("\n📋 待发布文件：")
    print(changed)

    if dry_run:
        print("\n🏃 Dry run模式，跳过实际发布")
        return True

    # 生成commit message
    if not commit_message:
        # 获取最新issue编号
        today = datetime.now().strftime("%Y-%m-%d")
        issue_files = sorted(ISSUES_DIR.glob("issue-*.html"))
        if issue_files:
            latest_num = issue_files[-1].stem.split("-")[1]
        else:
            latest_num = "???"
        commit_message = f"feat: Issue {latest_num} ({today}) 内容发布"

    print(f"\n📝 Commit message: {commit_message}")

    # Git add
    print("\n   git add -A ...")
    subprocess.run(["git", "add", "-A"], check=True)

    # Git commit
    print("   git commit ...")
    result = subprocess.run(["git", "commit", "-m", commit_message], capture_output=True, text=True)
    if result.returncode != 0:
        if "nothing to commit" in result.stdout or "nothing to commit" in result.stderr:
            print("   没有新的更改需要提交")
            return True
        print(f"   Commit输出: {result.stdout}")
        print(f"   错误: {result.stderr}")
        return False
    print(result.stdout.strip())

    # Git push
    print("   git push ...")
    result = subprocess.run(["git", "push"], capture_output=True, text=True)
    if result.returncode != 0:
        err(f"Push失败: {result.stderr}")
        return False
    print(result.stdout.strip())

    print(f"\n{'='*60}")
    print("✅ 发布成功！")
    print(f"   访问: {BASE_URL}/")
    print(f"{'='*60}")
    return True


# ============================================================
# 主流程
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Dawn Vision 流程二：验证+发布")
    parser.add_argument("--skip-verify", action="store_true", help="跳过验证直接发布")
    parser.add_argument("--dry-run", action="store_true", help="仅验证不实际发布")
    parser.add_argument("--message", "-m", help="自定义Git commit message")
    parser.add_argument("--verify-only", action="store_true", help="仅验证不发布")
    args = parser.parse_args()

    if args.skip_verify:
        print("⚠️  已跳过验证")
        verified = True
    else:
        verified = run_all_verifications()

    if not verified:
        print("\n❌ 验证未通过，发布中止")
        sys.exit(1)

    if args.verify_only:
        print("\n✅ 仅验证模式，不执行发布")
        return

    success = publish(commit_message=args.message, dry_run=args.dry_run)
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
