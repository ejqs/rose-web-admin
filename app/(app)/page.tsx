import { count, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { articles, newsSources } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = getDb();
  const [{ n: articleCount }] = await db.select({ n: count() }).from(articles);
  const sources = await db
    .select({
      id: newsSources.id,
      name: newsSources.name,
      status: newsSources.status,
      lastSuccessAt: newsSources.lastSuccessAt,
      lastError: newsSources.lastError,
      nextEligibleAt: newsSources.nextEligibleAt,
      articlesScrapedCount: newsSources.articlesScrapedCount,
    })
    .from(newsSources)
    .orderBy(desc(newsSources.priority));

  return (
    <FadeIn>
      <main className="grid gap-6">
        <div>
          <h1 className="text-xl font-semibold">Bot health</h1>
          <p className="text-sm text-muted-foreground">
            Config is written here. Discover feeds on <a className="underline-offset-4 hover:underline" href="/sources">Sources</a>. rose-bot reads <code>news_sources</code> and scrapes. Paused sources are never picked.
          </p>
        </div>
        <p className="text-sm">
          Articles stored: <strong>{Number(articleCount)}</strong> · Sources:{" "}
          <strong>{sources.length}</strong>
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Last success</TableHead>
              <TableHead>Next eligible</TableHead>
              <TableHead>Last error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "ok" ? "default" : "outline"}>{s.status}</Badge>
                </TableCell>
                <TableCell>{s.articlesScrapedCount}</TableCell>
                <TableCell className="text-muted-foreground">{s.lastSuccessAt || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{s.nextEligibleAt}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{s.lastError || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </FadeIn>
  );
}
