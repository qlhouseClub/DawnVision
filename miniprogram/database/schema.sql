-- ═══════════════════════════════════════════════════════════
-- Dawn Vision 数据库设计
-- 设计原则：
--   1. 支持扩表（新分类直接加表，不改现有结构）
--   2. 支持增表（未来加用户/收藏/评论等，互不干扰）
--   3. 中英双语字段共存（_en 后缀）
--   4. 软删除 + 时间戳，便于维护
--   5. 外键约束 + 索引，保证数据一致性
-- ═══════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ═══════════════════════════════════════════════════════════
-- 1. 分类表（可扩展内容线）
--    未来加"科技评测""行业报告"等，只需 INSERT 一条记录
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `dv_categories`;
CREATE TABLE `dv_categories` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`        VARCHAR(64) NOT NULL COMMENT 'URL标识，如 ai-daily',
  `name`        VARCHAR(64) NOT NULL COMMENT '中文名',
  `name_en`     VARCHAR(128) NOT NULL DEFAULT '' COMMENT '英文名',
  `description` VARCHAR(256) NOT NULL DEFAULT '' COMMENT '中文描述',
  `description_en` VARCHAR(256) NOT NULL DEFAULT '' COMMENT '英文描述',
  `sort_order`  INT NOT NULL DEFAULT 0 COMMENT '排序权重',
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始分类：AI 日报
INSERT INTO `dv_categories` (`slug`, `name`, `name_en`, `description`, `description_en`, `sort_order`)
VALUES ('ai-daily', 'AI 日报', 'AI Daily', 'AI 前沿深度观察日刊', 'AI frontier deep-dive daily briefing', 1);

-- ═══════════════════════════════════════════════════════════
-- 2. 期数表
--    一个分类可以有多个期数，期数号在分类内唯一
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `dv_issues`;
CREATE TABLE `dv_issues` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id`   INT UNSIGNED NOT NULL COMMENT '关联分类',
  `number`        VARCHAR(16) NOT NULL COMMENT '期数号，如 001、022',
  `date`          DATE NOT NULL COMMENT '发布日期',
  `date_display`  VARCHAR(32) NOT NULL DEFAULT '' COMMENT '显示格式日期，如 2026.06.24',
  `is_published`  TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否已发布',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cat_number` (`category_id`, `number`),
  KEY `idx_date` (`date`),
  KEY `idx_category` (`category_id`),
  CONSTRAINT `fk_issue_category` FOREIGN KEY (`category_id`) REFERENCES `dv_categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 3. 文章表（核心表，cover / brief / cao 统一存储）
--    用 article_type 区分类型，避免三张表冗余
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `dv_articles`;
CREATE TABLE `dv_articles` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `issue_id`        INT UNSIGNED NOT NULL COMMENT '关联期数',
  `category_id`    INT UNSIGNED NOT NULL COMMENT '关联分类（冗余，便于跨期查询）',
  `article_type`    ENUM('cover','brief','cao') NOT NULL COMMENT '文章类型',
  `slug`            VARCHAR(128) NOT NULL COMMENT 'URL标识',

  -- 中文内容
  `title`           TEXT NOT NULL COMMENT '标题',
  `title_break`     TEXT COMMENT '断行标题（含<br/>）',
  `title_short`     VARCHAR(256) DEFAULT NULL COMMENT '短标题',
  `deck`            TEXT NOT NULL COMMENT '摘要',
  `keywords`        TEXT COMMENT '关键词，逗号分隔',
  `og_description`  TEXT COMMENT 'Open Graph 描述',
  `twitter_description` TEXT COMMENT 'Twitter Card 描述',
  `read_time`       VARCHAR(32) NOT NULL DEFAULT '' COMMENT '阅读时长文案',
  `word_count`      INT NOT NULL DEFAULT 0 COMMENT '字数',
  `body_html`       LONGTEXT NOT NULL COMMENT '正文 HTML',
  `cognitive_notes` TEXT COMMENT '认知笔记',
  `source_summary`  TEXT COMMENT '来源说明',
  `footnote_tip`    TEXT COMMENT '脚注提示（cao 专用）',

  -- 引用块（Pull Quote）
  `pull_quote_text`      TEXT COMMENT '引用文字',
  `pull_quote_attr`      VARCHAR(128) DEFAULT NULL COMMENT '引用来源',

  -- 英文内容（可选，空则不显示英文切换）
  `title_en`             TEXT COMMENT '英文标题',
  `title_break_en`       TEXT COMMENT '英文断行标题',
  `title_short_en`       VARCHAR(256) DEFAULT NULL COMMENT '英文短标题',
  `deck_en`              TEXT COMMENT '英文摘要',
  `keywords_en`          TEXT COMMENT '英文关键词',
  `og_description_en`    TEXT COMMENT '英文 OG 描述',
  `twitter_description_en` TEXT COMMENT '英文 Twitter 描述',
  `read_time_en`         VARCHAR(32) NOT NULL DEFAULT '' COMMENT '英文阅读时长',
  `body_html_en`         LONGTEXT COMMENT '英文正文 HTML',
  `cognitive_notes_en`   TEXT COMMENT '英文认知笔记',
  `source_summary_en`    TEXT COMMENT '英文来源说明',
  `footnote_tip_en`      TEXT COMMENT '英文脚注提示',

  -- 英文引用块
  `pull_quote_text_en`   TEXT COMMENT '英文引用文字',
  `pull_quote_attr_en`   VARCHAR(128) DEFAULT NULL COMMENT '英文引用来源',

  -- 元数据
  `brief_category`       VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'brief 子分类，如 模型层/应用层',
  `brief_category_en`    VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'brief 英文子分类',
  `is_published`         TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_issue_slug` (`issue_id`, `slug`),
  KEY `idx_issue` (`issue_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_type` (`article_type`),
  KEY `idx_slug` (`slug`),
  KEY `idx_brief_cat` (`brief_category`),
  -- 全文索引（中文用 ngram 分词）
  FULLTEXT KEY `ft_title` (`title`) WITH PARSER ngram,
  FULLTEXT KEY `ft_deck` (`deck`) WITH PARSER ngram,
  CONSTRAINT `fk_article_issue` FOREIGN KEY (`issue_id`) REFERENCES `dv_issues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_article_category` FOREIGN KEY (`category_id`) REFERENCES `dv_categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 4. 文章来源表（sources 数组，一对多拆出）
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `dv_article_sources`;
CREATE TABLE `dv_article_sources` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `article_id`  INT UNSIGNED NOT NULL,
  `text`        VARCHAR(512) NOT NULL COMMENT '来源描述',
  `url`         VARCHAR(512) NOT NULL DEFAULT '' COMMENT '来源链接',
  `sort_order`  INT NOT NULL DEFAULT 0,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_article` (`article_id`),
  CONSTRAINT `fk_source_article` FOREIGN KEY (`article_id`) REFERENCES `dv_articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 5. 同步记录表（追踪每次同步操作）
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `dv_sync_logs`;
CREATE TABLE `dv_sync_logs` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_type`   VARCHAR(32) NOT NULL DEFAULT 'website_json' COMMENT '同步来源类型',
  `source_path`   VARCHAR(256) NOT NULL COMMENT '同步的源路径',
  `issues_synced` INT NOT NULL DEFAULT 0 COMMENT '同步的期数',
  `articles_synced` INT NOT NULL DEFAULT 0 COMMENT '同步的文章数',
  `status`        ENUM('success','partial','failed') NOT NULL DEFAULT 'success',
  `error_message` TEXT COMMENT '失败原因',
  `duration_ms`   INT NOT NULL DEFAULT 0 COMMENT '耗时毫秒',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 6. 预留扩展表说明（未来使用，当前不创建）
-- ═══════════════════════════════════════════════════════════
-- 以下表设计好结构，但当前不创建，等需要时再执行：
--
-- -- 用户表（未来加用户系统时启用）
-- CREATE TABLE dv_users (
--   id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--   openid VARCHAR(64) UNIQUE NOT NULL COMMENT '微信openid',
--   unionid VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
--   nickname VARCHAR(64) DEFAULT '',
--   avatar_url VARCHAR(256) DEFAULT '',
--   preferred_lang ENUM('zh','en') DEFAULT 'zh',
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- -- 用户收藏表
-- CREATE TABLE dv_user_favorites (
--   id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--   user_id INT UNSIGNED NOT NULL,
--   article_id INT UNSIGNED NOT NULL,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   UNIQUE KEY uk_user_article (user_id, article_id),
--   FOREIGN KEY (user_id) REFERENCES dv_users(id) ON DELETE CASCADE,
--   FOREIGN KEY (article_id) REFERENCES dv_articles(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- -- 阅读记录表
-- CREATE TABLE dv_user_read_history (
--   id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--   user_id INT UNSIGNED NOT NULL,
--   article_id INT UNSIGNED NOT NULL,
--   read_progress INT DEFAULT 0 COMMENT '阅读进度0-100',
--   last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   UNIQUE KEY uk_user_article (user_id, article_id),
--   FOREIGN KEY (user_id) REFERENCES dv_users(id) ON DELETE CASCADE,
--   FOREIGN KEY (article_id) REFERENCES dv_articles(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
