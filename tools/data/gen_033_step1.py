import json
from pathlib import Path

data = {
  "issue": {
    "number": "033",
    "date": "2026-08-12",
    "date_display": "2026.08.12"
  },
  "cover": {},
  "briefs": [],
  "cao": {}
}

with open(r"d:\WorkSpace\DawnVision\tools\data\issue-033.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Created empty structure")
