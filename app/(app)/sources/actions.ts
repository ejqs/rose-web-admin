"use server";

import { revalidatePath } from "next/cache";
import { backendFetch } from "@/lib/backend";
import { requireSession } from "@/lib/session";

const STATUSES = new Set(["ok", "paused", "unknown"]);

export async function createSource(formData: FormData) {
  const { token } = await requireSession();
  const name = String(formData.get("name") || "").trim();
  const baseUrl = String(formData.get("base_url") || "").trim();
  const feedUrl = String(formData.get("feed_url") || "").trim();
  const scrapeMethod = String(formData.get("scrape_method") || "rss").trim() || "rss";
  const priority = Number(formData.get("priority") || 0);
  if (!name || !baseUrl || !feedUrl) return;
  await backendFetch("/v1/admin/sources", {
    method: "POST",
    token,
    body: {
      name,
      base_url: baseUrl,
      feed_url: feedUrl,
      scrape_method: scrapeMethod,
      priority: Number.isFinite(priority) ? priority : 0,
    },
  });
  revalidatePath("/sources");
  revalidatePath("/");
}

export async function setSourceStatus(formData: FormData) {
  const { token } = await requireSession();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "");
  if (!Number.isInteger(id) || !STATUSES.has(status)) return;
  await backendFetch(`/v1/admin/sources/${id}`, {
    method: "PATCH",
    token,
    body: { status },
  });
  revalidatePath("/sources");
  revalidatePath("/");
}

export async function updateSource(formData: FormData) {
  const { token } = await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const name = String(formData.get("name") || "").trim();
  const baseUrl = String(formData.get("base_url") || "").trim();
  const feedUrl = String(formData.get("feed_url") || "").trim();
  const scrapeMethod = String(formData.get("scrape_method") || "rss").trim() || "rss";
  const priority = Number(formData.get("priority") || 0);
  if (!name || !baseUrl || !feedUrl) return;
  await backendFetch(`/v1/admin/sources/${id}`, {
    method: "PATCH",
    token,
    body: {
      name,
      base_url: baseUrl,
      feed_url: feedUrl,
      scrape_method: scrapeMethod,
      priority: Number.isFinite(priority) ? priority : 0,
    },
  });
  revalidatePath("/sources");
  revalidatePath("/");
}
