// HTML内容处理工具
// 将原始HTML转换为微信小程序rich-text组件支持的格式
// 所有样式通过内联style处理

/**
 * 处理HTML以适配小程序rich-text组件
 */
export function processHtmlForMini(html: string): string {
  if (!html) return ''

  let processed = html

  // 移除script和style标签
  processed = processed.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
  processed = processed.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')

  // 移除class属性
  processed = processed.replace(/\s+class="[^"]*"/g, '')

  // 处理pull-quote div
  processed = processed.replace(
    /<div[^>]*pull-quote[^>]*>/g,
    '<div style="margin: 32px 0; padding: 24px; background: rgba(0,47,167,0.06); border-left: 4px solid #002FA7;">'
  )
  processed = processed.replace(
    /<span[^>]*pull-quote__attr[^>]*>/g,
    '<span style="display: block; margin-top: 12px; font-size: 13px; color: #6b6b6b; font-style: normal;">'
  )

  // 处理段落
  processed = processed.replace(
    /<p>/g,
    '<p style="margin-bottom: 20px; line-height: 1.85; text-indent: 2em; font-family: Georgia, \'Songti SC\', \'STSong\', serif; font-size: 17px; color: #0a0a0a;">'
  )
  processed = processed.replace(
    /<p\s+style="[^"]*">/g,
    '<p style="margin-bottom: 20px; line-height: 1.85; text-indent: 2em; font-family: Georgia, \'Songti SC\', \'STSong\', serif; font-size: 17px; color: #0a0a0a;">'
  )

  // 第一段特殊处理：首行不缩进，有蓝色左边框
  const firstPMatch = processed.match(/<p[^>]*>/)
  if (firstPMatch && firstPMatch.index !== undefined) {
    const idx = firstPMatch.index
    const end = idx + firstPMatch[0].length
    const firstPStyle = 'margin-bottom: 24px; line-height: 1.7; text-indent: 0; font-family: Georgia, \'Songti SC\', \'STSong\', serif; font-size: 18px; color: #0a0a0a; font-weight: 500; border-left: 3px solid #002FA7; padding-left: 16px;'
    processed = processed.slice(0, idx) + `<p style="${firstPStyle}">` + processed.slice(end)
  }

  // 处理strong - Klein Blue加粗
  processed = processed.replace(
    /<strong>/g,
    '<strong style="font-weight: 700; color: #002FA7;">'
  )

  // 处理em
  processed = processed.replace(
    /<em>/g,
    '<em style="font-style: italic;">'
  )

  // 处理h2
  processed = processed.replace(
    /<h2>/g,
    '<h2 style="font-size: 22px; font-weight: 700; margin-top: 40px; margin-bottom: 16px; color: #0a0a0a; letter-spacing: -0.5px; line-height: 1.3; border-left: 3px solid #002FA7; padding-left: 16px; text-indent: 0;">'
  )

  // 处理h3
  processed = processed.replace(
    /<h3>/g,
    '<h3 style="font-size: 19px; font-weight: 700; margin-top: 32px; margin-bottom: 12px; color: #0a0a0a; text-indent: 0;">'
  )

  // 处理blockquote
  processed = processed.replace(
    /<blockquote>/g,
    '<blockquote style="margin: 32px 0; padding: 24px 24px; background: rgba(0,47,167,0.06); border-left: 4px solid #002FA7; font-style: italic;">'
  )

  // 处理ul/ol
  processed = processed.replace(
    /<ul>/g,
    '<ul style="margin: 20px 0; padding-left: 32px;">'
  )
  processed = processed.replace(
    /<ol>/g,
    '<ol style="margin: 20px 0; padding-left: 32px;">'
  )
  processed = processed.replace(
    /<li>/g,
    '<li style="margin-bottom: 12px; line-height: 1.7; text-indent: 0;">'
  )

  // 处理链接为纯文本（小程序rich-text中链接无法点击）
  processed = processed.replace(/<a[^>]*>/g, '<text style="color: #002FA7;">')
  processed = processed.replace(/<\/a>/g, '</text>')

  return processed
}

/**
 * 从HTML中提取纯文本
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}
