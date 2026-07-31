// utils/i18n-content.js - 从数据库双字段中提取当前语言内容
//
// 数据库返回的文章对象同时包含中英文字段：
//   title / title_en
//   deck / deck_en
//   body_html / body_html_en
//   read_time / read_time_en
//   等
//
// 当 lang='zh' 时用中文字段，lang='en' 时用英文字段（英文为空则回退中文）

var htmlParser = require('./html-parser.js');

/**
 * 给中文文本加中英文空格（仅中文模式）
 * 英文模式直接返回原文（英文不需要）
 */
function cjkSpace(text, isEn) {
  if (isEn) return text || '';
  return htmlParser.addCjkSpacingText(text || '');
}

/**
 * 从文章对象提取当前语言的展示数据
 * @param {object} article - 数据库返回的原始文章对象
 * @param {string} lang - 'zh' | 'en'
 * @returns {object} 提取后的文章展示数据
 */
function extractArticle(article, lang) {
  if (!article) return null;

  var isEn = lang === 'en';

  // 标题：英文为空时回退中文
  var title = cjkSpace(isEn ? (article.title_en || article.title) : article.title, isEn);
  var titleShort = cjkSpace(isEn ? (article.title_short_en || article.title_short) : (article.title_short || article.title), isEn);
  var deck = cjkSpace(isEn ? (article.deck_en || article.deck) : article.deck, isEn);
  var bodyHtml = isEn ? (article.body_html_en || article.body_html) : article.body_html;
  var readTime = cjkSpace(isEn ? (article.read_time_en || article.read_time) : article.read_time, isEn);
  var cognitiveNotes = cjkSpace(isEn ? (article.cognitive_notes_en || article.cognitive_notes) : article.cognitive_notes, isEn);
  var sourceSummary = cjkSpace(isEn ? (article.source_summary_en || article.source_summary) : article.source_summary, isEn);
  var keywords = cjkSpace(isEn ? (article.keywords_en || article.keywords) : article.keywords, isEn);

  // 分类
  var category = '';
  if (article.article_type === 'cover') {
    category = isEn ? 'Cover' : '封面';
  } else if (article.article_type === 'cao') {
    category = isEn ? 'Cao!' : '槽点';
  } else {
    // brief
    category = cjkSpace(isEn ? (article.category_en || article.category || 'Brief') : (article.category || '资讯'), isEn);
  }

  // Pull Quote
  var pullQuote = null;
  if (article.pull_quote) {
    var pqText = cjkSpace(isEn ? (article.pull_quote.text_en || article.pull_quote.text) : article.pull_quote.text, isEn);
    var pqAttr = cjkSpace(isEn ? (article.pull_quote.attr_en || article.pull_quote.attr) : article.pull_quote.attr, isEn);
    if (pqText) {
      pullQuote = { text: pqText, attr: pqAttr || '' };
    }
  } else {
    // 数据库 API 返回的扁平字段
    var pqTextFlat = cjkSpace(isEn ? (article.pull_quote_text_en || article.pull_quote_text) : article.pull_quote_text, isEn);
    var pqAttrFlat = cjkSpace(isEn ? (article.pull_quote_attr_en || article.pull_quote_attr) : article.pull_quote_attr, isEn);
    if (pqTextFlat) {
      pullQuote = { text: pqTextFlat, attr: pqAttrFlat || '' };
    }
  }

  // Sources（来源标题也加中英文空格）
  var sources = (article.sources || []).map(function(s) {
    return {
      title: cjkSpace(s.title || '', isEn),
      url: s.url || '',
      site: s.site || ''
    };
  });

  return {
    slug: article.slug,
    article_type: article.article_type || '',
    title: title || '',
    titleShort: titleShort || '',
    deck: deck || '',
    bodyHtml: bodyHtml || '',
    readTime: readTime || '',
    keywords: keywords || '',
    category: category,
    cognitiveNotes: cognitiveNotes || '',
    sourceSummary: sourceSummary || '',
    pullQuote: pullQuote,
    sources: sources,
    wordCount: article.word_count || 0
  };
}

/**
 * 从期数列表项中提取展示数据
 * @param {object} issueItem - { issue:{number,date,date_display}, cover, brief_count, has_cao }
 * @param {string} lang
 * @returns {object}
 */
