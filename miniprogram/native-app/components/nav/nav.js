// components/nav/nav.js - 自定义导航组件（仅4链接+搜索）
Component({
  properties: {
    // 变体：home（透明）| inner（白色磨砂）| cao（深色磨砂）
    variant: {
      type: String,
      value: 'inner'
    },
    // 当前激活页面：home / articles / cao / about
    active: {
      type: String,
      value: ''
    }
  },

  methods: {
    // 页面跳转
    goPage: function (e) {
      const page = e.currentTarget.dataset.page;
      const pageMap = {
        home: '/pages/index/index',
        articles: '/pages/articles/articles',
        cao: '/pages/cao/cao',
        about: '/pages/about/about'
      };

      const url = pageMap[page];
      if (!url) return;

      // 如果不是当前页，跳转
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const currentRoute = '/' + currentPage.route;

      if (currentRoute !== url) {
        wx.redirectTo({ url: url });
      }
    },

    // 触发搜索
    onSearch: function () {
      const app = getApp();
      if (app && typeof app.openSearch === 'function') {
        app.openSearch();
      }
    }
  }
});
