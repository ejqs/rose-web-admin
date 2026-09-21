import { ensureAuthTables } from "@/lib/db";
import { seedAdmin } from "@/lib/seed-admin";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await ensureAuthTables();
  await seedAdmin();
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-xl font-semibold">Rose admin</h1>
        <p className="text-sm text-muted-foreground">Bot control plane. Sign in to configure sources.</p>
      </div>
      <LoginForm />
    </main>
  );
}
