// pages/articles/articles.js
const api = require('../../utils/api.js');
const format = require('../../utils/format.js');

const app = getApp();

Page({
  data: {
    loading: true,
    issues: [],
    expandedIndex: -1,       // 当前展开的期数索引
    loadingBriefs: false,    // 是否正在加载brief详情
    issueDetailMap: {},      // 期数详情缓存 { number: issueData }
    briefCountMap: {}        // brief数量缓存 { number: count }
  },

  onLoad: function (options) {
    this.loadIssues();
  },

  onShow: function () {
    if (this.data.issues.length === 0) {
      this.loadIssues();
    }
  },

  // 下拉刷新
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
      // 处理数据，确保每期都有必要的字段
      const processedIssues = (issues || []).map(issue => {
        const issueInfo = issue.issue || {};
        return {
          issue: {
            number: issueInfo.number || issue.number,
            date: issueInfo.date || issue.date,
            date_display: issueInfo.date_display || issue.date_display
          },
          cover: issue.cover || null,
          briefs: issue.briefs || null
        };
      });

      // 构建 briefCountMap
      const briefCountMap = {};
      processedIssues.forEach(issue => {
        const num = issue.issue.number;
        if (issue.briefs && issue.briefs.length) {
          briefCountMap[num] = issue.briefs.length;
        } else {
          briefCountMap[num] = 0;
        }
      });

      // 更新全局数据
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

  // 展开/收起期数
  toggleIssue: function (e) {
    const index = e.currentTarget.dataset.index;
    const currentExpanded = this.data.expandedIndex;

    // 如果点击的是已展开的，则收起
    if (currentExpanded === index) {
      this.setData({ expandedIndex: -1 });
      return;
    }

    // 展开新的期数
    this.setData({ expandedIndex: index });

    const issue = this.data.issues[index];
    const issueNum = issue.issue.number;

    // 如果已经有详情了，直接显示
    if (this.data.issueDetailMap[issueNum]) {
      return;
    }

    // 如果列表数据里已经有 briefs，也不用请求
    if (issue.briefs && issue.briefs.length > 0) {
      const detailMap = this.data.issueDetailMap;
      detailMap[issueNum] = issue;
      this.setData({ issueDetailMap: detailMap });
      return;
    }

    // 否则请求期数详情
    this.setData({ loadingBriefs: true });
    api.getIssue(issueNum).then(issueData => {
      const detailMap = this.data.issueDetailMap;
      const countMap = this.data.briefCountMap;
      
      detailMap[issueNum] = issueData;
      if (issueData.briefs) {
        countMap[issueNum] = issueData.briefs.length;
      }

      this.setData({
        issueDetailMap: detailMap,
        briefCountMap: countMap,
        loadingBriefs: false
      });
    }).catch(err => {
      console.error('加载期数详情失败', err);
      this.setData({ loadingBriefs: false });
      wx.showToast({
        title: '加载简报失败',
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

  // 分享
  onShareAppMessage: function () {
    return {
      title: 'Dawn Vision 期刊库',
      path: '/pages/articles/articles'
    };
  }
});
