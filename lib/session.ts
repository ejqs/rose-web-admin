import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { ensureAuthTables } from "./db";
import { seedAdmin } from "./seed-admin";

export async function requireSession() {
  await ensureAuthTables();
  await seedAdmin();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}
