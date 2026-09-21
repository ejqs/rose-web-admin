import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendFetch, SESSION_COOKIE } from "./backend";

export type SessionUser = { id: string; email: string; name: string };

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value || "";
}

export async function requireSession() {
  const token = await getSessionToken();
  if (!token) redirect("/login");
  const { status, data } = await backendFetch<{ ok?: boolean; user?: SessionUser }>("/v1/auth/session", { token });
  if (status !== 200 || !data.user) redirect("/login");
  return { user: data.user, token };
}
