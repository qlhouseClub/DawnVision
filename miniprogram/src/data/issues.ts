// Dawn Vision Issues Data
// 从 Astro content collection 迁移而来

export interface Source {
  text: string;
  url: string;
}

export interface PullQuote {
  text: string;
  attr?: string;
}

export interface Article {
  slug: string;
  title: string;
  title_break?: string;
  title_short?: string;
  deck: string;
  keywords: string;
  og_description: string;
  read_time: string;
  word_count: number;
  sources: Source[];
  body_html: string;
  pull_quote?: PullQuote | null;
  cognitive_notes: string;
  source_summary: string;
}

export interface Brief extends Article {
  category: string;
  category_en: string;
}

export interface Issue {
  number: string;
  date: string;
  date_display: string;
}

export interface IssueData {
  issue: Issue;
  cover: Article;
  briefs: Brief[];
  cao?: Article | null;
}

// 动态导入所有issue JSON文件
// 注意：微信小程序不支持动态require，我们将通过构建脚本生成
// 这里先手动导入已有的9期数据

import issue001 from './raw/001.json';
import issue002 from './raw/002.json';
import issue003 from './raw/003.json';
import issue004 from './raw/004.json';
import issue005 from './raw/005.json';
import issue006 from './raw/006.json';
import issue007 from './raw/007.json';
import issue008 from './raw/008.json';
import issue009 from './raw/009.json';

const rawIssues: IssueData[] = [
  issue001 as IssueData,
  issue002 as IssueData,
  issue003 as IssueData,
  issue004 as IssueData,
  issue005 as IssueData,
  issue006 as IssueData,
  issue007 as IssueData,
  issue008 as IssueData,
  issue009 as IssueData,
];

// 按期数号降序排列（最新在前）
export const issues: IssueData[] = rawIssues.sort((a, b) => 
  b.issue.number.localeCompare(a.issue.number)
);

// 获取最新一期
export function getLatestIssue(): IssueData {
  return issues[0];
}

// 按期数号获取一期
export function getIssueByNumber(num: string): IssueData | undefined {
  return issues.find(i => i.issue.number === num);
}

// 获取所有brief文章（跨期数聚合），按日期降序
export interface BriefWithMeta extends Brief {
  issueNum: string;
  issueDate: string;
}

export function getAllBriefs(): BriefWithMeta[] {
  const briefs: BriefWithMeta[] = [];
  for (const issue of issues) {
    for (const brief of issue.briefs) {
      briefs.push({
        ...brief,
        issueNum: issue.issue.number,
        issueDate: issue.issue.date,
      });
    }
  }
  return briefs;
}

// 获取所有cao文章，按日期降序
export interface CaoWithMeta extends Article {
  issueNum: string;
  issueDate: string;
}

export function getAllCaos(): CaoWithMeta[] {
  const caos: CaoWithMeta[] = [];
  for (const issue of issues) {
    if (issue.cao) {
      caos.push({
        ...issue.cao,
        issueNum: issue.issue.number,
        issueDate: issue.issue.date,
      });
    }
  }
  return caos.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}

// 根据slug查找文章（在cover、briefs、cao中搜索）
export interface ArticleResult {
  article: Article | Brief;
  type: 'cover' | 'brief' | 'cao';
  issueNum: string;
}

export function getArticleBySlug(slug: string): ArticleResult | undefined {
  for (const issue of issues) {
    if (issue.cover.slug === slug) {
      return { article: issue.cover, type: 'cover', issueNum: issue.issue.number };
    }
    for (const brief of issue.briefs) {
      if (brief.slug === slug) {
        return { article: brief, type: 'brief', issueNum: issue.issue.number };
      }
    }
    if (issue.cao && issue.cao.slug === slug) {
      return { article: issue.cao, type: 'cao', issueNum: issue.issue.number };
    }
  }
  return undefined;
}

// 获取所有文章列表（用于列表页）
export interface ArticleListItem {
  slug: string;
  title: string;
  title_short?: string;
  deck: string;
  type: 'cover' | 'brief' | 'cao';
  issueNum: string;
  issueDate: string;
  issueDateDisplay: string;
  category?: string;
  read_time: string;
}

export function getAllArticles(): ArticleListItem[] {
  const articles: ArticleListItem[] = [];
  for (const issue of issues) {
    // Cover
    articles.push({
      slug: issue.cover.slug,
      title: issue.cover.title,
      title_short: issue.cover.title_short,
      deck: issue.cover.deck,
      type: 'cover',
      issueNum: issue.issue.number,
      issueDate: issue.issue.date,
      issueDateDisplay: issue.issue.date_display,
      category: 'Focus · 焦点',
      read_time: issue.cover.read_time,
    });
    // Briefs
    for (const brief of issue.briefs) {
      articles.push({
        slug: brief.slug,
        title: brief.title,
        title_short: brief.title_short,
        deck: brief.deck,
        type: 'brief',
        issueNum: issue.issue.number,
        issueDate: issue.issue.date,
        issueDateDisplay: issue.issue.date_display,
        category: brief.category,
        read_time: brief.read_time,
      });
    }
    // Cao
    if (issue.cao) {
      articles.push({
        slug: issue.cao.slug,
        title: issue.cao.title,
        title_short: issue.cao.title_short,
        deck: issue.cao.deck,
        type: 'cao',
        issueNum: issue.issue.number,
        issueDate: issue.issue.date,
        issueDateDisplay: issue.issue.date_display,
        category: 'Cao! · 来吐槽吧',
        read_time: issue.cao.read_time,
      });
    }
  }
  // 按日期降序排列
  return articles.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}
