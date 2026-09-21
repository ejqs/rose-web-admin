import Link from "next/link";
import { requireSession } from "@/lib/session";
import { SparkShell } from "@/components/motion";
import { SignOutButton } from "@/components/sign-out";
import { Separator } from "@/components/ui/separator";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <SparkShell>
      <div className="min-h-svh">
        <header className="border-b">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="font-semibold">
                Rose admin
              </Link>
              <Link href="/sources">Sources</Link>
              <Link href="/articles">Articles</Link>
            </nav>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{session.user.email}</span>
              <SignOutButton />
            </div>
          </div>
        </header>
        <Separator />
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </div>
    </SparkShell>
  );
}
