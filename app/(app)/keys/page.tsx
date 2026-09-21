import { desc } from "drizzle-orm";
import { getDb, ensureAuthTables } from "@/lib/db";
import { apiKeys } from "@/lib/schema";
import { FadeIn } from "@/components/motion";
import { KeysPanel } from "./key-forms";

export const dynamic = "force-dynamic";

export default async function KeysPage() {
  await ensureAuthTables();
  const keys = await getDb()
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .orderBy(desc(apiKeys.createdAt));

  return (
    <FadeIn>
      <main className="grid gap-8">
        <div>
          <h1 className="text-xl font-semibold">API keys</h1>
          <p className="text-sm text-muted-foreground">
            Keys authenticate rose-bot command APIs. Send{" "}
            <code>Authorization: Bearer &lt;secret&gt;</code> to the bot (live:{" "}
            <code>https://rose-production-ac15.up.railway.app</code>). The secret is shown once
            on generate or rotate; only a SHA-256 hash is stored.
          </p>
        </div>
        <KeysPanel keys={keys} />
      </main>
    </FadeIn>
  );
}
