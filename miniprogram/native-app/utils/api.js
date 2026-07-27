// utils/api.js - API 请求封装

const BASE_URL = 'https://www.dawnvision.cn/api';

/**
 * 通用请求封装
 */
function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.statusCode === 200 && res.data) {
          resolve(res.data);
        } else {
          reject(new Error('请求失败: ' + res.statusCode));
        }
      },
      fail: function (err) {
        reject(err);
      }
    });
  });
}

/**
 * 获取期数列表
 * 缓存有效期：24小时
 */
function getIssues(forceRefresh) {
  const cacheKey = 'dv_issues_list';
  
  // 尝试从缓存读取
  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }
  }

  return request({
    url: '/issues.json',
    method: 'GET'
  }).then(data => {
    // 假设返回的是数组或包含 issues 字段的对象
    const issues = Array.isArray(data) ? data : (data.issues || []);
    if (issues.length > 0) {
      setToCache(cacheKey, issues, 24);
    }
    return issues;
  }).catch(err => {
    console.error('获取期数列表失败', err);
    // 失败时返回缓存数据
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    throw err;
  });
}

/**
 * 获取单期内容
 * 缓存有效期：48小时
 */
function getIssue(number, forceRefresh) {
  const cacheKey = 'dv_issue_' + number;
  
  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }
  }

  return request({
    url: '/issue/' + number + '.json',
    method: 'GET'
  }).then(data => {
    if (data) {
      setToCache(cacheKey, data, 48);
    }
    return data;
  }).catch(err => {
    console.error('获取期数详情失败', err);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    throw err;
  });
}

/**
 * 获取单篇文章
 * 缓存有效期：72小时
 */
function getArticle(issueNum, slug, forceRefresh) {
  const cacheKey = 'dv_article_' + issueNum + '_' + slug;
  
  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }
  }

  return request({
    url: '/article/' + issueNum + '/' + slug + '.json',
    method: 'GET'
  }).then(data => {
    if (data) {
      setToCache(cacheKey, data, 72);
    }
    return data;
  }).catch(err => {
    console.error('获取文章详情失败', err);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    throw err;
  });
}

/**
 * 获取最新一期封面（从期数列表中取第一条）
 */
function getLatestCover() {
  return getIssues().then(issues => {
    if (!issues || issues.length === 0) return null;
    const latest = issues[0];
    // 如果列表里已经有封面信息，直接返回
    if (latest.cover) {
      return {
        issue: latest.issue || { number: latest.number, date: latest.date },
        cover: latest.cover
      };
    }
    // 否则请求单期详情获取封面
    const issueNum = latest.issue ? latest.issue.number : latest.number;
    if (issueNum) {
      return getIssue(issueNum).then(issueData => {
        return {
          issue: issueData.issue,
          cover: issueData.cover
        };
      });
    }
    return null;
  });
}

/**
 * 获取所有 cao 文章列表
 * 从各期中提取 cao 文章，按期倒序
 */
function getCaoList() {
  return getIssues().then(issues => {
    if (!issues || issues.length === 0) return [];
    
    const caoList = [];
    // 先从列表数据中尝试提取
    issues.forEach(issue => {
      const issueData = issue.issue || {};
      const caoData = issue.cao;
      if (caoData) {
        caoList.push({
          issue: issueData,
          cao: caoData
        });
      }
    });
    
    // 如果列表里没有 cao 信息，需要逐个请求（这里只处理已有数据）
    // 实际使用时，issues 列表可能不包含 cao 信息
    return caoList;
  });
}

// ---- 缓存工具函数 ----

function setToCache(key, data, expireHours) {
  try {
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      expireHours: expireHours || 24
    };
    wx.setStorageSync(key, cacheData);
  } catch (e) {
    console.warn('缓存写入失败', key, e);
  }
}

function getFromCache(key) {
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

module.exports = {
  BASE_URL: BASE_URL,
  request: request,
  getIssues: getIssues,
  getIssue: getIssue,
  getArticle: getArticle,
  getLatestCover: getLatestCover,
  getCaoList: getCaoList,
  setToCache: setToCache,
  getFromCache: getFromCache
};
