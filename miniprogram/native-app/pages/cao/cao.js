// pages/cao/cao.js
// 槽点专栏列表页：每页8条分页
var api = require('../../utils/api.js');
var i18nContent = require('../../utils/i18n-content.js');
var i18nUtil = require('../../utils/i18n.js');

var PAGE_SIZE = 8;

Page({
  data: {
    loading: true,
    rawCaoList: [],
    caoList: [],        // 当前语言的完整列表
    displayList: [],    // 当前页展示的列表
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    error: '',
    searchVisible: false,
    lang: 'zh',
    i18n: {},
    newContentVisible: false
  },

  onLoad: function() {
    var app = getApp();
    var lang = (app && app.globalData && app.globalData.lang) || 'zh';
    this.setData({
      lang: lang,
      i18n: i18nUtil.getMessages(lang)
    });
    this.loadCaoList();
  },

  onShow: function() {
    // 无数据时正常加载
    if (!this.data.loading && this.data.rawCaoList.length === 0) {
      this.loadCaoList();
      return;
    }
    // 有数据时，检查缓存年龄，超过2小时则后台静默刷新
    if (this.data.rawCaoList.length > 0) {
      var age = api.getCacheAgeHours('dv_cao_v2');
      if (age > 2) {
        this._backgroundRefresh();
      }
    }
  },

  /**
   * 后台静默刷新槽点列表
   * 有新内容时显示通知条
   */
  _backgroundRefresh: function() {
    var self = this;
    api.getCaoList(true).then(function(list) {
      if (!list) return;
      var oldLen = self.data.rawCaoList.length;
      var newLen = list.length;

      // 有新内容，显示通知条（不直接替换）
      if (newLen > oldLen && oldLen > 0) {
        self._pendingNewCaoList = list;
        self.setData({ newContentVisible: true });
      }
    }).catch(function(err) {
      console.warn('后台刷新槽点列表失败', err);
    });
  },

  /**
   * 用户点击通知条"查看"按钮
   */
  onNewContentAction: function() {
    var list = this._pendingNewCaoList;
    if (!list) {
      this.setData({ newContentVisible: false });
      return;
    }

    this.setData({
      rawCaoList: list,
      currentPage: 1,
      newContentVisible: false
    });
    this.renderCaoList();
    this._pendingNewCaoList = null;

    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  /**
   * 用户关闭通知条
   */
  onNewContentDismiss: function() {
    this.setData({ newContentVisible: false });
    this._pendingNewCaoList = null;
  },

  onPullDownRefresh: function() {
    var self = this;
    this.loadCaoList(true).then(function() {
      wx.stopPullDownRefresh();
    }).catch(function() {
      wx.stopPullDownRefresh();
    });
  },

  loadCaoList: function(forceRefresh) {
    var self = this;
    this.setData({ loading: true, error: '' });

    return api.getCaoList(forceRefresh).then(function(list) {
      var rawList = list || [];
      self.setData({ rawCaoList: rawList });
      self.renderCaoList();
    }).catch(function(err) {
      console.error('加载槽点列表失败', err);
      self.setData({
        loading: false,
        rawCaoList: [],
        caoList: [],
        displayList: [],
        error: self.data.i18n.status_error
      });
    });
  },

  renderCaoList: function() {
    var caoList = i18nContent.extractCaoList(this.data.rawCaoList, this.data.lang);
    var totalPages = Math.ceil(caoList.length / PAGE_SIZE);
    if (totalPages < 1) totalPages = 1;

    // 重置到第一页
    this.setData({
      loading: false,
      caoList: caoList,
      currentPage: 1,
      totalPages: totalPages
    });
    this.renderPage();
  },

  // 渲染当前页
  renderPage: function() {
    var page = this.data.currentPage;
    var start = (page - 1) * PAGE_SIZE;
    var end = start + PAGE_SIZE;
    var displayList = this.data.caoList.slice(start, end);

    this.setData({
      displayList: displayList,
      hasNext: page < this.data.totalPages,
      hasPrev: page > 1
    });
  },

  // 下一页
  nextPage: function() {
    if (!this.data.hasNext) return;
    this.setData({ currentPage: this.data.currentPage + 1 });
    this.renderPage();
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  // 上一页
  prevPage: function() {
    if (!this.data.hasPrev) return;
    this.setData({ currentPage: this.data.currentPage - 1 });
    this.renderPage();
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  goToArticle: function(e) {
    var issueNum = e.currentTarget.dataset.issue;
    var slug = e.currentTarget.dataset.slug;
    if (issueNum && slug) {
      wx.navigateTo({
        url: '/pages/article/article?issue=' + issueNum + '&slug=' + slug + '&type=cao'
      });
    }
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
    this.renderCaoList();
  },

  onShareAppMessage: function() {
    return {
      title: this.data.i18n.share_cao,
      path: '/pages/cao/cao'
    };
  },

  onShareTimeline: function() {
    return { title: this.data.i18n.share_cao };
  }
});
