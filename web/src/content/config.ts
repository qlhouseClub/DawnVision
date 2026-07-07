import { defineCollection, z } from 'astro:content';

// 文章来源
const sourceSchema = z.object({
  text: z.string(),
  url: z.union([z.string(), z.null()]).default('').transform(v => v ?? ''),
});

// 引用块（支持中英双语）
const pullQuoteSchema = z.object({
  text: z.string(),
  attr: z.string().default(''),
  text_en: z.string().optional().default(''),
  attr_en: z.string().optional().default(''),
});

// 基础文章schema（cover和brief共用）—— 扩展支持英文字段
const baseArticleSchema = z.object({
  slug: z.string(),
  // 中文内容
  title: z.string(),
  title_break: z.string().optional().nullable(),
  title_short: z.string().optional().nullable(),
  deck: z.string(),
  keywords: z.union([z.string(), z.array(z.string())]).default('').transform(v =>
    Array.isArray(v) ? v.join(', ') : v
  ),
  og_description: z.string().default(''),
  twitter_description: z.string().optional().nullable(),
  read_time: z.string().default('约 5 分钟阅读'),
  word_count: z.number().default(800),
  sources: z.array(sourceSchema).default([]),
  body_html: z.string(),
  pull_quote: pullQuoteSchema.nullable().optional(),
  cognitive_notes: z.string().default(''),
  source_summary: z.string().default(''),
  // 英文内容（可选，有则显示双语切换）
  title_en: z.string().optional().default(''),
  title_break_en: z.string().optional().nullable(),
  title_short_en: z.string().optional().nullable(),
  deck_en: z.string().optional().default(''),
  keywords_en: z.string().optional().default(''),
  og_description_en: z.string().optional().default(''),
  twitter_description_en: z.string().optional().nullable(),
  read_time_en: z.string().optional().default(''),
  body_html_en: z.string().optional().default(''),
  cognitive_notes_en: z.string().optional().default(''),
  source_summary_en: z.string().optional().default(''),
});

// Cover文章（封面焦点）
const coverSchema = baseArticleSchema.extend({
  title_short: z.string().optional(),
});

// Brief文章
const briefSchema = baseArticleSchema.extend({
  category: z.string(),
  category_en: z.string().default(''),
});

// Cao文章（操蛇之神）
const caoSchema = baseArticleSchema.extend({
  footnote_tip: z.string().optional(),
  footnote_tip_en: z.string().optional().default(''),
});

// 期数信息
const issueMetaSchema = z.object({
  number: z.string(),
  date: z.string(),
  date_display: z.string(),
});

// 完整issue schema
const issueSchema = z.object({
  issue: issueMetaSchema,
  cover: coverSchema,
  briefs: z.array(briefSchema).default([]),
  cao: caoSchema.nullable().optional(),
});

export const collections = {
  issues: defineCollection({
    type: 'data',
    schema: issueSchema,
  }),
};
