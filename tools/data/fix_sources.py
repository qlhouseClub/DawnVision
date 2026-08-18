import json

with open(r'd:\WorkSpace\DawnVision\tools\data\issue-038.json', 'r', encoding='utf-8') as f:
    issue = json.load(f)

# 修复所有sources的label -> text
def fix_sources(sources):
    for s in sources:
        if 'label' in s:
            s['text'] = s.pop('label')
    return sources

issue['cover']['sources'] = fix_sources(issue['cover']['sources'])
for b in issue['briefs']:
    b['sources'] = fix_sources(b['sources'])
issue['cao']['sources'] = fix_sources(issue['cao']['sources'])

# 添加date_display
issue['issue']['date_display'] = '2026年8月19日'

with open(r'd:\WorkSpace\DawnVision\tools\data\issue-038.json', 'w', encoding='utf-8') as f:
    json.dump(issue, f, ensure_ascii=False, indent=2)

print('修复完成')
