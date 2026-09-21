import { FadeIn } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { backendFetch } from "@/lib/backend";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Article = {
  id: number;
  title: string;
  url: string;
  body_preview: string;
  body_truncated: boolean;
  published_at: string | null;
  scraped_at: string | null;
  jev_status: string;
  source: string;
};

export default async function ArticlesPage() {
  const { token } = await requireSession();
  const { data } = await backendFetch<{ articles?: Article[] }>("/v1/admin/articles?limit=40", { token });
  const rows = data.articles || [];

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
                <Badge variant="secondary">{row.jev_status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {row.published_at || row.scraped_at} · {row.url}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {row.body_preview}
                {row.body_truncated ? "…" : ""}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </FadeIn>
  );
}
