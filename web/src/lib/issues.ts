import { getCollection, type CollectionEntry } from 'astro:content';

export type IssueData = CollectionEntry<'issues'>['data'];
export type ArticleData = IssueData['cover'];
export type BriefData = IssueData['briefs'][number];
export type CaoData = NonNullable<IssueData['cao']>;

/**
 * 获取所有期数，按期数号降序排列（最新在前）
 */
export async function getAllIssues(): Promise<CollectionEntry<'issues'>[]> {
  const issues = await getCollection('issues');
  return issues.sort((a, b) => b.data.issue.number.localeCompare(a.data.issue.number));
}

/**
 * 获取最新一期
 */
export async function getLatestIssue(): Promise<CollectionEntry<'issues'>> {
  const issues = await getAllIssues();
  return issues[0];
}

/**
 * 按期数号获取一期
 */
export async function getIssueByNumber(num: string): Promise<CollectionEntry<'issues'> | undefined> {
  const issues = await getAllIssues();
  return issues.find(i => i.data.issue.number === num);
}

/**
 * 获取所有brief文章（跨期数聚合），按日期降序
 */
export async function getAllBriefs(): Promise<Array<BriefData & { issueNum: string; issueDate: string }>> {
  const issues = await getAllIssues();
  const briefs: Array<BriefData & { issueNum: string; issueDate: string }> = [];
  for (const issue of issues) {
    for (const brief of issue.data.briefs) {
      briefs.push({
        ...brief,
        issueNum: issue.data.issue.number,
        issueDate: issue.data.issue.date,
      });
    }
  }
  return briefs;
}

/**
 * 获取所有cao文章，按日期降序
 */
export async function getAllCaos(): Promise<Array<CaoData & { issueNum: string; issueDate: string }>> {
  const issues = await getAllIssues();
  const caos: Array<CaoData & { issueNum: string; issueDate: string }> = [];
  for (const issue of issues) {
    if (issue.data.cao) {
      caos.push({
        ...issue.data.cao,
        issueNum: issue.data.issue.number,
        issueDate: issue.data.issue.date,
      });
    }
  }
  return caos.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}

/**
 * 根据slug查找文章（在cover和briefs中搜索）
 */
export async function getArticleBySlug(slug: string): Promise<{
  article: ArticleData | BriefData | CaoData;
  type: 'cover' | 'brief' | 'cao';
  issueNum: string;
} | undefined> {
  const issues = await getAllIssues();
  for (const issue of issues) {
    if (issue.data.cover.slug === slug) {
      return { article: issue.data.cover, type: 'cover', issueNum: issue.data.issue.number };
    }
    for (const brief of issue.data.briefs) {
      if (brief.slug === slug) {
        return { article: brief, type: 'brief', issueNum: issue.data.issue.number };
      }
    }
    if (issue.data.cao && issue.data.cao.slug === slug) {
      return { article: issue.data.cao, type: 'cao', issueNum: issue.data.issue.number };
    }
  }
  return undefined;
}

/**
 * 构建期数筛选器数据（四级联动）
 */
export async function buildIssueFilterData() {
  const issues = await getAllIssues();
  const filterMap = new Map<string, {
    months: Map<string, {
      halves: Map<string, string[]> // H1/H2 -> [issue numbers]
    }>
  }>();

  for (const issue of issues) {
    const { number, date, date_display } = issue.data.issue;
    const [year, month, day] = date.split('-');
    const half = parseInt(day) <= 15 ? 'H1' : 'H2';

    if (!filterMap.has(year)) {
      filterMap.set(year, { months: new Map() });
    }
    const yearData = filterMap.get(year)!;
    if (!yearData.months.has(month)) {
      yearData.months.set(month, { halves: new Map() });
    }
    const monthData = yearData.months.get(month)!;
    if (!monthData.halves.has(half)) {
      monthData.halves.set(half, []);
    }
    monthData.halves.get(half)!.push(number);
  }

  // 转换为数组格式
  const years = Array.from(filterMap.keys()).sort().reverse();
  const result = years.map(year => {
    const yearData = filterMap.get(year)!;
    const months = Array.from(yearData.months.keys()).sort().reverse().map(month => {
      const monthData = yearData.months.get(month)!;
      const halves = Array.from(monthData.halves.keys()).sort().reverse().map(half => ({
        half,
        issues: monthData.halves.get(half)!.sort().reverse(),
      }));
      return { month, halves };
    });
    return { year, months };
  });

  // 扁平期数列表（用于下拉选择）
  const flatIssues = issues.map(i => ({
    num: i.data.issue.number,
    date: i.data.issue.date,
    date_display: i.data.issue.date_display,
  }));

  return { tree: result, flat: flatIssues };
}
