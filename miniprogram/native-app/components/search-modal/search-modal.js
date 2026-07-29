// components/search-modal/search-modal.js
// 搜索组件：调用服务器端搜索 API，支持双语显示和关键词高亮
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

    doSearch: function(query) {
      var self = this;
      api.search(query).then(function(rawResults) {
        var results = i18nContent.extractSearchResults(rawResults, self.data.lang);
        // 给每个结果添加高亮后的富文本字段
        var keyword = query.trim();
        results.forEach(function(r) {
          r.titleHtml = self.highlightKeyword(r.title || '', keyword);
          r.excerptHtml = self.highlightKeyword(r.excerpt || '', keyword);
        });
        self.setData({
          results: results,
          searching: false
        });
      }).catch(function(err) {
        console.error('搜索失败', err);
        self.setData({ searching: false, results: [] });
      });
    },

    // 关键词高亮：返回 rich-text 可用的 HTML
    highlightKeyword: function(text, keyword) {
      if (!text || !keyword) return text || '';
      // 转义 HTML 特殊字符
      var escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      // 转义关键词中的正则特殊字符
      var escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var regex = new RegExp('(' + escapedKeyword + ')', 'gi');
      return escaped.replace(regex, '<span style="color:#002FA7;font-weight:700;">$1</span>');
    },

    onResultTap: function(e) {
      var index = e.currentTarget.dataset.index;
      var result = this.data.results[index];
      if (!result) return;

      this.close();
      wx.navigateTo({
        url: '/pages/article/article?issue=' + result.issue + '&slug=' + result.slug
      });
    },

    onConfirm: function() {
      if (this.data.results.length > 0) {
        this.onResultTap({ currentTarget: { dataset: { index: 0 } } });
      }
    },

    onOverlayTap: function() {
      this.close();
    },

    onModalTap: function() {},

    close: function() {
      this.triggerEvent('close');
    },

    onLangChange: function(e) {
      var lang = e.detail.lang;
      this.setData({
        lang: lang,
        i18n: i18nUtil.getMessages(lang)
      });
      if (this.data.query.trim() && this.data.results.length > 0) {
        this.doSearch(this.data.query);
      }
    }
  }
});
