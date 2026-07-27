// pages/index/index.js
const api = require('../../utils/api.js');

Page({
  data: {
    loading: true,
    latestIssue: null,
    latestCover: null,
    error: ''
  },

  onLoad: function (options) {
    this.loadData();
  },

  onPullDownRefresh: function () {
    this.loadData(true).then(() => {
      wx.stopPullDownRefresh();
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载数据
  loadData: function (forceRefresh) {
    this.setData({ loading: true, error: '' });

    return api.getIssues(forceRefresh).then(issues => {
      if (!issues || issues.length === 0) {
        this.setData({
          loading: false,
          latestIssue: null,
          latestCover: null
        });
        return;
      }

      const latestIssue = issues[0];
      const latestCover = latestIssue.cover || null;

      this.setData({
        loading: false,
        latestIssue: latestIssue,
        latestCover: latestCover
      });
    }).catch(err => {
      console.error('加载期数列表失败', err);
      this.setData({
        loading: false,
        error: err.message || '加载失败，请检查网络'
      });
    });
  },

  // 跳转到封面文章
  goToCoverArticle: function () {
    const { latestIssue, latestCover } = this.data;
    if (!latestIssue || !latestCover) return;

    const issueNum = latestIssue.number;
    const slug = latestCover.slug;

    if (issueNum && slug) {
      wx.navigateTo({
        url: '/pages/article/article?issue=' + issueNum + '&slug=' + slug
      });
    }
  },

  // 跳转到文章列表
  goToArticles: function () {
    wx.switchTab({
      url: '/pages/articles/articles'
    });
  },

  // 分享
  onShareAppMessage: function () {
    const { latestCover } = this.data;
    const title = latestCover ? latestCover.title : 'Dawn Vision - 穿越嘈杂，洞见留声';
    return {
      title: title,
      path: '/pages/index/index'
    };
  },

  onShareTimeline: function () {
    return {
      title: 'Dawn Vision - 穿越嘈杂，洞见留声'
    };
  }
});
