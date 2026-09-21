"use client";

import { useActionState } from "react";
import { mintKey } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MintKeyForm() {
  const [state, action, pending] = useActionState(mintKey, undefined);
  return (
    <form action={action} className="grid max-w-xl gap-3 rounded-lg border p-4">
      <h2 className="font-medium">Generate key</h2>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue="rose/newsey" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : "Generate key"}
      </Button>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.secret ? (
        <p className="break-all text-sm">
          Copy now (shown once): <code>{state.secret}</code>
        </p>
      ) : null}
    </form>
  );
}
