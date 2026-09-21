"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendFetch, SESSION_COOKIE } from "@/lib/backend";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const { status, data } = await backendFetch<{ ok?: boolean; token?: string; error?: string }>(
    "/v1/auth/login",
    { method: "POST", body: { email, password } },
  );
  if (status !== 200 || !data.token) {
    return { error: data.error === "invalid_credentials" ? "Sign in failed" : data.error || "Sign in failed" };
  }
  (await cookies()).set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/");
}

export async function logoutAction() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await backendFetch("/v1/auth/logout", { method: "POST", token }).catch(() => undefined);
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
