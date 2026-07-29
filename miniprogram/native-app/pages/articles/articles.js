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
    filterTree: [],
    yearOptions: [],
    monthOptions: [],
    halfOptions: [],
    issueOptions: [],
    yearIndex: 0,
    monthIndex: 0,
    halfIndex: 0,
    issueIndex: 0,
    searchVisible: false,
    lang: 'zh',
    i18n: {},
    hasPrev: false,
    hasNext: false
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

      if (rawIssues && rawIssues.length > 0) {
        var latestNum = rawIssues[0].issue.number;
        return self.loadIssueDetail(latestNum);
      } else {
        self.setData({ loading: false });
      }
    }).catch(function(err) {
      console.error('加载期数列表失败', err);
      self.setData({ loading: false });
    });
  },

  _applyIssues: function() {
    var lang = this.data.lang;
    var issues = (this._rawIssues || []).map(function(item) {
      return i18nContent.extractIssueListItem(item, lang);
    });
    this.setData({ issues: issues });
  },

  // 构建四级联动筛选树
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

    // 转为数组结构，降序排列（最新在前）
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

    // 默认选最新一期：tree[0] -> months[0] -> halves[0] -> issues[0]
    var latestYear = tree[0];
    var latestMonth = latestYear.months[0];
    var latestHalf = latestMonth.halves[0];

    var yearOptions = tree.map(function(y) { return { value: y.year, label: y.year }; });
    var monthOptions = latestYear.months.map(function(m) { return { value: m.month, label: m.label }; });
    var halfOptions = latestMonth.halves.map(function(h) { return { value: h.half, label: h.label }; });
    var issueOptions = latestHalf.issues.map(function(num) {
      return { value: num, label: 'Issue ' + num };
    });

    this.setData({
      filterTree: tree,
      yearOptions: yearOptions,
      monthOptions: monthOptions,
      halfOptions: halfOptions,
      issueOptions: issueOptions,
      yearIndex: 0,
      monthIndex: 0,
      halfIndex: 0,
      issueIndex: 0
    });
  },

  // 年份切换（picker 返回的是索引）
  onYearChange: function(e) {
    var yearIdx = parseInt(e.detail.value, 10);
    var yearData = this.data.filterTree[yearIdx];
    if (!yearData) return;

    var monthOptions = yearData.months.map(function(m) { return { value: m.month, label: m.label }; });
    var monthData = yearData.months[0];
    var halfOptions = monthData.halves.map(function(h) { return { value: h.half, label: h.label }; });
    var halfData = monthData.halves[0];
    var issueOptions = halfData.issues.map(function(num) {
      return { value: num, label: 'Issue ' + num };
    });

    this.setData({
      yearIndex: yearIdx,
      monthOptions: monthOptions,
      monthIndex: 0,
      halfOptions: halfOptions,
      halfIndex: 0,
      issueOptions: issueOptions,
      issueIndex: 0
    });

    if (issueOptions.length > 0) {
      this.loadIssueDetail(issueOptions[0].value);
    }
  },

  // 月份切换
  onMonthChange: function(e) {
    var monthIdx = parseInt(e.detail.value, 10);
    var yearData = this.data.filterTree[this.data.yearIndex];
    if (!yearData) return;
    var monthData = yearData.months[monthIdx];
    if (!monthData) return;

    var halfOptions = monthData.halves.map(function(h) { return { value: h.half, label: h.label }; });
    var halfData = monthData.halves[0];
    var issueOptions = halfData.issues.map(function(num) {
      return { value: num, label: 'Issue ' + num };
    });

    this.setData({
      monthIndex: monthIdx,
      halfOptions: halfOptions,
      halfIndex: 0,
      issueOptions: issueOptions,
      issueIndex: 0
    });

    if (issueOptions.length > 0) {
      this.loadIssueDetail(issueOptions[0].value);
    }
  },

  // 上/下半月切换
  onHalfChange: function(e) {
    var halfIdx = parseInt(e.detail.value, 10);
    var yearData = this.data.filterTree[this.data.yearIndex];
    if (!yearData) return;
    var monthData = yearData.months[this.data.monthIndex];
    if (!monthData) return;
    var halfData = monthData.halves[halfIdx];
    if (!halfData) return;

    var issueOptions = halfData.issues.map(function(num) {
      return { value: num, label: 'Issue ' + num };
    });

    this.setData({
      halfIndex: halfIdx,
      issueOptions: issueOptions,
      issueIndex: 0
    });

    if (issueOptions.length > 0) {
      this.loadIssueDetail(issueOptions[0].value);
    }
  },

  // 期数切换
  onIssueChange: function(e) {
    var issueIdx = parseInt(e.detail.value, 10);
    var issueOpt = this.data.issueOptions[issueIdx];
    if (!issueOpt) return;

    this.setData({ issueIndex: issueIdx });
    this.loadIssueDetail(issueOpt.value);
  },

  loadIssueDetail: function(issueNum) {
    var self = this;

    if (this._rawIssueDetails[issueNum]) {
      var extracted = i18nContent.extractIssue(this._rawIssueDetails[issueNum], this.data.lang);
      var nav = this._getNavState(issueNum);
      this.setData({
        loading: false,
        currentIssueNum: issueNum,
        currentIssueData: extracted,
        hasPrev: nav.hasPrev,
        hasNext: nav.hasNext
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
      var nav = self._getNavState(issueNum);

      self.setData({
        loading: false,
        currentIssueNum: issueNum,
        currentIssueData: extracted,
        hasPrev: nav.hasPrev,
        hasNext: nav.hasNext
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

  // 获取分页状态
  _getNavState: function(issueNum) {
    var issues = this._rawIssues || [];
    if (issues.length === 0) return { hasPrev: false, hasNext: false };
    var idx = -1;
    for (var i = 0; i < issues.length; i++) {
      if (issues[i].issue.number === issueNum) { idx = i; break; }
    }
    // issues[0] 是最新，issues[length-1] 是最早
    // hasPrev = 有更早的期（idx < length-1）
    // hasNext = 有更新的期（idx > 0）
    return {
      hasPrev: idx >= 0 && idx < issues.length - 1,
      hasNext: idx > 0
    };
  },

  // 上一期
  prevIssue: function() {
    var issues = this._rawIssues || [];
    if (issues.length === 0) return;
    var currentIdx = -1;
    for (var i = 0; i < issues.length; i++) {
      if (issues[i].issue.number === this.data.currentIssueNum) {
        currentIdx = i;
        break;
      }
    }
    if (currentIdx < 0 || currentIdx >= issues.length - 1) return;
    var prevNum = issues[currentIdx + 1].issue.number;
    this.loadIssueDetail(prevNum);
    this._syncFilterToIssue(prevNum);
  },

  // 下一期
  nextIssue: function() {
    var issues = this._rawIssues || [];
    if (issues.length === 0) return;
    var currentIdx = -1;
    for (var i = 0; i < issues.length; i++) {
      if (issues[i].issue.number === this.data.currentIssueNum) {
        currentIdx = i;
        break;
      }
    }
    if (currentIdx <= 0) return;
    var nextNum = issues[currentIdx - 1].issue.number;
    this.loadIssueDetail(nextNum);
    this._syncFilterToIssue(nextNum);
  },

  // 同步筛选器到指定期数
  _syncFilterToIssue: function(issueNum) {
    var tree = this.data.filterTree;
    var rawIssues = this._rawIssues || [];
    var issueData = null;
    for (var i = 0; i < rawIssues.length; i++) {
      if (rawIssues[i].issue.number === issueNum) {
        issueData = rawIssues[i];
        break;
      }
    }
    if (!issueData) return;

    var date = issueData.issue.date || '';
    var parts = date.split('-');
    var year = parts[0];
    var month = parts[1];
    var day = parseInt(parts[2] || '1', 10);
    var half = day <= 15 ? 'H1' : 'H2';

    var yearIdx = 0, monthIdx = 0, halfIdx = 0, issueIdx = 0;
    for (var y = 0; y < tree.length; y++) {
      if (tree[y].year === year) { yearIdx = y; break; }
    }
    var yearData = tree[yearIdx];
    if (!yearData) return;
    var monthOptions = yearData.months.map(function(m) { return { value: m.month, label: m.label }; });
    for (var m = 0; m < yearData.months.length; m++) {
      if (yearData.months[m].month === month) { monthIdx = m; break; }
    }
    var monthData = yearData.months[monthIdx];
    if (!monthData) return;
    var halfOptions = monthData.halves.map(function(h) { return { value: h.half, label: h.label }; });
    for (var h = 0; h < monthData.halves.length; h++) {
      if (monthData.halves[h].half === half) { halfIdx = h; break; }
    }
    var halfData = monthData.halves[halfIdx];
    if (!halfData) return;
    var issueOptions = halfData.issues.map(function(num) {
      return { value: num, label: 'Issue ' + num };
    });
    for (var n = 0; n < halfData.issues.length; n++) {
      if (halfData.issues[n] === issueNum) { issueIdx = n; break; }
    }

    this.setData({
      yearIndex: yearIdx,
      monthOptions: monthOptions,
      monthIndex: monthIdx,
      halfOptions: halfOptions,
      halfIndex: halfIdx,
      issueOptions: issueOptions,
      issueIndex: issueIdx
    });
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
