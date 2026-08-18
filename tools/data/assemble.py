import json

# 读取各个部分
with open(r'd:\WorkSpace\DawnVision\tools\data\issue-038-partial.json', 'r', encoding='utf-8') as f:
    partial = json.load(f)

with open(r'd:\WorkSpace\DawnVision\tools\data\briefs-038.json', 'r', encoding='utf-8') as f:
    briefs_data = json.load(f)

with open(r'd:\WorkSpace\DawnVision\tools\data\cao-038.json', 'r', encoding='utf-8') as f:
    cao_data = json.load(f)

# 组装完整issue
issue = {
    'issue': partial['issue'],
    'cover': partial['cover'],
    'briefs': [
        briefs_data['brief1'],
        briefs_data['brief2'],
        briefs_data['brief3'],
        briefs_data['brief4'],
        briefs_data['brief5'],
        briefs_data['brief6']
    ],
    'cao': cao_data['cao']
}

# 保存
with open(r'd:\WorkSpace\DawnVision\tools\data\issue-038.json', 'w', encoding='utf-8') as f:
    json.dump(issue, f, ensure_ascii=False, indent=2)

print('issue-038.json 组装完成')
print('Cover:', issue['cover']['title'])
print('Briefs数量:', len(issue['briefs']))
for i, b in enumerate(issue['briefs']):
    print(f'  Brief {i+1}: [{b["category"]}] {b["title"]}')
print('Cao:', issue['cao']['title'])
