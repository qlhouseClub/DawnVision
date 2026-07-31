// utils/api.js - Dawn Vision 数据库 API 请求封装
// 数据源：腾讯云 MySQL，通过 api-server.cjs 提供服务

var BASE_URL = 'https://www.dawnvision.cn/api2';

/**
 * 通用请求封装
 */
function request(options) {
  return new Promise(function(resolve, reject) {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          resolve(res.data);
        } else if (res.statusCode === 404) {
          resolve(null);
        } else {
          reject(new Error('请求失败: ' + res.statusCode));
        }
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
}

/**
 * 获取期数列表（概要）
 * 返回：[{ issue:{number,date,date_display}, cover:{slug,title,title_short,deck,read_time}, brief_count, has_cao }]
 */
function getIssues(forceRefresh) {
  var cacheKey = 'dv_issues_v2';
  if (!forceRefresh) {
    var cached = getFromCache(cacheKey);
    if (cached && cached.length > 0 && cached[0] && cached[0].issue) {
      return Promise.resolve(cached);
    }
  }
  return request({ url: '/issues' }).then(function(data) {
    if (data && data.length > 0 && data[0] && data[0].issue) {
      setToCache(cacheKey, data, 6);
    }
    return data || [];
  }).catch(function(err) {
    console.error('获取期数列表失败', err);
    var cached = getFromCache(cacheKey);
    if (cached) return cached;
    throw err;
  });
}

/**
 * 获取最新一期封面
 */
function getLatestCover(forceRefresh) {
  var cacheKey = 'dv_latest_v2';
  if (!forceRefresh) {
    var cached = getFromCache(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }
  }
  return request({ url: '/latest' }).then(function(data) {
    if (data) {
      setToCache(cacheKey, data, 6);
    }
    return data;
  }).catch(function(err) {
    console.error('获取最新封面失败', err);
    var cached = getFromCache(cacheKey);
    if (cached) return cached;
    throw err;
  });
}

/**
 * 获取单期完整内容（含所有文章+来源）
 * 返回：{ issue:{number,date,date_display}, cover, briefs[], cao }
 */
function getIssue(number, forceRefresh) {
  var cacheKey = 'dv_issue_v2_' + number;
  if (!forceRefresh) {
    var cached = getFromCache(cacheKey);
    if (cached) return Promise.resolve(cached);
  }
  return request({ url: '/issue/' + number }).then(function(data) {
    if (data) {
      setToCache(cacheKey, data, 48);
    }
    return data;
  }).catch(function(err) {
    console.error('获取期数详情失败', err);
    var cached = getFromCache(cacheKey);
    if (cached) return cached;
    throw err;
  });
}

/**
 * 获取单篇文章详情
 * 返回完整文章对象（含中英双字段 + sources 数组）
 */
function getArticle(issueNum, slug, forceRefresh) {
  var cacheKey = 'dv_article_v2_' + issueNum + '_' + slug;
  if (!forceRefresh) {
    var cached = getFromCache(cacheKey);
    if (cached) return Promise.resolve(cached);
  }
  return request({ url: '/article/' + issueNum + '/' + slug }).then(function(data) {
    if (data) {
      setToCache(cacheKey, data, 72);
    }
    return data;
  }).catch(function(err) {
    console.error('获取文章详情失败', err);
    var cached = getFromCache(cacheKey);
    if (cached) return cached;
    throw err;
  });
}

/**
 * 获取所有槽点文章列表
 */
function getCaoList(forceRefresh) {
  var cacheKey = 'dv_cao_v2';
  if (!forceRefresh) {
    var cached = getFromCache(cacheKey);
    if (cached) return Promise.resolve(cached);
  }
  return request({ url: '/cao/list' }).then(function(data) {
    if (data && data.length > 0) {
      setToCache(cacheKey, data, 24);
    }
    return data || [];
  }).catch(function(err) {
    console.error('获取槽点列表失败', err);
    var cached = getFromCache(cacheKey);
    if (cached) return cached;
    throw err;
  });
}

/**
 * 服务器端搜索
 * 参数：query 搜索关键词
 * 返回：[{ id, slug, issue, title, title_short, deck, title_en, title_short_en, deck_en, category, category_en, excerpt }]
 */
function search(query) {
  if (!query || !query.trim()) {
    return Promise.resolve([]);
  }
  return request({
    url: '/search',
    data: { q: query }
  }).then(function(data) {
    return data || [];
  }).catch(function(err) {
    console.error('搜索失败', err);
    return [];
  });
}

// ---- 缓存工具函数 ----

function setToCache(key, data, expireHours) {
  try {
    wx.setStorageSync(key, {
      data: data,
      timestamp: Date.now(),
      expireHours: expireHours || 24
    });
  } catch (e) {
    console.warn('缓存写入失败', key, e);
  }
}

function getFromCache(key) {
  try {
    var cached = wx.getStorageSync(key);
    if (!cached || !cached.timestamp) return null;
    var expireMs = (cached.expireHours || 24) * 60 * 60 * 1000;
    if (Date.now() - cached.timestamp > expireMs) return null;
    return cached.data;
  } catch (e) {
    return null;
  }
}

/**
 * 获取缓存年龄（小时）
 * 用于判断是否需要后台静默刷新
 */
function getCacheAgeHours(key) {
  try {
    var cached = wx.getStorageSync(key);
    if (!cached || !cached.timestamp) return 999;
    return (Date.now() - cached.timestamp) / (60 * 60 * 1000);
  } catch (e) {
    return 999;
  }
}

module.exports = {
  BASE_URL: BASE_URL,
  request: request,
  getIssues: getIssues,
  getLatestCover: getLatestCover,
  getIssue: getIssue,
  getArticle: getArticle,
  getCaoList: getCaoList,
  search: search,
  setToCache: setToCache,
  getFromCache: getFromCache,
  getCacheAgeHours: getCacheAgeHours
};
