import type { APIContext } from 'astro';
import { getAllIssues } from '@lib/issues';
import { siteConfig } from '@lib/config';

export async function GET(context: APIContext) {
  const issues = await getAllIssues();
  const site = context.site?.toString().replace(/\/$/, '') ?? siteConfig.url;
  const now = new Date().toISOString().split('T')[0];

  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];

  // Static pages — all URLs end with trailing slash (matches build.format: 'directory')
  urls.push({ loc: `${site}/`, lastmod: now, changefreq: 'daily', priority: '1.0' });
  urls.push({ loc: `${site}/articles/`, lastmod: now, changefreq: 'daily', priority: '0.9' });
  urls.push({ loc: `${site}/cao/`, lastmod: now, changefreq: 'daily', priority: '0.8' });
  urls.push({ loc: `${site}/about/`, lastmod: '2026-07-03', changefreq: 'monthly', priority: '0.5' });

  // Article pages — directory format requires trailing slash
  for (const issue of issues) {
    const date = issue.data.issue.date;
    const isoDate = new Date(date).toISOString().split('T')[0];

    // Cover
    urls.push({
      loc: `${site}/articles/${issue.data.cover.slug}/`,
      lastmod: isoDate,
      changefreq: 'monthly',
      priority: '0.8',
    });

    // Briefs
    for (const brief of issue.data.briefs) {
      urls.push({
        loc: `${site}/articles/${brief.slug}/`,
        lastmod: isoDate,
        changefreq: 'monthly',
        priority: '0.7',
      });
    }

    // Cao
    if (issue.data.cao) {
      urls.push({
        loc: `${site}/articles/${issue.data.cao.slug}/`,
        lastmod: isoDate,
        changefreq: 'monthly',
        priority: '0.6',
      });
    }
  }

  // Build XML
  const urlset = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
