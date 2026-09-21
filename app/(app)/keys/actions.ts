"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, ensureAuthTables } from "@/lib/db";
import { apiKeys } from "@/lib/schema";
import { requireSession } from "@/lib/session";
import { DEFAULT_SCOPES, generateToken, MAX_ACTIVE_KEYS } from "@/lib/api-keys";

export type KeyActionState =
  | { ok: true; secret: string; prefix: string; name: string }
  | { ok: false; error: string }
  | null;

async function countActive() {
  const rows = await getDb()
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(isNull(apiKeys.revokedAt));
  return rows.length;
}

export async function createApiKey(_prev: KeyActionState, formData: FormData): Promise<KeyActionState> {
  const session = await requireSession();
  await ensureAuthTables();
  const name = String(formData.get("name") || "").trim() || "project";
  if (await countActive() >= MAX_ACTIVE_KEYS) {
    return { ok: false, error: `At most ${MAX_ACTIVE_KEYS} active keys.` };
  }
  const made = generateToken();
  const t = new Date().toISOString();
  await getDb().insert(apiKeys).values({
    id: made.id,
    name,
    prefix: made.prefix,
    secretHash: made.secretHash,
    scopes: DEFAULT_SCOPES,
    createdBy: session.user.id,
    createdAt: t,
  });
  revalidatePath("/keys");
  return { ok: true, secret: made.token, prefix: made.prefix, name };
}

export async function revokeApiKey(formData: FormData) {
  await requireSession();
  await ensureAuthTables();
  const id = String(formData.get("id") || "").trim();
  if (!id) return;
  const t = new Date().toISOString();
  await getDb()
    .update(apiKeys)
    .set({ revokedAt: t })
    .where(and(eq(apiKeys.id, id), isNull(apiKeys.revokedAt)));
  revalidatePath("/keys");
}

export async function rotateApiKey(_prev: KeyActionState, formData: FormData): Promise<KeyActionState> {
  const session = await requireSession();
  await ensureAuthTables();
  const id = String(formData.get("id") || "").trim();
  if (!id) return { ok: false, error: "Missing key id." };
  const db = getDb();
  const [existing] = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
  if (!existing || existing.revokedAt) return { ok: false, error: "Key not found." };
  const made = generateToken();
  const t = new Date().toISOString();
  await db.insert(apiKeys).values({
    id: made.id,
    name: existing.name,
    prefix: made.prefix,
    secretHash: made.secretHash,
    scopes: existing.scopes,
    createdBy: session.user.id,
    createdAt: t,
  });
  await db.update(apiKeys).set({ revokedAt: t }).where(eq(apiKeys.id, id));
  revalidatePath("/keys");
  return { ok: true, secret: made.token, prefix: made.prefix, name: existing.name };
}
