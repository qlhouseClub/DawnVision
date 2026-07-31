// components/new-content-banner/new-content-banner.js
// 新内容通知条：发现有新一期时顶部滑入提示
var i18nUtil = require('../../utils/i18n.js');

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    // 最新期数，用于显示
    issueNumber: {
      type: Number,
      value: 0
    }
  },

  data: {
    show: false,
    lang: 'zh',
    i18n: {}
  },

  observers: {
    'visible': function(val) {
      var self = this;
      if (val) {
        // 先插入 DOM，下一帧加动画类
        this.setData({ show: true });
        setTimeout(function() {
          self.setData({ animShow: true });
        }, 30);
      } else {
        // 先移除动画类，等动画结束再移除 DOM
        this.setData({ animShow: false });
        setTimeout(function() {
          self.setData({ show: false });
        }, 350);
      }
    }
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

  methods: {
    onAction: function() {
      this.triggerEvent('action');
    },
    onDismiss: function() {
      this.triggerEvent('dismiss');
    }
  }
});
