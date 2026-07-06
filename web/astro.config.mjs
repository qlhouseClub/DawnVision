import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.dawnvision.net',
  // GitHub Pages: 保持根路径部署（Cloudflare CDN指向根域）
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
  },
});
