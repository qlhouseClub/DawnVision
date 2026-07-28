'use strict';

/**
 * sync-to-db.cjs - 服务器端同步脚本
 * 
 * 部署在腾讯云服务器 /opt/dawnvision-api/ 目录
 * 读取服务器上的 content/issues/*.json，写入本地 MySQL
 * 
 * 用法：node sync-to-db.cjs
 * 
 * 环境变量（从 .env 文件读取或系统环境变量）：
 *   DB_HOST     - 数据库地址（默认 127.0.0.1）
 *   DB_PORT     - 端口（默认 3306）
 *   DB_USER     - 用户名
 *   DB_PASSWORD - 密码
 *   DB_NAME     - 数据库名（默认 dawnvision）
 *   CONTENT_DIR - 内容目录路径（默认 ../dawnvision-web/src/content/issues）
 */

const fs = require('fs');
const path = require('path');

// ── 加载 .env 文件 ──
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

// ── 配置 ──
const CONTENT_DIR = process.env.CONTENT_DIR || '/var/www/dawnvision-content/issues';

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'dawnvision',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dawnvision',
  waitForConnections: true,
  connectionLimit: 5,
  charset: 'utf8mb4'
};

// ── 主函数 ──
async function main() {
  console.log('[sync-to-db] 开始同步...');
  console.log(`[sync-to-db] 内容目录: ${CONTENT_DIR}`);

  // 检查内容目录
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`[sync-to-db] 内容目录不存在: ${CONTENT_DIR}`);
    process.exit(1);
  }

  // 加载 mysql2
  let mysql;
  try {
    mysql = require('mysql2/promise');
  } catch (e) {
    console.error('[sync-to-db] mysql2 未安装，请运行: npm install mysql2');
    process.exit(1);
  }

  const startTime = Date.now();

  // 1. 读取所有 issue JSON
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  console.log(`[sync-to-db] 找到 ${files.length} 个 issue 文件`);

  const issues = files.map(file => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
    return JSON.parse(raw);
  });

  // 按期号降序
  issues.sort((a, b) => parseInt(b.issue.number, 10) - parseInt(a.issue.number, 10));

  // 2. 连接数据库
  const pool = mysql.createPool(DB_CONFIG);

  try {
    await pool.query('SELECT 1');
    console.log('[sync-to-db] 数据库连接成功');

    // 3. 获取或创建默认分类
    const [categories] = await pool.query(
      'SELECT id FROM dv_categories WHERE slug = ? LIMIT 1',
      ['ai-daily']
    );

    let categoryId;
    if (categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      const [result] = await pool.query(
        `INSERT INTO dv_categories (slug, name, name_en, description, description_en, sort_order)
         VALUES ('ai-daily', 'AI 日报', 'AI Daily', 'AI 前沿深度观察日刊', 'AI frontier deep-dive daily briefing', 1)`
      );
      categoryId = result.insertId;
    }
    console.log(`[sync-to-db] 分类 ID: ${categoryId}`);

    // 4. 逐期同步
    let issueCount = 0;
    let articleCount = 0;

    for (const issue of issues) {
      const issueNum = issue.issue.number;

      // 插入或更新期数
      await pool.query(
        `INSERT INTO dv_issues (category_id, number, date, date_display, is_published)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           date = VALUES(date),
           date_display = VALUES(date_display),
           updated_at = NOW()`,
        [categoryId, issueNum, issue.issue.date, issue.issue.date_display]
      );

      const [rows] = await pool.query(
        'SELECT id FROM dv_issues WHERE category_id = ? AND number = ? LIMIT 1',
        [categoryId, issueNum]
      );
      const issueId = rows[0].id;

      // 同步 cover
      if (issue.cover) {
        await upsertArticle(pool, issueId, categoryId, 'cover', issue.cover);
        articleCount++;
        if (issue.cover.sources?.length > 0) {
          await upsertSources(pool, issueId, issue.cover.slug, issue.cover.sources);
        }
      }

      // 同步 briefs
      if (Array.isArray(issue.briefs)) {
        for (const brief of issue.briefs) {
          await upsertArticle(pool, issueId, categoryId, 'brief', brief);
          articleCount++;
          if (brief.sources?.length > 0) {
            await upsertSources(pool, issueId, brief.slug, brief.sources);
          }
        }
      }

      // 同步 cao
      if (issue.cao) {
        await upsertArticle(pool, issueId, categoryId, 'cao', issue.cao);
        articleCount++;
        if (issue.cao.sources?.length > 0) {
          await upsertSources(pool, issueId, issue.cao.slug, issue.cao.sources);
        }
      }

      issueCount++;
      const cnt = 1 + (issue.briefs?.length || 0) + (issue.cao ? 1 : 0);
      console.log(`[sync-to-db] 第 ${issueNum} 期：${cnt} 篇文章已同步`);
    }

    // 5. 记录同步日志
    const durationMs = Date.now() - startTime;
    await pool.query(
      `INSERT INTO dv_sync_logs (source_type, source_path, issues_synced, articles_synced, status, duration_ms)
       VALUES ('server_json', ?, ?, ?, 'success', ?)`,
      [CONTENT_DIR, issueCount, articleCount, durationMs]
    );

    console.log(`[sync-to-db] 同步完成！${issueCount} 期，${articleCount} 篇文章，耗时 ${durationMs}ms`);

  } catch (err) {
    console.error('[sync-to-db] 同步失败:', err.message);
    try {
      await pool.query(
        `INSERT INTO dv_sync_logs (source_type, source_path, status, error_message, duration_ms)
         VALUES ('server_json', ?, 'failed', ?, ?)`,
        [CONTENT_DIR, err.message, Date.now() - startTime]
      );
    } catch (e) {}
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// ── 插入或更新文章 ──
async function upsertArticle(pool, issueId, categoryId, articleType, data) {
  const fields = {
    issue_id: issueId,
    category_id: categoryId,
    article_type: articleType,
    slug: data.slug,
    title: data.title || '',
    title_break: data.title_break || null,
    title_short: data.title_short || null,
    deck: data.deck || '',
    keywords: typeof data.keywords === 'string' ? data.keywords : (Array.isArray(data.keywords) ? data.keywords.join(', ') : ''),
    og_description: data.og_description || '',
    twitter_description: data.twitter_description || null,
    read_time: data.read_time || '',
    word_count: data.word_count || 0,
    body_html: data.body_html || '',
    cognitive_notes: data.cognitive_notes || '',
    source_summary: data.source_summary || '',
    footnote_tip: data.footnote_tip || null,
    pull_quote_text: data.pull_quote?.text || null,
    pull_quote_attr: data.pull_quote?.attr || null,
    title_en: data.title_en || '',
    title_break_en: data.title_break_en || null,
    title_short_en: data.title_short_en || null,
    deck_en: data.deck_en || '',
    keywords_en: data.keywords_en || '',
    og_description_en: data.og_description_en || '',
    twitter_description_en: data.twitter_description_en || null,
    read_time_en: data.read_time_en || '',
    body_html_en: data.body_html_en || '',
    cognitive_notes_en: data.cognitive_notes_en || '',
    source_summary_en: data.source_summary_en || '',
    footnote_tip_en: data.footnote_tip_en || null,
    pull_quote_text_en: data.pull_quote?.text_en || null,
    pull_quote_attr_en: data.pull_quote?.attr_en || null,
    brief_category: data.category || '',
    brief_category_en: data.category_en || '',
    is_published: 1
  };

  const columns = Object.keys(fields);
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map(c => fields[c]);
  const updateClause = columns
    .filter(c => c !== 'issue_id' && c !== 'slug')
    .map(c => `${c} = VALUES(${c})`)
    .join(', ');

  const sql = `INSERT INTO dv_articles (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}, updated_at = NOW()`;
  await pool.query(sql, values);
}

// ── 插入或更新来源 ──
async function upsertSources(pool, issueId, slug, sources) {
  const [rows] = await pool.query(
    'SELECT id FROM dv_articles WHERE issue_id = ? AND slug = ? LIMIT 1',
    [issueId, slug]
  );
  if (rows.length === 0) return;

  const articleId = rows[0].id;
  await pool.query('DELETE FROM dv_article_sources WHERE article_id = ?', [articleId]);

  for (let i = 0; i < sources.length; i++) {
    await pool.query(
      'INSERT INTO dv_article_sources (article_id, text, url, sort_order) VALUES (?, ?, ?, ?)',
      [articleId, sources[i].text || '', sources[i].url || '', i]
    );
  }
}

main();
