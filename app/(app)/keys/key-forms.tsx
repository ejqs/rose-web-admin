"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createApiKey, revokeApiKey, rotateApiKey, type KeyActionState } from "./actions";

type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  scopes: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

function SecretOnce({ state }: { state: KeyActionState }) {
  const [copied, setCopied] = useState(false);
  if (!state) return null;
  if (!state.ok) {
    return <p className="text-sm text-destructive">{state.error}</p>;
  }
  const secret = state.secret;
  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="grid gap-2 rounded-lg border p-3">
      <p className="text-sm">
        Secret for <strong>{state.name}</strong> ({state.prefix}). Copy it now; it is not stored in
        plaintext and will not be shown again.
      </p>
      <Input readOnly value={secret} />
      <div>
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export function KeysPanel({ keys }: { keys: KeyRow[] }) {
  const [created, createAction, creating] = useActionState(createApiKey, null);
  const [rotated, rotateAction, rotating] = useActionState(rotateApiKey, null);
  const revealed = rotated ?? created;

  return (
    <div className="grid gap-8">
      <form action={createAction} className="grid max-w-xl gap-3 rounded-lg border p-4">
        <h2 className="font-medium">Generate key</h2>
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue="rose/newsey" required />
        </div>
        <div>
          <Button type="submit" disabled={creating}>
            {creating ? "Generating…" : "Generate key"}
          </Button>
        </div>
      </form>
      <SecretOnce state={revealed} />

      <ul className="grid gap-4">
        {keys.length === 0 ? (
          <li className="text-sm text-muted-foreground">No keys yet.</li>
        ) : (
          keys.map((k) => (
            <li key={k.id} className="grid gap-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{k.name}</strong>
                <Badge variant={k.revokedAt ? "secondary" : "outline"}>
                  {k.revokedAt ? "revoked" : "active"}
                </Badge>
              </div>
              <p className="text-sm">
                Prefix: <code>{k.prefix}</code>
              </p>
              <p className="text-sm text-muted-foreground">
                Scopes: {k.scopes} · Created {k.createdAt}
                {k.lastUsedAt ? ` · Last used ${k.lastUsedAt}` : ""}
              </p>
              {k.revokedAt ? (
                <p className="text-sm text-muted-foreground">Revoked {k.revokedAt}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <form action={revokeApiKey}>
                    <input type="hidden" name="id" value={k.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Revoke
                    </Button>
                  </form>
                  <form action={rotateAction}>
                    <input type="hidden" name="id" value={k.id} />
                    <Button type="submit" variant="outline" size="sm" disabled={rotating}>
                      {rotating ? "Rotating…" : "Rotate"}
                    </Button>
                  </form>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
