// app.js
App({
  globalData: {
    baseUrl: 'https://www.dawnvision.cn/api',
    brandColor: '#002FA7',
    issues: [],
    latestIssue: null
  },

  onLaunch: function () {
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
