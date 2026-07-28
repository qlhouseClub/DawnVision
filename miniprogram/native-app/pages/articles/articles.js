// pages/articles/articles.js
// 文章列表页：按期展示，四级联动筛选，对齐网站设计
var api = require('../../utils/api.js');
var i18nContent = require('../../utils/i18n-content.js');
var i18nUtil = require('../../utils/i18n.js');

var app = getApp();

Page({
  data: {
    loading: true,
    currentIssueNum: '',
    currentIssueData: null,
    issues: [],
    // 四级联动筛选
    filterTree: [],           // 年 -> 月 -> 上/下半月 -> 期数
    selectedYear: '',
    selectedMonth: '',
    selectedHalf: '',
    selectedIssue: '',
    monthOptions: [],
    halfOptions: [],
    issueOptions: [],
    searchVisible: false,
    lang: 'zh',
    i18n: {}
  },

  onLoad: function() {
    var lang = (app && app.globalData && app.globalData.lang) || 'zh';
    this.setData({
      lang: lang,
      i18n: i18nUtil.getMessages(lang)
    });
    this._rawIssues = null;
    this._rawIssueDetails = {};
    this.loadData();
  },

  onShow: function() {
    if (!this.data.currentIssueData && !this.data.loading) {
      this.loadData();
    }
  },

  onPullDownRefresh: function() {
    var self = this;
    this.loadData(true).then(function() {
      wx.stopPullDownRefresh();
    }).catch(function() {
      wx.stopPullDownRefresh();
    });
  },

  loadData: function(forceRefresh) {
    var self = this;
    this.setData({ loading: true });

    if (!forceRefresh && this._rawIssues) {
      this._applyIssues();
      if (this.data.currentIssueNum) {
        this.loadIssueDetail(this.data.currentIssueNum);
      } else if (this._rawIssues.length > 0) {
        this.loadIssueDetail(this._rawIssues[0].issue.number);
      } else {
        this.setData({ loading: false });
      }
      return Promise.resolve();
    }

    return api.getIssues(forceRefresh).then(function(rawIssues) {
      self._rawIssues = rawIssues || [];
      self._applyIssues();
      self._buildFilterTree();

      // 默认加载最新一期
      if (rawIssues && rawIssues.length > 0) {
        var latest = rawIssues[0];
        var latestNum = latest.issue.number;
        return self.loadIssueDetail(latestNum);
      } else {
        self.setData({ loading: false });
      }
    }).catch(function(err) {
      console.error('加载期数列表失败', err);
      self.setData({ loading: false });
    });
  },

  // 从缓存提取期数列表
  _applyIssues: function() {
    var lang = this.data.lang;
    var issues = (this._rawIssues || []).map(function(item) {
      return i18nContent.extractIssueListItem(item, lang);
    });
    this.setData({ issues: issues });
  },

  // 构建四级联动筛选树（年 -> 月 -> 上/下半月 -> 期数）
  _buildFilterTree: function() {
    var rawIssues = this._rawIssues || [];
    if (rawIssues.length === 0) return;

    var treeMap = {};

    rawIssues.forEach(function(item) {
      var issueInfo = item.issue || {};
      var num = issueInfo.number;
      var date = issueInfo.date || '';
      var parts = date.split('-');
      var year = parts[0] || '2026';
      var month = parts[1] || '01';
      var day = parseInt(parts[2] || '1', 10);
      var half = day <= 15 ? 'H1' : 'H2';

      if (!treeMap[year]) treeMap[year] = {};
      if (!treeMap[year][month]) treeMap[year][month] = {};
      if (!treeMap[year][month][half]) treeMap[year][month][half] = [];

      treeMap[year][month][half].push(num);
    });

    // 转为数组结构
    var tree = Object.keys(treeMap).sort().reverse().map(function(year) {
      var months = Object.keys(treeMap[year]).sort().reverse().map(function(month) {
        var halves = Object.keys(treeMap[year][month]).sort().reverse().map(function(half) {
          var issues = treeMap[year][month][half].sort().reverse();
          return {
            half: half,
            label: half === 'H1' ? '上半月' : '下半月',
            issues: issues
          };
        });
        return {
          month: month,
          label: parseInt(month, 10) + '月',
          halves: halves
        };
      });
      return { year: year, months: months };
    });

    // 默认选最新一期（tree[0] -> months[0] -> halves[0] -> issues[0]）
    var latestYear = tree[0];
    var latestMonth = latestYear.months[0];
    var latestHalf = latestMonth.halves[0];
    var latestIssue = latestHalf.issues[0];

    this.setData({
      filterTree: tree,
      selectedYear: latestYear.year,
      monthOptions: latestYear.months.map(function(m) { return { value: m.month, label: m.label }; }),
      selectedMonth: latestMonth.month,
      halfOptions: latestMonth.halves.map(function(h) { return { value: h.half, label: h.label }; }),
      selectedHalf: latestHalf.half,
      issueOptions: latestHalf.issues.map(function(num) {
        return { value: num, label: 'Issue ' + num };
      }),
      selectedIssue: latestIssue
    });
  },

  // 年份切换
  onYearChange: function(e) {
    var year = e.detail.value;
    var yearData = this.data.filterTree.find(function(y) { return y.year === year; });
    if (!yearData) return;

    var months = yearData.months.map(function(m) { return { value: m.month, label: m.label }; });
    var firstMonth = months[0];
    var monthData = yearData.months[0];
    var halves = monthData.halves.map(function(h) { return { value: h.half, label: h.label }; });
    var firstHalf = halves[0];
    var issues = monthData.halves[0].issues.map(function(num) {
      return { value: num, label: 'Issue ' + num };
    });

    this.setData({
      selectedYear: year,
      selectedMonth: firstMonth.value,
      monthOptions: months,
      selectedHalf: firstHalf.value,
      halfOptions: halves,
      selectedIssue: issues[0] ? issues[0].value : '',
      issueOptions: issues
    });

    if (issues[0]) {
      this.loadIssueDetail(issues[0].value);
    }
  },

  // 月份切换
  onMonthChange: function(e) {
    var month = e.detail.value;
    var yearData = this.data.filterTree.find(function(y) { return y.year === this.data.selectedYear; }, this);
    if (!yearData) return;
    var monthData = yearData.months.find(function(m) { return m.month === month; });
    if (!monthData) return;

    var halves = monthData.halves.map(function(h) { return { value: h.half, label: h.label }; });
    var issues = monthData.halves[0].issues.map(function(num) {
      return { value: num, label: 'Issue ' + num };
    });

    this.setData({
      selectedMonth: month,
      selectedHalf: halves[0].value,
      halfOptions: halves,
      selectedIssue: issues[0] ? issues[0].value : '',
      issueOptions: issues
    });

    if (issues[0]) {
      this.loadIssueDetail(issues[0].value);
    }
  },

  // 上/下半月切换
  onHalfChange: function(e) {
    var half = e.detail.value;
    var yearData = this.data.filterTree.find(function(y) { return y.year === this.data.selectedYear; }, this);
    if (!yearData) return;
    var monthData = yearData.months.find(function(m) { return m.month === this.data.selectedMonth; }, this);
    if (!monthData) return;
    var halfData = monthData.halves.find(function(h) { return h.half === half; });
    if (!halfData) return;

    var issues = halfData.issues.map(function(num) {
      return { value: num, label: 'Issue ' + num };
    });

    this.setData({
      selectedHalf: half,
      selectedIssue: issues[0] ? issues[0].value : '',
      issueOptions: issues
    });

    if (issues[0]) {
      this.loadIssueDetail(issues[0].value);
    }
  },

  // 期数切换
  onIssueChange: function(e) {
    var issueNum = e.detail.value;
    this.setData({ selectedIssue: issueNum });
    this.loadIssueDetail(issueNum);
  },

  // 加载单期详情
  loadIssueDetail: function(issueNum) {
    var self = this;

    if (this._rawIssueDetails[issueNum]) {
      var extracted = i18nContent.extractIssue(this._rawIssueDetails[issueNum], this.data.lang);
      this.setData({
        loading: false,
        currentIssueNum: issueNum,
        currentIssueData: extracted
      });
      return Promise.resolve();
    }

    this.setData({ loading: true });

    return api.getIssue(issueNum).then(function(issueData) {
      if (!issueData) {
        self.setData({ loading: false });
        return;
      }

      self._rawIssueDetails[issueNum] = issueData;
      var extracted = i18nContent.extractIssue(issueData, self.data.lang);

      self.setData({
        loading: false,
        currentIssueNum: issueNum,
        currentIssueData: extracted
      });
    }).catch(function(err) {
      console.error('加载期数详情失败', err);
      self.setData({ loading: false });
    });
  },

  goToCoverArticle: function() {
    var d = this.data.currentIssueData;
    if (!d || !d.cover) return;
    wx.navigateTo({
      url: '/pages/article/article?issue=' + d.issue.number + '&slug=' + d.cover.slug
    });
  },

  goToArticle: function(e) {
    var issueNum = e.currentTarget.dataset.issue;
    var slug = e.currentTarget.dataset.slug;
    if (issueNum && slug) {
      wx.navigateTo({
        url: '/pages/article/article?issue=' + issueNum + '&slug=' + slug
      });
    }
  },

  goToCao: function() {
    var d = this.data.currentIssueData;
    if (!d || !d.cao) return;
    wx.navigateTo({
      url: '/pages/article/article?issue=' + d.issue.number + '&slug=' + d.cao.slug
    });
  },

  onSearchClose: function() {
    this.setData({ searchVisible: false });
  },

  onLangChange: function(e) {
    var lang = e.detail.lang;
    this.setData({
      lang: lang,
      i18n: i18nUtil.getMessages(lang)
    });
    this._applyIssues();
    if (this.data.currentIssueNum && this._rawIssueDetails[this.data.currentIssueNum]) {
      var extracted = i18nContent.extractIssue(this._rawIssueDetails[this.data.currentIssueNum], lang);
      this.setData({ currentIssueData: extracted });
    }
  },

  onShareAppMessage: function() {
    return {
      title: this.data.i18n.share_articles,
      path: '/pages/articles/articles'
    };
  }
});
