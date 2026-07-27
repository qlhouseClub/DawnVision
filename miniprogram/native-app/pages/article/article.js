// pages/article/article.js
const api = require('../../utils/api.js');
const format = require('../../utils/format.js');

Page({
  data: {
    loading: true,
    article: null,
    issueNumber: '',
    issueNumberDisplay: '',
    articleSlug: '',
    processedHtml: '',
    relatedArticles: [],
    errorMsg: ''
  },

  onLoad: function (options) {
    const issueNum = options.issue;
    const slug = options.slug;
    const articleType = options.type || ''; // cover, brief, cao

    if (!issueNum || !slug) {
      this.setData({
        loading: false,
        errorMsg: '参数错误'
      });
      return;
    }

    // 计算期号显示格式（三位数补零）
    const issueNumberDisplay = format.formatIssueNumber(issueNum);

    this.setData({
      issueNumber: issueNum,
      issueNumberDisplay: issueNumberDisplay,
      articleSlug: slug
    });

    this.loadArticle(issueNum, slug);
  },

  // 返回上一页
  goBack: function () {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      });
    } else {
      // 如果没有上一页，返回首页
      wx.switchTab({
        url: '/pages/index/index',
        fail: function () {
          wx.redirectTo({
            url: '/pages/index/index'
          });
        }
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    const { issueNumber, articleSlug } = this.data;
    if (issueNumber && articleSlug) {
      this.loadArticle(issueNumber, articleSlug, true).then(() => {
        wx.stopPullDownRefresh();
      }).catch(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  },

  // 加载文章
  loadArticle: function (issueNum, slug, forceRefresh) {
    this.setData({ loading: true, errorMsg: '' });

    return api.getArticle(issueNum, slug, forceRefresh).then(article => {
      if (!article) {
        this.setData({
          loading: false,
          errorMsg: '文章不存在'
        });
        return;
      }

      // 处理 HTML 内容，适配小程序 rich-text
      const processedHtml = format.processRichTextHtml(article.body_html || '');

      this.setData({
        loading: false,
        article: article,
        processedHtml: processedHtml
      });

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: article.title_short || article.title || '文章'
      });

      // 加载相关推荐（同期其他文章）
      this.loadRelatedArticles(issueNum, slug);
    }).catch(err => {
      console.error('加载文章失败', err);
      this.setData({
        loading: false,
        errorMsg: err.message || '加载失败，请检查网络'
      });
    });
  },

  // 加载相关推荐文章
  loadRelatedArticles: function (issueNum, currentSlug) {
    api.getIssue(issueNum).then(issueData => {
      if (!issueData) return;

      const related = [];

      // 添加封面文章（如果当前不是封面）
      if (issueData.cover && issueData.cover.slug !== currentSlug) {
        related.push({
          slug: issueData.cover.slug,
          title: issueData.cover.title_short || issueData.cover.title,
          deck: issueData.cover.deck,
          category: '封面'
        });
      }

      // 添加 brief 文章
      if (issueData.briefs && issueData.briefs.length > 0) {
        issueData.briefs.forEach(brief => {
          if (brief.slug !== currentSlug) {
            related.push({
              slug: brief.slug,
              title: brief.title,
              deck: brief.deck,
              category: brief.category
            });
          }
        });
      }

      // 最多显示 5 篇
      this.setData({
        relatedArticles: related.slice(0, 5)
      });
    }).catch(err => {
      console.error('加载相关文章失败', err);
    });
  },

  // 跳转到相关文章
  goToRelated: function (e) {
    const slug = e.currentTarget.dataset.slug;
    const issueNum = this.data.issueNumber;

    if (issueNum && slug) {
      // 关闭当前页再跳转，避免栈过深
      wx.redirectTo({
        url: '/pages/article/article?issue=' + issueNum + '&slug=' + slug
      });
    }
  },

  // 分享
  onShareAppMessage: function () {
    const { article, issueNumber } = this.data;
    const title = article ? (article.title_short || article.title) : 'Dawn Vision';
    const path = '/pages/article/article?issue=' + issueNumber + '&slug=' + this.data.articleSlug;
    return {
      title: title,
      path: path
    };
  },

  onShareTimeline: function () {
    const { article } = this.data;
    return {
      title: article ? (article.title_short || article.title) : 'Dawn Vision'
    };
  }
});
