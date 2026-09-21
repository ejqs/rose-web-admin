"use server";

import { revalidatePath } from "next/cache";
import { backendFetch } from "@/lib/backend";
import { requireSession } from "@/lib/session";

export async function mintKey(
  _prev: { secret?: string; error?: string } | undefined,
  formData: FormData,
) {
  const { token } = await requireSession();
  const name = String(formData.get("name") || "").trim() || "rose/newsey";
  const { status, data } = await backendFetch<{ ok?: boolean; secret?: string; error?: string }>(
    "/v1/admin/api-keys",
    { method: "POST", token, body: { name } },
  );
  if (status !== 201) {
    return { error: data.error || "mint_failed" };
  }
  revalidatePath("/keys");
  return { secret: data.secret };
}

export async function revokeKey(formData: FormData) {
  const { token } = await requireSession();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await backendFetch(`/v1/admin/api-keys/${id}`, { method: "DELETE", token });
  revalidatePath("/keys");
}
