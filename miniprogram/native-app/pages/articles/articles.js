// pages/articles/articles.js
const api = require('../../utils/api.js');

const app = getApp();

Page({
  data: {
    loading: true,
    issues: [],
    issueDetailMap: {},
    briefCountMap: {}
  },

  onLoad: function (options) {
    this.loadIssues();
  },

  onShow: function () {
    if (this.data.issues.length === 0) {
      this.loadIssues();
    }
  },

  onPullDownRefresh: function () {
    this.loadIssues(true).then(() => {
      wx.stopPullDownRefresh();
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载期数列表
  loadIssues: function (forceRefresh) {
    this.setData({ loading: true });

    return api.getIssues(forceRefresh).then(issues => {
      const processedIssues = (issues || []).map(issue => {
        const issueInfo = issue.issue || {};
        return {
          issue: {
            number: issueInfo.number || issue.number,
            date: issueInfo.date || issue.date,
            date_display: issueInfo.date_display || issue.date_display
          },
          cover: issue.cover || null,
          has_cao: issue.has_cao || false,
          brief_count: issue.brief_count || 0
        };
      });

      // 构建 briefCountMap
      const briefCountMap = {};
      processedIssues.forEach(issue => {
        const num = issue.issue.number;
        briefCountMap[num] = issue.brief_count || 0;
      });

      app.globalData.issues = processedIssues;

      this.setData({
        loading: false,
        issues: processedIssues,
        briefCountMap: briefCountMap
      });
    }).catch(err => {
      console.error('加载期数列表失败', err);
      this.setData({
        loading: false,
        issues: []
      });
      wx.showToast({
        title: '加载失败，请检查网络',
        icon: 'none'
      });
    });
  },

  // 展开/收起期数（加载详情）
  toggleIssue: function (e) {
    const index = e.currentTarget.dataset.index;
    const issue = this.data.issues[index];
    const issueNum = issue.issue.number;

    // 如果已经有详情了，不做操作（因为只有展开按钮，没有收起）
    if (this.data.issueDetailMap[issueNum]) {
      return;
    }

    // 请求期数详情
    wx.showLoading({ title: '加载中...' });
    api.getIssue(issueNum).then(issueData => {
      wx.hideLoading();
      const detailMap = this.data.issueDetailMap;
      const countMap = this.data.briefCountMap;
      
      detailMap[issueNum] = issueData;
      if (issueData.briefs) {
        countMap[issueNum] = issueData.briefs.length;
      }

      this.setData({
        issueDetailMap: detailMap,
        briefCountMap: countMap
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('加载期数详情失败', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 跳转到封面文章
  goToCoverArticle: function (e) {
    const issueNum = e.currentTarget.dataset.issue;
    const slug = e.currentTarget.dataset.slug;
    
    if (issueNum && slug) {
      wx.navigateTo({
        url: '/pages/article/article?issue=' + issueNum + '&slug=' + slug
      });
    }
  },

  // 跳转到文章详情
  goToArticle: function (e) {
    const issueNum = e.currentTarget.dataset.issue;
    const slug = e.currentTarget.dataset.slug;
    
    if (issueNum && slug) {
      wx.navigateTo({
        url: '/pages/article/article?issue=' + issueNum + '&slug=' + slug
      });
    }
  },

  // 跳转到槽点文章
  goToCao: function (e) {
    const issueNum = e.currentTarget.dataset.issue;
    const slug = e.currentTarget.dataset.slug;
    
    if (issueNum && slug) {
      wx.navigateTo({
        url: '/pages/article/article?issue=' + issueNum + '&slug=' + slug + '&type=cao'
      });
    }
  },

  // 分享
  onShareAppMessage: function () {
    return {
      title: 'Dawn Vision 期刊库',
      path: '/pages/articles/articles'
    };
  }
});
