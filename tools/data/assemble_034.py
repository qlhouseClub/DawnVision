import json
from pathlib import Path

data_dir = Path(r"d:\WorkSpace\DawnVision\tools\data")

# Load all parts
cover = json.load(open(data_dir / "issue_034_cover.json", encoding="utf-8"))
briefs_data = []
for i in range(1, 7):
    f = data_dir / f"b{i}_*.json"
    import glob
    files = list(glob.glob(str(data_dir / f"b{i}_*.json")))
    if files:
        briefs_data.append(json.load(open(files[0], encoding="utf-8")))

cao = json.load(open(data_dir / "cao_gym.json", encoding="utf-8"))
cover_body = open(data_dir / "cover_body_html.txt", encoding="utf-8").read()
cover_body_en = open(data_dir / "cover_body_html_en.txt", encoding="utf-8").read()

# Add body HTML to cover
cover["body_html"] = cover_body
cover["body_html_en"] = cover_body_en

# Build full issue
issue = {
    "issue": {
        "number": "034",
        "date": "2026-08-12",
        "date_display": "2026.08.12"
    },
    "cover": cover,
    "briefs": briefs_data,
    "cao": cao
}

output_path = data_dir / "issue-034.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(issue, f, ensure_ascii=False, indent=2)

print(f"Issue 034 assembled: {output_path}")
print(f"Cover: {cover['title'][:30]}...")
print(f"Briefs: {len(briefs_data)}")
for b in briefs_data:
    print(f"  - {b['title'][:30]}...")
print(f"Cao: {cao['title'][:30]}...")
