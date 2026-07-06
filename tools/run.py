#!/usr/bin/env python3
"""
Dawn Vision 全流程一键脚本（Astro 新版）
========================================
用法:
  python tools/run.py collect   # 第一步：采集信号
  python tools/run.py draft     # 第二步：选题+生成Prompt
  python tools/run.py process   # 第三步：校验JSON→入库→Astro构建
  python tools/run.py verify    # 第四步：验证（构建+预览检查）
  python tools/run.py publish   # 第五步：验证+发布
  python tools/run.py full      # 全流程：采集→选题→（AI二创）→构建→验证
  python tools/run.py status    # 查看当前工作流状态

完整日报工作流:
  14:00  采集资讯 (collect)
  14:10  选题+生成Prompt (draft)
  14:15  AI主编基于采集信号和写作规范进行二创，输出JSON
  15:00  JSON保存到 tools/data/issue-NNN.json
  15:30  校验入库+构建 (process)
  16:00  浏览器预览检查，必要时微调
  16:20  验证+发布 (publish)
"""

import sys
import os
import json
import shutil
import subprocess
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = SITE_ROOT / "tools"
DATA_DIR = TOOLS_DIR / "data"
WEB_DIR = SITE_ROOT / "web"
WEB_CONTENT_DIR = WEB_DIR / "src" / "content" / "issues"
DIST_DIR = WEB_DIR / "dist"
CST = timezone(timedelta(hours=8))


