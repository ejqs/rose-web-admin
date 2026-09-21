"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { MagnetButton } from "@/components/motion";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  return (
    <MagnetButton>
      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          await authClient.signOut();
          router.push("/login");
          router.refresh();
        }}
      >
        Sign out
      </Button>
    </MagnetButton>
  );
}
