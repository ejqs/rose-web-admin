import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { backendFetch } from "@/lib/backend";
import { requireSession } from "@/lib/session";
import { revokeKey } from "./actions";
import { MintKeyForm } from "./mint-form";

export const dynamic = "force-dynamic";

type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  scopes: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export default async function KeysPage() {
  const { token } = await requireSession();
  const { data } = await backendFetch<{ keys?: KeyRow[] }>("/v1/admin/api-keys", { token });
  const keys = data.keys || [];

  return (
    <FadeIn>
      <main className="grid gap-8">
        <div>
          <h1 className="text-xl font-semibold">API keys</h1>
          <p className="text-sm text-muted-foreground">
            Hashed keys for rose-backend command APIs. Secret is shown once. Default scopes: bot:read bot:command.
          </p>
        </div>
        <MintKeyForm />
        <ul className="grid gap-3">
          {keys.map((k) => (
            <li key={k.id} className="grid gap-2 rounded-lg border p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{k.name}</strong>
                <code>{k.prefix}</code>
                {k.revoked_at ? <span>revoked</span> : <span>active</span>}
              </div>
              <p className="text-muted-foreground">
                {k.scopes} · created {k.created_at}
                {k.last_used_at ? ` · last used ${k.last_used_at}` : ""}
              </p>
              {!k.revoked_at ? (
                <form action={revokeKey}>
                  <input type="hidden" name="id" value={k.id} />
                  <Button type="submit" variant="outline" size="sm">
                    Revoke
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </main>
    </FadeIn>
  );
}
