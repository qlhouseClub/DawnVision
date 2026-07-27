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
 * 对 HTML 做一些小程序兼容性处理
 * 杂志编辑风格：首段 lede 加大字号 + 左侧蓝线，H2 左侧蓝线，段间距调整，首行缩进
 */
function processRichTextHtml(html) {
  if (!html) return '';

  let result = html;

  // ---- 图片 ----
  result = result.replace(
    /<img /g,
    '<img style="max-width:100%;height:auto;display:block;margin:32rpx 0;border-radius:4rpx;" '
  );

  // ---- Pull Quote 样式类 ----
  result = result.replace(
    /class="pull-quote"/g,
    'style="border-left:4px solid #002FA7;padding:28rpx 32rpx;margin:48rpx 0;background:rgba(0,47,167,0.06);font-style:italic;font-size:30rpx;line-height:1.8;color:#1a1a1a;border-radius:0 8rpx 8rpx 0;"'
  );
  result = result.replace(
    /class="pull-quote-text"/g,
    'style="font-family:Noto Serif SC,Georgia,serif;font-size:32rpx;line-height:1.7;color:#1a1a1a;margin-bottom:16rpx;font-style:italic;"'
  );
  result = result.replace(
    /class="pull-quote-attr"/g,
    'style="font-size:24rpx;color:#666;text-align:right;letter-spacing:2rpx;"'
  );

  // ---- H2 标题：左侧 3px 克莱因蓝竖线 ----
  result = result.replace(
    /<h2>/g,
    '<h2 style="font-family:Noto Serif SC,Source Han Serif SC,Georgia,serif;font-size:36rpx;font-weight:700;margin:48rpx 0 24rpx;line-height:1.4;color:#0a0a0a;padding-left:20rpx;border-left:3px solid #002FA7;">'
  );
  result = result.replace(
    /<h2 /g,
    '<h2 style="font-family:Noto Serif SC,Source Han Serif SC,Georgia,serif;font-size:36rpx;font-weight:700;margin:48rpx 0 24rpx;line-height:1.4;color:#0a0a0a;padding-left:20rpx;border-left:3px solid #002FA7;" '
  );

  // ---- H1 标题 ----
  result = result.replace(
    /<h1>/g,
    '<h1 style="font-family:Noto Serif SC,Source Han Serif SC,Georgia,serif;font-size:42rpx;font-weight:700;margin:56rpx 0 28rpx;line-height:1.35;color:#0a0a0a;">'
  );

  // ---- H3 标题 ----
  result = result.replace(
    /<h3>/g,
    '<h3 style="font-family:Noto Serif SC,Source Han Serif SC,Georgia,serif;font-size:30rpx;font-weight:700;margin:36rpx 0 18rpx;line-height:1.5;color:#0a0a0a;">'
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
    '<blockquote style="border-left:4px solid #002FA7;padding:24rpx 32rpx;margin:36rpx 0;background:rgba(0,47,167,0.06);font-style:italic;line-height:1.8;color:#333;border-radius:0 8rpx 8rpx 0;">'
  );

  // ---- 链接 ----
  result = result.replace(
    /<a /g,
    '<a style="color:#002FA7;text-decoration:underline;" '
  );

  // ---- 列表 ----
  result = result.replace(
    /<ul>/g,
    '<ul style="padding-left:40rpx;margin-bottom:32rpx;">'
  );
  result = result.replace(
    /<ol>/g,
    '<ol style="padding-left:40rpx;margin-bottom:32rpx;">'
  );
  result = result.replace(
    /<li>/g,
    '<li style="margin-bottom:14rpx;line-height:1.85;font-size:28rpx;color:#222;">'
  );

  // ---- 分割线 ----
  result = result.replace(
    /<hr>/g,
    '<hr style="border:none;border-top:1px solid #E8E8E0;margin:48rpx 0;">'
  );

  // ---- 段落（普通段落，先全部替换为基础样式） ----
  result = result.replace(
    /<p>/g,
    '<p style="margin-bottom:32rpx;line-height:2;font-size:28rpx;color:#2a2a2a;text-align:justify;text-indent:2em;">'
  );
  result = result.replace(
    /<p /g,
    '<p style="margin-bottom:32rpx;line-height:2;font-size:28rpx;color:#2a2a2a;text-align:justify;text-indent:2em;" '
  );

  // ---- 首段 Lede 样式：加大字号 + 左侧 3px 克莱因蓝竖线 + 无首行缩进 ----
  // 找到第一个 <p 标签（可能带 style 也可能不带），替换为 lede 样式
  // 由于上面已经把 <p> 和 <p 都替换成带 style 的了，这里找第一个带 style 的 p
  result = result.replace(
    /(<p style="[^"]*">)/,
    '<p style="font-size:32rpx;line-height:1.9;color:#1a1a1a;font-weight:500;margin-bottom:36rpx;padding-left:20rpx;border-left:3px solid #002FA7;text-align:justify;text-indent:0;">'
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
