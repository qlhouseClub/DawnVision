// pages/about/about.js

Page({
  data: {
    version: '1.0.0'
  },

  onLoad: function (options) {
    // 获取版本信息
    const accountInfo = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null;
    if (accountInfo && accountInfo.miniProgram) {
      this.setData({
        version: accountInfo.miniProgram.version || '1.0.0'
      });
    }
  },

  // 复制网站地址
  copyWebsite: function () {
    wx.setClipboardData({
      data: 'https://www.dawnvision.cn',
      success: function () {
        wx.showToast({
          title: '网址已复制',
          icon: 'success'
        });
      }
    });
  },

  // 复制 RSS 地址
  copyRss: function () {
    wx.setClipboardData({
      data: 'https://www.dawnvision.cn/rss.xml',
      success: function () {
        wx.showToast({
          title: 'RSS 地址已复制',
          icon: 'success'
        });
      }
    });
  },

  // 分享
  onShareAppMessage: function () {
    return {
      title: 'Dawn Vision - 穿越嘈杂，洞见留声',
      path: '/pages/about/about'
    };
  }
});
