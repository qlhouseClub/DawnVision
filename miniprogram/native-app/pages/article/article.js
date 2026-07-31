// pages/article/article.js
var api = require('../../utils/api.js');
var format = require('../../utils/format.js');
var i18nContent = require('../../utils/i18n-content.js');
var i18nUtil = require('../../utils/i18n.js');
var htmlParser = require('../../utils/html-parser.js');

Page({
  data: {
    loading: true,
    rawArticle: null,
    article: null,
    issueNumber: '',
    issueNumberDisplay: '',
    articleSlug: '',
    processedHtml: '',
    bodyNodes: [],
    relatedArticles: [],
    errorMsg: '',
    searchVisible: false,
    lang: 'zh',
    i18n: {}
  },

  onLoad: function(options) {
    var app = getApp();
    var lang = (app && app.globalData && app.globalData.lang) || 'zh';
    this.setData({
      lang: lang,
      i18n: i18nUtil.getMessages(lang)
    });

    var issueNum = options.issue;
    var slug = options.slug;

    if (!issueNum || !slug) {
      this.setData({
        loading: false,
        errorMsg: this.data.i18n.status_articleError
      });
      return;
    }

    var issueNumberDisplay = format.formatIssueNumber(issueNum);

    this.setData({
      issueNumber: issueNum,
      issueNumberDisplay: issueNumberDisplay,
      articleSlug: slug
    });

    this.loadArticle(issueNum, slug);
  },

  previewImage: function(e) {
    var src = e.currentTarget.dataset.src;
    if (!src) return;
    wx.previewImage({
      urls: [src],
      current: src
    });
  },

  /**
   * 点击正文中的链接
   * 弹出操作菜单：复制链接 / 在浏览器打开
   */
  onLinkTap: function(e) {
    var href = e.currentTarget.dataset.href;
    if (!href) return;

    var self = this;
    wx.showActionSheet({
      itemList: ['复制链接', '在浏览器打开'],
      success: function(res) {
        if (res.tapIndex === 0) {
          // 复制链接
          wx.setClipboardData({
            data: href,
            success: function() {
              wx.showToast({
                title: '链接已复制',
                icon: 'success',
                duration: 1500
              });
            }
          });
        } else if (res.tapIndex === 1) {
          // 在浏览器打开
          wx.setClipboardData({
            data: href,
            success: function() {
              wx.showToast({
                title: '链接已复制，请在浏览器粘贴',
                icon: 'none',
                duration: 2000
              });
            }
          });
        }
      }
    });
  },

  onPullDownRefresh: function() {
    var self = this;
    var data = this.data;
    if (data.issueNumber && data.articleSlug) {
      this.loadArticle(data.issueNumber, data.articleSlug, true).then(function() {
        wx.stopPullDownRefresh();
      }).catch(function() {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  },

  loadArticle: function(issueNum, slug, forceRefresh) {
    var self = this;
    this.setData({ loading: true, errorMsg: '' });

    return api.getArticle(issueNum, slug, forceRefresh).then(function(article) {
      if (!article) {
        self.setData({
          loading: false,
          errorMsg: self.data.i18n.status_articleMissing
        });
        return;
      }

      // 保存原始数据，提取当前语言版本
      var extracted = i18nContent.extractArticle(article, self.data.lang);
      var bodyNodes = htmlParser.parseArticleHtml(extracted.bodyHtml || '');

      self.setData({
        loading: false,
        rawArticle: article,
        article: extracted,
        bodyNodes: bodyNodes
      });

      // 加载相关推荐
      self.loadRelatedArticles(issueNum, slug);
    }).catch(function(err) {
      console.error('加载文章失败', err);
      self.setData({
        loading: false,
        errorMsg: err.message || self.data.i18n.status_error
      });
    });
  },

  loadRelatedArticles: function(issueNum, currentSlug) {
    var self = this;
    api.getIssue(issueNum).then(function(issueData) {
      if (!issueData) return;

      var related = [];

      if (issueData.cover && issueData.cover.slug !== currentSlug) {
        var coverExtracted = i18nContent.extractArticle(issueData.cover, self.data.lang);
        related.push({
          slug: issueData.cover.slug,
          title: coverExtracted.title,
          deck: coverExtracted.deck,
          category: coverExtracted.category
        });
      }

      if (issueData.briefs && issueData.briefs.length > 0) {
        issueData.briefs.forEach(function(brief) {
          if (brief.slug !== currentSlug) {
            var briefExtracted = i18nContent.extractArticle(brief, self.data.lang);
            related.push({
              slug: brief.slug,
              title: briefExtracted.title,
              deck: briefExtracted.deck,
              category: briefExtracted.category
            });
          }
        });
      }

      self.setData({ relatedArticles: related.slice(0, 5) });
    }).catch(function(err) {
      console.error('加载相关文章失败', err);
    });
  },

  goToRelated: function(e) {
    var slug = e.currentTarget.dataset.slug;
    var issueNum = this.data.issueNumber;
    if (issueNum && slug) {
      wx.redirectTo({
        url: '/pages/article/article?issue=' + issueNum + '&slug=' + slug
      });
    }
  },

  onSearchClose: function() {
    this.setData({ searchVisible: false });
  },

  onLangChange: function(e) {
    var lang = e.detail.lang;
    var self = this;
    this.setData({
      lang: lang,
      i18n: i18nUtil.getMessages(lang)
    });

    // 如果已有原始数据，直接重新提取（不重新请求网络）
    if (this.data.rawArticle) {
      var extracted = i18nContent.extractArticle(this.data.rawArticle, lang);
      var bodyNodes = htmlParser.parseArticleHtml(extracted.bodyHtml || '');
      this.setData({
        article: extracted,
        bodyNodes: bodyNodes
      });

      // 重新提取相关推荐
      if (this.data.issueNumber && this.data.articleSlug) {
        this.loadRelatedArticles(this.data.issueNumber, this.data.articleSlug);
      }
    }
  },

  onShareAppMessage: function() {
    var data = this.data;
    var title = data.article ? data.article.title : 'Dawn Vision';
    var path = '/pages/article/article?issue=' + data.issueNumber + '&slug=' + data.articleSlug;
    return { title: title, path: path };
  },

  onShareTimeline: function() {
    var data = this.data;
    return { title: data.article ? data.article.title : 'Dawn Vision' };
  }
});
