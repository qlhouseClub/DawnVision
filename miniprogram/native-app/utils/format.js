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
 */
function processRichTextHtml(html) {
  if (!html) return '';
  
  // 确保图片有最大宽度
  let result = html
    .replace(/<img /g, '<img style="max-width:100%;height:auto;display:block;" ')
    // 处理 pull-quote 样式类
    .replace(/class="pull-quote"/g, 'style="border-left:4px solid #002FA7;padding:20rpx 30rpx;margin:40rpx 0;background:rgba(0,47,167,0.05);font-style:italic;font-size:30rpx;line-height:1.8;color:#333;"')
    .replace(/class="pull-quote-text"/g, 'style="font-family:Noto Serif SC,Georgia,serif;font-size:32rpx;line-height:1.7;color:#1a1a1a;margin-bottom:16rpx;"')
    .replace(/class="pull-quote-attr"/g, 'style="font-size:24rpx;color:#666;text-align:right;"')
    // 处理段落
    .replace(/<p>/g, '<p style="margin-bottom:28rpx;line-height:1.9;font-size:28rpx;color:#222;text-align:justify;">')
    // 处理标题
    .replace(/<h1>/g, '<h1 style="font-family:Noto Serif SC,Georgia,serif;font-size:40rpx;font-weight:600;margin:48rpx 0 24rpx;line-height:1.4;color:#1a1a1a;">')
    .replace(/<h2>/g, '<h2 style="font-family:Noto Serif SC,Georgia,serif;font-size:34rpx;font-weight:600;margin:40rpx 0 20rpx;line-height:1.4;color:#1a1a1a;">')
    .replace(/<h3>/g, '<h3 style="font-family:Noto Serif SC,Georgia,serif;font-size:30rpx;font-weight:600;margin:32rpx 0 16rpx;line-height:1.5;color:#1a1a1a;">')
    // 处理加粗
    .replace(/<strong>/g, '<strong style="font-weight:600;color:#002FA7;">')
    // 处理引用块
    .replace(/<blockquote>/g, '<blockquote style="border-left:4px solid #002FA7;padding:20rpx 30rpx;margin:32rpx 0;background:rgba(0,47,167,0.05);">')
    // 处理链接
    .replace(/<a /g, '<a style="color:#002FA7;text-decoration:underline;" ')
    // 处理列表
    .replace(/<ul>/g, '<ul style="padding-left:40rpx;margin-bottom:28rpx;">')
    .replace(/<ol>/g, '<ol style="padding-left:40rpx;margin-bottom:28rpx;">')
    .replace(/<li>/g, '<li style="margin-bottom:12rpx;line-height:1.8;font-size:28rpx;color:#222;">')
    // 处理分割线
    .replace(/<hr>/g, '<hr style="border:none;border-top:1px solid #E8E8E0;margin:40rpx 0;">');
  
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
