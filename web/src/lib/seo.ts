import { siteConfig } from './config';

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export interface ArticleSeoData {
  title: string;
  deck: string;
  slug: string;
  keywords?: string;
  word_count?: number;
  og_description?: string;
}

export interface IssueSeoData {
  number: string;
  date: string;       // ISO date: YYYY-MM-DD
  date_display: string;
}

/**
 * Build WebSite JSON-LD structured data (with search action)
 */
export function buildWebsiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: 'DawnVision',
    url: siteConfig.url + '/',
    description: siteConfig.description,
    inLanguage: 'zh-CN',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url + '/',
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/images/og-image.png`,
        width: 1200,
        height: 630,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/articles?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Build NewsArticle JSON-LD structured data
 */
export function buildNewsArticleJsonLd(
  article: ArticleSeoData,
  issue: IssueSeoData,
  category?: string,
): Record<string, unknown> {
  const pageUrl = `${siteConfig.url}/articles/${article.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.og_description || article.deck,
    datePublished: issue.date,
    dateModified: issue.date,
    author: {
      '@type': 'Organization',
      name: `${siteConfig.name} 编辑部`,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url + '/',
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/images/og-image.png`,
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    url: pageUrl,
    inLanguage: 'zh-CN',
    articleSection: category,
    keywords: article.keywords,
    wordCount: article.word_count,
  };
}

/**
 * Build BreadcrumbList JSON-LD structured data
 * @param items Array of breadcrumb items from root to current page
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}
