"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { newsSources } from "@/lib/schema";
import { requireSession } from "@/lib/session";
import { catalogById } from "@/lib/source-catalog";
import { discoverFromText } from "@/lib/source-discover";
import { nameFromHost, normalizeFeedUrl, parseHttpUrl, type DiscoveredFeed } from "@/lib/source-feeds";

const STATUSES = new Set(["ok", "paused", "unknown"]);

export type DiscoverState =
  | { ok: true; feeds: DiscoveredFeed[]; notes: { url: string; message: string }[] }
  | { ok: false; error: string }
  | null;

function sourcesPath(params?: { added?: number; skipped?: number; error?: string }) {
  if (!params) return "/sources";
  const q = new URLSearchParams();
  if (params.error) q.set("error", params.error);
  if (params.added != null) q.set("added", String(params.added));
  if (params.skipped != null) q.set("skipped", String(params.skipped));
  const s = q.toString();
  return s ? `/sources?${s}` : "/sources";
}

export async function createSource(formData: FormData) {
  await requireSession();
  const name = String(formData.get("name") || "").trim();
  const baseUrl = String(formData.get("base_url") || "").trim();
  const feedUrl = String(formData.get("feed_url") || "").trim();
  const scrapeMethod = String(formData.get("scrape_method") || "rss").trim() || "rss";
  const priority = Number(formData.get("priority") || 0);
  if (!name || !baseUrl || !feedUrl) return;
  const result = await insertNewSources([
    {
      name,
      baseUrl,
      feedUrl,
      scrapeMethod,
      priority: Number.isFinite(priority) ? priority : 0,
    },
  ]);
  revalidatePath("/sources");
  revalidatePath("/");
  redirect(sourcesPath(result));
}

export async function discoverFeeds(_prev: DiscoverState, formData: FormData): Promise<DiscoverState> {
  await requireSession();
  const pasted = String(formData.get("urls") || "");
  const file = formData.get("opml");
  let raw = pasted;
  if (file instanceof File && file.size > 0) {
    if (file.size > 800_000) return { ok: false, error: "OPML file is too large." };
    raw = `${await file.text()}\n${pasted}`;
  }
  try {
    const result = await discoverFromText(raw);
    return { ok: true, feeds: result.feeds, notes: result.notes };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Discovery failed." };
  }
}

export async function addDiscoveredSources(formData: FormData) {
  await requireSession();
  const selected = formData.getAll("feed").map(String);
  const rows: SourceInsert[] = [];
  for (const raw of selected) {
    try {
      const parsed = JSON.parse(raw) as { name?: string; baseUrl?: string; feedUrl?: string };
      const feedUrl = String(parsed.feedUrl || "").trim();
      const baseUrl = String(parsed.baseUrl || "").trim() || new URL(feedUrl).origin;
      parseHttpUrl(feedUrl);
      parseHttpUrl(baseUrl);
      rows.push({
        name: String(parsed.name || "").trim() || nameFromHost(feedUrl),
        baseUrl,
        feedUrl,
        scrapeMethod: "rss",
        priority: 50,
      });
    } catch {
      /* skip bad checkbox payload */
    }
  }
  if (!rows.length) redirect(sourcesPath({ error: "Select at least one discovered feed." }));
  const result = await insertNewSources(rows);
  revalidatePath("/sources");
  revalidatePath("/");
  redirect(sourcesPath(result));
}

export async function addCatalogSources(formData: FormData) {
  await requireSession();
  const ids = formData.getAll("catalog_id").map(String);
  const rows: SourceInsert[] = [];
  for (const id of ids) {
    const entry = catalogById(id);
    if (!entry) continue;
    rows.push({
      name: entry.name,
      baseUrl: entry.baseUrl,
      feedUrl: entry.feedUrl,
      scrapeMethod: "rss",
      priority: entry.priority,
    });
  }
  if (!rows.length) redirect(sourcesPath({ error: "Select at least one catalog source." }));
  const result = await insertNewSources(rows);
  revalidatePath("/sources");
  revalidatePath("/");
  redirect(sourcesPath(result));
}

export async function setSourceStatus(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "");
  if (!Number.isInteger(id) || !STATUSES.has(status)) return;
  const t = new Date().toISOString();
  await getDb()
    .update(newsSources)
    .set({ status, updatedAt: t })
    .where(eq(newsSources.id, id));
  revalidatePath("/sources");
  revalidatePath("/");
}

export async function updateSource(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const name = String(formData.get("name") || "").trim();
  const baseUrl = String(formData.get("base_url") || "").trim();
  const feedUrl = String(formData.get("feed_url") || "").trim();
  const scrapeMethod = String(formData.get("scrape_method") || "rss").trim() || "rss";
  const priority = Number(formData.get("priority") || 0);
  if (!name || !baseUrl || !feedUrl) return;
  const t = new Date().toISOString();
  await getDb()
    .update(newsSources)
    .set({
      name,
      baseUrl,
      feedUrl,
      scrapeMethod,
      priority: Number.isFinite(priority) ? priority : 0,
      updatedAt: t,
    })
    .where(eq(newsSources.id, id));
  revalidatePath("/sources");
  revalidatePath("/");
}

type SourceInsert = {
  name: string;
  baseUrl: string;
  feedUrl: string;
  scrapeMethod: string;
  priority: number;
};

async function insertNewSources(rows: SourceInsert[]) {
  const existing = await getDb().select({ feedUrl: newsSources.feedUrl }).from(newsSources);
  const have = new Set(
    existing
      .map((row) => row.feedUrl)
      .filter((url): url is string => Boolean(url))
      .map((url) => {
        try {
          return normalizeFeedUrl(url);
        } catch {
          return url;
        }
      }),
  );
  let added = 0;
  let skipped = 0;
  const t = new Date().toISOString();
  for (const row of rows) {
    let key: string;
    try {
      parseHttpUrl(row.feedUrl);
      parseHttpUrl(row.baseUrl);
      key = normalizeFeedUrl(row.feedUrl);
    } catch {
      skipped += 1;
      continue;
    }
    if (have.has(key)) {
      skipped += 1;
      continue;
    }
    have.add(key);
    await getDb().insert(newsSources).values({
      name: row.name,
      baseUrl: row.baseUrl,
      feedUrl: row.feedUrl,
      scrapeMethod: row.scrapeMethod,
      status: "unknown",
      priority: row.priority,
      nextEligibleAt: t,
      articlesScrapedCount: 0,
      createdAt: t,
      updatedAt: t,
    });
    added += 1;
  }
  return { added, skipped };
}
