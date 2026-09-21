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
import { backendFetch } from "@/lib/backend";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Source = {
  id: number;
  name: string;
  status: string;
  last_success_at: string | null;
  last_error: string | null;
  next_eligible_at: string;
  articles_scraped_count: number;
};

export default async function DashboardPage() {
  const { token } = await requireSession();
  const { data } = await backendFetch<{ articles?: number; sources?: Source[] }>("/v1/admin/dashboard", { token });
  const sources = data.sources || [];
  const articleCount = Number(data.articles || 0);

  return (
    <FadeIn>
      <main className="grid gap-6">
        <div>
          <h1 className="text-xl font-semibold">Bot health</h1>
          <p className="text-sm text-muted-foreground">
            Config is written here via rose-backend. rose-bot leases sources over HTTP. Paused sources are never picked.
          </p>
        </div>
        <p className="text-sm">
          Articles stored: <strong>{articleCount}</strong> · Sources:{" "}
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
                <TableCell>{s.articles_scraped_count}</TableCell>
                <TableCell className="text-muted-foreground">{s.last_success_at || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{s.next_eligible_at}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{s.last_error || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </FadeIn>
  );
}
