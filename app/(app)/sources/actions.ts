"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { newsSources } from "@/lib/schema";
import { requireSession } from "@/lib/session";

const STATUSES = new Set(["ok", "paused", "unknown"]);

export async function createSource(formData: FormData) {
  await requireSession();
  const name = String(formData.get("name") || "").trim();
  const baseUrl = String(formData.get("base_url") || "").trim();
  const feedUrl = String(formData.get("feed_url") || "").trim();
  const scrapeMethod = String(formData.get("scrape_method") || "rss").trim() || "rss";
  const priority = Number(formData.get("priority") || 0);
  if (!name || !baseUrl || !feedUrl) return;
  const t = new Date().toISOString();
  await getDb().insert(newsSources).values({
    name,
    baseUrl,
    feedUrl,
    scrapeMethod,
    status: "unknown",
    priority: Number.isFinite(priority) ? priority : 0,
    nextEligibleAt: t,
    articlesScrapedCount: 0,
    createdAt: t,
    updatedAt: t,
  });
  revalidatePath("/sources");
  revalidatePath("/");
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
