import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const newsSources = pgTable("news_sources", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  feedUrl: text("feed_url"),
  scrapeMethod: text("scrape_method").notNull().default("rss"),
  status: text("status").notNull().default("unknown"),
  robotsCheckedAt: text("robots_checked_at"),
  robotsTtlUntil: text("robots_ttl_until"),
  robotsBody: text("robots_body"),
  crawlDelaySeconds: integer("crawl_delay_seconds"),
  lastSuccessAt: text("last_success_at"),
  lastAttemptAt: text("last_attempt_at"),
  lastError: text("last_error"),
  priority: integer("priority").notNull().default(0),
  nextEligibleAt: text("next_eligible_at").notNull(),
  articlesScrapedCount: integer("articles_scraped_count").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const articles = pgTable("articles", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  sourceId: integer("source_id")
    .notNull()
    .references(() => newsSources.id),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  bodyText: text("body_text").notNull(),
  publishedAt: text("published_at"),
  scrapedAt: text("scraped_at").notNull(),
  contentHash: text("content_hash").notNull(),
  lang: text("lang"),
  rawMetadata: text("raw_metadata"),
  jevStatus: text("jev_status").notNull().default("skipped"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
