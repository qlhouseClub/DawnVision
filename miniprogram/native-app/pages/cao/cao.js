// pages/cao/cao.js
const api = require('../../utils/api.js');
const format = require('../../utils/format.js');

Page({
  data: {
    loading: true,
    caoList: [],
    error: ''
  },

  onLoad: function (options) {
    this.loadCaoList();
  },

  onShow: function () {
    if (this.data.caoList.length === 0) {
      this.loadCaoList();
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadCaoList(true).then(() => {
      wx.stopPullDownRefresh();
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载槽点文章列表
  loadCaoList: function (forceRefresh) {
    this.setData({ loading: true, error: '' });

    // 先获取期数列表
    return api.getIssues(forceRefresh).then(issues => {
      if (!issues || issues.length === 0) {
        this.setData({
          loading: false,
          caoList: []
        });
        return;
      }

      // 从期数列表中提取有 cao 的期数
      const caoList = [];
      const issuesWithCao = [];

      issues.forEach(issue => {
        const issueInfo = issue.issue || {};
        const caoData = issue.cao;
        
        if (caoData) {
          // 列表里已经有 cao 信息
          caoList.push({
            issue: {
              number: issueInfo.number || issue.number,
              date: issueInfo.date || issue.date,
              date_display: issueInfo.date_display || issue.date_display
            },
            cao: caoData
          });
        } else {
          // 需要请求详情获取 cao
          const issueNum = issueInfo.number || issue.number;
          if (issueNum) {
            issuesWithCao.push({
              number: issueNum,
              date: issueInfo.date || issue.date,
              date_display: issueInfo.date_display || issue.date_display
            });
          }
        }
      });

      // 如果列表里已经有足够的 cao 数据，直接显示
      if (caoList.length > 0) {
        this.setData({
          loading: false,
          caoList: caoList
        });
        return;
      }

      // 否则需要逐期请求获取 cao（这里只请求前10期，避免请求过多）
      if (issuesWithCao.length > 0) {
        this.loadCaoFromIssues(issuesWithCao.slice(0, 20));
      } else {
        this.setData({
          loading: false,
          caoList: []
        });
      }
    }).catch(err => {
      console.error('加载槽点列表失败', err);
      this.setData({
        loading: false,
        error: err.message || '加载失败',
        caoList: []
      });
    });
  },

  // 从各期中提取 cao 文章
  loadCaoFromIssues: function (issues) {
    const promises = issues.map(issueInfo => {
      return api.getIssue(issueInfo.number).then(issueData => {
        if (issueData && issueData.cao) {
          return {
            issue: {
              number: issueInfo.number,
              date: issueInfo.date,
              date_display: issueInfo.date_display
            },
            cao: issueData.cao
          };
        }
        return null;
      }).catch(() => null);
    });

    Promise.all(promises).then(results => {
      const caoList = results.filter(item => item !== null);
      this.setData({
        loading: false,
        caoList: caoList
      });
    }).catch(err => {
      console.error('加载 cao 详情失败', err);
      this.setData({ loading: false });
    });
  },

  // 跳转到文章详情
  goToArticle: function (e) {
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
      title: 'Dawn Vision 槽点专栏',
      path: '/pages/cao/cao'
    };
  }
});
