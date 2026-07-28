// components/search-modal/search-modal.js
// 搜索组件：调用服务器端搜索 API，支持双语显示
var api = require('../../utils/api.js');
var i18nContent = require('../../utils/i18n-content.js');
var i18nUtil = require('../../utils/i18n.js');

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    query: '',
    results: [],
    searching: false,
    lang: 'zh',
    i18n: {}
  },

  lifetimes: {
    attached: function() {
      var app = getApp();
      var lang = (app && app.globalData && app.globalData.lang) || 'zh';
      this.setData({
        lang: lang,
        i18n: i18nUtil.getMessages(lang)
      });
    }
  },

  observers: {
    'visible': function(val) {
      if (!val) {
        this.setData({ query: '', results: [], searching: false });
      }
    }
  },

  methods: {
    // 输入处理（防抖）
    onInput: function(e) {
      var query = e.detail.value;
      this.setData({ query: query });

      if (this._timer) {
        clearTimeout(this._timer);
      }

      if (!query.trim()) {
        this.setData({ results: [], searching: false });
        return;
      }

      this.setData({ searching: true });

      var self = this;
      this._timer = setTimeout(function() {
        self.doSearch(query);
      }, 250);
    },

    // 调用服务器搜索 API
    doSearch: function(query) {
      var self = this;
      api.search(query).then(function(rawResults) {
        var results = i18nContent.extractSearchResults(rawResults, self.data.lang);
        self.setData({
          results: results,
          searching: false
        });
      }).catch(function(err) {
        console.error('搜索失败', err);
        self.setData({ searching: false, results: [] });
      });
    },

    // 点击结果跳转
    onResultTap: function(e) {
      var index = e.currentTarget.dataset.index;
      var result = this.data.results[index];
      if (!result) return;

      this.close();
      wx.navigateTo({
        url: '/pages/article/article?issue=' + result.issue + '&slug=' + result.slug
      });
    },

    // 确认搜索
    onConfirm: function() {
      if (this.data.results.length > 0) {
        this.onResultTap({ currentTarget: { dataset: { index: 0 } } });
      }
    },

    // 点击遮罩关闭
    onOverlayTap: function() {
      this.close();
    },

    onModalTap: function() {},

    close: function() {
      this.triggerEvent('close');
    },

    // 语言切换响应
    onLangChange: function(e) {
      var lang = e.detail.lang;
      this.setData({
        lang: lang,
        i18n: i18nUtil.getMessages(lang)
      });
      // 如果有搜索结果，重新提取当前语言的显示
      if (this.data.query.trim() && this.data.results.length > 0) {
        this.doSearch(this.data.query);
      }
    }
  }
});
