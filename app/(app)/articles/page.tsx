import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { articles, newsSources } from "@/lib/schema";
import { FadeIn } from "@/components/motion";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const rows = await getDb()
    .select({
      id: articles.id,
      title: articles.title,
      url: articles.url,
      bodyText: articles.bodyText,
      publishedAt: articles.publishedAt,
      scrapedAt: articles.scrapedAt,
      jevStatus: articles.jevStatus,
      source: newsSources.name,
    })
    .from(articles)
    .innerJoin(newsSources, eq(articles.sourceId, newsSources.id))
    .orderBy(desc(articles.id))
    .limit(40);

  return (
    <FadeIn>
      <main className="grid gap-6">
        <div>
          <h1 className="text-xl font-semibold">Articles</h1>
          <p className="text-sm text-muted-foreground">
            Body preview for operators. The public site only shows excerpts and outbound links.
          </p>
        </div>
        <ul className="grid gap-6">
          {rows.map((row) => (
            <li key={row.id} className="grid gap-2 border-b pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <a href={row.url} className="font-medium underline-offset-4 hover:underline" rel="noreferrer">
                  {row.title}
                </a>
                <Badge variant="outline">{row.source}</Badge>
                <Badge variant="secondary">{row.jevStatus}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {row.publishedAt || row.scrapedAt} · {row.url}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {row.bodyText.slice(0, 2000)}
                {row.bodyText.length > 2000 ? "…" : ""}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </FadeIn>
  );
}
