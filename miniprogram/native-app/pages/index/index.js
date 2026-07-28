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
    i18n: {}
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

      // 提取当前语言的封面数据
      var coverData = data.cover ? {
        slug: data.cover.slug,
        title: self.data.lang === 'en'
          ? (data.cover.title_short_en || data.cover.title_en || data.cover.title)
          : (data.cover.title_short || data.cover.title),
        deck: self.data.lang === 'en'
          ? (data.cover.deck_en || data.cover.deck)
          : data.cover.deck,
        readTime: self.data.lang === 'en'
          ? (data.cover.read_time_en || data.cover.read_time)
          : data.cover.read_time
      } : null;

      self.setData({
        loading: false,
        latestIssue: data.issue,
        latestCover: coverData
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
