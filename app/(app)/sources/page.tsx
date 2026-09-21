import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FadeIn, MagnetButton } from "@/components/motion";
import { backendFetch } from "@/lib/backend";
import { requireSession } from "@/lib/session";
import { createSource, setSourceStatus, updateSource } from "./actions";

export const dynamic = "force-dynamic";

type Source = {
  id: number;
  name: string;
  status: string;
  priority: number;
  base_url: string;
  feed_url: string | null;
  scrape_method: string;
  last_error: string | null;
};

export default async function SourcesPage() {
  const { token } = await requireSession();
  const { data } = await backendFetch<{ sources?: Source[] }>("/v1/admin/sources", { token });
  const sources = data.sources || [];

  return (
    <FadeIn>
      <main className="grid gap-8">
        <div>
          <h1 className="text-xl font-semibold">Sources</h1>
          <p className="text-sm text-muted-foreground">
            This is bot configuration. Add feeds here. Set status to paused to stop scraping.
          </p>
        </div>

        <form action={createSource} className="grid max-w-xl gap-3 rounded-lg border p-4">
          <h2 className="font-medium">Add source</h2>
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
                  <Input name="base_url" defaultValue={s.base_url} required />
                </div>
                <div className="grid gap-1">
                  <Label>Feed URL</Label>
                  <Input name="feed_url" defaultValue={s.feed_url ?? ""} required />
                </div>
                <div className="grid gap-1">
                  <Label>Method</Label>
                  <Input name="scrape_method" defaultValue={s.scrape_method} />
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
              {s.last_error ? (
                <p className="text-sm text-muted-foreground">Last error: {s.last_error}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </main>
    </FadeIn>
  );
}
