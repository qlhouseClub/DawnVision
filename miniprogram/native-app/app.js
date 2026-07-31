// app.js
App({
  globalData: {
    baseUrl: 'https://www.dawnvision.cn/api',
    brandColor: '#002FA7',
    issues: [],
    latestIssue: null,
    lang: 'zh',
    searchVisible: false
  },

  onLaunch: function () {
    // 读取语言设置
    try {
      const savedLang = wx.getStorageSync('dv_lang');
      if (savedLang) {
        this.globalData.lang = savedLang;
      }
    } catch (e) {}

    // 启动时尝试从缓存加载期数列表
    try {
      const cachedIssues = wx.getStorageSync('issues_list');
      if (cachedIssues && cachedIssues.length > 0) {
        this.globalData.issues = cachedIssues;
        this.globalData.latestIssue = cachedIssues[0];
      }
    } catch (e) {
      console.warn('读取缓存失败', e);
    }

    // 加载 Source Serif 4 字体（数字/英文/符号字形对齐网站）
    this._loadSourceSerif4();
  },

  /**
   * 加载 Source Serif 4 字体
   * 对齐网站字体，确保数字、符号（尤其 0、$ 等）字形一致
   * 加载失败则静默回退到 Noto Serif SC / Georgia
   */
  _loadSourceSerif4: function () {
    // 同一个 App 会话内只加载一次
    if (this._sourceSerifLoaded) return;
    this._sourceSerifLoaded = true;

    var fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/source-serif-4@5/files/source-serif-4-latin-400-normal.woff2';
    var fontUrlBold = 'https://cdn.jsdelivr.net/npm/@fontsource/source-serif-4@5/files/source-serif-4-latin-700-normal.woff2';
    var fontUrlBlack = 'https://cdn.jsdelivr.net/npm/@fontsource/source-serif-4@5/files/source-serif-4-latin-900-normal.woff2';
    var fontUrlItalic = 'https://cdn.jsdelivr.net/npm/@fontsource/source-serif-4@5/files/source-serif-4-latin-400-italic.woff2';
    var fontUrlBoldItalic = 'https://cdn.jsdelivr.net/npm/@fontsource/source-serif-4@5/files/source-serif-4-latin-700-italic.woff2';
    var fontUrlBlackItalic = 'https://cdn.jsdelivr.net/npm/@fontsource/source-serif-4@5/files/source-serif-4-latin-900-italic.woff2';

    // 逐个加载不同字重
    var fonts = [
      { family: 'Source Serif 4', weight: 400, style: 'normal', source: fontUrl },
      { family: 'Source Serif 4', weight: 700, style: 'normal', source: fontUrlBold },
      { family: 'Source Serif 4', weight: 900, style: 'normal', source: fontUrlBlack },
      { family: 'Source Serif 4', weight: 400, style: 'italic', source: fontUrlItalic },
      { family: 'Source Serif 4', weight: 700, style: 'italic', source: fontUrlBoldItalic },
      { family: 'Source Serif 4', weight: 900, style: 'italic', source: fontUrlBlackItalic }
    ];

    fonts.forEach(function (f) {
      try {
        wx.loadFontFace({
          family: f.family,
          weight: f.weight.toString(),
          style: f.style,
          source: 'url("' + f.source + '")',
          success: function () {
            // 字体加载成功
          },
          fail: function (res) {
            console.warn('Source Serif 4 加载失败（' + f.weight + '/' + f.style + '）', res);
          }
        });
      } catch (e) {
        console.warn('字体加载调用异常', e);
      }
    });
  },

  // 打开搜索
  openSearch: function () {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    if (currentPage) {
      if (typeof currentPage.setData === 'function') {
        currentPage.setData({ searchVisible: true });
      }
    }
  },

  // 关闭搜索
  closeSearch: function () {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    if (currentPage) {
      if (typeof currentPage.setData === 'function') {
        currentPage.setData({ searchVisible: false });
      }
    }
  },

  // 全局缓存管理
  setCache: function (key, data, expireHours) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        expireHours: expireHours || 24
      };
      wx.setStorageSync(key, cacheData);
    } catch (e) {
      console.warn('设置缓存失败', e);
    }
  },

  getCache: function (key) {
    try {
      const cacheData = wx.getStorageSync(key);
      if (!cacheData || !cacheData.timestamp) return null;
      const expireMs = (cacheData.expireHours || 24) * 60 * 60 * 1000;
      if (Date.now() - cacheData.timestamp > expireMs) {
        return null;
      }
      return cacheData.data;
    } catch (e) {
      return null;
    }
  }
});
