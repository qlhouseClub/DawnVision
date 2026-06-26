#!/usr/bin/env python3
"""
Dawn Vision 全流程一键脚本
===========================
用法:
  python tools/run.py collect   # 第一步：采集信号
  python tools/run.py draft     # 第二步：选题+生成Prompt
  python tools/run.py process   # 第三步：生成HTML+本地预览
  python tools/run.py verify    # 第四步：验证（不发布）
  python tools/run.py publish   # 第五步：验证+发布
  python tools/run.py full      # 全流程：采集→选题→（等待LLM）→处理→验证
  python tools/run.py status    # 查看当前工作流状态

完整日报工作流:
  14:00  python tools/run.py collect    # 采集资讯
  14:10  python tools/run.py draft      # 选题，生成Prompt
  14:15  复制Prompt到Claude/ChatGPT，获取JSON
  15:00  将JSON保存到 tools/data/issue-NNN.json
  15:30  python tools/run.py process    # 生成HTML，本地预览
  16:00  浏览器预览检查，必要时微调
  16:30  python tools/run.py publish    # 验证并发布
"""

import sys
import os
import json
import subprocess
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = SITE_ROOT / "tools"
DATA_DIR = TOOLS_DIR / "data"
CST = timezone(timedelta(hours=8))


def run_step(cmd, cwd=None, check=True):
    """运行子进程命令"""
    print(f"\n{'─'*60}")
    print(f"▶ {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    print(f"{'─'*60}")
    result = subprocess.run(cmd, cwd=cwd or SITE_ROOT, shell=isinstance(cmd, str))
    if check and result.returncode != 0:
        print(f"\n❌ 步骤失败 (exit code {result.returncode})")
        sys.exit(1)
    return result


def next_issue_number():
    issues_dir = SITE_ROOT / "issues"
    existing = list(issues_dir.glob("issue-*.html"))
    if not existing:
        return "001"
    nums = [int(f.stem.split("-")[1]) for f in existing]
    return f"{max(nums)+1:03d}"


def next_workday():
    now = datetime.now(CST)
    d = now
    # 如果现在是工作日16:30之后，目标是下一个工作日
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
    """生成HTML+预览"""
    issue_num = args.issue_num or next_issue_number()
    issue_file = DATA_DIR / f"issue-{issue_num}.json"

    if not issue_file.exists():
        print(f"❌ 未找到issue文件: {issue_file}")
        print(f"   请先完成draft步骤，并将LLM输出保存到该文件")
        sys.exit(1)

    # 检查是否还是模板
    with open(issue_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    if data.get("cover", {}).get("_placeholder"):
        print(f"⚠️  {issue_file} 还是选题模板，不是完整内容")
        print(f"   请将LLM生成的完整JSON替换此文件后再运行")
        sys.exit(1)

    cmd = [sys.executable, str(TOOLS_DIR / "process.py"), str(issue_file)]
    if args.no_preview:
        cmd.append("--no-preview")
    run_step(cmd)


def cmd_verify(args):
    """仅验证"""
    cmd = [sys.executable, str(TOOLS_DIR / "publish.py"), "--verify-only"]
    run_step(cmd)


def cmd_publish(args):
    """验证+发布"""
    # 先验证
    result = run_step([sys.executable, str(TOOLS_DIR / "publish.py"), "--verify-only"], check=False)
    if result.returncode != 0:
        print("\n❌ 验证未通过，请修复后再发布")
        sys.exit(1)

    cmd = [sys.executable, str(TOOLS_DIR / "publish.py")]
    if args.message:
        cmd.extend(["--message", args.message])
    if args.dry_run:
        cmd.append("--dry-run")
    run_step(cmd)


def cmd_status(args):
    """查看工作流状态"""
    issue_num = next_issue_number()
    date = next_workday()[0]

    print(f"{'='*60}")
    print(f"Dawn Vision 工作流状态")
    print(f"{'='*60}")
    print(f"下一期: Issue {issue_num}")
    print(f"目标日期: {date}")
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
                data = json.loads(path.read_text(encoding="utf-8"))
                is_complete = not any(
                    v.get("_placeholder") for v in [data.get("cover", {})]
                    if isinstance(v, dict)
                )
            except Exception:
                pass
        elif exists:
            is_complete = True

        status = "✅ 完成" if is_complete else ("📝 存在(模板)" if exists else "⬜ 待完成")
        print(f"  {name:20s} {status}  {path.name}")
        if not is_complete:
            all_done = False

    # 检查HTML是否已生成
    articles_dir = SITE_ROOT / "articles"
    cao_dir = SITE_ROOT / "cao"
    articles_today = list(articles_dir.glob(f"{date}-*.html"))
    cao_today = list(cao_dir.glob(f"{date}-*.html"))
    html_ok = len(articles_today) == 7 and len(cao_today) == 1  # 1 cover + 6 briefs + 1 cao
    print(f"  {'HTML生成 (process)':20s} {'✅ 完成' if html_ok else '⬜ 待完成'}  ({len(articles_today)} articles + {len(cao_today)} cao)")
    if not html_ok:
        all_done = False

    print()
    if all_done:
        print("  🎯 可以发布: python tools/run.py publish")
    else:
        print("  → 按步骤执行: collect → draft → (LLM处理) → process → publish")


def cmd_full(args):
    """全流程引导"""
    print(f"{'='*60}")
    print(f"Dawn Vision 全流程启动")
    print(f"{'='*60}")

    # Step 1: Collect
    date = args.date or next_workday()[0]
    signals_file = DATA_DIR / f"raw-signals-{date}.json"
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

    # 等待用户完成LLM处理
    print(f"\n{'='*60}")
    print("⏸️  暂停：请完成以下操作后继续")
    print(f"{'='*60}")
    print(f"  1. 打开 {DATA_DIR / f'prompt-{issue_num}-{date}.md'}")
    print(f"  2. 复制内容到Claude/ChatGPT")
    print(f"  3. 将返回的JSON保存到 {issue_file}")
    print()
    input("  完成后按 Enter 继续...")

    # Step 3: Process
    cmd_process(args)

    # Step 4: Verify
    print(f"\n{'='*60}")
    print("👀 请在浏览器中预览检查 (http://localhost:8080)")
    print(f"{'='*60}")
    input("  预览确认无误后按 Enter 继续验证...")
    cmd_verify(args)

    # Step 5: Publish?
    print()
    do_pub = input("  验证通过，是否发布？(y/N): ").strip().lower()
    if do_pub == "y":
        cmd_publish(args)
    else:
        print("  未发布。如需发布请运行: python tools/run.py publish")


def main():
    parser = argparse.ArgumentParser(description="Dawn Vision 全流程工作流",
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
    p_process = sub.add_parser("process", help="生成HTML+本地预览")
    p_process.add_argument("--issue-num", help="期号")
    p_process.add_argument("--no-preview", action="store_true", help="不启动预览")

    # verify
    sub.add_parser("verify", help="验证完整性")

    # publish
    p_publish = sub.add_parser("publish", help="验证+发布")
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

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    commands = {
        "collect": cmd_collect,
        "draft": cmd_draft,
        "process": cmd_process,
        "verify": cmd_verify,
        "publish": cmd_publish,
        "status": cmd_status,
        "full": cmd_full,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