def run_step(cmd, cwd=None, check=True, capture=False):
    """运行子进程命令"""
    print(f"\n{'─'*60}")
    print(f"▶ {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    print(f"{'─'*60}")
    if capture:
        result = subprocess.run(cmd, cwd=cwd or SITE_ROOT, shell=isinstance(cmd, str),
                                capture_output=True, text=True)
    else:
        result = subprocess.run(cmd, cwd=cwd or SITE_ROOT, shell=isinstance(cmd, str))
    if check and result.returncode != 0:
        print(f"\n❌ 步骤失败 (exit code {result.returncode})")
        if capture and result.stderr:
            print(result.stderr[-500:])
        sys.exit(1)
    return result


def next_issue_number():
    """从 web/src/content/issues/ 推断下一期号"""
    # 优先看web内容目录
    if WEB_CONTENT_DIR.exists():
        existing = list(WEB_CONTENT_DIR.glob("*.json"))
        if existing:
            nums = [int(f.stem) for f in existing if f.stem.isdigit()]
            if nums:
                return f"{max(nums)+1:03d}"
    # 回退到tools/data目录
    if DATA_DIR.exists():
        existing = list(DATA_DIR.glob("issue-*.json"))
        if existing:
            nums = [int(f.stem.split("-")[1]) for f in existing]
            if nums:
                return f"{max(nums)+1:03d}"
    return "001"


def next_workday():
    """获取下一个工作日日期"""
    now = datetime.now(CST)
    d = now
    if d.hour >= 16 and d.weekday() < 5:
        d += timedelta(days=1)
    while d.weekday() >= 5:
        d += timedelta(days=1)
    return d.strftime("%Y-%m-%d"), d.strftime("%Y.%m.%d")


def cmd_collect(args):
    """采集"""
    date = args.date or next_workday()[0]
    cmd = [sys.executable, str(TOOLS_DIR / "collect.py"), "--date", date]
    if args.add:
        cmd.append("--add")
    run_step(cmd)


def cmd_draft(args):
    """选题+生成Prompt"""
    issue_num = args.issue_num or next_issue_number()
    date = args.date or next_workday()[0]
    signals_file = DATA_DIR / f"raw-signals-{date}.json"

    if not signals_file.exists():
        print(f"⚠️  未找到信号文件 {signals_file}")
        print(f"   先运行: python tools/run.py collect")
        sys.exit(1)

    cmd = [sys.executable, str(TOOLS_DIR / "draft.py"), str(signals_file),
           "--issue-num", issue_num, "--date", date]
    if args.auto:
        cmd.append("--auto")
    run_step(cmd)


def cmd_process(args):
    """校验JSON→入库→Astro构建"""
    issue_num = args.issue_num or next_issue_number()
    # 如果指定了期号，校验该期；否则校验最新一期
    if args.issue_num:
        issue_file = DATA_DIR / f"issue-{issue_num}.json"
    else:
        # 找最新的issue文件
        candidates = sorted(DATA_DIR.glob("issue-*.json"))
        if not candidates:
            print(f"❌ 未找到任何issue文件在 {DATA_DIR}")
            sys.exit(1)
        issue_file = candidates[-1]
        issue_num = issue_file.stem.split("-")[1]

    if not issue_file.exists():
        print(f"❌ 未找到issue文件: {issue_file}")
        print(f"   请先完成draft步骤，并将AI二创输出保存到该文件")
        sys.exit(1)

    # 检查是否还是模板
    with open(issue_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    if data.get("cover", {}).get("_placeholder"):
        print(f"⚠️  {issue_file} 还是选题模板，不是完整内容")
        print(f"   请将AI二创生成的完整JSON替换此文件后再运行")
        sys.exit(1)

    # Step 1: 校验并复制到web内容目录
    print(f"\n{'='*60}")
    print(f"Step 1/3: 校验内容并入库 → web/src/content/issues/")
    print(f"{'='*60}")
    cmd = [sys.executable, str(TOOLS_DIR / "validate.py"), str(issue_file)]
    if args.no_copy:
        cmd.append("--no-copy")
    run_step(cmd)

    # Step 2: 构建Astro站点
    built = False
    if not args.no_build:
        print(f"\n{'='*60}")
        print(f"Step 2/3: 构建Astro站点")
        print(f"{'='*60}")
        run_step(["npm", "run", "build"], cwd=str(WEB_DIR))
        built = True

    # Step 3: 预览提示
    if built:
        print(f"\n{'='*60}")
        print(f"Step 3/3: 本地预览")
        print(f"{'='*60}")
        print(f"  预览命令: cd web && npm run dev")
        print(f"  预览地址: http://localhost:4321/")


def cmd_verify(args):
    """验证"""
    # 1. 校验所有JSON
    print(f"\n{'='*60}")
    print("验证1/2: 校验所有issue JSON")
    print(f"{'='*60}")
    run_step([sys.executable, str(TOOLS_DIR / "validate.py"), "--all", "--no-copy"], check=False)

    # 2. 检查构建产物
    print(f"\n{'='*60}")
    print("验证2/2: 检查Astro构建产物")
    print(f"{'='*60}")
    required = ["index.html", "articles/index.html", "about/index.html", "cao/index.html"]
    all_ok = True
    for f in required:
        fp = DIST_DIR / f
        if fp.exists():
            print(f"  ✓ {f}")
        else:
            print(f"  ✗ 缺少: {f}")
            all_ok = False

    article_count = len(list((DIST_DIR / "articles").glob("*/index.html"))) if (DIST_DIR / "articles").exists() else 0
    print(f"  ✓ 文章页面: {article_count} 篇")

    if all_ok:
        print(f"\n✅ 验证通过")
    else:
        print(f"\n⚠️ 部分文件缺失，建议重新构建: cd web && npm run build")


def cmd_publish(args):
    """验证+构建+发布"""
    # 1. 校验
    print(f"\n{'='*60}")
    print("Step 1/4: 校验内容")
    print(f"{'='*60}")
    result = run_step([sys.executable, str(TOOLS_DIR / "validate.py"), "--all", "--no-copy"], check=False)
    if result.returncode != 0:
        print("\n❌ 内容校验未通过，请修复后再发布")
        sys.exit(1)

    # 2. 构建
    print(f"\n{'='*60}")
    print("Step 2/4: 构建Astro站点")
    print(f"{'='*60}")
    run_step(["npm", "run", "build"], cwd=str(WEB_DIR))

    # 3. 同步构建产物到根目录（用于GitHub Pages部署）
    print(f"\n{'='*60}")
    print("Step 3/4: 同步构建产物")
    print(f"{'='*60}")
    sync_dist_to_root()

    # 4. Git提交推送
    if not args.dry_run:
        print(f"\n{'='*60}")
        print("Step 4/4: Git提交并推送")
        print(f"{'='*60}")
        os.chdir(SITE_ROOT)
        commit_msg = args.message or f"feat: Issue {next_issue_number_n()} ({datetime.now(CST).strftime('%Y-%m-%d')}) 内容发布"
        subprocess.run(["git", "add", "-A"], check=False)
        result = subprocess.run(["git", "commit", "-m", commit_msg], capture_output=True, text=True)
        if result.returncode != 0 and "nothing to commit" not in result.stdout:
            print(f"  Commit失败: {result.stderr}")
        else:
            print(f"  ✓ {commit_msg}")
            push_result = subprocess.run(["git", "push"], capture_output=True, text=True)
            if push_result.returncode == 0:
                print(f"  ✓ 推送成功")
                print(f"\n✅ 发布完成！")
            else:
                print(f"  ⚠️ 推送失败: {push_result.stderr}")
                print(f"  请手动执行: git push")
    else:
        print(f"\n🏃 Dry run模式，跳过Git推送")


def next_issue_number_n():
    """获取当前最新期号（非下一期）"""
    if WEB_CONTENT_DIR.exists():
        existing = list(WEB_CONTENT_DIR.glob("*.json"))
        if existing:
            nums = [int(f.stem) for f in existing if f.stem.isdigit()]
            if nums:
                return f"{max(nums):03d}"
    return "???"


def sync_dist_to_root():
    """将web/dist构建产物同步到项目根目录（用于GitHub Pages部署）"""
    import shutil
    if not DIST_DIR.exists():
        print(f"  ⚠️ 构建产物目录不存在: {DIST_DIR}")
        return

    # 跳过Astro构建出错时残留的服务端产物目录（非静态文件）
    skip_dirs = {"chunks", "pages"}

    # 清理根目录下旧的构建产物（目录和文件）
    # 这些都是 web/dist 构建输出的内容，同步前需要清理旧版本，避免哈希文件残留
    old_items = [
        # 目录
        "_astro", "articles", "about", "cao", "issues", "assets",
        "images", "pagefind", "502", "503", "504", "chunks", "pages",
        # 文件
        "index.html", "articles.html", "cao.html", "about.html",
        "404.html", "500.html", "502.html", "503.html", "504.html",
        "sitemap.xml", "rss.xml", "robots.txt", "favicon.svg",
        "CNAME", "version.json", ".nojekyll",
    ]
    for item in old_items:
        p = SITE_ROOT / item
        if p.is_dir():
            shutil.rmtree(p, ignore_errors=True)
            print(f"  清理旧目录: {item}/")
        elif p.is_file():
            p.unlink()
            print(f"  清理旧文件: {item}")

    # 先清理dist中的非静态产物目录
    for skip_name in skip_dirs:
        skip_path = DIST_DIR / skip_name
        if skip_path.exists():
            shutil.rmtree(skip_path, ignore_errors=True)
            print(f"  跳过构建残留: {skip_name}/")

    # 复制dist内容到根目录
    for item in DIST_DIR.iterdir():
        if item.name in skip_dirs:
            continue
        dest = SITE_ROOT / item.name
        try:
            if item.is_dir():
                shutil.copytree(item, dest, dirs_exist_ok=True)
            else:
                shutil.copy2(item, dest)
        except Exception as e:
            print(f"  ⚠️ 复制 {item.name} 时出错: {e}")
    print(f"  ✓ 已同步 web/dist/ → 根目录")


def cmd_knowledge(args):
    """构建/重建知识网络"""
    cmd = [sys.executable, str(TOOLS_DIR / "knowledge.py"), "--rebuild"]
    run_step(cmd, check=False)


def cmd_status(args):
    """查看工作流状态"""
    issue_num = next_issue_number()
    date = next_workday()[0]
    current_num = next_issue_number_n()

    print(f"{'='*60}")
    print(f"Dawn Vision 工作流状态 (Astro)")
    print(f"{'='*60}")
    print(f"当前最新期: Issue {current_num}")
    print(f"下一期号: Issue {issue_num}")
    print(f"目标日期: {date}")
    print(f"内容目录: web/src/content/issues/")
    print()

    steps = [
        ("采集 (collect)", DATA_DIR / f"raw-signals-{date}.json"),
        ("选题Prompt (draft)", DATA_DIR / f"prompt-{issue_num}-{date}.md"),
        ("内容JSON (issue)", DATA_DIR / f"issue-{issue_num}.json"),
    ]

    all_done = True
    for name, path in steps:
        exists = path.exists()
        is_complete = False
        if exists and path.suffix == ".json":
            try:
                d = json.loads(path.read_text(encoding="utf-8"))
                is_complete = not any(
                    v.get("_placeholder") for v in [d.get("cover", {})]
                    if isinstance(v, dict)
                )
            except Exception:
                pass
        elif exists:
            is_complete = True

        status = "✅ 完成" if is_complete else ("📝 存在(模板)" if exists else "⬜ 待完成")
        print(f"  {name:22s} {status}  {path.name}")
        if not is_complete:
            all_done = False

    # 检查Web内容入库
    web_file = WEB_CONTENT_DIR / f"{issue_num}.json"
    web_ok = web_file.exists()
    # 检查已入库的最新期
    latest_web = WEB_CONTENT_DIR.glob("*.json") if WEB_CONTENT_DIR.exists() else []
    latest_count = len(list(latest_web))
    print(f"  {'Web入库 (validate)':22s} {'✅ 完成' if web_ok else '⬜ 待完成'}  (已入库 {latest_count} 期)")
    if not web_ok and all_done:
        all_done = False

    # 检查构建产物
    build_ok = (DIST_DIR / "index.html").exists()
    article_count = len(list((DIST_DIR / "articles").glob("*/index.html"))) if (DIST_DIR / "articles").exists() else 0
    print(f"  {'Astro构建 (build)':22s} {'✅ 完成' if build_ok else '⬜ 待完成'}  ({article_count} 篇文章)")
    if not build_ok and web_ok:
        all_done = False

    print()
    if all_done:
        print("  🎯 可以发布: python tools/run.py publish")
    else:
        print("  → 按步骤执行: collect → draft → (AI二创) → process → publish")


def cmd_full(args):
    """全流程引导"""
    print(f"{'='*60}")
    print(f"Dawn Vision 全流程启动 (Astro版)")
    print(f"{'='*60}")

    date = args.date or next_workday()[0]
    signals_file = DATA_DIR / f"raw-signals-{date}.json"

    # Step 1: Collect
    if not signals_file.exists() or args.force:
        cmd_collect(args)
    else:
        print(f"\n✅ 信号文件已存在: {signals_file.name}")

    # Step 2: Draft
    issue_num = args.issue_num or next_issue_number()
    issue_file = DATA_DIR / f"issue-{issue_num}.json"
    if not issue_file.exists() or args.force:
        cmd_draft(args)
    else:
        print(f"\n✅ Issue文件已存在: {issue_file.name}")

    # 提示AI二创
    print(f"\n{'='*60}")
    print("⏸️  AI二创阶段")
    print(f"{'='*60}")
    print(f"  作为AI主编，你需要：")
    print(f"  1. 读取 {DATA_DIR / f'prompt-{issue_num}-{date}.md'} 中的选题和Prompt")
    print(f"  2. 读取 {DATA_DIR / f'raw-signals-{date}.json'} 中的采集信号")
    print(f"  3. 读取 tools/config/writing-style.md 了解写作规范")
    print(f"  4. 读取 tools/config/sources.json 了解信源配置")
    print(f"  5. 读取 web/src/content/issues/007.json 作为格式参考")
    print(f"  6. 进行二创写作，输出完整JSON保存到 {issue_file}")
    print()
    input("  二创完成后按 Enter 继续构建...")

    # Step 3: Process (validate + build)
    cmd_process(args)

    # Step 4: Preview
    print(f"\n{'='*60}")
    print("👀 预览检查")
    print(f"{'='*60}")
    print(f"  启动预览: cd web && npm run dev")
    print(f"  访问: http://localhost:4321/")
    print(f"  检查: 首页、文章列表、每篇文章、Cao、About")
    input("  预览确认无误后按 Enter 继续发布...")

    # Step 5: Publish
    cmd_publish(args)


def main():
    parser = argparse.ArgumentParser(description="Dawn Vision 全流程工作流 (Astro版)",
                                     formatter_class=argparse.RawDescriptionHelpFormatter,
                                     epilog=__doc__)
    sub = parser.add_subparsers(dest="command", help="子命令")

    # collect
    p_collect = sub.add_parser("collect", help="采集资讯信号")
    p_collect.add_argument("--date", help="日期 YYYY-MM-DD")
    p_collect.add_argument("--add", action="store_true", help="手动添加信号")

    # draft
    p_draft = sub.add_parser("draft", help="选题+生成LLM Prompt")
    p_draft.add_argument("--date", help="日期 YYYY-MM-DD")
    p_draft.add_argument("--issue-num", help="期号")
    p_draft.add_argument("--auto", action="store_true", help="自动选题")

    # process
    p_process = sub.add_parser("process", help="校验JSON→入库→Astro构建")
    p_process.add_argument("--issue-num", help="期号")
    p_process.add_argument("--no-build", action="store_true", help="跳过Astro构建")
    p_process.add_argument("--no-copy", action="store_true", help="不复制到web内容目录")

    # verify
    sub.add_parser("verify", help="验证完整性")

    # knowledge
    sub.add_parser("knowledge", help="构建知识网络关联")

    # publish
    p_publish = sub.add_parser("publish", help="验证+构建+发布")
    p_publish.add_argument("-m", "--message", help="commit message")
    p_publish.add_argument("--dry-run", action="store_true", help="空跑不推送")

    # status
    sub.add_parser("status", help="查看工作流状态")

    # full
    p_full = sub.add_parser("full", help="全流程引导")
    p_full.add_argument("--date", help="日期 YYYY-MM-DD")
    p_full.add_argument("--issue-num", help="期号")
    p_full.add_argument("--auto", action="store_true", help="自动选题")
    p_full.add_argument("--force", action="store_true", help="强制重新采集/选题")
    p_full.add_argument("--no-preview", action="store_true", help="不启动预览")
    p_full.add_argument("--dry-run", action="store_true", help="空跑不推送")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    commands = {
        "collect": cmd_collect,
        "draft": cmd_draft,
        "process": cmd_process,
        "verify": cmd_verify,
        "knowledge": cmd_knowledge,
        "publish": cmd_publish,
        "status": cmd_status,
        "full": cmd_full,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
