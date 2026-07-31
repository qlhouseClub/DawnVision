// utils/i18n.js - 中英双语工具

const messages = {
  zh: {
    // 搜索
    'search.placeholder': '搜索文章、关键词...',
    'search.empty': '输入关键词开始搜索',
    'search.noResults': '未找到相关文章',
    'search.loading': '搜索中...',
    'search.footer.open': '打开',
    'search.footer.search': '搜索',
    // 分区标签
    'section.focus': 'FOCUS · 焦点',
    'section.brief': 'BRIEF · 资讯',
    'section.cao': 'CAO! · 来吐槽吧',
    // 按钮
    'btn.readMore': 'READ MORE',
    'btn.browseAll': 'BROWSE ALL ISSUES',
    'btn.browseAllSub': '浏览全部期刊',
    'btn.loading': 'LOADING...',
    // 标语
    'tagline.en1': 'THROUGH THE CLAMOR,',
    'tagline.en2': 'INSIGHT ECHOES.',
    'tagline.en3': 'READ.',
    'tagline.zh1': '穿越嘈杂，',
    'tagline.zh2': '洞见留声。',
    // 状态
    'status.loading': '加载中...',
    'status.empty': '暂无内容',
    'status.emptyIssues': '暂无期刊内容',
    'status.emptyCao': '暂无槽点内容',
    'status.error': '加载失败，请检查网络',
    'status.articleMissing': '文章不存在',
    'status.articleError': '参数错误',
    // About 页
    'about.label': 'ABOUT · 关于',
    'about.title': '穿越嘈杂，洞见留声。',
    'about.p1': 'Dawn Vision 是一份 AI 深度观察日刊；关注每天 AI 相关的前沿话题。',
    'about.p2': '我们从海量信息中提炼最有价值的信号，用结构化的分析和独立的判断，帮助你看清行业的真实走向。',
    'about.p3': '在这里，没有标题党，没有情绪宣泄，只有冷静的观察、扎实的数据和清晰的思考框架。',
    'about.content': 'CONTENT · 内容架构',
    'about.content1Title': '封面深度',
    'about.content1Desc': '每期一篇深度长文，聚焦最重要的行业议题。',
    'about.content2Title': '产业简报',
    'about.content2Desc': '精选多条关键动态，简明扼要呈现核心信息。',
    'about.content3Title': '槽点专栏',
    'about.content3Desc': '轻松吐槽科技圈那些荒诞的人和事。',
    'about.frequency': 'FREQUENCY · 更新频率',
    'about.freqMain': '日刊形式，工作日每日发布。',
    'about.freqSub': '重大事件发生时，可能会加更号外。',
    'about.follow': 'FOLLOW · 关注我们',
    'about.website': '官方网站',
    'about.rss': 'RSS 订阅',
    // Cao 页
    'cao.intro': '科技圈的那些糟心事，我们一起吐槽。',
    // 文章详情
    'article.cognitive': 'COGNITIVE NOTES · 认知笔记',
    'article.about': 'ABOUT THIS ARTICLE · 关于本文',
    'article.related': 'MORE FROM THIS ISSUE · 同期其他文章',
    // 期数
    'issue.expand': '展开',
    'issue.briefs': '条资讯',
    // 提示
    'toast.loadFail': '加载失败，请检查网络',
    'toast.copied': '网址已复制',
    'toast.rssCopied': 'RSS 地址已复制',
    // 分享
    'share.default': 'Dawn Vision - 穿越嘈杂，洞见留声',
    'share.articles': 'Dawn Vision 期刊库',
    'share.cao': 'Dawn Vision 槽点专栏',
    // 底部品牌
    'footer.brand': 'DAWN VISION',
    'footer.tagline': '穿越嘈杂，洞见留声',
    // 新内容通知
    'newContent.title': '有新内容发布',
    'newContent.desc': '新一期已上线，点击查看',
    'newContent.action': '查看',
    'newContent.dismiss': '稍后',
  },
  en: {
    // Search
    'search.placeholder': 'Search articles, keywords...',
    'search.empty': 'Type to start searching',
    'search.noResults': 'No articles found',
    'search.loading': 'Searching...',
    'search.footer.open': 'Open',
    'search.footer.search': 'Search',
    // Section labels
    'section.focus': 'FOCUS',
    'section.brief': 'BRIEF',
    'section.cao': 'CAO!',
    // Buttons
    'btn.readMore': 'READ MORE',
    'btn.browseAll': 'BROWSE ALL ISSUES',
    'btn.browseAllSub': 'Browse all issues',
    'btn.loading': 'LOADING...',
    // Tagline
    'tagline.en1': 'THROUGH THE CLAMOR,',
    'tagline.en2': 'INSIGHT ECHOES.',
    'tagline.en3': 'READ.',
    'tagline.zh1': 'Through the Clamor,',
    'tagline.zh2': 'Insight Echoes.',
    // Status
    'status.loading': 'Loading...',
    'status.empty': 'No content yet',
    'status.emptyIssues': 'No issues available',
    'status.emptyCao': 'No rants yet',
    'status.error': 'Failed to load. Check network.',
    'status.articleMissing': 'Article not found',
    'status.articleError': 'Invalid parameters',
    // About
    'about.label': 'ABOUT',
    'about.title': 'Through the Clamor, Insight Echoes.',
    'about.p1': 'Dawn Vision is a daily AI deep-dive newsletter; covering the frontier of AI every day.',
    'about.p2': 'We distill the most valuable signals from the noise, using structured analysis and independent judgment to help you see the real direction of the industry.',
    'about.p3': 'No clickbait, no outrage — only calm observation, solid data, and clear frameworks.',
    'about.content': 'CONTENT · STRUCTURE',
    'about.content1Title': 'Cover Story',
    'about.content1Desc': 'One in-depth feature per issue, focused on the most important industry topic.',
    'about.content2Title': 'Briefs',
    'about.content2Desc': 'Curated key updates, concise and essential.',
    'about.content3Title': 'Cao!',
    'about.content3Desc': 'Ranting about the absurdities of the tech world.',
    'about.frequency': 'FREQUENCY',
    'about.freqMain': 'Daily publication, every weekday.',
    'about.freqSub': 'Special editions may be published for major events.',
    'about.follow': 'FOLLOW US',
    'about.website': 'Website',
    'about.rss': 'RSS Feed',
    // Cao
    'cao.intro': 'The absurdities of tech — let\'s rant together.',
    // Article
    'article.cognitive': 'COGNITIVE NOTES',
    'article.about': 'ABOUT THIS ARTICLE',
    'article.related': 'MORE FROM THIS ISSUE',
    // Issue
    'issue.expand': 'Expand',
    'issue.briefs': ' briefs',
    // Toast
    'toast.loadFail': 'Load failed. Check network.',
    'toast.copied': 'URL copied',
    'toast.rssCopied': 'RSS URL copied',
    // Share
    'share.default': 'Dawn Vision — Through the Clamor, Insight Echoes.',
    'share.articles': 'Dawn Vision — All Issues',
    'share.cao': 'Dawn Vision — Cao!',
    // Footer
    'footer.brand': 'DAWN VISION',
    'footer.tagline': 'Through the Clamor, Insight Echoes.',
    // New content banner
    'newContent.title': 'New content available',
    'newContent.desc': 'A new issue has been published.',
    'newContent.action': 'View',
    'newContent.dismiss': 'Later',
  }
};

/**
 * 获取翻译文本
 * @param {string} key - 翻译键
 * @param {string} lang - 语言 'zh' | 'en'
 * @returns {string}
 */
function t(key, lang) {
  var l = lang || 'zh';
  return (messages[l] && messages[l][key]) || (messages.zh && messages.zh[key]) || key;
}

/**
 * 获取当前语言的所有翻译（key 转为下划线格式，WXML 可直接访问）
 * 例如 'section.focus' -> 'section_focus'
 * @param {string} lang - 语言 'zh' | 'en'
 * @returns {object}
 */
function getMessages(lang) {
  var l = lang || 'zh';
  var raw = messages[l] || messages.zh;
  var flat = {};
  for (var key in raw) {
    if (raw.hasOwnProperty(key)) {
      var flatKey = key.replace(/\./g, '_');
      flat[flatKey] = raw[key];
    }
  }
  return flat;
}

module.exports = {
  t: t,
  getMessages: getMessages,
  messages: messages
};
