// components/lang-switch/lang-switch.js
// 语言切换组件：切换中英文，通知页面刷新内容
Component({
  data: {
    lang: 'zh'
  },

  lifetimes: {
    attached: function() {
      var app = getApp();
      var lang = (app && app.globalData && app.globalData.lang) || 'zh';
      this.setData({ lang: lang });
    }
  },

  methods: {
    toggleLang: function() {
      var newLang = this.data.lang === 'zh' ? 'en' : 'zh';
      this.setData({ lang: newLang });

      // 更新全局状态
      var app = getApp();
      if (app && app.globalData) {
        app.globalData.lang = newLang;
      }

      // 持久化
      try {
        wx.setStorageSync('dv_lang', newLang);
      } catch (e) {}

      // 通知页面更新
      this.triggerEvent('change', { lang: newLang });
    }
  }
});
