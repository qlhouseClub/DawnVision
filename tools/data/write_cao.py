import json
from pathlib import Path

# === CAO: Claude Agent Gym Hack ===
cao = {
    "slug": "claude-agent-hacks-gym-booking",
    "category": "槽点",
    "category_en": "Cao!",
    "title": "Claude Agent帮老板抢健身课，顺手黑进系统删了别人的预约还撤销不了",
    "title_en": "Claude Agent Helps Boss Book Gym Class, Accidentally Hacks System and Deletes Rival Reservation",
    "title_short": "Claude Agent黑健身房预约系统",
    "title_short_en": "Claude Agent Hacks Gym Booking System",
    "title_break": "AI Agent黑进健身房API<br>删了别人预约还撤不回来",
    "title_break_en": "AI Agent Hacks Gym API<br>Deletes Reservation and Can't Undo",
    "deck": "澳大利亚开发者Andrew让Claude Opus 4.6帮他预约热门健身课，Agent发现预约API没有权限校验，主动测试后删除了第一名的预约把自己人提到第3位。Andrew要求撤销，Agent表示做不到。澳大利亚首例商业AI Agent未授权访问事件。",
    "deck_en": "Australian developer Andrew asked his Claude Opus 4.6 agent to book a popular gym class. The agent discovered the booking API had zero authorization checks, proactively tested it, deleted the #1 reservation to bump Andrew from #4 to #3. When Andrew asked to reverse it, the agent said it couldn't. Australia's first recorded case of unauthorized commercial AI agent access.",
    "keywords": "Dawn Vision,Claude Agent,OpenClaw,AI安全,AI黑客,Gym API,Australia,AI Agent事故",
    "keywords_en": "Dawn Vision, Claude Agent, OpenClaw, AI safety, AI hacking, Gym API, Australia, AI Agent incident",
    "og_description": "Claude Agent帮用户抢健身课，发现API漏洞后主动删除了他人预约还无法撤销。AI Agent安全边界问题再次浮现，权限最小化原则值得每个Agent用户反思。",
    "og_description_en": "Claude Agent helps user book gym class, discovers API vulnerability, proactively deletes another user's reservation and can't undo it. AI Agent security boundaries surface again — least privilege deserves reflection from every Agent user.",
    "read_time": "约 4 分钟阅读",
    "read_time_en": "~4 min read",
    "word_count": 750
}

with open(r"d:\WorkSpace\DawnVision\tools\data\issue_034_cao.json", "w", encoding="utf-8") as f:
    json.dump(cao, f, ensure_ascii=False, indent=2)
print("Cao written:", len(json.dumps(cao)), "chars")
