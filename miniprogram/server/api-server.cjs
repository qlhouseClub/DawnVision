'use strict';

/**
 * Dawn Vision API Server
 * 
 * 小程序后端服务，从 MySQL 读取内容
 * 部署在腾讯云服务器上，通过 PM2 管理进程
 * 
 * 端口：3100（通过环境变量 PORT 可配置）
 * 
 * 接口列表：
 *   GET /api/issues              - 获取期数列表
 *   GET /api/issue/:number        - 获取单期完整内容
 *   GET /api/article/:issue/:slug - 获取单篇文章详情
 *   GET /api/cao/list             - 获取槽点文章列表
 *   GET /api/search?q=keyword    - 搜索文章
 *   GET /api/latest              - 获取最新一期
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// ── 加载 .env 文件 ──
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(function(line) {
    var match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      var key = match[1].trim();
      var val = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
  console.log('[DawnVision API] .env 已加载');
}

// ── 数据库配置 ──
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'dawnvision',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dawnvision',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
};

const PORT = parseInt(process.env.PORT || '3100', 10);

// ── 工具函数 ──

function sendJson(res, data, status) {
  res.writeHead(status || 200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, message, status) {
  sendJson(res, { error: message }, status || 404);
}

// 日期格式化：MySQL DATE 对象 -> YYYY-MM-DD 字符串
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') {
    // 已经是字符串，截取前10位
    return date.substring(0, 10);
  }
  if (date instanceof Date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  return String(date);
}

// 文章行转 JSON
function articleRowToJson(row) {
  return {
    slug: row.slug,
    article_type: row.article_type,
    // 中文
    title: row.title,
    title_break: row.title_break,
    title_short: row.title_short,
    deck: row.deck,
    keywords: row.keywords,
    og_description: row.og_description,
    read_time: row.read_time,
    word_count: row.word_count,
    body_html: row.body_html,
    cognitive_notes: row.cognitive_notes,
    source_summary: row.source_summary,
    footnote_tip: row.footnote_tip,
    pull_quote: {
      text: row.pull_quote_text,
      attr: row.pull_quote_attr,
      text_en: row.pull_quote_text_en,
      attr_en: row.pull_quote_attr_en
    },
    // 英文
    title_en: row.title_en,
    title_break_en: row.title_break_en,
    title_short_en: row.title_short_en,
    deck_en: row.deck_en,
    keywords_en: row.keywords_en,
    og_description_en: row.og_description_en,
    read_time_en: row.read_time_en,
    body_html_en: row.body_html_en,
    cognitive_notes_en: row.cognitive_notes_en,
    source_summary_en: row.source_summary_en,
    footnote_tip_en: row.footnote_tip_en,
    // brief
    category: row.brief_category,
    category_en: row.brief_category_en
  };
}

// 期数行转简要 JSON（列表用）
function issueRowToListJson(row) {
  return {
    issue: {
      number: row.number,
      date: formatDate(row.date),
      date_display: row.date_display
    },
    cover: row.cover_slug ? {
      slug: row.cover_slug,
      title: row.cover_title,
      title_short: row.cover_title_short,
      deck: row.cover_deck,
      read_time: row.cover_read_time
    } : null,
    brief_count: row.brief_count || 0,
    has_cao: row.has_cao === 1
  };
}

// ── 路由处理 ──

async function handleIssues(db) {
  const [rows] = await db.query(`
    SELECT 
      i.id, i.number, i.date, i.date_display,
      (SELECT a.slug FROM dv_articles a WHERE a.issue_id = i.id AND a.article_type = 'cover' LIMIT 1) AS cover_slug,
      (SELECT a.title FROM dv_articles a WHERE a.issue_id = i.id AND a.article_type = 'cover' LIMIT 1) AS cover_title,
      (SELECT a.title_short FROM dv_articles a WHERE a.issue_id = i.id AND a.article_type = 'cover' LIMIT 1) AS cover_title_short,
      (SELECT a.deck FROM dv_articles a WHERE a.issue_id = i.id AND a.article_type = 'cover' LIMIT 1) AS cover_deck,
      (SELECT a.read_time FROM dv_articles a WHERE a.issue_id = i.id AND a.article_type = 'cover' LIMIT 1) AS cover_read_time,
      (SELECT COUNT(*) FROM dv_articles a WHERE a.issue_id = i.id AND a.article_type = 'brief') AS brief_count,
      EXISTS(SELECT 1 FROM dv_articles a WHERE a.issue_id = i.id AND a.article_type = 'cao') AS has_cao
    FROM dv_issues i
    WHERE i.is_published = 1
    ORDER BY i.number DESC
  `);
  return rows.map(issueRowToListJson);
}

async function handleIssue(db, issueNum) {
  // 获取期数
  const [issues] = await db.query(
    'SELECT id, number, date, date_display FROM dv_issues WHERE number = ? AND is_published = 1 LIMIT 1',
    [issueNum]
  );
  if (issues.length === 0) return null;

  const issue = issues[0];

  // 获取该期所有文章
  const [articles] = await db.query(
    'SELECT * FROM dv_articles WHERE issue_id = ? AND is_published = 1 ORDER BY FIELD(article_type, "cover", "brief", "cao"), id ASC',
    [issue.id]
  );

  // 获取每篇文章的来源
  const sourcesMap = {};
  for (const art of articles) {
    const [sources] = await db.query(
      'SELECT text, url FROM dv_article_sources WHERE article_id = ? ORDER BY sort_order ASC',
      [art.id]
    );
    sourcesMap[art.slug] = sources;
  }

  // 组装数据
  const cover = articles.find(a => a.article_type === 'cover');
  const briefs = articles.filter(a => a.article_type === 'brief');
  const cao = articles.find(a => a.article_type === 'cao');

  const result = {
    issue: {
      number: issue.number,
      date: formatDate(issue.date),
      date_display: issue.date_display
    },
    cover: cover ? { ...articleRowToJson(cover), sources: sourcesMap[cover.slug] || [] } : null,
    briefs: briefs.map(b => ({ ...articleRowToJson(b), sources: sourcesMap[b.slug] || [] })),
    cao: cao ? { ...articleRowToJson(cao), sources: sourcesMap[cao.slug] || [] } : null
  };

  return result;
}

async function handleArticle(db, issueNum, slug) {
  const [issues] = await db.query(
    'SELECT id FROM dv_issues WHERE number = ? AND is_published = 1 LIMIT 1',
    [issueNum]
  );
  if (issues.length === 0) return null;

  const [articles] = await db.query(
    'SELECT * FROM dv_articles WHERE issue_id = ? AND slug = ? AND is_published = 1 LIMIT 1',
    [issues[0].id, slug]
  );
  if (articles.length === 0) return null;

  const article = articles[0];

  // 获取来源
  const [sources] = await db.query(
    'SELECT text, url FROM dv_article_sources WHERE article_id = ? ORDER BY sort_order ASC',
    [article.id]
  );

  return { ...articleRowToJson(article), sources };
}

async function handleCaoList(db) {
  const [rows] = await db.query(`
    SELECT 
      a.id, a.slug, a.title, a.deck, a.read_time,
      a.title_en, a.deck_en, a.read_time_en,
      i.number AS issue_number, i.date, i.date_display
    FROM dv_articles a
    JOIN dv_issues i ON a.issue_id = i.id
    WHERE a.article_type = 'cao' AND a.is_published = 1 AND i.is_published = 1
    ORDER BY i.number DESC
  `);

  return rows.map(row => ({
    slug: row.slug,
    title: row.title,
    title_en: row.title_en,
    deck: row.deck,
    deck_en: row.deck_en,
    read_time: row.read_time,
    read_time_en: row.read_time_en,
    issue: {
      number: row.issue_number,
      date: formatDate(row.date),
      date_display: row.date_display
    }
  }));
}

async function handleSearch(db, query) {
  const q = (query || '').trim();
  if (!q || q.length < 1) return [];

  // 使用全文索引搜索，回退到 LIKE
  const [rows] = await db.query(
    `SELECT 
       a.id, a.slug, a.title, a.title_short, a.deck,
       a.title_en, a.title_short_en, a.deck_en,
       a.brief_category, a.brief_category_en,
       a.article_type,
       i.number AS issue_number
     FROM dv_articles a
     JOIN dv_issues i ON a.issue_id = i.id
     WHERE a.is_published = 1 AND i.is_published = 1
       AND (MATCH(a.title) AGAINST(? IN NATURAL LANGUAGE MODE)
            OR MATCH(a.deck) AGAINST(? IN NATURAL LANGUAGE MODE)
            OR a.title LIKE ?
            OR a.deck LIKE ?
            OR a.keywords LIKE ?)
     ORDER BY i.number DESC
     LIMIT 20`,
    [q, q, `%${q}%`, `%${q}%`, `%${q}%`]
  );

  return rows.map(row => ({
    id: row.id,
    slug: row.slug,
    issue: row.issue_number,
    title: row.title,
    title_short: row.title_short,
    deck: row.deck,
    title_en: row.title_en,
    title_short_en: row.title_short_en,
    deck_en: row.deck_en,
    category: row.brief_category || row.article_type,
    category_en: row.brief_category_en,
    excerpt: row.deck
  }));
}

async function handleLatest(db) {
  const [issues] = await db.query(`
    SELECT i.id, i.number, i.date, i.date_display
    FROM dv_issues i
    WHERE i.is_published = 1
    ORDER BY i.number DESC
    LIMIT 1
  `);
  if (issues.length === 0) return null;

  const issue = issues[0];

  const [covers] = await db.query(
    'SELECT * FROM dv_articles WHERE issue_id = ? AND article_type = "cover" AND is_published = 1 LIMIT 1',
    [issue.id]
  );

  return {
    issue: {
      number: issue.number,
      date: formatDate(issue.date),
      date_display: issue.date_display
    },
    cover: covers.length > 0 ? {
      slug: covers[0].slug,
      title: covers[0].title,
      title_short: covers[0].title_short,
      title_short_en: covers[0].title_short_en,
      deck: covers[0].deck,
      deck_en: covers[0].deck_en,
      read_time: covers[0].read_time,
      read_time_en: covers[0].read_time_en,
      title_en: covers[0].title_en
    } : null
  };
}

// ── 主服务 ──

async function startServer() {
  let mysql2;
  try {
    mysql2 = require('mysql2/promise');
  } catch (e) {
    console.error('请安装 mysql2: npm install mysql2');
    process.exit(1);
  }

  const pool = mysql2.createPool(DB_CONFIG);

  // 测试连接
  try {
    await pool.query('SELECT 1');
    console.log('[DawnVision API] 数据库连接成功');
  } catch (err) {
    console.error('[DawnVision API] 数据库连接失败:', err.message);
    process.exit(1);
  }

  const server = http.createServer(async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    try {
      // 路由匹配
      let data = null;

      if (pathname === '/api/issues') {
        data = await handleIssues(pool);
      } else if (pathname === '/api/latest') {
        data = await handleLatest(pool);
      } else if (pathname === '/api/cao/list') {
        data = await handleCaoList(pool);
      } else if (pathname === '/api/search') {
        data = await handleSearch(pool, query.q);
      } else if (pathname.match(/^\/api\/issue\/(\d+)$/)) {
        const issueNum = pathname.match(/^\/api\/issue\/(\d+)$/)[1];
        data = await handleIssue(pool, issueNum);
      } else if (pathname.match(/^\/api\/article\/(\d+)\/(.+)$/)) {
        const match = pathname.match(/^\/api\/article\/(\d+)\/(.+)$/);
        data = await handleArticle(pool, match[1], match[2]);
      } else {
        sendError(res, 'Not found', 404);
        return;
      }

      if (data === null) {
        sendError(res, 'Not found', 404);
      } else {
        sendJson(res, data);
      }
    } catch (err) {
      console.error('[API Error]', err);
      sendError(res, 'Internal server error', 500);
    }
  });

  server.listen(PORT, () => {
    console.log(`[DawnVision API] 服务已启动，端口 ${PORT}`);
    console.log(`[DawnVision API] 接口列表:`);
    console.log('  GET /api/issues              - 期数列表');
    console.log('  GET /api/latest              - 最新一期');
    console.log('  GET /api/issue/:number        - 单期内容');
    console.log('  GET /api/article/:issue/:slug - 文章详情');
    console.log('  GET /api/cao/list             - 槽点列表');
    console.log('  GET /api/search?q=keyword     - 搜索文章');
  });
}

startServer();
