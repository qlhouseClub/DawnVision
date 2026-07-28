// pages/cao/cao.js
// 槽点专栏列表页
var api = require('../../utils/api.js');
var i18nContent = require('../../utils/i18n-content.js');
var i18nUtil = require('../../utils/i18n.js');

// i18n.js 的 getMessages() 返回的对象键带点（如 'section.cao'），
// WXML 无法通过 {{i18n.section.cao}} 访问（点号会被解析为嵌套属性）。
// 这里把点分键拍平为下划线键（'section_cao'），使 WXML 可用 {{i18n.section_cao}} 直接取值。
function flattenI18n(messages) {
  var result = {};
  if (!messages) return result;
  Object.keys(messages).forEach(function (key) {
    result[key.replace(/\./g, '_')] = messages[key];
  });
  return result;
}

Page({
  data: {
    loading: true,
    // 接口原始列表，语言切换时用它重新提取，无需重新请求
    rawCaoList: [],
    // 当前语言下的展示列表（由 extractCaoList 产出）
    caoList: [],
    error: '',
    searchVisible: false,
    lang: 'zh',
    i18n: {}
  },

  onLoad: function () {
    var app = getApp();
    var lang = (app && app.globalData && app.globalData.lang) || 'zh';
    this.setData({
      lang: lang,
      i18n: flattenI18n(i18nUtil.getMessages(lang))
    });
    this.loadCaoList();
  },

  onShow: function () {
    // 仅在未加载且无数据时补拉，避免与 onLoad 重复请求
    if (!this.data.loading && this.data.rawCaoList.length === 0) {
      this.loadCaoList();
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    var self = this;
    this.loadCaoList(true).then(function () {
      wx.stopPullDownRefresh();
    }).catch(function () {
      wx.stopPullDownRefresh();
    });
  },

  // 加载槽点文章列表
  loadCaoList: function (forceRefresh) {
    var self = this;
    this.setData({ loading: true, error: '' });

    return api.getCaoList(forceRefresh).then(function (list) {
      var rawList = list || [];
      self.setData({ rawCaoList: rawList });
      self.renderCaoList();
    }).catch(function (err) {
      console.error('加载槽点列表失败', err);
      self.setData({
        loading: false,
        rawCaoList: [],
        caoList: [],
        error: self.data.i18n.status_error
      });
      wx.showToast({
        title: self.data.i18n.toast_loadFail,
        icon: 'none'
      });
    });
  },

  // 按当前语言提取并渲染列表
  renderCaoList: function () {
    var caoList = i18nContent.extractCaoList(this.data.rawCaoList, this.data.lang);
    this.setData({
      loading: false,
      caoList: caoList
    });
  },

  // 跳转到文章详情
  goToArticle: function (e) {
    var issueNum = e.currentTarget.dataset.issue;
    var slug = e.currentTarget.dataset.slug;

    if (issueNum && slug) {
      wx.navigateTo({
        url: '/pages/article/article?issue=' + issueNum + '&slug=' + slug + '&type=cao'
      });
    }
  },

  // 关闭搜索
  onSearchClose: function () {
    this.setData({ searchVisible: false });
  },

  // 语言切换：更新语言后用新语言重新提取内容（无需重新请求接口）
  onLangChange: function (e) {
    var lang = e.detail.lang;
    this.setData({
      lang: lang,
      i18n: flattenI18n(i18nUtil.getMessages(lang))
    });
    this.renderCaoList();
  },

  // 分享给朋友
  onShareAppMessage: function () {
    return {
      title: this.data.i18n.share_cao,
      path: '/pages/cao/cao'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return { title: this.data.i18n.share_cao };
  }
});
