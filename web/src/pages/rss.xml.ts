import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllIssues } from '@lib/issues';
import { siteConfig } from '@lib/config';

export async function GET(context: APIContext) {
  const issues = await getAllIssues();
  const items: any[] = [];

  for (const issue of issues) {
    // Cover article
    items.push({
      title: issue.data.cover.title,
      description: issue.data.cover.deck,
      link: `/articles/${issue.data.cover.slug}`,
      pubDate: new Date(issue.data.issue.date),
      categories: [issue.data.cover.category_en || 'Focus'],
    });

    // Briefs
    for (const brief of issue.data.briefs) {
      items.push({
        title: brief.title,
        description: brief.deck,
        link: `/articles/${brief.slug}`,
        pubDate: new Date(issue.data.issue.date),
        categories: [brief.category_en || 'Brief'],
      });
    }

    // Cao
    if (issue.data.cao) {
      items.push({
        title: issue.data.cao.title,
        description: issue.data.cao.deck,
        link: `/articles/${issue.data.cao.slug}`,
        pubDate: new Date(issue.data.issue.date),
        categories: ['Cao!'],
      });
    }
  }

  return rss({
    title: `${siteConfig.name} — AI 深度观察日刊`,
    description: siteConfig.description,
    site: context.site ?? siteConfig.url,
    items: items.slice(0, 100),
    customData: `<language>zh-cn</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
  });
}
