'use strict';

const fs = require('fs');
const path = require('path');

// 路径配置
const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'issues');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const API_DIR = path.join(DIST_DIR, 'api');
const API_ISSUE_DIR = path.join(API_DIR, 'issue');
const API_ARTICLE_DIR = path.join(API_DIR, 'article');

// 递归移除所有 _en 结尾的字段
function removeEnFields(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeEnFields);
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      if (key.endsWith('_en')) continue;
      result[key] = removeEnFields(obj[key]);
    }
    return result;
  }
  return obj;
}

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 写入 JSON 文件
function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 主函数
function main() {
  console.log('[generate-api] 开始生成 API 文件...');

  // 1. 读取所有 issue JSON 文件
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.json'))
    .sort(); // 文件名即期号，升序排列后再反转

  console.log(`[generate-api] 找到 ${files.length} 个 issue 文件`);

  // 2. 解析所有 issue 数据
  const issues = files.map(file => {
    const filePath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return data;
  });

  // 3. 按期号降序排列
  issues.sort((a, b) => {
    const numA = parseInt(a.issue.number, 10);
    const numB = parseInt(b.issue.number, 10);
    return numB - numA;
  });

  // 4. 确保输出目录存在
  ensureDir(API_DIR);
  ensureDir(API_ISSUE_DIR);

  // 5. 生成 issues.json（期数列表）
  const issuesList = issues.map(issue => ({
    number: issue.issue.number,
    date: issue.issue.date,
    date_display: issue.issue.date_display,
    cover: {
      slug: issue.cover.slug,
      title: issue.cover.title,
      deck: issue.cover.deck,
      title_short: issue.cover.title_short,
    },
    has_cao: !!issue.cao,
    brief_count: Array.isArray(issue.briefs) ? issue.briefs.length : 0,
  }));

  writeJson(path.join(API_DIR, 'issues.json'), issuesList);
  console.log(`[generate-api] 已生成 issues.json（${issuesList.length} 期）`);

  // 6. 生成单期完整内容 + 单篇文章详情
  let articleCount = 0;

  for (const issue of issues) {
    const issueNum = issue.issue.number;

    // 6a. 生成单期完整内容（去掉 _en 字段）
    const issueData = removeEnFields({
      issue: issue.issue,
      cover: issue.cover,
      briefs: issue.briefs || [],
      cao: issue.cao || null,
    });

    writeJson(path.join(API_ISSUE_DIR, `${issueNum}.json`), issueData);

    // 6b. 生成单篇文章详情
    const articleDir = path.join(API_ARTICLE_DIR, issueNum);
    ensureDir(articleDir);

    // cover 文章
    const coverArticle = removeEnFields({ ...issue.cover });
    writeJson(path.join(articleDir, `${issue.cover.slug}.json`), coverArticle);
    articleCount++;

    // briefs 文章
    if (Array.isArray(issue.briefs)) {
      for (const brief of issue.briefs) {
        const briefArticle = removeEnFields({ ...brief });
        writeJson(path.join(articleDir, `${brief.slug}.json`), briefArticle);
        articleCount++;
      }
    }

    // cao 文章
    if (issue.cao) {
      const caoArticle = removeEnFields({ ...issue.cao });
      writeJson(path.join(articleDir, `${issue.cao.slug}.json`), caoArticle);
      articleCount++;
    }

    console.log(`[generate-api] 第 ${issueNum} 期：issue + ${1 + (issue.briefs?.length || 0) + (issue.cao ? 1 : 0)} 篇文章`);
  }

  console.log(`[generate-api] 完成！共生成 ${issues.length} 个 issue 文件，${articleCount} 篇文章详情`);
  console.log(`[generate-api] 输出目录：${API_DIR}`);
}

main();
