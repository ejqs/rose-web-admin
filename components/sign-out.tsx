"use client";

import { logoutAction } from "@/app/(app)/auth-actions";
import { Button } from "@/components/ui/button";
import { MagnetButton } from "@/components/motion";

export function SignOutButton() {
  return (
    <MagnetButton>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </MagnetButton>
  );
}
