// pages/about/about.js
// 关于页：严格复刻网站的作者展示页
var i18nUtil = require('../../utils/i18n.js');

Page({
  data: {
    version: '1.0.0',
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

    var accountInfo = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null;
    if (accountInfo && accountInfo.miniProgram) {
      this.setData({
        version: accountInfo.miniProgram.version || '1.0.0'
      });
    }
  },

  copyPhone: function() {
    wx.setClipboardData({
      data: '18622454349',
      success: function() {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
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
  },

  onShareAppMessage: function() {
    return {
      title: 'Dawn Vision',
      path: '/pages/about/about'
    };
  },

  onShareTimeline: function() {
    return { title: 'Dawn Vision' };
  }
});
