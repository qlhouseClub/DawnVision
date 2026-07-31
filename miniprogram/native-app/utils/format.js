// utils/format.js - 日期、文本格式化工具

/**
 * 格式化日期显示
 * @param {string} dateStr - 日期字符串，如 "2026-06-27"
 * @param {string} format - 格式，默认 "YYYY.MM.DD"
 */
function formatDate(dateStr, format) {
  if (!dateStr) return '';
  format = format || 'YYYY.MM.DD';
  
  const date = new Date(dateStr.replace(/-/g, '/'));
  if (isNaN(date.getTime())) return dateStr;
  
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day);
}

/**
 * 获取相对时间描述
 */
function formatRelative(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr.replace(/-/g, '/'));
  if (isNaN(date.getTime())) return dateStr;
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  
  if (days < 0) return formatDate(dateStr);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return days + ' 天前';
  if (days < 30) return Math.floor(days / 7) + ' 周前';
  if (days < 365) return Math.floor(days / 30) + ' 个月前';
  return Math.floor(days / 365) + ' 年前';
}

/**
 * 补零
 */
function padZero(num) {
  return num < 10 ? '0' + num : '' + num;
}

/**
 * 截取文本长度
 */
function truncate(text, maxLen, suffix) {
  if (!text) return '';
  maxLen = maxLen || 100;
  suffix = suffix || '...';
  
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + suffix;
}

/**
 * 去除 HTML 标签
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/**
 * 处理 rich-text 需要的 HTML 内容
 * 
 * 【设计系统】垂直韵律 · 纯 <br> 驱动版
 * 
 * 【为什么不用 padding/margin？】
 * 微信小程序 rich-text 对块级元素的 padding-bottom / margin 支持极不可靠，
 * 同一套代码在不同版本、不同平台上表现不一致。
 * 因此本版本采用最可靠的方案：用 <br> 标签控制所有垂直间距。
 * 
 * 【节奏系统】
 * 基准：正文字号 30rpx，行高 1.75 → 行内距 ≈ 52.5rpx
 * 
 * 间距层级（从密到疏）：
 *   0.5 档 → 标题底部（内容贴着标题，层级锐利）
 *   1 档   → 段落间距（<br><br>，清晰换气）
 *   2 档   → H3 前（<br><br><br>，小节停顿）
 *   3 档   → H2 前（<br><br><br><br>，章节级大呼吸）
 * 
 * 注意：<br> 在 rich-text 中使用默认字号行高，
 * 实际渲染高度可能与 p 内行行高略有差异，
 * 但层级关系（谁比谁大）是稳定可靠的。
 * 
 * 节奏示意：
 *   ━━━━━━━━━━  行
 *   ━━━━━━━━━━  行（行高 1.75，段内是"块"）
 *   ━━━━━━━━━━  行
 *   
 *   段落间隔 2 br — 清晰换气
 *   ━━━━━━━━━━  行
 *   ━━━━━━━━━━  行
 *   
 *   
 *   
 *   H2 标题（前 4 br — 章节级大呼吸）
 *   ━━━━━━━━━━  行（标题后紧贴，层级锐利）
 *   ━━━━━━━━━━  行
 */