function extractIssueListItem(item, lang) {
  if (!item) return null;
  var isEn = lang === 'en';

  var cover = item.cover;
  var coverDisplay = null;
  if (cover) {
    coverDisplay = {
      slug: cover.slug,
      title: cjkSpace(isEn ? (cover.title_short_en || cover.title_en || cover.title) : (cover.title_short || cover.title), isEn),
      deck: cjkSpace(isEn ? (cover.deck_en || cover.deck) : cover.deck, isEn),
      readTime: cjkSpace(isEn ? (cover.read_time_en || cover.read_time) : cover.read_time, isEn)
    };
  }

  return {
    issue: item.issue,
    cover: coverDisplay,
    briefCount: item.brief_count || 0,
    hasCao: item.has_cao || false
  };
}

/**
 * 从期数详情中提取完整展示数据（含 cover + briefs + cao）
 * @param {object} issueData - 数据库返回的完整期数对象
 * @param {string} lang
 * @returns {object}
 */
function extractIssue(issueData, lang) {
  if (!issueData) return null;

  return {
    issue: issueData.issue,
    cover: extractArticle(issueData.cover, lang),
    briefs: (issueData.briefs || []).map(function(b) { return extractArticle(b, lang); }),
    cao: extractArticle(issueData.cao, lang)
  };
}

/**
 * 从搜索结果中提取展示数据
 * @param {array} results - 搜索结果数组
 * @param {string} lang
 * @returns {array}
 */
function extractSearchResults(results, lang) {
  if (!results || results.length === 0) return [];
  var isEn = lang === 'en';

  return results.map(function(r) {
    return {
      id: r.id,
      slug: r.slug,
      issue: r.issue,
      title: cjkSpace(isEn ? (r.title_en || r.title) : r.title, isEn),
      titleShort: cjkSpace(isEn ? (r.title_short_en || r.title_short || r.title_en || r.title) : (r.title_short || r.title), isEn),
      deck: cjkSpace(isEn ? (r.deck_en || r.deck) : r.deck, isEn),
      category: cjkSpace(isEn ? (r.category_en || r.category) : r.category, isEn),
      excerpt: cjkSpace(isEn ? (r.deck_en || r.deck || r.excerpt) : (r.deck || r.excerpt), isEn)
    };
  });
}

/**
 * 从槽点列表中提取展示数据
 * @param {array} caoList - 数据库返回的槽点列表
 * @param {string} lang
 * @returns {array}
 */
function extractCaoList(caoList, lang) {
  if (!caoList || caoList.length === 0) return [];
  var isEn = lang === 'en';

  return caoList.map(function(item) {
    return {
      slug: item.slug,
      title: cjkSpace(isEn ? (item.title_en || item.title) : item.title, isEn),
      deck: cjkSpace(isEn ? (item.deck_en || item.deck) : item.deck, isEn),
      readTime: cjkSpace(isEn ? (item.read_time_en || item.read_time) : item.read_time, isEn),
      issue: item.issue
    };
  });
}

/**
 * 从最新封面数据中提取展示数据（首页用）
 * @param {object} data - { issue, cover }
 * @param {string} lang
 * @returns {object}
 */
function extractCover(data, lang) {
  if (!data || !data.cover) return { issue: data ? data.issue : null, cover: null };
  var isEn = lang === 'en';
  var cover = data.cover;
  var coverDisplay = {
    slug: cover.slug,
    title: cjkSpace(isEn ? (cover.title_short_en || cover.title_en || cover.title) : (cover.title_short || cover.title), isEn),
    deck: cjkSpace(isEn ? (cover.deck_en || cover.deck) : cover.deck, isEn),
    readTime: cjkSpace(isEn ? (cover.read_time_en || cover.read_time) : cover.read_time, isEn)
  };
  return {
    issue: data.issue,
    cover: coverDisplay
  };
}

module.exports = {
  extractArticle: extractArticle,
  extractIssueListItem: extractIssueListItem,
  extractIssue: extractIssue,
  extractSearchResults: extractSearchResults,
  extractCaoList: extractCaoList,
  extractCover: extractCover
};
