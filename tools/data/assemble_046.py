#!/usr/bin/env python3
"""Assemble issue-046.json from staged partial files (cover + briefs x3 + cao)."""
import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent
OUT = DATA_DIR / "issue-046.json"

# Field sets derived from issue-045.json (golden reference)
COVER_KEYS = {
    "slug", "title", "title_en", "title_short", "title_short_en",
    "title_break", "title_break_en", "deck", "deck_en",
    "keywords", "keywords_en", "og_description", "og_description_en",
    "twitter_description", "twitter_description_en",
    "read_time", "read_time_en", "word_count",
    "cognitive_notes", "cognitive_notes_en",
    "source_summary", "source_summary_en",
    "body_html", "body_html_en", "pull_quote", "sources",
}
BRIEF_KEYS = {
    "slug", "category", "category_en",
    "title", "title_en", "title_break", "title_break_en", "deck", "deck_en",
    "keywords", "keywords_en", "og_description", "og_description_en",
    "read_time", "read_time_en", "word_count",
    "cognitive_notes", "cognitive_notes_en",
    "source_summary", "source_summary_en",
    "body_html", "body_html_en", "pull_quote", "sources",
}
CAO_KEYS = {
    "slug", "category", "category_en",
    "title", "title_en", "title_short", "title_short_en",
    "title_break", "title_break_en", "deck", "deck_en",
    "keywords", "keywords_en", "og_description", "og_description_en",
    "twitter_description", "twitter_description_en",
    "read_time", "read_time_en", "word_count",
    "cognitive_notes", "cognitive_notes_en",
    "source_summary", "source_summary_en",
    "body_html", "body_html_en",
    "footnote_tip", "footnote_tip_en", "sources",
}

EXPECTED_BRIEF_SLUGS = [
    "four-major-closed-models-rare-simultaneous-downtime",
    "nvidia-officially-confirms-12-9b-hugging-face-acquisition",
    "meta-muse-spark-contributor-pricing-discount-for-data",
    "armature-17k-sessions-how-agents-really-pick-tools",
    "trump-administration-openai-copyright-brief",
    "inceptio-1b-km-freight-physical-ai",
]

errors = []


def check_keys(obj, required, label):
    missing = required - set(obj.keys())
    if missing:
        errors.append(f"{label}: missing keys {sorted(missing)}")


def check_nonempty(obj, keys, label):
    for k in keys:
        v = obj.get(k)
        if v is None or (isinstance(v, str) and not v.strip()):
            errors.append(f"{label}: field '{k}' is empty")


def check_no_placeholder(obj, label):
    raw = json.dumps(obj, ensure_ascii=False)
    if "_placeholder" in raw:
        errors.append(f"{label}: contains _placeholder")


def check_sources(obj, label):
    srcs = obj.get("sources")
    if not isinstance(srcs, list) or len(srcs) < 1:
        errors.append(f"{label}: sources missing/empty")
        return
    for i, s in enumerate(srcs):
        if not (isinstance(s, dict) and s.get("text") and s.get("url")):
            errors.append(f"{label}: sources[{i}] lacks text/url")


def main():
    partial = json.loads((DATA_DIR / "issue-046-partial.json").read_text(encoding="utf-8"))
    briefs = []
    for part in ("issue-046-briefs-part1.json", "issue-046-briefs-part2.json", "issue-046-briefs-part3.json"):
        briefs.extend(json.loads((DATA_DIR / part).read_text(encoding="utf-8")))
    cao = json.loads((DATA_DIR / "issue-046-cao.json").read_text(encoding="utf-8"))

    issue = partial.get("issue", {})
    check_keys(issue, {"number", "date", "date_display"}, "issue")
    if issue.get("number") != "046":
        errors.append(f"issue.number = {issue.get('number')!r}, expected '046'")

    cover = partial.get("cover", {})
    check_keys(cover, COVER_KEYS, "cover")
    check_nonempty(cover, COVER_KEYS - {"pull_quote"}, "cover")
    check_no_placeholder(cover, "cover")
    check_sources(cover, "cover")

    if len(briefs) != 6:
        errors.append(f"briefs count = {len(briefs)}, expected 6")
    for i, b in enumerate(briefs):
        label = f"brief[{i}] {b.get('slug', '?')[:40]}"
        check_keys(b, BRIEF_KEYS, label)
        check_nonempty(b, BRIEF_KEYS - {"pull_quote"}, label)
        check_no_placeholder(b, label)
        check_sources(b, label)
        if b.get("slug") != EXPECTED_BRIEF_SLUGS[i] if i < len(EXPECTED_BRIEF_SLUGS) else False:
            errors.append(f"brief[{i}] slug mismatch: {b.get('slug')!r} != {EXPECTED_BRIEF_SLUGS[i]!r}")

    label = f"cao {cao.get('slug', '?')[:40]}"
    check_keys(cao, CAO_KEYS, label)
    check_nonempty(cao, CAO_KEYS, label)
    check_no_placeholder(cao, label)
    check_sources(cao, label)
    if "pull_quote" in cao:
        errors.append("cao: unexpected pull_quote (045 reference has none)")

    if errors:
        print("ASSEMBLE FAILED:")
        for e in errors:
            print("  -", e)
        sys.exit(1)

    result = {"issue": issue, "cover": cover, "briefs": briefs, "cao": cao}
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    total = cover.get("word_count", 0) + sum(b.get("word_count", 0) for b in briefs) + cao.get("word_count", 0)
    print(f"OK -> {OUT}")
    print(f"  cover: {cover.get('slug')} ({cover.get('word_count')} chars)")
    for b in briefs:
        print(f"  brief: {b.get('slug')} ({b.get('word_count')} chars)")
    print(f"  cao:   {cao.get('slug')} ({cao.get('word_count')} chars)")
    print(f"  total word_count: {total}")


if __name__ == "__main__":
    main()
