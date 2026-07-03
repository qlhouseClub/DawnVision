import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.dawnvision.net',
  integrations: [
    react(),
    sitemap({
      changefreq: 'daily',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  // GitHub Pages: 保持根路径部署（Cloudflare CDN指向根域）
  // 如需子路径部署，设置 base: '/DawnVision/'
  build: {
    format: 'directory',
  },
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
    css: {
      devSourcemap: true,
    },
  },
});
