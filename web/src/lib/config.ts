// 支持通过环境变量 SITE_URL 切换域名（国内/国际部署）
const SITE_URL = import.meta.env.SITE_URL || 'https://www.dawnvision.net';

export const siteConfig = {
  name: 'Dawn Vision',
  tagline: '穿越嘈杂，洞见留声',
  englishTagline: 'AI Insight Daily',
  description: 'Dawn Vision — AI深度观察日刊，每日精选AI行业焦点，穿透信息噪声。焦点资讯+槽点吐槽，AI news & tech rant.',
  url: SITE_URL,
  defaultLocale: 'zh-CN',
  author: 'Dawn Vision 编辑部',
  itemsPerPage: 7, // 每期7篇（1 cover + 6 briefs）
  analytics: {
    cloudflareBeaconToken: import.meta.env.CF_BEACON_TOKEN ?? '',
    baiduTongjiId: import.meta.env.BAIDU_TONGJI_ID ?? '',
  },
  seo: {
    baiduVerify: '', // 百度站长验证meta content
    sogouVerify: '', // 搜狗站长验证
    so360Verify: '', // 360站长验证
    bingVerify: '',  // 必应站长验证
    googleVerify: '', // Google Search Console验证
    quarkVerify: '',  // 夸克/神马站长验证
  },
} as const;
