import { defineConfig } from 'astro/config';

// 支持通过环境变量 SITE_URL 切换域名
const SITE_URL = process.env.SITE_URL || 'https://www.dawnvision.net';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  // GitHub Pages: 保持根路径部署（Cloudflare CDN指向根域）
  build: {
    format: 'directory',
  },
  // Ensure all URLs end with trailing slash to match directory format
  trailingSlash: 'always',
  vite: {
    resolve: {
      alias: {
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@lib': '/src/lib',
        '@styles': '/src/styles',
        '@content': '/src/content',
        '@scripts': '/src/scripts',
      },
    },
  },
});
