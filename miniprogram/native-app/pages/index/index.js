// pages/index/index.js
var api = require('../../utils/api.js');
var i18nContent = require('../../utils/i18n-content.js');
var i18nUtil = require('../../utils/i18n.js');

Page({
  data: {
    loading: true,
    latestIssue: null,
    latestCover: null,
    error: '',
    searchVisible: false,
    lang: 'zh',
    i18n: {},
    newContentVisible: false,
    newContentIssue: 0
  },

  onLoad: function() {
    var app = getApp();
    var lang = (app && app.globalData && app.globalData.lang) || 'zh';
    this.setData({
      lang: lang,
      i18n: i18nUtil.getMessages(lang)
    });
    this.loadData();
  },

  onShow: function() {
    // 已有数据时，检查缓存年龄，超过1小时则后台静默刷新
    if (this.data.latestIssue) {
      var age = api.getCacheAgeHours('dv_latest_v2');
      if (age > 1) {
        this._backgroundRefresh();
      }
    }
  },

  /**
   * 后台静默刷新最新封面
   * 有新内容时显示通知条，用户点击后才更新
   */
  _backgroundRefresh: function() {
    var self = this;
    api.getLatestCover(true).then(function(data) {
      if (!data) return;

      var oldNum = self.data.latestIssue ? self.data.latestIssue.number : 0;
      var newNum = data.issue ? data.issue.number : 0;

      // 期数变多了，显示通知条（不直接替换，用户点击"查看"才更新）
      if (newNum > oldNum && oldNum > 0) {
        self._pendingNewData = data;
        self.setData({
          newContentVisible: true,
          newContentIssue: newNum
        });
      }
    }).catch(function(err) {
      console.warn('后台刷新最新封面失败', err);
    });
  },

  /**
   * 用户点击通知条"查看"按钮
   */
  onNewContentAction: function() {
    var data = this._pendingNewData;
    if (!data) {
      this.setData({ newContentVisible: false });
      return;
    }

    var extracted = i18nContent.extractCover(data, this.data.lang);
    this.setData({
      latestIssue: extracted.issue,
      latestCover: extracted.cover,
      newContentVisible: false
    });
    this._pendingNewData = null;

    // 滚到顶部
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  /**
   * 用户关闭通知条
   */
  onNewContentDismiss: function() {
    this.setData({ newContentVisible: false });
    this._pendingNewData = null;
  },

  onPullDownRefresh: function() {
    var self = this;
    this.loadData(true).then(function() {
      wx.stopPullDownRefresh();
    }).catch(function() {
      wx.stopPullDownRefresh();
    });
  },

  loadData: function(forceRefresh) {
    var self = this;
    this.setData({ loading: true, error: '' });

    return api.getLatestCover(forceRefresh).then(function(data) {
      if (!data) {
        self.setData({ loading: false, latestIssue: null, latestCover: null });
        return;
      }

      var extracted = i18nContent.extractCover(data, self.data.lang);
      self.setData({
        loading: false,
        latestIssue: extracted.issue,
        latestCover: extracted.cover
      });
    }).catch(function(err) {
      console.error('加载失败', err);
      self.setData({
        loading: false,
        error: self.data.i18n.status_error
      });
    });
  },

  goToCoverArticle: function() {
    var data = this.data;
    if (!data.latestIssue || !data.latestCover) return;
    var issueNum = data.latestIssue.number;
    var slug = data.latestCover.slug;
    if (issueNum && slug) {
      wx.navigateTo({
        url: '/pages/article/article?issue=' + issueNum + '&slug=' + slug
      });
    }
  },

  goToArticles: function() {
    wx.redirectTo({ url: '/pages/articles/articles' });
  },

  onSearchClose: function() {
    this.setData({ searchVisible: false });
  },

  onLangChange: function(e) {
    var lang = e.detail.lang;
    this.setData({
      lang: lang,
      i18n: i18nUtil.getMessages(lang)
    });
    // 重新加载以提取新语言内容
    this.loadData();
  },

  onShareAppMessage: function() {
    var cover = this.data.latestCover;
    return {
      title: cover ? cover.title : this.data.i18n.share_default,
      path: '/pages/index/index'
    };
  },

  onShareTimeline: function() {
    return { title: this.data.i18n.share_default };
  }
});
