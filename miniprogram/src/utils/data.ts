// 数据加载模块 - 从生成的TS模块导入
import { allIssues } from './issues-data'

// 类型定义
export interface Source {
  text: string
  url: string
}

export interface PullQuote {
  text: string
  attr: string
}

export interface BaseArticle {
  slug: string
  title: string
  title_break?: string
  title_short?: string
  deck: string
  keywords: string
  og_description: string
  twitter_description?: string
  read_time: string
  word_count: number
  sources: Source[]
  body_html: string
  pull_quote?: PullQuote
  cognitive_notes: string
  source_summary: string
}

export interface CoverArticle extends BaseArticle {}

export interface BriefArticle extends BaseArticle {
  category: string
  category_en: string
}

export interface CaoArticle extends BaseArticle {
  footnote_tip?: string
}

export interface Issue {
  issue: {
    number: string
    date: string
    date_display: string
  }
  cover: CoverArticle
  briefs: BriefArticle[]
  cao?: CaoArticle | null
}

// 所有期数，按期号倒序（最新在前）
const issues = [...(allIssues as unknown as Issue[])].sort((a, b) =>
  b.issue.number.localeCompare(a.issue.number)
)

export function getAllIssues(): Issue[] {
  return issues
}

export function getLatestIssue(): Issue {
  return issues[0]
}

export function findArticleBySlug(slug: string) {
  for (const issue of issues) {
    if (issue.cover.slug === slug) {
      return { article: issue.cover as BaseArticle, issue, type: 'cover' as const }
    }
    for (const brief of issue.briefs) {
      if (brief.slug === slug) {
        return { article: brief as BaseArticle, issue, type: 'brief' as const }
      }
    }
    if (issue.cao && issue.cao.slug === slug) {
      return { article: issue.cao as BaseArticle, issue, type: 'cao' as const }
    }
  }
  return null
}

export function getAllBriefs(): Array<BriefArticle & { issueNumber: string; issueDate: string }> {
  const all: Array<BriefArticle & { issueNumber: string; issueDate: string }> = []
  for (const issue of issues) {
    for (const brief of issue.briefs) {
      all.push({ ...brief, issueNumber: issue.issue.number, issueDate: issue.issue.date_display })
    }
  }
  return all
}

export function getAllCaos(): Array<CaoArticle & { issueNumber: string; issueDate: string }> {
  const all: Array<CaoArticle & { issueNumber: string; issueDate: string }> = []
  for (const issue of issues) {
    if (issue.cao) {
      all.push({ ...issue.cao, issueNumber: issue.issue.number, issueDate: issue.issue.date_display })
    }
  }
  return all
}
