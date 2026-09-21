import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { newsSources } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FadeIn, MagnetButton } from "@/components/motion";
import { SOURCE_CATALOG } from "@/lib/source-catalog";
import { normalizeFeedUrl } from "@/lib/source-feeds";
import { addCatalogSources, createSource, setSourceStatus, updateSource } from "./actions";
import { DiscoverPanel } from "./discover-panel";

export const dynamic = "force-dynamic";

export default async function SourcesPage({
  searchParams,
}: {
  searchParams?: Promise<{ added?: string; skipped?: string; error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const sources = await getDb().select().from(newsSources).orderBy(desc(newsSources.priority));
  const existingFeedKeys = sources
    .map((s) => s.feedUrl)
    .filter((url): url is string => Boolean(url))
    .map((url) => {
      try {
        return normalizeFeedUrl(url);
      } catch {
        return url;
      }
    });
  const have = new Set(existingFeedKeys);
  const missingCatalog = SOURCE_CATALOG.filter((row) => !have.has(normalizeFeedUrl(row.feedUrl))).length;

  return (
    <FadeIn>
      <main className="grid gap-8">
        <div>
          <h1 className="text-xl font-semibold">Sources</h1>
          <p className="text-sm text-muted-foreground">
            Discover RSS/Atom feeds from site URLs or OPML, or add from the English news catalog. rose-bot
            scrapes registered feeds; paused sources are never picked.
          </p>
        </div>

        {params.error ? <p className="text-sm text-destructive">{params.error}</p> : null}
        {params.added || params.skipped ? (
          <p className="text-sm">
            Added {params.added || "0"} source{(params.added || "0") === "1" ? "" : "s"}
            {params.skipped && params.skipped !== "0" ? ` · skipped ${params.skipped} already present` : ""}.
          </p>
        ) : null}

        <DiscoverPanel existingFeedKeys={existingFeedKeys} />

        <form action={addCatalogSources} className="grid gap-3 rounded-lg border p-4">
          <div>
            <h2 className="font-medium">English news catalog</h2>
            <p className="text-sm text-muted-foreground">
              Known public RSS feeds for publishers rose-bot already treats as credible. {missingCatalog} not
              in your list yet. Select and add — no feed URL typing.
            </p>
          </div>
          <ul className="grid gap-2">
            {SOURCE_CATALOG.map((row) => {
              const already = have.has(normalizeFeedUrl(row.feedUrl));
              return (
                <li key={row.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="catalog_id"
                    value={row.id}
                    className="mt-1"
                    disabled={already}
                    defaultChecked={!already}
                  />
                  <span className="grid gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong>{row.name}</strong>
                      {already ? <Badge variant="secondary">already added</Badge> : <Badge variant="outline">rss</Badge>}
                    </span>
                    <span className="break-all text-muted-foreground">{row.feedUrl}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div>
            <Button type="submit" disabled={missingCatalog === 0}>
              Add selected catalog sources
            </Button>
          </div>
        </form>

        <form action={createSource} className="grid max-w-xl gap-3 rounded-lg border p-4">
          <h2 className="font-medium">Add source manually</h2>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="base_url">Base URL</Label>
            <Input id="base_url" name="base_url" type="url" required placeholder="https://example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="feed_url">Feed URL</Label>
            <Input id="feed_url" name="feed_url" type="url" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="scrape_method">Method</Label>
              <Input id="scrape_method" name="scrape_method" defaultValue="rss" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" name="priority" type="number" defaultValue="50" />
            </div>
          </div>
          <MagnetButton>
            <Button type="submit">Add source</Button>
          </MagnetButton>
        </form>

        <ul className="grid gap-4">
          {sources.map((s) => (
            <li key={s.id} className="grid gap-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{s.name}</strong>
                <Badge variant={s.status === "paused" ? "secondary" : "outline"}>{s.status}</Badge>
              </div>
              <form action={updateSource} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="id" value={s.id} />
                <div className="grid gap-1">
                  <Label>Name</Label>
                  <Input name="name" defaultValue={s.name} required />
                </div>
                <div className="grid gap-1">
                  <Label>Priority</Label>
                  <Input name="priority" type="number" defaultValue={s.priority} />
                </div>
                <div className="grid gap-1">
                  <Label>Base URL</Label>
                  <Input name="base_url" defaultValue={s.baseUrl} required />
                </div>
                <div className="grid gap-1">
                  <Label>Feed URL</Label>
                  <Input name="feed_url" defaultValue={s.feedUrl ?? ""} required />
                </div>
                <div className="grid gap-1">
                  <Label>Method</Label>
                  <Input name="scrape_method" defaultValue={s.scrapeMethod} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="outline">
                    Save
                  </Button>
                </div>
              </form>
              <div className="flex flex-wrap gap-2">
                {(["ok", "paused", "unknown"] as const).map((status) => (
                  <form action={setSourceStatus} key={status}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="status" value={status} />
                    <Button type="submit" variant={s.status === status ? "default" : "outline"} size="sm">
                      {status}
                    </Button>
                  </form>
                ))}
              </div>
              {s.lastError ? (
                <p className="text-sm text-muted-foreground">Last error: {s.lastError}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </main>
    </FadeIn>
  );
}