function processRichTextHtml(html) {
  if (!html) return '';

  let result = html;

  // ============================================================
  // 第一步：所有块级元素之间插入 <br> 控制间距
  //         （层级越高，<br> 数量越多）
  // ============================================================

  // --- 段落之间：2 br（1档，清晰换气）---
  result = result.replace(/<\/p>\s*<p(\s|>)/g, '</p><br><br><p$1');

  // --- H2 前：4 br（3档，章节级大呼吸）---
  result = result.replace(/<\/p>\s*<h2(\s|>)/g, '</p><br><br><br><br><h2$1');
  result = result.replace(/<\/(ul|ol)>\s*<h2(\s|>)/g, '</$1><br><br><br><br><h2$2');
  result = result.replace(/<\/blockquote>\s*<h2(\s|>)/g, '</blockquote><br><br><br><br><h2$1');

  // --- H3 前：3 br（2档，小节停顿）---
  result = result.replace(/<\/p>\s*<h3(\s|>)/g, '</p><br><br><br><h3$1');
  result = result.replace(/<\/(ul|ol)>\s*<h3(\s|>)/g, '</$1><br><br><br><h3$2');
  result = result.replace(/<\/blockquote>\s*<h3(\s|>)/g, '</blockquote><br><br><br><h3$1');

  // --- H1 前：4 br（3档）---
  result = result.replace(/<\/p>\s*<h1(\s|>)/g, '</p><br><br><br><br><h1$1');
  result = result.replace(/<\/(ul|ol)>\s*<h1(\s|>)/g, '</$1><br><br><br><br><h2$2');
  result = result.replace(/<\/blockquote>\s*<h1(\s|>)/g, '</blockquote><br><br><br><br><h1$1');

  // --- 引用块前后：2 br（1档）---
  result = result.replace(/<\/p>\s*<blockquote(\s|>)/g, '</p><br><br><blockquote$1');
  result = result.replace(/<\/blockquote>\s*<p(\s|>)/g, '</blockquote><br><br><p$1');

  // --- 列表前后：2 br（1档）---
  result = result.replace(/<\/p>\s*<(ul|ol)(\s|>)/g, '</p><br><br><$1$2');
  result = result.replace(/<\/(ul|ol)>\s*<p(\s|>)/g, '</$1><br><br><p$2');

  // --- 图片前后：2 br（1档）---
  result = result.replace(/<\/p>\s*<img/g, '</p><br><br><img');
  result = result.replace(/<img([^>]*)>\s*<p(\s|>)/g, '<img$1><br><br><p$2');

  // --- 分割线前后：2 br（1档）---
  result = result.replace(/<\/p>\s*<hr/g, '</p><br><br><hr');
  result = result.replace(/<hr\s*\/?>\s*<p(\s|>)/g, '<hr><br><br><p$1');

  // ============================================================
  // 第二步：元素内联样式
  // ============================================================

  // ---- 图片 ----
  result = result.replace(
    /<img /g,
    '<img style="max-width:100%;height:auto;display:block;border-radius:4rpx;" '
  );

  // ---- Pull Quote 样式类 ----
  result = result.replace(
    /class="pull-quote"/g,
    'style="border-left:4px solid #002FA7;padding:36rpx 32rpx;background:rgba(0,47,167,0.06);font-style:italic;font-size:30rpx;line-height:1.75;color:#1a1a1a;border-radius:0 8rpx 8rpx 0;"'
  );
  result = result.replace(
    /class="pull-quote-text"/g,
    'style="font-family:Source Serif 4,Noto Serif SC,Georgia,serif;font-size:32rpx;line-height:1.65;color:#1a1a1a;padding-bottom:16rpx;font-style:italic;"'
  );
  result = result.replace(
    /class="pull-quote-attr"/g,
    'style="font-size:24rpx;color:#666;text-align:right;letter-spacing:2rpx;"'
  );

  // ---- H1 标题 ----
  // 后距靠标题自身行高，内容紧贴标题
  result = result.replace(
    /<h1>/g,
    '<h1 style="font-family:Source Serif 4,Noto Serif SC,Source Han Serif SC,Georgia,serif;font-size:46rpx;font-weight:800;line-height:1.2;color:#0a0a0a;letter-spacing:-0.5rpx;">'
  );
  result = result.replace(
    /<h1 /g,
    '<h1 style="font-family:Source Serif 4,Noto Serif SC,Source Han Serif SC,Georgia,serif;font-size:46rpx;font-weight:800;line-height:1.2;color:#0a0a0a;letter-spacing:-0.5rpx;" '
  );

  // ---- H2 标题：左侧克莱因蓝竖线 ----
  // 前距 4br（章节级大呼吸）
  // 后距靠行高，内容贴标题
  result = result.replace(
    /<h2>/g,
    '<h2 style="font-family:Source Serif 4,Noto Serif SC,Source Han Serif SC,Georgia,serif;font-size:38rpx;font-weight:800;line-height:1.25;color:#0a0a0a;border-left:4px solid #002FA7;padding-left:22rpx;letter-spacing:-0.3rpx;">'
  );
  result = result.replace(
    /<h2 /g,
    '<h2 style="font-family:Source Serif 4,Noto Serif SC,Source Han Serif SC,Georgia,serif;font-size:38rpx;font-weight:800;line-height:1.25;color:#0a0a0a;border-left:4px solid #002FA7;padding-left:22rpx;letter-spacing:-0.3rpx;" '
  );

  // ---- H3 标题 ----
  // 前距 3br（小节停顿）
  result = result.replace(
    /<h3>/g,
    '<h3 style="font-family:Source Serif 4,Noto Serif SC,Source Han Serif SC,Georgia,serif;font-size:32rpx;font-weight:700;line-height:1.35;color:#0a0a0a;">'
  );
  result = result.replace(
    /<h3 /g,
    '<h3 style="font-family:Source Serif 4,Noto Serif SC,Source Han Serif SC,Georgia,serif;font-size:32rpx;font-weight:700;line-height:1.35;color:#0a0a0a;" '
  );

  // ---- Strong 加粗：克莱因蓝色 ----
  result = result.replace(
    /<strong>/g,
    '<strong style="font-weight:700;color:#002FA7;">'
  );
  result = result.replace(
    /<strong /g,
    '<strong style="font-weight:700;color:#002FA7;" '
  );

  // ---- Blockquote 引用块 ----
  result = result.replace(
    /<blockquote>/g,
    '<blockquote style="border-left:4px solid #002FA7;padding:28rpx 32rpx;background:rgba(0,47,167,0.06);font-style:italic;line-height:1.75;color:#333;border-radius:0 8rpx 8rpx 0;">'
  );
  result = result.replace(
    /<blockquote /g,
    '<blockquote style="border-left:4px solid #002FA7;padding:28rpx 32rpx;background:rgba(0,47,167,0.06);font-style:italic;line-height:1.75;color:#333;border-radius:0 8rpx 8rpx 0;" '
  );

  // ---- 链接 ----
  result = result.replace(
    /<a /g,
    '<a style="color:#002FA7;text-decoration:underline;" '
  );

  // ---- 列表 ----
  result = result.replace(
    /<ul>/g,
    '<ul style="padding-left:40rpx;">'
  );
  result = result.replace(
    /<ol>/g,
    '<ol style="padding-left:40rpx;">'
  );
  // 列表项：行高与正文一致
  result = result.replace(
    /<li>/g,
    '<li style="line-height:1.75;font-size:30rpx;color:#222;">'
  );
  result = result.replace(
    /<li /g,
    '<li style="line-height:1.75;font-size:30rpx;color:#222;" '
  );

  // ---- 分割线 ----
  result = result.replace(
    /<hr\s*\/?>/g,
    '<hr style="border:none;border-top:1px solid #E8E8E0;">'
  );

  // ---- 段落 ----
  // 字号 30rpx，行高 1.75（段内舒适密度）
  // 段间距由段间 <br><br> 控制（不依赖 padding/margin）
  // 首行缩进 2em，两端对齐
  result = result.replace(
    /<p>/g,
    '<p style="margin:0;padding:0;line-height:1.75;font-size:30rpx;color:#222;text-align:justify;text-indent:2em;font-family:Source Serif 4,Noto Serif SC,Source Han Serif SC,Georgia,serif;">'
  );
  result = result.replace(
    /<p /g,
    '<p style="margin:0;padding:0;line-height:1.75;font-size:30rpx;color:#222;text-align:justify;text-indent:2em;font-family:Source Serif 4,Noto Serif SC,Source Han Serif SC,Georgia,serif;" '
  );

  // ---- 首段 Lede 样式 ----
  // 更大字号 + 左侧克莱因蓝竖线 + 无首行缩进 + 加粗
  // 作为文章的"视觉锚点"
  result = result.replace(
    /(<p style="[^"]*">)/,
    '<p style="font-size:34rpx;line-height:1.7;color:#111;font-weight:600;margin:0;padding:0 0 0 22rpx;border-left:4px solid #002FA7;text-align:justify;text-indent:0;font-family:Source Serif 4,Noto Serif SC,Source Han Serif SC,Georgia,serif;letter-spacing:-0.2rpx;">'
  );

  return result;
}

/**
 * 格式化阅读时间
 */
function formatReadTime(readTime) {
  if (!readTime) return '';
  return readTime;
}

/**
 * 期号格式化
 * 确保期号是三位数格式，如 "001", "045"
 */
function formatIssueNumber(num) {
  if (!num && num !== 0) return '';
  const n = parseInt(num, 10);
  if (isNaN(n)) return num;
  if (n < 10) return '00' + n;
  if (n < 100) return '0' + n;
  return '' + n;
}

module.exports = {
  formatDate: formatDate,
  formatRelative: formatRelative,
  truncate: truncate,
  stripHtml: stripHtml,
  processRichTextHtml: processRichTextHtml,
  formatReadTime: formatReadTime,
  formatIssueNumber: formatIssueNumber,
  padZero: padZero
};
